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
    const out = buildExpectedSessions([cls()], [], { days: 14, timeZone: TZ, now: SUNDAY_NOON });
    expect(out).toHaveLength(2);                       // Mon 17 and Mon 10 Aug
    expect(out.map(o => o.session_date)).toEqual(["2026-08-17", "2026-08-10"]);
  });

  it("returns newest first", () => {
    const out = buildExpectedSessions(
      [cls({ id: "a", weekday: 1 }), cls({ id: "b", weekday: 4 })],
      [], { days: 7, timeZone: TZ, now: SUNDAY_NOON },
    );
    const dates = out.map(o => o.session_date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("pairs a confirmation with its occurrence and leaves the rest unconfirmed", () => {
    const out = buildExpectedSessions([cls()], [session()], { days: 14, timeZone: TZ, now: SUNDAY_NOON });
    const [recent, older] = out;
    expect(recent.session_date).toBe("2026-08-17");
    expect(recent.confirmed?.outcome).toBe("attended");
    expect(older.confirmed).toBeNull();
  });

  it("matches a confirmation even though Postgres returns HH:MM:SS", () => {
    const out = buildExpectedSessions(
      [cls()],
      [session({ start_time: "22:00:00" })],
      { days: 14, timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out[0].confirmed).not.toBeNull();
    expect(out[0].start_time).toBe("22:00");
  });

  it("does not offer a class that has not happened yet today", () => {
    // Sunday 09:00 local; a Sunday 23:00 class is still hours away.
    const sundayMorning = new Date("2026-08-23T01:00:00Z");
    const out = buildExpectedSessions(
      [cls({ weekday: 0, start_time: "23:00:00" })],
      [], { days: 1, timeZone: TZ, now: sundayMorning },
    );
    expect(out).toHaveLength(0);
  });

  it("does offer a class that already finished today", () => {
    // Sunday 12:00 local; a Sunday 09:00 class is done.
    const out = buildExpectedSessions(
      [cls({ weekday: 0, start_time: "09:00:00" })],
      [], { days: 1, timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out).toHaveLength(1);
    expect(out[0].session_date).toBe("2026-08-23");
  });

  it("ignores occurrences before the class started", () => {
    const out = buildExpectedSessions(
      [cls({ effective_from: "2026-08-15" })],
      [], { days: 21, timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out.map(o => o.session_date)).toEqual(["2026-08-17"]);
  });

  it("ignores occurrences after the class ended", () => {
    const out = buildExpectedSessions(
      [cls({ effective_to: "2026-08-12" })],
      [], { days: 21, timeZone: TZ, now: SUNDAY_NOON },
    );
    expect(out.map(o => o.session_date)).toEqual(["2026-08-10", "2026-08-03"]);
  });

  it("keeps a class that runs past midnight on the day it STARTS", () => {
    // Rynad: Sunday 23:00 + 90 min. It belongs to Sunday, not Monday.
    const mondayNoon = new Date("2026-08-24T04:00:00Z");
    const out = buildExpectedSessions(
      [cls({ weekday: 0, start_time: "23:00:00", duration_minutes: 90 })],
      [], { days: 3, timeZone: TZ, now: mondayNoon },
    );
    expect(out).toHaveLength(1);
    expect(out[0].session_date).toBe("2026-08-23");
    expect(out[0].start_time).toBe("23:00");
  });

  it("handles several classes a week for one student", () => {
    // Solafa: Mon-Thu 22:00.
    const classes = [1, 2, 3, 4].map(w => cls({ id: `c${w}`, weekday: w }));
    const out = buildExpectedSessions(classes, [], { days: 7, timeZone: TZ, now: SUNDAY_NOON });
    expect(out.map(o => o.session_date)).toEqual([
      "2026-08-20", "2026-08-19", "2026-08-18", "2026-08-17",
    ]);
  });

  it("returns nothing when the student has no classes", () => {
    expect(buildExpectedSessions([], [], { days: 14, timeZone: TZ, now: SUNDAY_NOON })).toEqual([]);
  });

  it("reads the date in the teacher's zone, not the browser's", () => {
    // 2026-08-23T17:00Z is Monday 01:00 in Kuala Lumpur but still Sunday in UTC.
    const lateSunday = new Date("2026-08-23T17:00:00Z");
    expect(localDateKey(lateSunday, TZ)).toBe("2026-08-24");
    expect(localWeekday(lateSunday, TZ)).toBe(1);
    expect(localDateKey(lateSunday, "UTC")).toBe("2026-08-23");
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
