import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

/**
 * The welcome letter, sent by hand to everyone seated in one group.
 *
 * WHY IT EXISTS
 *
 * Nothing in the system ever told a student "you are in, here is your book,
 * and here is where your attendance and your payments live". The class-link
 * letter states a room and a time; the payment letters state money. A student
 * seated in a class got neither a book nor any idea the dashboard answers
 * anything. This is the one letter that opens the course.
 *
 * WHY IT IS ITS OWN FILE
 *
 * GroupsToStart.tsx is 68 KB and the only write path to it is a whole-file
 * rewrite, which is how that file has already lost work once (see its header
 * note on PR #571). Anything that can live outside it should. The card keeps
 * one piece of state — which group has this open — and hands this component
 * the group and its members.
 *
 * WHAT IT INSISTS ON
 *
 *   - The BOOK link, pasted here and saved onto the group in the same action.
 *     Saved on the GROUP, not the student: everyone in a class reads the same
 *     book, and a student seated next month then gets the same link without
 *     anyone having to remember what it was. The send button stays disabled
 *     until it looks like a URL, because the letter's whole middle section is
 *     that one button.
 *   - A ROOM link is warned about, not required. A group whose room is not
 *     booked yet still has a book and a dashboard worth sending.
 *   - An EMAIL per student. Anyone without one is listed as skipped rather
 *     than silently dropped from the count.
 *
 * ONCE PER SEAT
 *
 * Each send is stamped on `pkg_group_members.welcome_email_sent_at`, so
 * pressing this again after one more student joins writes to her alone.
 * "Resend to everyone" is the deliberate override. The stamp is on the seat
 * rather than the profile because the letter is about one class: a student
 * who moves to another group should be welcomed to that one too.
 */

export type WelcomeGroup = {
  id: string;
  title: string;
  /** Raw level key; the mailer turns it into a readable label per language. */
  level: string | null;
  /** "english" or "arabic" — decides which language the letter is written in. */
  languageKey: string;
  meetingUrl: string | null;
  bookUrl: string | null;
  /** "Wednesday · 15:00 Cairo", already in the class language. */
  whenLabel: string;
};

export type WelcomeMember = {
  userId: string;
  name: string;
  email: string;
  welcomeSentAt: string | null;
};

/** "2026-09-21" -> "21 September". Enough to say when, without the year. */
function shortDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso.slice(0, 10);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", timeZone: "UTC",
  });
}

export default function GroupWelcomeSender({
  group,
  members,
  onSent,
}: {
  group: WelcomeGroup;
  members: WelcomeMember[];
  onSent: () => void;
}) {
  const [book, setBook] = useState(group.bookUrl ?? "");
  const [resend, setResend] = useState(false);
  const [busy, setBusy] = useState(false);

  const trimmed = book.trim();
  const looksLikeUrl = /^https?:\/\/\S+$/i.test(trimmed);
  const withEmail = members.filter(m => m.email);
  const noEmail = members.length - withEmail.length;
  const recipients = withEmail.filter(m => resend || !m.welcomeSentAt);
  const isAr = group.languageKey !== "english";

  const send = async () => {
    if (recipients.length === 0) {
      toast({
        title: "Nobody to write to",
        description: "Everyone here has had the welcome already — tick resend to send it again.",
      });
      return;
    }

    setBusy(true);
    try {
      // Saved first, and saved whatever happens to the letters below: the
      // link is a fact about the group, not about this one batch.
      if (trimmed !== (group.bookUrl ?? "")) {
        const { error: bookErr } = await supabase
          .from("pkg_groups")
          .update({ book_url: trimmed || null })
          .eq("id", group.id);
        if (bookErr) throw bookErr;
      }

      let sent = 0;
      const failed: string[] = [];

      for (const m of recipients) {
        try {
          const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
            body: {
              email: m.email,
              name: (m.name || "").trim() || (isAr ? "طالبتنا العزيزة" : "there"),
              language: isAr ? "ar" : "en",
              template: "course_welcome",
              group_name: group.title,
              level: group.level,
              class_time_label: group.whenLabel,
              class_link_url: group.meetingUrl ?? "",
              book_url: trimmed,
            },
          });
          if (sendErr) throw new Error(sendErr.message);

          const { error: stampErr } = await supabase
            .from("pkg_group_members")
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq("group_id", group.id)
            .eq("user_id", m.userId);
          // Sent but unstamped is worth saying out loud: the next batch would
          // otherwise write to her a second time.
          if (stampErr) failed.push(`${m.name}: sent but not recorded — ${stampErr.message}`);
          sent++;
        } catch (e: any) {
          failed.push(`${m.name}: ${e?.message ?? String(e)}`);
        }
      }

      toast({
        title: sent > 0
          ? `Welcome sent to ${sent} student${sent === 1 ? "" : "s"}`
          : "Nothing was sent",
        description: failed.length > 0 ? failed.join(" · ") : undefined,
        variant: failed.length > 0 ? "destructive" : undefined,
      });
      if (failed.length === 0) onSent();
    } catch (e: any) {
      toast({
        title: "Could not send the welcome",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-input bg-muted/30 p-2">
      <p className="text-[11px] text-muted-foreground">
        Paste the book link first — it is saved on this group, so the next student seated here gets the same one.
        The letter carries the class time and the room, the book as its own button, and what the dashboard shows
        her: her schedule, her attendance, and what is paid and what is due.
      </p>

      <Input
        value={book}
        onChange={e => setBook(e.target.value)}
        className="h-8 text-xs"
        aria-label={`Book link for ${group.title}`}
        placeholder="https://… link to the book"
      />
      {trimmed !== "" && !looksLikeUrl && (
        <p className="text-[11px] text-destructive">That does not look like a link — it should start with https://</p>
      )}
      {!group.meetingUrl && (
        <p className="text-[11px] text-amber-600">
          This group has no room link yet, so the letter goes without one. Add it in "Edit group" first if you have it.
        </p>
      )}

      <div className="max-h-32 overflow-y-auto space-y-0.5">
        {members.map(m => (
          <div key={m.userId} className="flex items-center justify-between gap-2 px-1 text-[11px]">
            <span className="truncate">
              {m.name} <span className="text-muted-foreground">· {m.email || "no email"}</span>
            </span>
            {!m.email
              ? <span className="shrink-0 text-destructive">skipped</span>
              : m.welcomeSentAt
                ? <span className="shrink-0 text-muted-foreground">sent {shortDate(m.welcomeSentAt)}</span>
                : <span className="shrink-0 text-mint-strong">will send</span>}
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <input type="checkbox" checked={resend} onChange={e => setResend(e.target.checked)} />
        Resend to everyone, including students who already had it
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8"
          disabled={busy || !looksLikeUrl || recipients.length === 0}
          onClick={() => void send()}
        >
          <Mail className="h-3.5 w-3.5 mr-1" />
          {busy ? "Sending…" : `Send to ${recipients.length} student${recipients.length === 1 ? "" : "s"}`}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          {isAr ? "Arabic" : "English"} ·{" "}
          {group.whenLabel ? (
            <span lang={isAr ? "ar" : "en"} dir={isAr ? "rtl" : "ltr"}>{group.whenLabel}</span>
          ) : (
            "no day/time set"
          )}
          {noEmail > 0 && ` · ${noEmail} without an email address`}
        </span>
      </div>
    </div>
  );
}
