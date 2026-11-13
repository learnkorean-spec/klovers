/**
 * Who actually came to the trial — and the letter that follows.
 *
 * The gap this fills, in one sentence: nothing in the database has ever
 * recorded that a trial HAPPENED for a given student. `attendance_response` is
 * what she predicted days beforehand and `status` is where the booking is —
 * neither is about the room. So the letter that follows a trial is aimed by the
 * clock alone and is written in deliberately neutral words, and no report can
 * say what a session's real turnout was.
 *
 * The control is a drop list with THREE states, and the third one is the point:
 *
 *   Not decided yet   the default — nobody has answered
 *   Came
 *   Didn't come
 *
 * "Not decided yet" and "didn't come" are different facts and they call for
 * opposite letters. A two-state control would turn every unopened session into
 * a roomful of no-shows the moment the page loaded, which is the same mistake —
 * guessing — in a nicer costume.
 *
 * TWO STEPS, and they do different jobs.
 *
 *   1. Each drop list writes immediately. Nothing is ever lost to a closed tab,
 *      and there is no unsaved state to hunt for.
 *   2. CONFIRM ATTENDANCE closes the session. The drop lists lock, the header
 *      says so, and only then does the letters button open.
 *
 * Step 2 is not persistence — step 1 already did that. It is the difference
 * between a session nobody has opened and a session whose answers are final,
 * which the card previously could not show at all: eighteen rows reading "Not
 * decided yet" meant either "Re hasn't looked" or "Re looked and only three
 * came", and nothing distinguished them.
 *
 * Reopen undoes it in one click. A confirmation that cannot be taken back is a
 * wrong answer kept forever, and this record exists to be correct rather than
 * tidy.
 *
 * Confirming leaves the undecided undecided, and says how many. "I am done with
 * this session" is not "everyone I skipped was absent" — that distinction is
 * the whole reason the mark has three states, and the button must not quietly
 * collapse it.
 *
 * WHO GETS A LETTER. Re's call on 19 September: the students who CAME, for now.
 * The no-shows are not silently dropped — the header says how many are waiting
 * and the dialog carries a switch that pulls them in, off unless pressed.
 *
 * ORDER. The students who said they were coming sit at the top, then the
 * silent ones, then the ones who said they couldn't. Alphabetical put the three
 * confirmed students at rows 2, 4 and 6 of eighteen — the people most likely to
 * have actually been in the room, scattered through a list that has to be
 * scrolled. The sort key is her PREDICTION, never the answer already recorded:
 * sorting on `attended` would make a row jump the instant it is answered and
 * the next click would land on somebody else's name.
 *
 * Writes the tables directly rather than through an RPC, matching
 * PrivateClassesToConfirm and TrialAttendanceRoster; RLS is admin-only on both.
 *
 * Scope: dated, live bookings from the last 14 days.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  FunnelBadges, TelegramGroupPicker, TelegramInviteButton,
  chatUsable, useChosenChat, useFunnelStatus, useTelegramChats,
} from "./TrialTelegramInvite";

/** true / false / null — the three states, as one value the Select can hold. */
type Mark = "yes" | "no" | "unknown";

/** Which letters a call asks for. "came" is the default, here and in the sender. */
type Selection = "came" | "both";

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  trial_date: string | null;
  start_time: string | null;
  class_language: string | null;
  attendance_response: string | null;
  attended: boolean | null;
  attended_letter_sent_at: string | null;
};

/**
 * The one message that replaces three disconnected manual steps (Re, 13 Nov
 * 2026: "i lost them... add them to telegram... guide each for the link to
 * book the class... all not connected steps"). The moment a student is
 * marked "Came", this is what she actually needs in hand: the community
 * Telegram group (a real add-by-phone isn't possible — Telegram's bot API
 * only lets a student join herself, via a link) AND the enroll-now booking
 * link, together, so nothing has to be chased down a second time. Same
 * community link as Footer/CommunityBand/FAQPage.
 *
 * Later the same day this became the FALLBACK. When a class group is chosen
 * in the picker above the list, each student gets her own invite link to
 * that group instead (TrialTelegramInvite). This plain WhatsApp button is
 * what remains when no group is chosen, or before the bot is set up.
 */
const TELEGRAM_COMMUNITY_LINK = "https://t.me/+Fu5T7d4wLMsxNDY9";
const ENROLL_NOW_LINK = "https://kloversegy.com/enroll-now";

function cameWhatsAppMessage(name: string | null, isAr: boolean): string {
  const first = (name || "").trim().split(" ")[0];
  return isAr
    ? `هاي ${first || "يا قمر"} \u{1F44B} سعيدين إنك جيتِ التراير!\n\n` +
      `انضمي لجروب كلوفرز على تيليجرام عشان توصلك كل حاجة جديدة:\n${TELEGRAM_COMMUNITY_LINK}\n\n` +
      `وعشان تثبتي مكانك وتكملي الكورس:\n${ENROLL_NOW_LINK}`
    : `Hi ${first || "there"} \u{1F44B} so glad you made it to the trial!\n\n` +
      `Join the Klovers Telegram group to keep up with everything:\n${TELEGRAM_COMMUNITY_LINK}\n\n` +
      `And to lock in your seat and continue the course:\n${ENROLL_NOW_LINK}`;
}

type Confirmation = {
  trial_date: string;
  start_time: string;
  confirmed_at: string;
};

/** One line of the sender's dry run. */
type PlannedRecipient = {
  name: string | null;
  email: string | null;
  letter: "came" | "missed";
  language: "ar" | "en";
};

type DryRun = {
  eligible: number;
  came: number;
  missed: number;
  /** Marked and unsent, whether or not this call selected them. */
  came_waiting: number;
  missed_waiting: number;
  skipped_unsubscribed: number;
  without_unsubscribe_link: number;
  recipients: PlannedRecipient[];
};

interface TrialAttendanceProps {
  /** How many days back to look. The card empties itself as sessions are marked. */
  days?: number;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Local calendar date as YYYY-MM-DD. Never a sliced UTC string — Cairo is +3. */
function localISODate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-09-18" -> "Fri 18 Sep". Parsed as a plain date, never shifted by a zone. */
function formatSlotDate(iso: string | null): string {
  if (!iso) return "Date TBA";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const month = dt.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${DAY_NAMES[dt.getUTCDay()].slice(0, 3)} ${d} ${month}`;
}

const markOf = (attended: boolean | null): Mark =>
  attended === true ? "yes" : attended === false ? "no" : "unknown";

const MARK_LABEL: Record<Mark, string> = {
  unknown: "Not decided yet",
  yes: "Came",
  no: "Didn't come",
};

const LETTER_LABEL: Record<PlannedRecipient["letter"], string> = {
  came: "Your place in the group",
  missed: "Another trial time",
};

/**
 * Sort rank from what she SAID beforehand.
 *
 * Said yes first: those are the people most likely to have been in the room, so
 * they are the rows worth answering first and the ones that should be on screen
 * without scrolling. Said no last: a seat that was given back is the least
 * likely thing on this list to need an answer.
 */
const responseRank = (r: Row): number =>
  r.attendance_response === "yes" ? 0 : r.attendance_response === "no" ? 2 : 1;

const sessionKey = (date: string | null, time: string | null) => `${date ?? ""}|${time ?? ""}`;

const TrialAttendance = ({ days = 14 }: TrialAttendanceProps) => {
  const qc = useQueryClient();
  /** Sessions the admin has opened in full. Collapsed is the default. */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  /** The session whose letters are being previewed, and the sender's answer. */
  const [previewing, setPreviewing] = useState<{ date: string; time: string | null; label: string } | null>(null);
  const [preview, setPreview] = useState<DryRun | null>(null);
  const [selection, setSelection] = useState<Selection>("came");
  const [busy, setBusy] = useState(false);

  const { data, error, isLoading } = useQuery({
    queryKey: ["admin", "trial-attendance", days],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("trial_bookings")
        // These columns do not exist until migrations 20260918190000 and
        // 20260918200000 are applied. The cast keeps the generated types quiet
        // until they are regenerated; the error path below is what the admin
        // actually sees if they are missing.
        .select(
          "id, name, email, phone, trial_date, start_time, class_language, attendance_response, attended, attended_letter_sent_at" as "*",
        )
        .neq("status", "cancelled")
        .not("trial_date", "is", null)
        .gte("trial_date", localISODate(-days))
        .lte("trial_date", localISODate(0))
        .order("trial_date", { ascending: false })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  /** Which sessions have been finished with. Its own table — see the migration. */
  const { data: confirmations } = useQuery({
    queryKey: ["admin", "trial-attendance-confirmations"],
    queryFn: async (): Promise<Confirmation[]> => {
      const { data, error } = await (supabase as never as {
        from: (t: string) => {
          select: (c: string) => Promise<{ data: Confirmation[] | null; error: Error | null }>;
        };
      })
        .from("trial_attendance_confirmations")
        .select("trial_date, start_time, confirmed_at");
      if (error) throw error;
      return data ?? [];
    },
    // A missing table before the migration lands must not blank the whole card.
    retry: false,
  });

  // Telegram: the groups the bot can invite into, the one Re picked, and how
  // far each student has got since the trial. All three are empty, and the
  // panel behaves exactly as before, until the bot side is deployed.
  const chatsQuery = useTelegramChats();
  const chats = chatsQuery.data ?? [];
  const [chosenChat, setChosenChat] = useChosenChat();
  const chosenReady = chats.some(c => String(c.chat_id) === chosenChat && chatUsable(c));
  const bookingIds = useMemo(() => (data ?? []).map(r => r.id), [data]);
  const { data: funnel } = useFunnelStatus(bookingIds);

  const confirmedAt = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of confirmations ?? []) m.set(sessionKey(c.trial_date, c.start_time), c.confirmed_at);
    return m;
  }, [confirmations]);

  const setMark = useMutation({
    mutationFn: async ({ id, mark }: { id: string; mark: Mark }) => {
      const { data: auth } = await supabase.auth.getUser(); // supabase-error-check-ignore: only supplies the audit id; if it fails the stamp is null and the write below reports its own error
      const attended = mark === "yes" ? true : mark === "no" ? false : null;
      const patch: Record<string, unknown> = {
        attended,
        // Clearing the answer clears its provenance too — a stamp left behind
        // would say somebody decided this, and nobody has.
        attendance_marked_at: attended === null ? null : new Date().toISOString(),
        attendance_marked_by: attended === null ? null : auth.user?.id ?? null,
      };
      const { error } = await supabase
        .from("trial_bookings")
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "trial-attendance"] });
      qc.invalidateQueries({ queryKey: ["admin", "trial-bookings"] });
    },
    onError: (e: unknown) =>
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      }),
  });

  const confirmSession = useMutation({
    mutationFn: async ({ date, time, reopen }: { date: string; time: string | null; reopen: boolean }) => {
      const table = (supabase as never as {
        from: (t: string) => {
          insert: (v: unknown) => Promise<{ error: Error | null }>;
          delete: () => {
            eq: (c: string, v: unknown) => {
              eq: (c: string, v: unknown) => Promise<{ error: Error | null }>;
            };
          };
        };
      }).from("trial_attendance_confirmations");

      if (reopen) {
        const { error } = await table.delete().eq("trial_date", date).eq("start_time", time ?? "");
        if (error) throw error;
        return;
      }
      const { data: auth } = await supabase.auth.getUser(); // supabase-error-check-ignore: only supplies the audit id; if it fails the stamp is null and the write below reports its own error
      const { error } = await table.insert({
        trial_date: date,
        start_time: time ?? "",
        confirmed_by: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "trial-attendance-confirmations"] }),
    onError: (e: unknown) =>
      toast({
        title: "Could not update the session",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      }),
  });

  /** One block per session — the pair (trial_date, start_time) is the session. */
  const sessions = useMemo(() => {
    const by = new Map<string, Row[]>();
    for (const r of data ?? []) {
      const k = sessionKey(r.trial_date, r.start_time);
      by.set(k, [...(by.get(k) ?? []), r]);
    }
    return [...by.entries()].map(([k, rows]) => ({
      key: k,
      date: rows[0]?.trial_date ?? null,
      time: rows[0]?.start_time ?? null,
      language: rows[0]?.class_language ?? null,
      rows: [...rows].sort(
        (a, b) => responseRank(a) - responseRank(b) || (a.name ?? "").localeCompare(b.name ?? ""),
      ),
      marked: rows.filter(r => r.attended !== null).length,
      came: rows.filter(r => r.attended === true).length,
      confirmedResponse: rows.filter(r => r.attendance_response === "yes").length,
      /** Came, and not yet written to — what the letters button sends. */
      camePending: rows.filter(r => r.attended === true && !r.attended_letter_sent_at).length,
      /** Marked absent and not written to. Named, never silently dropped. */
      missedPending: rows.filter(r => r.attended === false && !r.attended_letter_sent_at).length,
      lettersSent: rows.filter(r => r.attended_letter_sent_at).length,
      /** Still undecided — and they stay that way, even after the session closes. */
      unmarked: rows.filter(r => r.attended === null).length,
      isConfirmed: confirmedAt.has(k),
    }));
  }, [data, confirmedAt]);

  /**
   * Ask the sender what it would do. Deliberately its dry run rather than the
   * same rules copied into this component: a preview that can disagree with the
   * sender is worse than no preview, because it is believed.
   */
  const runPreview = async (
    date: string, time: string | null, label: string, letters: Selection,
  ) => {
    setPreviewing({ date, time, label });
    setSelection(letters);
    setPreview(null);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-trial-attendance-letters", {
        body: { trial_date: date, start_time: time, dry_run: true, letters },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setPreview(data as DryRun);
    } catch (e) {
      toast({
        title: "Could not check",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      setPreviewing(null);
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!previewing) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-trial-attendance-letters", {
        body: {
          trial_date: previewing.date,
          start_time: previewing.time,
          dry_run: false,
          // The same selection the preview was built from. Sending a wider set
          // than the one just shown would make the preview a lie.
          letters: selection,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const res = data as { sent?: number; came?: number; missed?: number; missed_waiting?: number };
      toast({
        title: `${res.sent ?? 0} letter${res.sent === 1 ? "" : "s"} sent`,
        description: res.missed_waiting
          ? `${res.came ?? 0} to students who came. ${res.missed_waiting} no-show${res.missed_waiting === 1 ? "" : "s"} still unwritten to.`
          : `${res.came ?? 0} to students who came.`,
      });
      setPreviewing(null);
      setPreview(null);
      setSelection("came");
      qc.invalidateQueries({ queryKey: ["admin", "trial-attendance"] });
    } catch (e) {
      toast({
        title: "Could not send",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setPreviewing(null);
    setPreview(null);
    setSelection("came");
  };

  if (isLoading) return null;

  // A missing column is not "nothing to do", and a card that vanishes says the
  // second thing. Name it instead.
  if (error) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
        <p className="text-sm font-semibold">Who came</p>
        <p className="text-xs text-muted-foreground">
          Not available yet — run the Apply Migrations workflow for{" "}
          <code className="text-[11px]">20260919010000_trial_attendance_confirmation</code>, then reload.
        </p>
      </div>
    );
  }

  if (sessions.length === 0) return null;

  const toggle = (key: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div>
        <p className="text-sm font-semibold">Who came</p>
        <p className="text-xs text-muted-foreground">
          Mark at your own pace — each choice saves the moment you pick it. When the session
          is done, <strong>Confirm attendance</strong> closes it and opens the letters.
        </p>
        <p className="text-xs text-muted-foreground">
          <em>Not decided yet</em> stays undecided, before and after confirming. Nothing reads it
          as a no-show and nobody undecided is written to.
        </p>
      </div>

      {chats.length > 0 && (
        <TelegramGroupPicker
          chats={chats}
          chosen={chosenReady ? chosenChat : ""}
          onChoose={setChosenChat}
          onRefresh={() => chatsQuery.refetch()}
          refreshing={chatsQuery.isFetching}
        />
      )}

      {sessions.map(s => {
        const isOpen = expanded.has(s.key);
        const label = `${formatSlotDate(s.date)} · ${(s.time ?? "TBA").slice(0, 5)}`;
        const locked = s.isConfirmed;
        // Collapsed by default (Re, 1 Oct 2026: "no need all names"). Folded, a
        // session shows only the rows worth a look — who said yes and who is
        // already marked — and a closed session shows none at all.
        const shown = isOpen
          ? s.rows
          : locked
            ? []
            : s.rows.filter(r => r.attendance_response === "yes" || r.attended !== null);
        const hidden = s.rows.length - shown.length;

        // The letters button names the next action rather than the feature.
        const nothingToSend = s.camePending === 0 && s.missedPending === 0;
        const cta =
          s.camePending > 0
            ? `Send ${s.camePending} letter${s.camePending === 1 ? "" : "s"}`
            : s.missedPending > 0
              ? `Letters — ${s.missedPending} no-show${s.missedPending === 1 ? "" : "s"}`
              : s.unmarked > 0
                ? "Mark who came first"
                : "All letters sent";

        return (
          <div key={s.key} className="space-y-0.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-0.5">
              <span className="flex items-center gap-2 text-xs font-semibold">
                {label}
                {s.language && (
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {s.language}
                  </Badge>
                )}
                {locked && (
                  <Badge variant="outline" className="text-[10px]">confirmed</Badge>
                )}
              </span>

              <span className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {s.marked === 0
                    ? `${s.rows.length} booked · ${s.confirmedResponse} said yes · none marked`
                    : `${s.came} came · ${s.marked} of ${s.rows.length} marked`}
                  {s.lettersSent > 0 && ` · ${s.lettersSent} written to`}
                  {s.missedPending > 0 && ` · ${s.missedPending} no-show${s.missedPending === 1 ? "" : "s"} not written to`}
                </span>

                {locked ? (
                  <button
                    type="button"
                    className="rounded-sm text-xs text-muted-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    disabled={confirmSession.isPending}
                    onClick={() =>
                      s.date && confirmSession.mutate({ date: s.date, time: s.time, reopen: true })
                    }
                  >
                    Reopen
                  </button>
                ) : (
                  <Button
                    size="sm"
                    variant={s.marked > 0 ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    disabled={s.marked === 0 || !s.date || confirmSession.isPending}
                    onClick={() =>
                      s.date && confirmSession.mutate({ date: s.date, time: s.time, reopen: false })
                    }
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    {s.marked === 0
                      ? "Mark who came first"
                      : s.unmarked > 0
                        ? `Confirm — ${s.marked} marked, ${s.unmarked} undecided`
                        : `Confirm attendance`}
                  </Button>
                )}

                {/* Letters only after the session is closed. Writing to students
                    off a half-finished list is how the wrong person gets the
                    wrong letter. */}
                <Button
                  size="sm"
                  variant={locked && s.camePending > 0 ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  disabled={!locked || nothingToSend || !s.date}
                  onClick={() => s.date && runPreview(s.date, s.time, label, "came")}
                >
                  <Mail className="mr-1 h-3.5 w-3.5" />
                  {locked ? cta : "Letters"}
                </Button>
              </span>
            </div>

            {shown.map(r => {
              const waDigits = r.phone?.replace(/[^0-9]/g, "") ?? "";
              const hasPhone = waDigits.length >= 8;
              // class_language mirrors the session-level badge above — only
              // "english" reads as English, everything else (including null)
              // defaults to Arabic, same convention as GroupWelcomeSender.
              const isAr = (r.class_language ?? s.language) !== "english";
              const waLink = hasPhone
                ? `https://wa.me/${waDigits}?text=${encodeURIComponent(cameWhatsAppMessage(r.name, isAr))}`
                : null;

              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background px-3 py-1 text-sm"
                >
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{r.name?.trim() || r.email || "—"}</span>
                    {r.attendance_response === "yes" && (
                      <span className="text-[11px] text-muted-foreground">said yes</span>
                    )}
                    {r.attendance_response === "no" && (
                      <span className="text-[11px] text-muted-foreground">said she couldn't</span>
                    )}
                    {r.attended_letter_sent_at && (
                      <Badge variant="outline" className="text-[10px]">letter sent</Badge>
                    )}
                    <FunnelBadges status={funnel?.get(r.id)} />
                  </span>

                  <span className="flex items-center gap-1.5">
                    {/* Right after marking "Came" is exactly the moment the
                        Telegram link + the enroll-now link are needed — one
                        message, instead of hunting the number down again
                        later and sending each link separately. */}
                    {r.attended === true && chosenReady && (
                      <TelegramInviteButton
                        bookingId={r.id}
                        chatId={chosenChat}
                        status={funnel?.get(r.id)}
                      />
                    )}
                    {r.attended === true && !chosenReady && (
                      hasPhone ? (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-green-400 text-green-700 dark:text-green-400"
                        >
                          <a href={waLink!} target="_blank" rel="noreferrer">
                            <MessageCircle className="mr-1 h-3.5 w-3.5" />
                            Telegram + enroll link
                          </a>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-destructive">no phone</span>
                      )
                    )}

                    {/* Locked by the session being confirmed (Reopen to change), and
                        permanently once her letter has gone — the two letters
                        contradict each other, so a later correction fixes the record
                        without chasing the first letter with the second. */}
                    <Select
                      value={markOf(r.attended)}
                      onValueChange={v => setMark.mutate({ id: r.id, mark: v as Mark })}
                      disabled={setMark.isPending || locked || !!r.attended_letter_sent_at}
                    >
                      <SelectTrigger className="h-7 w-[9.5rem] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["unknown", "yes", "no"] as Mark[]).map(m => (
                          <SelectItem key={m} value={m} className="text-xs">
                            {MARK_LABEL[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </span>
                </div>
              );
            })}

            {(hidden > 0 || isOpen) && (
              <button
                type="button"
                className="rounded-sm pt-1 text-xs text-muted-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => toggle(s.key)}
              >
                {isOpen
                  ? "Hide names"
                  : shown.length === 0
                    ? `Show ${s.rows.length} name${s.rows.length === 1 ? "" : "s"}`
                    : `+ ${hidden} more`}
              </button>
            )}
          </div>
        );
      })}

      <Dialog open={!!previewing} onOpenChange={o => { if (!o) close(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send letters — {previewing?.label}</DialogTitle>
            <DialogDescription>
              Nothing has been sent yet. This is the sender's own dry run: exactly who it would
              write to, and which letter each one gets.
            </DialogDescription>
          </DialogHeader>

          {busy && !preview && <p className="text-sm text-muted-foreground">Checking…</p>}

          {preview && (
            <div className="space-y-3">
              <p className="text-sm">
                <strong>{preview.came}</strong> · <em>{LETTER_LABEL.came}</em> — enrolment is open,
                here is your seat.
                {selection === "both" && (
                  <>
                    <br />
                    <strong>{preview.missed}</strong> · <em>{LETTER_LABEL.missed}</em> — the time may
                    not have suited you, here is another trial.
                  </>
                )}
              </p>

              {/* The no-shows are named whether or not they are included. A
                  number that only appears once you go looking for it is a
                  number nobody looks for. */}
              {preview.missed_waiting > 0 && (
                <div className="rounded-md border bg-background p-2 text-xs">
                  {selection === "came" ? (
                    <>
                      <span className="text-muted-foreground">
                        {preview.missed_waiting} marked <em>Didn't come</em> — not written to.
                      </span>{" "}
                      <button
                        type="button"
                        className="rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        onClick={() =>
                          previewing &&
                          runPreview(previewing.date, previewing.time, previewing.label, "both")
                        }
                      >
                        Include them
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">
                        Including the {preview.missed_waiting} who didn't come.
                      </span>{" "}
                      <button
                        type="button"
                        className="rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        onClick={() =>
                          previewing &&
                          runPreview(previewing.date, previewing.time, previewing.label, "came")
                        }
                      >
                        Leave them out
                      </button>
                    </>
                  )}
                </div>
              )}

              {preview.skipped_unsubscribed > 0 && (
                <p className="text-xs text-muted-foreground">
                  {preview.skipped_unsubscribed} skipped — unsubscribed.
                </p>
              )}
              {preview.without_unsubscribe_link > 0 && (
                <p className="text-xs text-destructive">
                  {preview.without_unsubscribe_link} would go out with no one-click unsubscribe link.
                </p>
              )}

              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                {preview.recipients.map(r => (
                  <div key={r.email ?? r.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{r.name?.trim() || r.email}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {LETTER_LABEL[r.letter]} · {r.language}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Anyone still marked <em>Not decided yet</em> is not in this list and is not written to.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={send} disabled={busy || !preview || preview.eligible === 0}>
              {busy ? "Sending…" : `Send ${preview?.eligible ?? 0}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrialAttendance;
