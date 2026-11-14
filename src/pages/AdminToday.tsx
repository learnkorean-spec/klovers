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
import RecordedClasses from "@/components/admin/RecordedClasses";
import TrialAttendance from "@/components/admin/TrialAttendance";
import GroupsToStart from "@/components/admin/GroupsToStart";
import TrialSessionsToOpen from "@/components/admin/TrialSessionsToOpen";
import ClassRooms from "@/components/admin/ClassRooms";
import MoneyIn from "@/components/admin/MoneyIn";
import { usePrivateConfirmQueue } from "@/hooks/admin/usePrivateConfirmQueue";
import { CalendarDays, Users, GraduationCap, Bell, ArrowRight, MessageCircle } from "lucide-react";

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
  /**
   * Unread business updates — the sidebar badge, and the number the empty
   * state quotes. It used to be every notification ever written, read or not,
   * system or not, which is why the bell said "99+" for months and would have
   * gone on saying it whatever she did.
   */
  notifications: number;
  /** Arrived since local midnight — the number a daily check is actually asking for. */
  notificationsToday: number;
  /** The newest few messages from today, so the card says what happened. */
  notificationsRecent: string[];
  oldestSignup: string | null;
};

/**
 * A trial booking submitted today — the thing this section exists to show,
 * so she can see who just signed up without opening Trials, and message
 * each one straight away.
 */
type TrialSignupRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  level: string | null;
  class_language: string | null;
  created_at: string;
};

interface GroupClassRow {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string | null;
  duration_min: number | null;
  capacity: number | null;
  timezone: string | null;
  groups: number;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * The two numbered levels that have group classes on the calendar. Level 3 has
 * packages too, but only one student is placed there, so the dashboard would be
 * reporting a class nobody is waiting for.
 */
const GROUP_CLASS_LEVELS = ["level_1", "level_2"];

const LEVEL_LABEL: Record<string, string> = {
  hangul: "Hangul",
  level_1: "Level 1",
  level_2: "Level 2",
  level_3: "Level 3",
  level_4: "Level 4",
  level_5: "Level 5",
  level_6: "Level 6",
};

/** "16:00:00" -> "16:00". The column is a plain wall time, already in the package's own zone. */
function shortTime(t: string | null): string {
  if (!t) return "TBA";
  return t.slice(0, 5);
}

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
  const [groupClasses, setGroupClasses] = useState<GroupClassRow[] | null>(null);
  const [todaySignups, setTodaySignups] = useState<TrialSignupRow[] | null>(null);
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
          packagesRes,
          pkgGroupsRes,
          signupsToday,
        ] = await Promise.all([
          waitingBase(),
          waitingBase().eq("class_language", "arabic"),
          waitingBase().eq("class_language", "english"),
          waitingBase().or("level.is.null,level.eq."),
          supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            // "Approved but not yet paid" lives in payment_status. The old
            // filter looked for "pending%" in approval_status, a column that
            // never holds it, so this card read 0 while a payment was owed.
            .eq("approval_status", "APPROVED")
            .eq("payment_status", "PENDING_PAYMENT")
            .is("deleted_at", null),
          // Unread business updates only. Without the two filters this counted
          // every row the table had ever held — a number that only grows — and
          // the bell beside it was stuck on "99+" no matter how much she read.
          supabase
            .from("admin_notifications")
            .select("*", { count: "exact", head: true })
            .eq("read", false)
            .eq("category", "update"),
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
          supabase
            .from("schedule_packages")
            .select("id, level, day_of_week, start_time, duration_min, capacity, timezone")
            .eq("is_active", true)
            .eq("course_type", "group")
            .in("level", GROUP_CLASS_LEVELS)
            .order("level", { ascending: true })
            .order("day_of_week", { ascending: true }),
          supabase.from("pkg_groups").select("id, package_id"),
          // Whoever booked a trial since local midnight, newest first — the
          // "who signed up today" list, kept separate from the waiting-list
          // count above because that one only ever counts undated bookings
          // and this one is about the day, not the queue.
          supabase
            .from("trial_bookings")
            .select("id, name, email, phone, level, class_language, created_at")
            .neq("status", "cancelled")
            .gte("created_at", startOfTodayISO())
            .order("created_at", { ascending: false }),
        ]);

        // Any failed request must surface as the banner. A rejected count
        // comes back as null, and `?? 0` below would present it as real data.
        const failed = [
          waitingAll, waitingAr, waitingEn, unlevelled, payments,
          notifications, notificationsToday, oldest, slotRows, packagesRes, pkgGroupsRes,
          signupsToday,
        ].find((r) => r.error);
        if (failed?.error) throw failed.error;

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

        // Same shape one level up: the package is the bookable time, the group
        // is the seat, and they are separate rows. Counted in memory from one
        // pkg_groups read rather than a query per package.
        const groupCount = new Map<string, number>();
        for (const g of pkgGroupsRes.data ?? []) {
          const pid = (g as any).package_id;
          if (pid) groupCount.set(pid, (groupCount.get(pid) ?? 0) + 1);
        }
        const groupRows: GroupClassRow[] = (packagesRes.data ?? []).map((p: any) => ({
          ...p,
          groups: groupCount.get(p.id) ?? 0,
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
        setGroupClasses(groupRows);
        setTodaySignups((signupsToday.data ?? []) as TrialSignupRow[]);
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
    >
      <div id="main-content">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 space-y-8">

          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight">Today</h1>
              <p className="text-sm text-muted-foreground">{today}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin?tab=trials">
                  Open trials <ArrowRight className="ml-1.5 h-4 w-4" />
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

          {/* TRIAL SIGNUPS — TODAY
              Re's own ask: show whoever booked a trial since local midnight
              right here, newest first, with a one-tap WhatsApp button already
              carrying her phone number — rather than her having to open
              Trials and hunt for the number herself. Stays empty, not hidden,
              on a day with no signups, since "nothing yet today" is itself an
              answer to the question this section exists to answer. */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                TRIAL SIGNUPS — TODAY
              </h2>
              <p className="text-xs text-muted-foreground">newest first · tap to message on WhatsApp</p>
            </div>

            {!todaySignups && !error ? (
              <Skeleton className="h-20 rounded-lg" />
            ) : todaySignups && todaySignups.length > 0 ? (
              <Card>
                <CardContent className="p-4 space-y-2">
                  {todaySignups.map(r => {
                    const waDigits = r.phone?.replace(/[^0-9]/g, "") ?? "";
                    const hasPhone = waDigits.length >= 8;
                    const firstName = (r.name ?? "").trim().split(/\s+/)[0] || "there";
                    const waMsg = encodeURIComponent(
                      `Hi ${firstName}! \u{1F44B} Thanks for booking a free trial with Klovers Korean \u{1F1F0}\u{1F1F7} — I'm Reham, happy to help with anything before your class.`
                    );
                    const waLink = hasPhone
                      ? `https://wa.me/${waDigits}?text=${waMsg}`
                      : `https://wa.me/?text=${waMsg}`;
                    const signupTime = new Date(r.created_at).toLocaleTimeString("en-GB", {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
                      >
                        <span className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate font-medium">{r.name?.trim() || r.email || "—"}</span>
                          {r.class_language && (
                            <Badge variant="secondary" className="capitalize text-[10px]">
                              {r.class_language}
                            </Badge>
                          )}
                          {r.level && (
                            <span className="text-xs text-muted-foreground">
                              {LEVEL_LABEL[r.level] ?? r.level}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{signupTime}</span>
                        </span>
                        <Button
                          asChild
                          size="sm"
                          variant={hasPhone ? "default" : "outline"}
                          className="h-7 px-2 text-xs"
                        >
                          <a href={waLink} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="mr-1 h-3.5 w-3.5" />
                            {hasPhone ? "WhatsApp" : "WhatsApp (no number)"}
                          </a>
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : todaySignups ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No trial signups yet today.
                </CardContent>
              </Card>
            ) : null}
          </section>

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
                      <>Nothing new today. {counts.notifications} unread update{counts.notifications === 1 ? "" : "s"} are all in one place.</>
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

          {/* MONEY IN
              What has actually been collected, group and private side by side.
              It lived only in the KPI strip above AdminDashboard's tabs, and
              bare /admin redirects here — so the screen opened every morning
              showed no money at all and the figures could only be reached by
              first picking some unrelated tab.

              A readout rather than a decision, so it sits below NEEDS YOU and
              above the queues. Private budgets are never converted: each
              student pays in their own currency and the system holds no rate.
              See MoneyIn.tsx. */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                MONEY IN
              </h2>
              <p className="text-xs text-muted-foreground">what has been collected so far</p>
            </div>
            <MoneyIn />
          </section>

          {/* GROUPS TO START
              The only action that makes a group real. `activate_pkg_group()`
              has been live since 15 Sep and no screen called it, so no group
              had a start_date, no student had a first_class_date, and both
              payment letters — written, deployed and switched on the same day
              — could not reach a single person. Eight active groups, none
              started.

              Above the rooms and the trial week because it is upstream of
              both: a group that has not started has no first class to put a
              room link on. */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                GROUPS TO START
              </h2>
              <p className="text-xs text-muted-foreground">sets the first class date and the payment deadline</p>
            </div>
            <GroupsToStart />
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

          {/* PRIVATE CLASSES ALREADY ANSWERED
              Directly under the strip above, because the correction this exists
              for is always noticed right after the answer that needs it: a
              class marked "did not happen" on Monday and then taught on
              Wednesday. Until this card, that answer was final and the only
              repairs on record were made by hand in the database. Renders
              nothing when there are no recorded classes at all. */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                PRIVATE CLASSES ALREADY ANSWERED
              </h2>
              <p className="text-xs text-muted-foreground">open one to change the date or the answer</p>
            </div>
            <RecordedClasses limit={6} />
          </section>

          {/* TRIAL — WHO CAME
              The same question as the two cards above, asked about the other
              half of the school. Nothing in the database has ever recorded that
              a trial HAPPENED for a given student: attendance_response is what
              she predicted days beforehand, and status is about the booking,
              not the room. So the letter that follows a trial is aimed by the
              clock and written in neutral words, and no report can say what a
              session's turnout really was.

              Here, under the private strips, because it is the same decision
              and the same habit — answer for yesterday's teaching before
              looking at tomorrow's. Renders nothing once every recent session
              has been marked. */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                TRIAL — WHO CAME
              </h2>
              <p className="text-xs text-muted-foreground">undecided is not a no-show</p>
            </div>
            <TrialAttendance days={14} />
          </section>

          {/* CLASS ROOMS
              The joining link lived on one column of one table and appeared on
              no screen at all. On 14 Sep six of the eight group classes had
              none - including the one holding the only paying student - and
              nothing anywhere said so. A class with no room looks exactly like
              a class that is ready, right up until the hour it is supposed to
              start.

              Here because Today is the screen she opens, and because a missing
              link is a decision waiting on her, which is what this page is for.
              Rooms with no link sort first; the working ones are just a place
              to copy from. */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                CLASS ROOMS
              </h2>
              <p className="text-xs text-muted-foreground">the link students are sent</p>
            </div>
            <ClassRooms />
          </section>

          {/* TRIAL SESSIONS — CAN THEY BE BOOKED
              The grid below answers "are the booked ones coming". It could
              never answer "can anyone book this", because it only ever listed
              sessions with is_active = true — the same filter every other
              trial view uses. On 15 Sep two future sessions, 20 and 26
              September, were dated, had a room link, and were closed. They
              appeared on no screen in the app, which is indistinguishable from
              not existing. */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                TRIAL SESSIONS — OPEN OR CLOSED
              </h2>
              <p className="text-xs text-muted-foreground">whether a student can book it at all</p>
            </div>
            <TrialSessionsToOpen />
          </section>

          {/* TRIAL WEEK */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                NEXT TRIAL SESSIONS
              </h2>
              <p className="text-xs text-muted-foreground">who has said they are coming</p>
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

          {/* GROUP CLASSES */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                SUGGESTED GROUP CLASSES
              </h2>
              <p className="text-xs text-muted-foreground">Cairo time · what a placed student is offered</p>
            </div>

            {!groupClasses && !error ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
              </div>
            ) : groupClasses && groupClasses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {groupClasses.map(p => (
                  <Card key={p.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold">
                          {DAY_NAMES[p.day_of_week] ?? "Day TBA"} · {shortTime(p.start_time)}
                        </span>
                        <Badge variant="secondary">{LEVEL_LABEL[p.level] ?? p.level}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {p.duration_min ?? 60} min · up to {p.capacity ?? 0} students
                      </p>
                      {/* The package is the time a student can pick. The group is the
                          thing she is actually seated in, and it is a separate row --
                          so a package with no group reads as bookable on her side and
                          goes nowhere on yours. Worth saying on the dashboard rather
                          than discovering it when someone books. */}
                      <p className="text-xs text-muted-foreground">
                        {p.groups > 0
                          ? `${p.groups} group${p.groups > 1 ? "s" : ""} running`
                          : "No group created yet — she can pick this time, but cannot be seated"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : groupClasses ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No Level 1 or Level 2 group classes are active.
                </CardContent>
              </Card>
            ) : null}
          </section>

        </div>
      </div>
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
