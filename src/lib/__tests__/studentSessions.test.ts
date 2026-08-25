/**
 * The catch-up list is built in the browser from the weekly schedule — an
 * unconfirmed class has no database row — so getting this wrong means either
 * offering Re a class that never happened or hiding one she needs to confirm.
 *
 * All times are the teacher's own (Asia/Kuala_Lumpur, UTC+8). `now` is injected
 * rather than mocked so the boundary cases are readable.
 */
import { describe, it, expect } from "vitest";
import {
  buildExpectedSessions,
  formatMoney,
  formatSessionDate,
  localDateKey,
  localWeekday,
  pricePerClass,
  resolveBundleForDate,
  type StudentBundle,
  type StudentClassSchedule,
  type StudentClassSession,
} from "@/types/students";

const TZ = "Asia/Kuala_Lumpur";

const cls = (over: Partial<StudentClassSchedule> = {}): StudentClassSchedule => ({
  id: "class-1",
  student_id: "solafa",
  weekday: 1,               // Monday
  start_time: "22:00:00",
  duration_minutes: 90,
  timezone: TZ,
  effective_from: "2026-01-01",
  effective_to: null,
  note: null,
  ...over,
});

const session = (over: Partial<StudentClassSession> = {}): StudentClassSession => ({
  id: "sess-1",
  student_id: "solafa",
  bundle_id: "bundle-1",
  class_id: "class-1",
  session_date: "2026-08-17",
  start_time: "22:00:00",
  outcome: "attended",
  counted: true,
  confirmed_at: "2026-08-17T15:00:00Z",
  note: null,
  ...over,
});

// Sunday 23 Aug 2026, 12:00 in Kuala Lumpur.
const SUNDAY_NOON = new Date("2026-08-23T04:00:00Z");

describe("buildExpectedSessions", () => {
  it("only produces occurrences on the class's own weekday", () => {
    // effective_from bounds the window to isolate exactly two Mondays.
    const out = buildExpectedSessions(
      [cls({ effective_from: "2026-08-05" })], [], { timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out).toHaveLength(2);                       // Mon 17 and Mon 10 Aug
    expect(out.map(o => o.session_date)).toEqual(["2026-08-17", "2026-08-10"]);
  });

  it("returns newest first", () => {
    const out = buildExpectedSessions(
      [
        cls({ id: "a", weekday: 1, effective_from: "2026-08-17" }),
        cls({ id: "b", weekday: 4, effective_from: "2026-08-17" }),
      ],
      [], { timeZone: TZ, now: SUNDAY_NOON },
    );
    const dates = out.map(o => o.session_date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("pairs a confirmation with its occurrence and leaves the rest unconfirmed", () => {
    const out = buildExpectedSessions(
      [cls({ effective_from: "2026-08-05" })], [session()], { timeZone: TZ, now: SUNDAY_NOON },
    );
    const [recent, older] = out;
    expect(recent.session_date).toBe("2026-08-17");
    expect(recent.confirmed?.outcome).toBe("attended");
    expect(older.confirmed).toBeNull();
  });

  it("matches a confirmation even though Postgres returns HH:MM:SS", () => {
    const out = buildExpectedSessions(
      [cls({ effective_from: "2026-08-17" })],
      [session({ start_time: "22:00:00" })],
      { timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out[0].confirmed).not.toBeNull();
    expect(out[0].start_time).toBe("22:00");
  });

  it("does not offer a class that has not happened yet today", () => {
    // Sunday 09:00 local; a Sunday 23:00 class is still hours away.
    const sundayMorning = new Date("2026-08-23T01:00:00Z");
    const out = buildExpectedSessions(
      [cls({ weekday: 0, start_time: "23:00:00", effective_from: "2026-08-23" })],
      [], { timeZone: TZ, now: sundayMorning },
    );
    expect(out).toHaveLength(0);
  });

  it("does offer a class that already finished today", () => {
    // Sunday 12:00 local; a Sunday 09:00 class is done.
    const out = buildExpectedSessions(
      [cls({ weekday: 0, start_time: "09:00:00", effective_from: "2026-08-23" })],
      [], { timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out).toHaveLength(1);
    expect(out[0].session_date).toBe("2026-08-23");
  });

  it("ignores occurrences before the class started", () => {
    const out = buildExpectedSessions(
      [cls({ effective_from: "2026-08-15" })],
      [], { timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out.map(o => o.session_date)).toEqual(["2026-08-17"]);
  });

  it("ignores occurrences after the class ended", () => {
    const out = buildExpectedSessions(
      [cls({ effective_from: "2026-08-01", effective_to: "2026-08-12" })],
      [], { timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out.map(o => o.session_date)).toEqual(["2026-08-10", "2026-08-03"]);
  });

  it("keeps a class that runs past midnight on the day it STARTS", () => {
    // Rynad: Sunday 23:00 + 90 min. It belongs to Sunday, not Monday.
    const mondayNoon = new Date("2026-08-24T04:00:00Z");
    const out = buildExpectedSessions(
      [cls({ weekday: 0, start_time: "23:00:00", duration_minutes: 90, effective_from: "2026-08-22" })],
      [], { timeZone: TZ, now: mondayNoon },
    );
    expect(out).toHaveLength(1);
    expect(out[0].session_date).toBe("2026-08-23");
    expect(out[0].start_time).toBe("23:00");
  });

  it("handles several classes a week for one student", () => {
    // Solafa: Mon-Thu 22:00.
    const classes = [1, 2, 3, 4].map(w => cls({ id: `c${w}`, weekday: w, effective_from: "2026-08-17" }));
    const out = buildExpectedSessions(classes, [], { timeZone: TZ, now: SUNDAY_NOON });
    expect(out.map(o => o.session_date)).toEqual([
      "2026-08-20", "2026-08-19", "2026-08-18", "2026-08-17",
    ]);
  });

  it("returns nothing when the student has no classes", () => {
    expect(buildExpectedSessions([], [], { timeZone: TZ, now: SUNDAY_NOON })).toEqual([]);
  });

  it("is a queue, not a recent-activity list — offers every occurrence back to effective_from, however far", () => {
    // The exact real-world case: a Sunday class running since 19 Jul must not
    // be truncated to a recent slice once its start date is set correctly.
    // 19:00 today (Sun 23 Aug) has not happened yet at SUNDAY_NOON, so it is
    // correctly excluded — five past occurrences, not today's.
    const out = buildExpectedSessions(
      [cls({ weekday: 0, start_time: "19:00:00", effective_from: "2026-07-19" })],
      [], { timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out.map(o => o.session_date)).toEqual([
      "2026-08-16", "2026-08-09", "2026-08-02", "2026-07-26", "2026-07-19",
    ]);
  });

  it("walks back to the EARLIEST effective_from across several classes, not just one", () => {
    const out = buildExpectedSessions(
      [
        cls({ id: "old", weekday: 1, effective_from: "2026-07-27" }),   // Monday
        cls({ id: "new", weekday: 4, effective_from: "2026-08-20" }),   // Thursday
      ],
      [], { timeZone: TZ, now: SUNDAY_NOON },
    );
    // Mondays from Jul27 plus the one Thursday on/after Aug20.
    expect(out.map(o => o.session_date)).toEqual([
      "2026-08-20", "2026-08-17", "2026-08-10", "2026-08-03", "2026-07-27",
    ]);
  });

  it("reads the date in the teacher's zone, not the browser's", () => {
    // 2026-08-23T17:00Z is Monday 01:00 in Kuala Lumpur but still Sunday in UTC.
    const lateSunday = new Date("2026-08-23T17:00:00Z");
    expect(localDateKey(lateSunday, TZ)).toBe("2026-08-24");
    expect(localWeekday(lateSunday, TZ)).toBe(1);
    expect(localDateKey(lateSunday, "UTC")).toBe("2026-08-23");
  });
});

const bundle = (over: Partial<StudentBundle> = {}): StudentBundle => ({
  id: "b1",
  student_id: "solafa",
  source: "custom",
  catalog_key: null,
  label: "16 classes",
  total_classes: 16,
  total_price: 6400,
  currency: "EGP",
  purchased_on: "2026-01-01",
  coverage_start: "2026-01-01",
  coverage_start_confirmed_at: "2026-01-01T00:00:00Z",
  status: "active",
  voided_reason: null,
  voided_at: null,
  note: null,
  ...over,
});

describe("resolveBundleForDate", () => {
  it("picks the bundle whose coverage_start is the latest one on or before the date", () => {
    // The older one is "completed" once superseded, but stays a valid target
    // for dates before the renewal -- status alone never disqualifies it.
    const closed = bundle({ id: "older", coverage_start: "2026-01-01", status: "completed" });
    const newer = bundle({ id: "newer", coverage_start: "2026-06-01", status: "active" });
    expect(resolveBundleForDate([closed, newer], "2026-03-15")?.id).toBe("older");
    expect(resolveBundleForDate([closed, newer], "2026-07-01")?.id).toBe("newer");
  });

  it("returns null when no bundle covers the date at all", () => {
    const b = bundle({ coverage_start: "2026-06-01" });
    expect(resolveBundleForDate([b], "2026-01-15")).toBeNull();
    expect(resolveBundleForDate([], "2026-06-15")).toBeNull();
  });

  it("never resolves to a voided bundle, even if its window would otherwise cover the date", () => {
    const voided = bundle({ id: "voided", coverage_start: "2026-01-01", status: "cancelled", voided_reason: "duplicate" });
    const earlier = bundle({ id: "earlier", coverage_start: "2025-06-01", status: "completed" });
    // Without the voided one, "earlier" is the only valid candidate.
    expect(resolveBundleForDate([voided, earlier], "2026-03-01")?.id).toBe("earlier");
    // With nothing else, a date only the voided bundle's window covers resolves to nothing.
    expect(resolveBundleForDate([voided], "2026-03-01")).toBeNull();
  });

  it("picks the single latest coverage_start among several candidates, not just any match", () => {
    const a = bundle({ id: "a", coverage_start: "2026-01-01" });
    const b = bundle({ id: "b", coverage_start: "2026-04-01" });
    const c = bundle({ id: "c", coverage_start: "2026-07-01" });
    expect(resolveBundleForDate([a, b, c], "2026-05-15")?.id).toBe("b");
  });
});

describe("money is shown as paid, never converted", () => {
  it("formats each currency in its own right", () => {
    expect(formatMoney(6400, "EGP")).toContain("6,400");
    expect(formatMoney(6400, "EGP")).toContain("EGP");
    expect(formatMoney(1238, "SAR")).toContain("SAR");
    expect(formatMoney(350, "MYR")).toContain("MYR");
  });

  it("keeps the decimals a currency actually uses", () => {
    expect(formatMoney(218.5, "BHD")).toContain("218.5");
    expect(formatMoney(6156000, "IDR")).toContain("6,156,000");
  });

  it("renders an unknown but well-formed code rather than throwing", () => {
    // Intl accepts any three-letter code, so a currency the runtime has never
    // heard of still shows its amount and its code. The database constraint is
    // ^[A-Z]{3}$, so this is the worst case that can actually be stored.
    expect(formatMoney(100, "XYZ")).toContain("100");
    expect(formatMoney(100, "XYZ")).toContain("XYZ");
  });

  it("falls back instead of throwing on a malformed code", () => {
    expect(formatMoney(100, "E")).toBe("100 E");
    expect(formatMoney(100, "")).toBe("100 ");
  });

  it("derives price per class instead of storing it", () => {
    expect(pricePerClass(6400, 16, "EGP")).toContain("400");
    expect(pricePerClass(6600, 12, "EGP")).toContain("550");
    expect(pricePerClass(0, 0, "EGP")).toBe("—");
  });
});

describe("formatSessionDate", () => {
  it("names the weekday so a catch-up row is unambiguous", () => {
    expect(formatSessionDate("2026-08-17")).toBe("Mon 17 Aug");
    expect(formatSessionDate("2026-08-23")).toBe("Sun 23 Aug");
  });
});
