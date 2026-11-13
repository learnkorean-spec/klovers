/**
 * The Telegram half of "Who came": pick a class group, and send each student
 * who came her own invite link to it together with the enrol link.
 *
 * Re, 13 Nov 2026: "i have telegram and many groups, how to fill this gap and
 * use the telegram bot as well and groups". The first version of the button
 * on this panel sent one community link to everybody and recorded nothing.
 * This one asks the bot for a single-use link to the chosen group, named
 * after the student, and then:
 *
 *   - she pressed Start on the bot when she booked  → the bot sends it now;
 *   - she did not                                   → a WhatsApp link opens
 *     with the same message ready to send.
 *
 * Because the link is hers alone, Telegram tells the bot when it is used, and
 * the row shows "joined". Next to it, how far she has got since: signed up,
 * enrolled, paid. A row that stops at "invited" is the one to chase.
 *
 * Everything here degrades to nothing when the migration behind it has not
 * been applied yet (no groups, no statuses): TrialAttendance then keeps
 * showing its plain WhatsApp button, exactly as before.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export type TelegramChat = {
  chat_id: number;
  title: string | null;
  bot_status: string | null;
  can_invite: boolean;
  /** t.me/<username> when the group is public; the fallback when the bot
   *  may not create a personal link there. */
  public_link?: string | null;
};

/** A group the button can actually send someone to. */
export const chatUsable = (c: TelegramChat) => c.can_invite || !!c.public_link;

export type FunnelStatus = {
  booking_id: string;
  tg_linked: boolean;
  invite_sent_at: string | null;
  invite_sent_via: string | null;
  invite_chat: string | null;
  joined_at: string | null;
  signed_up: boolean;
  enrolled: boolean;
  paid: boolean;
};

type SendResult = {
  sent_via: "telegram" | "whatsapp";
  invite_link: string;
  group: string | null;
  whatsapp_url: string | null;
  text: string;
};

const CHOSEN_KEY = "klovers.admin.trialInviteChat";

function readChosen(): string {
  try {
    return localStorage.getItem(CHOSEN_KEY) ?? "";
  } catch {
    return "";
  }
}

/** The groups the bot knows, re-checked against Telegram by the edge function. */
export function useTelegramChats() {
  return useQuery({
    queryKey: ["admin", "telegram-chats"],
    queryFn: async (): Promise<TelegramChat[]> => {
      const { data, error } = await supabase.functions.invoke("telegram-trial-invite", {
        body: { action: "chats" },
      });
      if (error) throw error;
      return ((data as { chats?: TelegramChat[] } | null)?.chats ?? []);
    },
    // Not deployed yet, or the migration is not applied: show nothing, quietly.
    retry: false,
    staleTime: 5 * 60_000,
  });
}

/** How far each of these bookings has got. Empty map until the RPC exists. */
export function useFunnelStatus(bookingIds: string[]) {
  const key = [...bookingIds].sort().join(",");
  return useQuery({
    queryKey: ["admin", "trial-funnel-status", key],
    enabled: bookingIds.length > 0,
    queryFn: async (): Promise<Map<string, FunnelStatus>> => {
      const { data, error } = await (supabase as never as {
        rpc: (fn: string, args: { p_booking_ids: string[] }) =>
          Promise<{ data: FunnelStatus[] | null; error: Error | null }>;
      }).rpc("admin_trial_funnel_status", { p_booking_ids: bookingIds });
      if (error) throw error;
      return new Map((data ?? []).map(r => [r.booking_id, r]));
    },
    retry: false,
  });
}

/** Chosen group, remembered on this browser between visits. */
export function useChosenChat() {
  const [chosen, setChosenState] = useState<string>(readChosen);
  const setChosen = (v: string) => {
    setChosenState(v);
    try {
      localStorage.setItem(CHOSEN_KEY, v);
    } catch {
      /* private window: the choice simply lasts for this visit */
    }
  };
  return [chosen, setChosen] as const;
}

export function TelegramGroupPicker({
  chats, chosen, onChoose, onRefresh, refreshing,
}: {
  chats: TelegramChat[];
  chosen: string;
  onChoose: (v: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const ready = chats.filter(chatUsable);
  const notReady = chats.filter(c => !chatUsable(c));
  const chosenChat = chats.find(c => String(c.chat_id) === chosen);

  return (
    <div className="rounded-md border bg-background p-2 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium">Telegram group to invite into</span>
        <Select value={chosen} onValueChange={onChoose}>
          <SelectTrigger className="h-7 w-[16rem] text-xs" aria-label="Telegram group to invite into">
            <SelectValue placeholder={ready.length ? "Choose a group" : "No group ready yet"} />
          </SelectTrigger>
          <SelectContent>
            {ready.map(c => (
              <SelectItem key={c.chat_id} value={String(c.chat_id)} className="text-xs">
                {c.title || String(c.chat_id)}{c.can_invite ? "" : " — public link"}
              </SelectItem>
            ))}
            {notReady.map(c => (
              <SelectItem key={c.chat_id} value={String(c.chat_id)} disabled className="text-xs">
                {c.title || String(c.chat_id)} — bot is not admin
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm" variant="ghost" className="h-7 px-2 text-xs"
          onClick={onRefresh} disabled={refreshing}
        >
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      {chosenChat && !chosenChat.can_invite && chosenChat.public_link && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          The bot can't create personal links in this group, so everyone gets its public link
          ({chosenChat.public_link.replace("https://", "")}). "Joined" will only show for students who
          pressed Start on the bot. Turn on <em>Invite Users via Link</em> for the bot to track everyone.
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        A group appears here once the bot is in it. To let it create invite links, make{" "}
        <strong>@learnkoreanwithkloversbot</strong> an admin of the group with{" "}
        <em>Invite Users via Link</em> on. Missing a group? Type <code>/register</code> inside it,
        then Refresh.
      </p>
    </div>
  );
}

/** Small badges: where she is between the trial and paying. */
export function FunnelBadges({ status }: { status: FunnelStatus | undefined }) {
  if (!status) return null;
  const stage = status.paid ? "paid" : status.enrolled ? "enrolled" : status.signed_up ? "signed up" : null;
  return (
    <>
      {status.tg_linked && <Badge variant="outline" className="text-[10px]">on bot</Badge>}
      {status.joined_at ? (
        <Badge variant="outline" className="text-[10px] border-green-500 text-green-700 dark:text-green-400">
          joined {status.invite_chat ?? "group"}
        </Badge>
      ) : status.invite_sent_at ? (
        <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700 dark:text-amber-400">
          invited, not joined
        </Badge>
      ) : null}
      {stage && (
        <Badge
          variant="outline"
          className={`text-[10px] ${status.paid ? "border-green-500 text-green-700 dark:text-green-400" : ""}`}
        >
          {stage}
        </Badge>
      )}
    </>
  );
}

/**
 * The per-student action. One press asks the bot for her link and sends it;
 * when it could not go by Telegram, the button turns into the WhatsApp link
 * carrying the same message (a link, not window.open: a popup opened after a
 * network round-trip is blocked by most browsers).
 */
export function TelegramInviteButton({
  bookingId, chatId, status,
}: {
  bookingId: string;
  chatId: string;
  status: FunnelStatus | undefined;
}) {
  const qc = useQueryClient();
  const [whatsapp, setWhatsapp] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: async (): Promise<SendResult> => {
      const { data, error } = await supabase.functions.invoke("telegram-trial-invite", {
        body: { action: "send", booking_id: bookingId, chat_id: Number(chatId) },
      });
      if (error) {
        // supabase-js hides the JSON body of a non-2xx behind error.context.
        const ctx = (error as { context?: Response }).context;
        const body = ctx ? await ctx.json().catch(() => null) : null;
        throw new Error(
          body?.error === "cannot_invite"
            ? `The bot can't create a link in "${body.group ?? "that group"}". Make it an admin with "Invite Users via Link" on, then Refresh.`
            : body?.error === "not_ready"
              ? "The database update for this feature has not been applied yet."
              : body?.error ?? error.message,
        );
      }
      return data as SendResult;
    },
    onSuccess: async (res) => {
      qc.invalidateQueries({ queryKey: ["admin", "trial-funnel-status"] });
      if (res.sent_via === "telegram") {
        setWhatsapp(null);
        toast({ title: "Sent on Telegram", description: `Her invite to ${res.group ?? "the group"} and the enrol link.` });
        return;
      }
      if (res.whatsapp_url) {
        setWhatsapp(res.whatsapp_url);
        toast({ title: "Link ready", description: "She is not on the bot, so send it on WhatsApp." });
        return;
      }
      // No bot chat and no phone: hand Re the text to paste wherever she can.
      try {
        await navigator.clipboard.writeText(res.text);
        toast({ title: "Message copied", description: "No phone and not on the bot. Paste it wherever you reach her." });
      } catch {
        toast({ title: "No phone and not on the bot", description: res.invite_link });
      }
    },
    onError: (e: Error) => {
      toast({ title: "Could not create the invite", description: e.message, variant: "destructive" });
    },
  });

  if (whatsapp) {
    return (
      <Button asChild size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white">
        <a href={whatsapp} target="_blank" rel="noreferrer">
          <MessageCircle className="mr-1 h-3.5 w-3.5" />
          Send on WhatsApp
        </a>
      </Button>
    );
  }

  const already = !!status?.invite_sent_at;
  return (
    <Button
      size="sm" variant="outline"
      className="h-7 px-2 text-xs border-sky-400 text-sky-700 dark:text-sky-400"
      disabled={send.isPending}
      onClick={() => send.mutate()}
    >
      <Send className="mr-1 h-3.5 w-3.5" />
      {send.isPending ? "Sending…" : already ? "Send invite again" : "Send group invite"}
    </Button>
  );
}
