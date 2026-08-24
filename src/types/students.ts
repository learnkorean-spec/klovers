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
  status: BundleStatus;
  note: string | null;
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

export const SESSION_OUTCOMES = ["attended", "cancelled_no_charge"] as const;
export type SessionOutcome = (typeof SESSION_OUTCOMES)[number];

export interface StudentClassSession {
  id: string;
  student_id: string;
  bundle_id: string;
  class_id: string | null;
  session_date: string;
  start_time: string;
  outcome: SessionOutcome;
  counted: boolean;
  confirmed_at: string;
  note: string | null;
}

/**
 * A class the weekly schedule says should have happened, paired with whatever
 * was confirmed for it. Built in the browser from teacher_student_classes; an
 * unconfirmed occurrence has no database row at all, which is what lets this
 * list be rebuilt at any time without consulting stored state.
 */
export interface ExpectedSession {
  student_id: string;
  class_id: string;
  /** "YYYY-MM-DD" in the teacher's timezone. */
  session_date: string;
  /** "HH:MM". */
  start_time: string;
  duration_minutes: number;
  confirmed: StudentClassSession | null;
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
 * paired with its confirmation if one exists. An occurrence never ages out —
 * a class the schedule says happened stays in this list until it is answered,
 * however far back effective_from goes.
 *
 * Only looks backwards, and never past today: a class that has not happened yet
 * cannot be marked as done. `now` is injected so this is testable without
 * mocking the clock.
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
      // Today's later classes have not happened yet.
      if (dateKey === localDateKey(now, timeZone)) {
        const nowHM = new Intl.DateTimeFormat("en-GB", {
          timeZone, hour: "2-digit", minute: "2-digit", hour12: false,
        }).format(now);
        if (start > nowHM) continue;
      }

      out.push({
        student_id: c.student_id,
        class_id: c.id,
        session_date: dateKey,
        start_time: start,
        duration_minutes: c.duration_minutes,
        confirmed: bySlot.get(`${dateKey}|${start}`) ?? null,
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
