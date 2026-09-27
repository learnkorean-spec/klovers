/**
 * Re's ongoing 1:1 students and their weekly classes.
 *
 * Deliberately separate from the site's registered-student types: these people
 * are not signed up on kloversegy.com, they are private students whose classes
 * block trial availability. Contact details, levels and billing are a later
 * phase and will extend `MyStudent` rather than replace it.
 */

export const STUDENT_SUBJECTS = ["korean", "english"] as const;
export type StudentSubject = (typeof STUDENT_SUBJECTS)[number];

export const STUDENT_STATUSES = ["active", "paused", "ended"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export interface MyStudent {
  id: string;
  full_name: string;
  /** What they learn. NOT the language of instruction. */
  subject: StudentSubject;
  status: StudentStatus;
  note: string | null;
  /** Stable meeting room for this student. Null until one is pasted in. */
  meeting_url: string | null;
  /** Matches a country in @/lib/stripePrices; drives default currency and prices. */
  country: string | null;
  /** ISO 4217. Defaults from country, then overridable — what they pay in is an agreement. */
  currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentClassSchedule {
  id: string;
  student_id: string;
  /** 0 = Sunday .. 6 = Saturday, matching Postgres EXTRACT(DOW). */
  weekday: number;
  /** "HH:MM:SS" as returned by Postgres `time`. */
  start_time: string;
  duration_minutes: number;
  timezone: string;
  effective_from: string;
  effective_to: string | null;
  note: string | null;
}

export interface MyStudentWithClasses extends MyStudent {
  classes: StudentClassSchedule[];
}

export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const SUBJECT_LABEL: Record<StudentSubject, string> = {
  korean: "Learning Korean",
  english: "Learning English",
};

export const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "Active",
  paused: "Paused",
  ended: "Ended",
};

/** "23:00:00" or "23:00" -> minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 1410 -> "23:30". Wraps past 24h so a class crossing midnight reads correctly. */
export function minutesToTime(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** True when the class runs past midnight into the following day. */
export function crossesMidnight(startTime: string, durationMinutes: number): boolean {
  return timeToMinutes(startTime) + durationMinutes > 1440;
}

/**
 * "23:00 – 00:30 (+1 day)" for a class that wraps, "16:00 – 17:30" otherwise.
 * A wrapping class is still one class; the suffix says where it ends, it does
 * not imply a second entry.
 */
export function formatClassRange(startTime: string, durationMinutes: number): string {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  const label = `${minutesToTime(start)} – ${minutesToTime(end)}`;
  return end > 1440 ? `${label} (+1 day)` : label;
}

/** "Mon 22:00 – 23:30 · Tue 22:00 – 23:30" for a compact list row. */
export function formatWeeklySummary(classes: StudentClassSchedule[]): string {
  if (!classes.length) return "No classes scheduled";
  return [...classes]
    .sort((a, b) =>
      a.weekday - b.weekday || timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    .map(c => `${DAY_SHORT[c.weekday]} ${formatClassRange(c.start_time, c.duration_minutes)}`)
    .join(" · ");
}

/** Total teaching minutes a week — shown so a schedule change is easy to sanity-check. */
export function weeklyMinutes(classes: StudentClassSchedule[]): number {
  return classes.reduce((sum, c) => sum + c.duration_minutes, 0);
}

// ---------------------------------------------------------------------------
// Bundles and credits.
//
// A bundle is what a student bought: a number of classes for a price, in the
// currency they paid. The balance is NOT stored on it — it is counted from
// confirmed sessions, which is why nothing here holds a `remaining` field.
// ---------------------------------------------------------------------------

export const BUNDLE_STATUSES = ["active", "completed", "cancelled"] as const;
export type BundleStatus = (typeof BUNDLE_STATUSES)[number];

export type BundleSource = "catalog" | "custom";

export interface StudentBundle {
  id: string;
  student_id: string;
  source: BundleSource;
  catalog_key: string | null;
  label: string;
  total_classes: number;
  total_price: number;
  currency: string;
  purchased_on: string;
  /** The first date this bundle covers. See resolveBundleForDate. */
  coverage_start: string;
  /** Null means coverage_start was backfilled and nobody has reviewed it yet. */
  coverage_start_confirmed_at: string | null;
  /** Null means Re has not recorded a payment for this bundle yet. */
  paid_on?: string | null;
  status: BundleStatus;
  voided_reason: string | null;
  voided_at: string | null;
  note: string | null;
}

/** One row of student_bundle_edits — an old/new diff for a single changed column. */
export interface BundleEdit {
  id: string;
  bundle_id: string;
  edited_at: string;
  edited_by: string;
  changes: Record<string, { old: unknown; new: unknown }>;
}

/** One row of get_student_bundle_balances() — the active bundle plus its usage. */
export interface BundleBalance {
  student_id: string;
  bundle_id: string;
  label: string;
  source: BundleSource;
  catalog_key: string | null;
  total_classes: number;
  used_classes: number;
  /** Can be negative: a class that happened after the bundle ran out still happened. */
  remaining_classes: number;
  total_price: number;
  currency: string;
  purchased_on: string;
}

/**
 * The outcomes a human can CHOOSE for a class. Deliberately not every state a
 * session row can be in — see SESSION_STATES — because every picker in the
 * admin offers exactly these two and must never offer "scheduled", which is
 * something the generator writes, not something Re decides.
 */
export const SESSION_OUTCOMES = ["attended", "cancelled_no_charge"] as const;
export type SessionOutcome = (typeof SESSION_OUTCOMES)[number];

/**
 * Every state a student_class_sessions row can actually be READ in, which is
 * the two choosable outcomes plus "scheduled": on the calendar, not yet
 * answered, and never counted. The weekly generator materialises upcoming
 * private lessons as scheduled rows so they can be seen and answered in one
 * click; until someone answers, such a row carries confirmed_at = null and
 * counted = false, and must not be mistaken for a confirmation.
 */
export const SESSION_STATES = ["attended", "cancelled_no_charge", "scheduled"] as const;
export type SessionState = (typeof SESSION_STATES)[number];

export interface StudentClassSession {
  id: string;
  student_id: string;
  bundle_id: string;
  class_id: string | null;
  session_date: string;
  start_time: string;
  outcome: SessionState;
  counted: boolean;
  /** Null on a scheduled row — nobody has answered for that lesson yet. */
  confirmed_at: string | null;
  note: string | null;
}

/** A row somebody has actually answered for. A scheduled row is not one. */
export function isResolved(s: StudentClassSession): boolean {
  return s.outcome !== "scheduled";
}

/**
 * A class the weekly schedule says should have happened, paired with whatever
 * the database holds for it. Built in the browser from teacher_student_classes,
 * which is what lets this list be rebuilt at any time without consulting
 * stored state.
 *
 * The two row fields are not interchangeable and only one is ever set. A slot
 * holding a generated, still-unanswered row is UNCONFIRMED — it is precisely
 * the class Re has yet to answer for — so it gets `scheduledRow` and a null
 * `confirmed`. Treating that row as a confirmation would silently drop the
 * class out of the confirm queue and out of its bundle's count, which is the
 * defect this split exists to prevent.
 */
export interface ExpectedSession {
  student_id: string;
  class_id: string;
  /** "YYYY-MM-DD" in the teacher's timezone. */
  session_date: string;
  /** "HH:MM". */
  start_time: string;
  duration_minutes: number;
  /** The answered row for this occurrence, attended or cancelled. */
  confirmed: StudentClassSession | null;
  /** The generator's placeholder sitting in this slot, still unanswered. */
  scheduledRow: StudentClassSession | null;
}

/**
 * Money as paid, never converted. Intl gives each currency its own decimals —
 * 6,400 EGP, 218.500 BHD, ¥8,940 — and falls back to a plain join if the
 * runtime does not know the code.
 */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

/** "400.00 EGP per class". Bundles always have total_classes > 0. */
export function pricePerClass(totalPrice: number, totalClasses: number, currency: string): string {
  if (totalClasses <= 0) return "—";
  return `${formatMoney(totalPrice / totalClasses, currency)} per class`;
}

/** Local YYYY-MM-DD for a date in a given IANA zone, without UTC drift. */
export function localDateKey(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** 0 = Sunday .. 6 = Saturday for a date read in a given zone. */
export function localWeekday(d: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

/** Whole calendar days between two "YYYY-MM-DD" keys, treated as plain dates. */
function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const diffMs = Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd);
  return Math.max(0, Math.round(diffMs / 86400000));
}

/**
 * A queue, not a recent-activity list: every occurrence of a student's weekly
 * classes from each class's own effective_from up to today, newest first, each
 * paired with whatever row the database holds for it. An occurrence never ages
 * out — a class the schedule says happened stays in this list until it is
 * answered, however far back effective_from goes.
 *
 * A slot whose only row is the generator's `scheduled` placeholder still counts
 * as unanswered: it comes back with `confirmed` null and `scheduledRow` set, so
 * a lesson that was merely put on the calendar and then let past its date keeps
 * asking to be answered instead of quietly reading as done.
 *
 * Only looks backwards, and never past a class that is not OVER yet: a class
 * that has not finished cannot be marked as done. It used to compare against
 * the START time, which offered a lesson that was still in progress — and the
 * database now refuses to count one anyway (migration
 * 20260922180000_no_counting_a_class_before_it_ends), so offering it here
 * could only ever have produced an error toast. `now` is injected so this is
 * testable without mocking the clock.
 */
export function buildExpectedSessions(
  classes: StudentClassSchedule[],
  confirmed: StudentClassSession[],
  opts: { timeZone: string; now?: Date },
): ExpectedSession[] {
  const { timeZone, now = new Date() } = opts;
  const bySlot = new Map(confirmed.map(s => [`${s.session_date}|${s.start_time.slice(0, 5)}`, s]));
  const out: ExpectedSession[] = [];

  // How far back to walk: the earliest effective_from among these classes, not
  // a fixed cap. A class with no earlier sibling contributes nothing extra, so
  // an empty classes list correctly walks back zero days.
  const todayKey = localDateKey(now, timeZone);
  const earliestFrom = classes.reduce<string | null>(
    (min, c) => (c.effective_from && (!min || c.effective_from < min) ? c.effective_from : min),
    null,
  );
  const days = earliestFrom ? daysBetween(earliestFrom, todayKey) + 1 : 0;

  for (let back = 0; back < days; back++) {
    const d = new Date(now.getTime() - back * 86400000);
    const dateKey = localDateKey(d, timeZone);
    const weekday = localWeekday(d, timeZone);

    for (const c of classes) {
      if (c.weekday !== weekday) continue;
      if (c.effective_from && dateKey < c.effective_from) continue;
      if (c.effective_to && dateKey > c.effective_to) continue;

      const start = c.start_time.slice(0, 5);
      // Today's classes are only answerable once they have ENDED. A lesson
      // still in progress has not happened yet in the only sense that
      // matters here, and the database refuses to count it.
      //
      // A class that runs past midnight has an end beyond 1440, so it is
      // skipped on its own date and appears the following day instead —
      // which is the first day it is genuinely over.
      if (dateKey === todayKey) {
        const nowHM = new Intl.DateTimeFormat("en-GB", {
          timeZone, hour: "2-digit", minute: "2-digit", hour12: false,
        }).format(now);
        if (timeToMinutes(start) + c.duration_minutes > timeToMinutes(nowHM)) continue;
      }

      const row = bySlot.get(`${dateKey}|${start}`) ?? null;

      out.push({
        student_id: c.student_id,
        class_id: c.id,
        session_date: dateKey,
        start_time: start,
        duration_minutes: c.duration_minutes,
        confirmed: row && isResolved(row) ? row : null,
        scheduledRow: row && !isResolved(row) ? row : null,
      });
    }
  }

  return out.sort((a, b) =>
    b.session_date.localeCompare(a.session_date) || b.start_time.localeCompare(a.start_time));
}

/** "Mon 18 Aug" — short enough for a confirm row, unambiguous about the day. */
export function formatSessionDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

/**
 * Which bundle a session on `dateKey` draws against: whichever of a student's
 * bundles has the latest coverage_start on or before that date. Replaces "the
 * active bundle", which had no notion of date at all -- confirming a batch of
 * catch-up sessions charged every one of them to whatever was active at the
 * moment of confirming, not to the bundle actually in force on each date.
 *
 * A voided bundle (status "cancelled") is never resolved to -- it was voided
 * because it was wrong, so a date that would fall in its window is either
 * covered by an earlier bundle or resolves to nothing, surfacing the gap
 * instead of drawing against a bundle already flagged as a mistake. A
 * completed bundle stays eligible -- a date genuinely inside a superseded
 * bundle's own window must keep resolving there, which is the entire reason
 * coverage_start exists.
 *
 * Two bundles can share the same coverage_start (same-day renewal, or two
 * bundles both backfilled to the same purchased_on). A same-day production
 * case did: a superseded, zero-price bundle and its live paid replacement
 * both carried the same date, and picking "the latest coverage_start" alone
 * left the choice between them to whatever order the caller's array happened
 * to be in -- not a rule, an accident of how the data was fetched. This is a
 * pure function of its inputs precisely so that can never happen again:
 * among every eligible bundle sharing the true maximum coverage_start, ties
 * break on (a) status "active" over anything else -- a live bundle must never
 * lose to a superseded one for the same date -- then (b) the latest
 * purchased_on, then (c) id, so there is always exactly one answer regardless
 * of input order.
 *
 * Returns null when no (non-voided) bundle covers the date at all.
 */
export function resolveBundleForDate(
  bundles: StudentBundle[],
  dateKey: string,
): StudentBundle | null {
  const eligible = bundles.filter(b => b.status !== "cancelled" && b.coverage_start <= dateKey);
  if (eligible.length === 0) return null;

  const latestStart = eligible.reduce(
    (max, b) => (b.coverage_start > max ? b.coverage_start : max), eligible[0].coverage_start,
  );
  const tied = eligible.filter(b => b.coverage_start === latestStart);
  if (tied.length === 1) return tied[0];

  return [...tied].sort((a, b) =>
    (b.status === "active" ? 1 : 0) - (a.status === "active" ? 1 : 0)
    || b.purchased_on.localeCompare(a.purchased_on)
    || a.id.localeCompare(b.id),
  )[0];
}

export type BundleTone = "clean" | "unused" | "negative" | "active";

/**
 * The one place that decides what a bundle's usage reads as. Every surface
 * that draws a bundle's state on the student card — the active bundle's own
 * identity line, the completed-bundle history beneath it, and the queued
 * zero-session context work — reads it off this function rather than
 * inventing adjacent colour rules for what is really the same fact asked at
 * a different point in a bundle's life.
 *
 * Status matters as much as the numbers: a still-running bundle never reads
 * green just because it happens to be fully used at this instant, and never
 * gets the "ended with N unused" wording either — it has not ended. Only a
 * genuine overrun (used > total) overrides status, because a class that
 * happened after the bundle ran out still happened, active or not.
 */
export function bundleTone(status: BundleStatus, usedClasses: number, totalClasses: number): BundleTone {
  if (usedClasses > totalClasses) return "negative";
  if (status !== "completed") return "active";
  if (usedClasses < totalClasses) return "unused";
  return "clean";
}

/**
 * The identity line every bundle carries on the card, active or completed —
 * "Bundle N · label · usage · price · window" — built once so neither surface
 * invents its own wording or date logic. An active bundle's window is always
 * the open-ended "from <coverage_start>": it has not ended, so it never gets
 * an end date. A completed bundle's window is its coverage_start through its
 * last counted session (or "since <coverage_start>" if it somehow has none).
 *
 * `fillPct` is the same `counted / total` fraction (clamped 0–100) that drives
 * the slim consumption bar beneath this line on every bundle — computed here,
 * once, so the bar can never show a fill the line's own numbers disagree with.
 */
export function bundleIdentityLine(
  bundle: StudentBundle,
  bundleNumber: number,
  usedClasses: number,
  lastCountedSessionDate: string | null,
): { tone: BundleTone; text: string; fillPct: number } {
  const tone = bundleTone(bundle.status, usedClasses, bundle.total_classes);
  const usageText = tone === "unused"
    ? `ended with ${bundle.total_classes - usedClasses} unused`
    : `${usedClasses} of ${bundle.total_classes}`;
  const windowText = bundle.status === "completed"
    ? (lastCountedSessionDate
        ? `${formatSessionDate(bundle.coverage_start)} – ${formatSessionDate(lastCountedSessionDate)}`
        : `since ${formatSessionDate(bundle.coverage_start)}`)
    : `from ${formatSessionDate(bundle.coverage_start)}`;
  const fillPct = Math.min(100, Math.max(0, (usedClasses / Math.max(1, bundle.total_classes)) * 100));
  return {
    tone,
    text: `Bundle ${bundleNumber} · ${bundle.label} · ${usageText} · ${formatMoney(bundle.total_price, bundle.currency)} · ${windowText}`,
    fillPct,
  };
}
