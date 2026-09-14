/**
 * Shared admin utilities — replaces duplicated helpers across admin components.
 */

// ── Pagination ───────────────────────────────────────────────────────────────

/** Default page size for admin tables. Keeps row height × count ≈ one screen. */
export const ADMIN_PAGE_SIZE = 25;

// ── Business rule thresholds ─────────────────────────────────────────────────

/** Sessions remaining at or below this count triggers "at-risk" UI warning. */
export const AT_RISK_SESSION_THRESHOLD = 3;

/** sessions_remaining value at which a student is considered LOCKED (matches DB view logic). */
export const LOCKED_SESSION_THRESHOLD = -3;

/** Maximum unit price (per-session) an admin can set on an enrollment. */
export const MAX_UNIT_PRICE = 10_000;

/** Referral conversion bonus per enrolled friend (percentage). */
export const REFERRAL_CONVERSION_BONUS_PCT = 5;

/** Referral click-only bonus per visitor who didn't enroll (percentage). */
export const REFERRAL_CLICK_BONUS_PCT = 2;

/** Maximum referral bonus any single referrer can earn (percentage). */
export const REFERRAL_MAX_BONUS_PCT = 15;

// ── Time formatting ──────────────────────────────────────────────────────────

/**
 * Normalise a clock string to "H:MM", or null if it is not one.
 *
 * The reason this exists: `schedule_packages.start_time` and `trial_slots`
 * are Postgres `time` columns, and PostgREST serialises those as **"15:00:00"**
 * — with seconds. Every helper below used to guard on /^\d{1,2}:\d{2}$/, which
 * that string fails. The guards then returned the input untouched, which looks
 * like a harmless no-op and is not: `convertSlotToTimezone` fell back to the
 * SOURCE weekday and the SOURCE time while the caller carried on labelling it
 * with the student's own timezone.
 *
 * So the schedule picker showed a Riyadh student "Monday · 15:00:00" under
 * "Asia/Riyadh" for a class that starts at 16:00 her time — the one number she
 * needs, wrong, with no error anywhere. Seconds in, hours out.
 *
 * Accepting the seconds here, once, is the whole fix: every caller already
 * routes through these three functions.
 */
function normaliseClock(t: string | null | undefined): string | null {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec((t ?? "").trim());
  return m ? `${m[1]}:${m[2]}` : null;
}

/** Convert "HH:MM" or "HH:MM:SS" (24h) to "H:MM AM/PM". Replaces 6+ identical formatTime copies. */
export function formatTime(t: string): string {
  const norm = normaliseClock(t);
  if (!norm) return t || "";
  const [h, m] = norm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function tzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date).reduce((a, p) => { a[p.type] = p.value; return a; }, {} as Record<string, string>);
  const hour = parts.hour === "24" ? 0 : +parts.hour;
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, hour, +parts.minute, +parts.second);
  return asUTC - date.getTime();
}

/**
 * Convert a recurring weekly slot from source timezone to target timezone.
 * Returns the localized weekday + 12h time string. Handles DST correctly
 * by resolving against the next upcoming occurrence.
 *
 * Accepts "HH:MM" and "HH:MM:SS" — see normaliseClock above for why that
 * distinction cost a student the right hour.
 */
export function convertSlotToTimezone(
  dayOfWeek: number,
  timeHHMM: string,
  sourceTz: string,
  targetTz: string,
): { weekday: string; dayIndex: number; timeFormatted: string } {
  const norm = normaliseClock(timeHHMM);
  if (!norm || !sourceTz || !targetTz) {
    return {
      weekday: WEEKDAY_LONG[dayOfWeek] || "",
      dayIndex: dayOfWeek,
      timeFormatted: formatTime(timeHHMM),
    };
  }
  const [h, m] = norm.split(":").map(Number);

  // Find next date (in source tz) matching dayOfWeek
  const now = new Date();
  const srcParts = new Intl.DateTimeFormat("en-US", {
    timeZone: sourceTz, weekday: "short",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now).reduce((a, p) => { a[p.type] = p.value; return a; }, {} as Record<string, string>);
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDow = dowMap[srcParts.weekday] ?? 0;
  const delta = ((dayOfWeek - currentDow) + 7) % 7 || 7;
  const base = new Date(Date.UTC(+srcParts.year, +srcParts.month - 1, +srcParts.day));
  base.setUTCDate(base.getUTCDate() + delta);

  // Interpret (year,month,day,h,m) as wall-time in source tz → UTC instant
  const guess = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), h, m);
  const offset = tzOffsetMs(new Date(guess), sourceTz);
  const instant = new Date(guess - offset);

  const tgtParts = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTz, weekday: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(instant).reduce((a, p) => { a[p.type] = p.value; return a; }, {} as Record<string, string>);

  const dayIndex = WEEKDAY_LONG.indexOf(tgtParts.weekday);
  const timeFormatted = `${tgtParts.hour}:${tgtParts.minute} ${tgtParts.dayPeriod}`;
  return { weekday: tgtParts.weekday, dayIndex, timeFormatted };
}

/**
 * The session-period label a slot's Cairo-local hour implies — morning
 * before noon, daytime noon through 4pm, evening from 5pm on. `trial_slots`
 * still has a stored `session_period` column, but nothing writes to it
 * anymore (see issue #127) — the admin table derives the label from here
 * every time instead of trusting a stored value, which is exactly how a
 * 5:30am slot once sat labelled "evening" unnoticed.
 */
export function deriveSessionPeriod(cairoHour: number): 'morning' | 'daytime' | 'evening' {
  if (cairoHour < 12) return 'morning';
  if (cairoHour < 17) return 'daytime';
  return 'evening';
}

/**
 * Convert a specific calendar datetime from source tz to target tz.
 * Accepts `YYYY-MM-DD` + `HH:MM` or `HH:MM:SS`. Returns localized date, time, weekday.
 */
export function convertDateTimeToTimezone(
  dateStr: string,
  timeHHMM: string,
  sourceTz: string,
  targetTz: string,
): { dateStr: string; timeFormatted: string; weekday: string; hour24: number } {
  const norm = normaliseClock(timeHHMM);
  if (!dateStr || !norm) {
    return { dateStr, timeFormatted: formatTime(timeHHMM), weekday: "", hour24: NaN };
  }
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = norm.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = tzOffsetMs(new Date(guess), sourceTz);
  const instant = new Date(guess - offset);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTz, weekday: "long",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(instant).reduce((a, p) => { a[p.type] = p.value; return a; }, {} as Record<string, string>);
  // A separate h23-cycle pass rather than converting the 12h value above --
  // deriving 24h from a locale's 12h + AM/PM string is exactly the kind of
  // "should be equivalent" arithmetic this task exists to distrust.
  const hour24 = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: targetTz, hour: "2-digit", hourCycle: "h23" })
      .formatToParts(instant).find((p) => p.type === "hour")!.value,
  );
  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    timeFormatted: `${parts.hour}:${parts.minute} ${parts.dayPeriod}`,
    weekday: parts.weekday,
    hour24,
  };
}

// ── Attendance status colors ─────────────────────────────────────────────────

/** Ring + background classes for attendance status badges. */
export function getAttendanceStatusColor(status: string): string {
  switch (status) {
    case "present": return "ring-green-500 bg-green-500/20";
    case "absent": return "ring-destructive bg-destructive/20";
    case "late": return "ring-yellow-500 bg-yellow-500/20";
    case "excused": return "ring-blue-500 bg-blue-500/20";
    default: return "ring-muted";
  }
}

// ── CSV export ───────────────────────────────────────────────────────────────

/** Download an array of row-objects as a CSV file. */
export function exportCSV(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string,
): void {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c ?? ""}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Currency formatting ──────────────────────────────────────────────────────

/** Formats an amount with its currency code using locale-aware number formatting. */
export function formatCurrency(amount: number, currency = "EGP"): string {
  return `${amount.toLocaleString()} ${currency}`;
}
