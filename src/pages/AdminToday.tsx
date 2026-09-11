/**
 * /admin/today — the admin's default screen.
 *
 * Not a report. A queue of the things that need a decision, each with the
 * link that resolves it. When every card is clear there is nothing to do,
 * and that is the point: the empty state is the goal.
 *
 * Each trial session also carries its attendance picture, because "eleven
 * booked" and "eleven coming" are different numbers and only the second one
 * decides whether a session runs.
 *
 * Deliberately a separate route rather than a 26th tab. AdminDashboard.tsx
 * is 1,871 lines and reads its screen from `?tab=`, so this page deep-links
 * into it (`/admin?tab=trials`) without touching that file at all. Making
 * Today the landing screen and restructuring the sidebar is a follow-up that
 * edits AdminDashboard.tsx; this page is useful on its own before that lands.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AdminShell from "@/components/admin/AdminShell";
import PrivateClassesToConfirm from "@/components/admin/PrivateClassesToConfirm";
import { usePrivateConfirmQueue } from "@/hooks/admin/usePrivateConfirmQueue";
import { CalendarDays, Users, GraduationCap, Bell, ArrowRight } from "lucide-react";

type SlotRow = {
  id: string;
  trial_date: string | null;
  start_time: string | null;
  class_language: string | null;
  capacity: number | null;
  booked: number;
  /** Said yes to the attendance question. */
  confirmed: number;
  /** Said no — the seat is bookable again. */
  declined: number;
  /**
   * How many were actually SENT the confirmation request. Without this the
   * screen cannot tell "nine people ignored us" from "nobody was asked", and
   * those two call for opposite decisions.
   *
   * Counted from attendance_email_sent_at, the stamp the confirmation letter
   * writes. It used to count email_sent_at, which is the INVITATION stamp —
   * a different letter, asking a different question, written only by
   * send-trial-invitations. Nothing recorded the confirmation letter at all,
   * so this number was zero for every session no matter how many people had
   * been asked, and the line below said so in words.
   */
  asked: number;
};

type Counts = {
  waitingTotal: number;
  waitingArabic: number;
  waitingEnglish: number;
  unlevelled: number;
  awaitingPayment: number;
  /** Every notification ever written. Kept for the sidebar badge and the empty state. */
  notifications: number;
  /** Arrived since local midnight — the number a daily check is actually asking for. */
  notificationsToday: number;
  /** The newest few messages from today, so the card says what happened. */
  notificationsRecent: string[];
  oldestSignup: string | null;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "2026-09-11" -> "Fri 11 Sep". Parsed as a plain date, never shifted by a timezone. */
function formatSlotDate(iso: string | null): string {
  if (!iso) return "Date TBA";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const month = dt.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${DAY_NAMES[dt.getUTCDay()].slice(0, 3)} ${d} ${month}`;
}

function formatSignup(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

/**
 * Local midnight as an ISO instant.
 *
 * created_at is a timestamptz, so "today" has to be anchored to the admin's own
 * midnight rather than to a sliced UTC string — in Cairo the two differ by
 * three hours, which is three hours of this morning's notifications reported as
 * yesterday's.
 */
function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const AdminToday = () => {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [slots, setSlots] = useState<SlotRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Private lessons the weekly schedule says have happened and nobody has
  // answered for. Read here only to decide whether the section exists at all;
  // the strip below owns the rows and the buttons. Both calls share one
  // react-query cache, so this is not a second fetch.
  const { toConfirm: privateToConfirm } = usePrivateConfirmQueue();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Waiting list: pending with no date yet. Split by language because the
        // two tracks are seated in different sessions.
        const waitingBase = () =>
          supabase
            .from("trial_bookings")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending")
            .is("trial_date", null);

        const [
          waitingAll,
          waitingAr,
          waitingEn,
          unlevelled,
          payments,
          notifications,
          notificationsToday,
          oldest,
          slotRows,
        ] = await Promise.all([
          waitingBase(),
          waitingBase().eq("class_language", "arabic"),
          waitingBase().eq("class_language", "english"),
          waitingBase().or("level.is.null,level.eq."),
          supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .ilike("approval_status", "pending%"),
          supabase.from("admin_notifications").select("*", { count: "exact", head: true }),
          // One request answers both halves of the card: `count` is how many
          // arrived today, the three rows are what they said.
          supabase
            .from("admin_notifications")
            .select("message, created_at", { count: "exact" })
            .gte("created_at", startOfTodayISO())
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("trial_bookings")
            .select("created_at")
            .eq("status", "pending")
            .is("trial_date", null)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("trial_slots")
            .select("id, trial_date, start_time, class_language, capacity")
            .eq("is_active", true)
            .eq("lifecycle", "active")
            .order("trial_date", { ascending: true }),
        ]);

        if (notificationsToday.error) throw notificationsToday.error;

        if (cancelled) return;

        // Every live dated booking, in ONE query, then tallied per slot in
        // memory. This replaced a count-per-slot loop: six sessions meant six
        // round trips before the page could paint, and adding attendance would
        // have made it eighteen.
        //
        // Only the four fields the tally needs are selected. No name, no email,
        // no phone reaches this screen — it shows totals, never people.
        //
        // The error is thrown, not swallowed. A rejected request here returns
        // null, which would leave the tally empty and render "0 of 12 booked"
        // and "Nobody has been asked to confirm yet" for every session — two
        // false statements that both look like data, on the screen built to
        // tell "ignored us" apart from "never asked". Throwing hands it to the
        // catch below, which shows the banner.
        const { data: bookingRows, error: bookingRowsError } = await supabase
          .from("trial_bookings")
          .select("trial_date, start_time, attendance_response, attendance_email_sent_at")
          .neq("status", "cancelled")
          .not("trial_date", "is", null);
        if (bookingRowsError) throw bookingRowsError;

        type Tally = { booked: number; confirmed: number; declined: number; asked: number };
        const tally = new Map<string, Tally>();
        const key = (d: string | null, t: string | null) => `${d ?? ""}|${t ?? ""}`;

        for (const b of (bookingRows ?? []) as Array<{
          trial_date: string | null;
          start_time: string | null;
          attendance_response: string | null;
          attendance_email_sent_at: string | null;
        }>) {
          const k = key(b.trial_date, b.start_time);
          const t = tally.get(k) ?? { booked: 0, confirmed: 0, declined: 0, asked: 0 };
          t.booked += 1;
          if (b.attendance_response === "yes") t.confirmed += 1;
          if (b.attendance_response === "no") t.declined += 1;
          if (b.attendance_email_sent_at) t.asked += 1;
          tally.set(k, t);
        }

        // Matched on (trial_date, start_time) — the pair that is UNIQUE on
        // trial_slots.
        const rows: SlotRow[] = ((slotRows.data ?? []) as Array<
          Omit<SlotRow, "booked" | "confirmed" | "declined" | "asked">
        >).map(s => ({
          ...s,
          ...(tally.get(key(s.trial_date, s.start_time)) ?? {
            booked: 0, confirmed: 0, declined: 0, asked: 0,
          }),
        }));

        if (cancelled) return;

        setCounts({
          waitingTotal: waitingAll.count ?? 0,
          waitingArabic: waitingAr.count ?? 0,
          waitingEnglish: waitingEn.count ?? 0,
          unlevelled: unlevelled.count ?? 0,
          awaitingPayment: payments.count ?? 0,
          notifications: notifications.count ?? 0,
          notificationsToday: notificationsToday.count ?? 0,
          notificationsRecent: ((notificationsToday.data ?? []) as Array<{ message: string | null }>)
            .map(n => (n.message ?? "").trim())
            .filter(Boolean),
          oldestSignup: (oldest.data as { created_at?: string } | null)?.created_at ?? null,
        });
        setSlots(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load today's summary.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const seatsTotal = (slots ?? []).reduce((n, s) => n + (s.capacity ?? 0), 0);
  const bookedTotal = (slots ?? []).reduce((n, s) => n + s.booked, 0);
  const askedTotal = (slots ?? []).reduce((n, s) => n + s.asked, 0);
  // Everyone has a date; nobody has been asked whether they are coming. That
  // is a different job from inviting, and the card used to offer the wrong one.
  const toAsk = Math.max(0, bookedTotal - askedTotal);
  const invitingDone = (counts?.waitingTotal ?? 0) === 0 && bookedTotal > 0;
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AdminShell
      activeId="today"
      badges={{
        trials: counts?.waitingTotal,
        enrollments: counts?.awaitingPayment,
        notifications: counts?.notifications,
      }}
    >
      <main id="main-content">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 space-y-8">

          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight">Today</h1>
              <p className="text-sm text-muted-foreground">{today}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/admin?tab=trials">Open trials</Link>
              </Button>
              <Button asChild>
                <Link to="/admin?tab=trials">
                  Invite students <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </header>

          {error && (
            <Card className="border-destructive">
              <CardContent className="p-5 text-sm">
                <span className="font-semibold text-destructive">Could not load the summary.</span>{" "}
                <span className="text-muted-foreground">{error}</span>
              </CardContent>
            </Card>
          )}

          {/* NEEDS YOU */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">NEEDS YOU</h2>

            {!counts && !error ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-lg" />)}
              </div>
            ) : counts ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <ActionCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label={invitingDone ? "TRIAL CONFIRMATIONS" : "TRIAL INVITES"}
                  value={invitingDone ? toAsk : counts.waitingTotal}
                  unit={
                    invitingDone
                      ? `to ask · ${bookedTotal} booked`
                      : `waiting · ${bookedTotal} booked`
                  }
                  urgent={invitingDone ? toAsk > 0 : counts.waitingTotal > 0 && bookedTotal === 0}
                  body={
                    invitingDone
                      ? `${seatsTotal} seats across ${slots?.length ?? 0} sessions. ` +
                        (toAsk > 0
                          ? `${toAsk} of them have not been asked whether they are coming.`
                          : "Everyone has been asked.")
                      : `${counts.waitingArabic} Arabic · ${counts.waitingEnglish} English. ` +
                        `${seatsTotal} seats across ${slots?.length ?? 0} sessions.` +
                        (formatSignup(counts.oldestSignup)
                          ? ` Oldest signup has waited since ${formatSignup(counts.oldestSignup)}.`
                          : "")
                  }
                  to="/admin?tab=trials"
                  cta={
                    invitingDone
                      ? toAsk > 0
                        ? "Ask them to confirm"
                        : "Open trials"
                      : "Start inviting"
                  }
                  primary
                />

                <ActionCard
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="PAYMENTS"
                  value={counts.awaitingPayment}
                  unit="awaiting payment"
                  urgent={counts.awaitingPayment > 0}
                  body="Enrollments approved but not yet paid."
                  to="/admin?tab=enrollments"
                  cta="Review"
                />

                <ActionCard
                  icon={<Users className="h-4 w-4" />}
                  label="UNLEVELLED"
                  value={counts.unlevelled}
                  unit="no level recorded"
                  body="They cannot be seated until they sit a placement test — guessing a level puts them in the wrong class."
                  to="/admin?tab=placement-tests"
                  cta="Placement tests"
                />

                {/* "188 total" only ever grows and never asks for anything. What a
                    daily check wants is what arrived since this morning, and what
                    it said. */}
                <ActionCard
                  icon={<Bell className="h-4 w-4" />}
                  label="NOTIFICATIONS"
                  value={counts.notificationsToday}
                  unit="new today"
                  body={
                    counts.notificationsToday === 0 ? (
                      <>Nothing new today. {counts.notifications} older ones are all in one place.</>
                    ) : (
                      <span className="block">
                        {counts.notificationsRecent.map((m, i) => (
                          <span key={i} className="block truncate">· {m}</span>
                        ))}
                        {counts.notificationsToday > counts.notificationsRecent.length && (
                          <span className="block">
                            +{counts.notificationsToday - counts.notificationsRecent.length} more today
                          </span>
                        )}
                      </span>
                    )
                  }
                  to="/admin?tab=notifications"
                  cta="Open"
                />

              </div>
            ) : null}
          </section>

          {/* PRIVATE CLASSES TO CONFIRM
              Money, not admin: until Re answers, the lesson is not counted
              against the student's bundle and the balance she quotes is wrong.
              It sat on My Students, a screen she has no reason to open on a day
              with no scheduling to do — so a taught lesson could go unanswered
              for a week without anything saying so. The strip is the same
              component, and its buttons work here. */}
          {privateToConfirm.length > 0 && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                  PRIVATE CLASSES TO CONFIRM
                </h2>
                <Link
                  to="/admin?tab=my-students"
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  My students
                </Link>
              </div>
              {/* Five, not eight: Today is a queue of decisions, not the place
                  to work through a backlog. Anything past that is a Catch up. */}
              <PrivateClassesToConfirm
                limit={5}
                overflow={hidden => (
                  <p className="text-xs text-muted-foreground pt-1">
                    …and {hidden} more —{" "}
                    <Link
                      to="/admin?tab=my-students"
                      className="font-semibold text-foreground underline underline-offset-2"
                    >
                      do them together in My students
                    </Link>
                  </p>
                )}
              />
            </section>
          )}

          {/* TRIAL WEEK */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                NEXT TRIAL SESSIONS
              </h2>
              <p className="text-xs text-muted-foreground">times as configured on each slot</p>
            </div>

            {!slots && !error ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
              </div>
            ) : slots && slots.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {slots.map(s => {
                  const cap = s.capacity ?? 0;
                  return (
                    <Card key={s.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold">
                            {formatSlotDate(s.trial_date)} · {s.start_time ?? "TBA"}
                          </span>
                          <Badge variant="secondary" className="capitalize">
                            {s.class_language ?? "any"}
                          </Badge>
                        </div>
                        <div className="flex gap-1" aria-hidden="true">
                          {Array.from({ length: Math.max(cap, 1) }).map((_, i) => (
                            <span
                              key={i}
                              className={`h-1.5 flex-1 rounded-full ${
                                i < s.confirmed
                                  ? "bg-primary"
                                  : i < s.booked
                                    ? "bg-primary/35"
                                    : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {s.booked} of {cap} booked
                            {s.booked > 0 && (
                              <span className="text-foreground">
                                {" · "}
                                <span className="font-semibold">{s.confirmed}</span> confirmed
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <AttendanceNote
                              booked={s.booked}
                              confirmed={s.confirmed}
                              declined={s.declined}
                              asked={s.asked}
                            />
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : slots ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No active trial sessions are scheduled.
                </CardContent>
              </Card>
            ) : null}
          </section>

        </div>
      </main>
    </AdminShell>
  );
};

/**
 * One honest line about attendance for a session.
 *
 * The distinction this exists to draw: "no reply" and "not asked" look
 * identical in the data — attendance_response is null either way — and they
 * mean opposite things. Nine silent people who were emailed is a session in
 * trouble. Nine silent people who were never emailed is a task nobody has
 * done yet, and reading it as apathy would be reading a mirror.
 *
 * `asked` is the count of attendance_email_sent_at, so the sentences below
 * are now true statements about the confirmation letter rather than about the
 * invitation, which is a different letter that answers a different question.
 */
const AttendanceNote = ({
  booked, confirmed, declined, asked,
}: {
  booked: number; confirmed: number; declined: number; asked: number;
}) => {
  if (booked === 0) return <>No bookings yet.</>;

  const silent = Math.max(0, booked - confirmed - declined);

  if (asked === 0) {
    return (
      <>
        <Link to="/admin?tab=trials" className="font-semibold text-foreground underline decoration-2 underline-offset-2">محدش اتسأل لسه — ابعتيلهم ←</Link>
        {declined > 0 && ` ${declined} already said no.`}
      </>
    );
  }

  const parts: string[] = [];
  if (declined > 0) parts.push(`${declined} can't make it`);
  if (silent > 0) parts.push(`${silent} no reply`);
  if (asked < booked) parts.push(`${booked - asked} not asked yet`);

  return <>{parts.length ? parts.join(" · ") : "Everyone has answered."}</>;
};

const ActionCard = ({
  icon, label, value, unit, body, to, cta, urgent, primary,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  /** Widened from string so a card can list what it is counting, not just describe it. */
  body: React.ReactNode;
  to: string;
  cta: string;
  urgent?: boolean;
  primary?: boolean;
}) => (
  <Card className={urgent ? "border-foreground" : undefined}>
    <CardContent className="p-5 flex h-full flex-col gap-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {urgent && <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-hidden="true" />}
        {icon}
        <span className="text-xs font-bold tracking-[0.04em]">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold leading-none tracking-tight">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground">{body}</div>
      <Button asChild variant={primary ? "default" : "outline"} className="mt-auto w-full">
        <Link to={to}>{cta}</Link>
      </Button>
    </CardContent>
  </Card>
);

export default AdminToday;
