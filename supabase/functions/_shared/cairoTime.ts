/**
 * Africa/Cairo has observed DST since 2023 (EET, UTC+2, in winter; EEST,
 * UTC+3, roughly late April through late October) — a fixed offset is wrong
 * for about half of every year. Every Cairo date/hour computation in the
 * edge functions goes through here instead of `Date.now() + N * 3600000`,
 * so the IANA zone stays the single source of truth and a fixed offset can
 * never quietly come back.
 *
 * Pure Intl/Date — no Deno-specific APIs — so this file is also imported
 * directly by its own Vitest test (see __tests__/cairoTime.test.ts) without
 * any Deno runtime involved.
 */

const CAIRO_TZ = "Africa/Cairo";

function partsInZone(at: Date, timeZone: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, ...opts }).formatToParts(at);
}

/** "YYYY-MM-DD" for a given instant, in Africa/Cairo. */
export function cairoDateKey(at: Date = new Date()): string {
  const parts = partsInZone(at, CAIRO_TZ, { year: "numeric", month: "2-digit", day: "2-digit" });
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** The hour (0-23) of a given instant, in Africa/Cairo. */
export function cairoHour(at: Date = new Date()): number {
  const parts = partsInZone(at, CAIRO_TZ, { hour: "2-digit", hourCycle: "h23" });
  return Number(parts.find((p) => p.type === "hour")!.value) % 24;
}

/**
 * `dateKey` (YYYY-MM-DD) shifted by `days` calendar days. Pure calendar
 * arithmetic on the already-correct Cairo date, not a second timezone
 * conversion — once "today in Cairo" is known, "N days from today" needs no
 * further zone awareness.
 */
export function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86_400_000).toISOString().slice(0, 10);
}

function tzOffsetMs(at: Date, timeZone: string): number {
  const parts = partsInZone(at, timeZone, {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asIfUtc - at.getTime();
}

/**
 * The UTC instant of local midnight on `dateKey` in `timeZone` (Africa/Cairo
 * by default). Two-pass: a first guess (treat the wall-clock as if it were
 * already UTC) can land on the wrong side of a DST transition, so the second
 * pass corrects using the zone's actual offset at that guessed instant — the
 * same technique src/lib/admin-utils.ts already uses for slot-timezone
 * conversion on the frontend.
 */
export function zonedMidnightUtc(dateKey: string, timeZone: string = CAIRO_TZ): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  let instant = Date.UTC(y, m - 1, d);
  for (let i = 0; i < 2; i++) {
    instant = Date.UTC(y, m - 1, d) - tzOffsetMs(new Date(instant), timeZone);
  }
  return new Date(instant);
}
