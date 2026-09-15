import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { DoorOpen, DoorClosed, VideoOff } from "lucide-react";

/**
 * Every upcoming trial session, whether or not it is open for booking.
 *
 * The same silence that hid the groups: every trial view in the app filters
 * `is_active = true`, so a session that is dated, staffed and has a room link
 * but is CLOSED appears on no screen at all. On 15 Sep two of them were sitting
 * in that state — 20 September and 26 September — and nothing anywhere said
 * so. A closed session looks exactly like a session that does not exist.
 *
 * `is_active` is the only thing this card touches. It is what the public
 * booking page reads, so it is the difference between a session a student can
 * book and one she cannot see.
 *
 * `lifecycle` is left alone on purpose: it is moved by the crons
 * (propose-trial-slots, advance-trial-slots) and by the Trials tab, and an
 * archived session that reopened here would fight them. Archived rows are
 * listed, plainly labelled, without a button.
 */

type Session = {
  id: string;
  date: string | null;
  time: string;
  language: string;
  capacity: number;
  booked: number;
  hasRoom: boolean;
  isOpen: boolean;
  /** "active" — ours to toggle. Anything else is someone else's to move. */
  lifecycle: string;
};

/** Today in Cairo as YYYY-MM-DD. The admin may be anywhere; the school is not. */
function cairoTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "2026-09-20" -> "Sunday 20 September". Plain date, never shifted by a zone. */
function prettyDate(iso: string | null): string {
  if (!iso) return "no date";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

const hhmm = (t: string | null | undefined) => (t ?? "").slice(0, 5);

export default function TrialSessionsToOpen() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const today = cairoTodayISO();

      // No is_active filter — that filter is the bug this card exists to undo.
      // The RLS policy on trial_slots reads
      // `is_active = true OR has_role(uid, 'admin')`, so an admin sees the
      // closed ones and nobody else does.
      const [slotsRes, bookingsRes] = await Promise.all([
        supabase
          .from("trial_slots")
          .select("id, trial_date, start_time, class_language, capacity, meeting_url, is_active, lifecycle")
          .gte("trial_date", today)
          .order("trial_date", { ascending: true }),
        supabase
          .from("trial_bookings")
          .select("trial_date, start_time")
          .neq("status", "cancelled")
          .gte("trial_date", today),
      ]);

      // Thrown, not swallowed. An empty list here would read as "every session
      // is open", which is the one wrong answer this card must never give.
      if (slotsRes.error) throw slotsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      // Matched on (trial_date, start_time) — the pair that is UNIQUE on
      // trial_slots, and the same join the rest of the admin uses.
      const booked = new Map<string, number>();
      for (const b of (bookingsRes.data ?? []) as Array<{ trial_date: string | null; start_time: string | null }>) {
        const k = `${b.trial_date ?? ""}|${b.start_time ?? ""}`;
        booked.set(k, (booked.get(k) ?? 0) + 1);
      }

      const rows: Session[] = ((slotsRes.data ?? []) as Array<{
        id: string; trial_date: string | null; start_time: string | null;
        class_language: string | null; capacity: number | null;
        meeting_url: string | null; is_active: boolean | null; lifecycle: string | null;
      }>)
        .filter(s => (s.lifecycle ?? "active") !== "retired")
        .map(s => ({
          id: s.id,
          date: s.trial_date,
          time: hhmm(s.start_time),
          language: s.class_language === "english" ? "English" : "Arabic",
          capacity: s.capacity ?? 0,
          booked: booked.get(`${s.trial_date ?? ""}|${s.start_time ?? ""}`) ?? 0,
          hasRoom: Boolean(s.meeting_url && s.meeting_url.trim()),
          isOpen: s.is_active === true,
          lifecycle: s.lifecycle ?? "active",
        }));

      // Closed sessions first — they are the ones nobody can see. Within each
      // group, soonest first.
      rows.sort((a, b) => {
        const aClosed = a.isOpen ? 1 : 0;
        const bClosed = b.isOpen ? 1 : 0;
        if (aClosed !== bClosed) return aClosed - bClosed;
        return `${a.date ?? ""}${a.time}`.localeCompare(`${b.date ?? ""}${b.time}`);
      });

      setSessions(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the trial sessions.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (s: Session) => {
    setBusyId(s.id);
    try {
      const { error: updateError } = await supabase
        .from("trial_slots")
        .update({ is_active: !s.isOpen })
        .eq("id", s.id);
      if (updateError) throw updateError;

      toast({
        title: s.isOpen
          ? `${prettyDate(s.date)} ${s.time} is closed`
          : `${prettyDate(s.date)} ${s.time} is open for booking`,
        description: s.isOpen
          ? "It is off the site now. Bookings already made are untouched — nobody has been cancelled."
          : s.hasRoom
            ? "Students can book it from the site."
            : "Students can book it — but it still has no room link, so nobody can join it yet.",
      });
      setConfirmId(null);
      await load();
    } catch (e: any) {
      toast({
        title: "Could not change the session",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-5 text-sm">
          <span className="font-semibold text-destructive">Could not load the trial sessions.</span>{" "}
          <span className="text-muted-foreground">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!sessions) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No trial sessions are dated from today onwards.
        </CardContent>
      </Card>
    );
  }

  const openable = sessions.filter(s => s.lifecycle === "active");
  const closed = openable.filter(s => !s.isOpen);
  const archived = sessions.filter(s => s.lifecycle !== "active");

  return (
    <div className="space-y-3">
      {closed.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {closed.length} upcoming session{closed.length === 1 ? "" : "s"} {closed.length === 1 ? "is" : "are"} closed.
          </span>{" "}
          A closed session is on no screen a student sees — it cannot be booked and it does not look like it exists.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Every upcoming session is open for booking.</p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {openable.map(s => {
          const confirming = confirmId === s.id;
          return (
            <Card key={s.id} className={s.isOpen ? undefined : "border-destructive"}>
              <CardContent className="p-4 space-y-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {s.isOpen
                    ? <DoorOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <DoorClosed className="h-4 w-4 shrink-0 text-destructive" />}
                  <span className="text-sm font-semibold">{prettyDate(s.date)} · {s.time}</span>
                  <Badge variant="secondary" className="text-[10px]">{s.language}</Badge>
                  {!s.hasRoom && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive">
                      <VideoOff className="h-3 w-3" /> no room link
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {s.booked} of {s.capacity} booked ·{" "}
                  {s.isOpen ? "open for booking" : "closed — invisible to students"}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={s.isOpen ? (confirming ? "destructive" : "outline") : "default"}
                    className="h-8"
                    disabled={busyId === s.id}
                    onClick={() => {
                      // Opening is safe and reversible, so it happens on the
                      // first click. Closing one people have booked is not: it
                      // takes the session off the site under them, so that one
                      // asks first.
                      if (!s.isOpen || s.booked === 0 || confirming) { void toggle(s); return; }
                      setConfirmId(s.id);
                    }}
                  >
                    {busyId === s.id
                      ? "Saving…"
                      : s.isOpen
                        ? (confirming ? `Confirm — hide it from ${s.booked} booked` : "Close this session")
                        : "Open for booking"}
                  </Button>
                </div>

                {confirming && (
                  <p className="text-[11px] text-muted-foreground">
                    {s.booked} {s.booked === 1 ? "person has" : "people have"} booked this. Closing it only takes it
                    off the site — nobody is cancelled and no email goes out.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {archived.length > 0 && (
        <div className="space-y-1 pt-1">
          {archived.map(s => (
            <p key={s.id} className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{prettyDate(s.date)} · {s.time}</span>{" "}
              <span>{s.lifecycle} — moved by the trial schedule, not from here</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
