import { describe, it, expect } from "vitest";
import { convertSlotToTimezone, convertDateTimeToTimezone, deriveSessionPeriod, formatTime } from "./admin-utils";

describe("formatTime", () => {
  it("converts 24h → 12h", () => {
    expect(formatTime("18:00")).toBe("6:00 PM");
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
  });
  it("handles invalid input gracefully", () => {
    expect(formatTime("")).toBe("");
    expect(formatTime("bogus")).toBe("bogus");
  });

  // The shape the database actually sends. `schedule_packages.start_time` and
  // `trial_slots.start_time` are Postgres `time` columns and PostgREST
  // serialises them with seconds; every case above uses a shape no query has
  // ever returned, which is how this went unnoticed.
  it("accepts the seconds PostgREST sends for a `time` column", () => {
    expect(formatTime("18:00:00")).toBe("6:00 PM");
    expect(formatTime("15:00:00")).toBe("3:00 PM");
    expect(formatTime("00:05:00")).toBe("12:05 AM");
    expect(formatTime("09:30:45")).toBe("9:30 AM");
  });
});

describe("convertSlotToTimezone (weekly)", () => {
  it("converts across UTC+2 → UTC+8 (±DST-sensitive)", () => {
    // Thursday 18:00 Cairo → Singapore is either Thursday 23:00 (Cairo DST+3)
    // or Friday 00:00 (Cairo standard +2). Either outcome is correct.
    const r = convertSlotToTimezone(4, "18:00", "Africa/Cairo", "Asia/Singapore");
    expect(["Thursday", "Friday"]).toContain(r.weekday);
    expect(r.timeFormatted).toMatch(/(11:00 PM|12:00 AM)/);
  });

  it("converts Cairo → same tz is identity", () => {
    const r = convertSlotToTimezone(4, "18:00", "Africa/Cairo", "Africa/Cairo");
    expect(r.weekday).toBe("Thursday");
    expect(r.timeFormatted).toBe("6:00 PM");
  });

  it("handles early morning with previous-day shift", () => {
    // Friday 02:00 Cairo in Los Angeles = Thursday PM
    const r = convertSlotToTimezone(5, "02:00", "Africa/Cairo", "America/Los_Angeles");
    expect(r.weekday).toBe("Thursday");
    expect(r.dayIndex).toBe(4);
  });

  it("round-trips through source tz", () => {
    const kl = convertSlotToTimezone(1, "10:00", "Asia/Kuala_Lumpur", "Africa/Cairo");
    const [hStr, period] = kl.timeFormatted.split(" ");
    const [h12, mm] = hStr.split(":").map(Number);
    const h24 = (period === "PM" ? (h12 % 12) + 12 : h12 % 12);
    const back = convertSlotToTimezone(kl.dayIndex, `${String(h24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, "Africa/Cairo", "Asia/Kuala_Lumpur");
    expect(back.weekday).toBe("Monday");
    expect(back.timeFormatted).toBe("10:00 AM");
  });

  it("falls back gracefully on invalid input", () => {
    const r = convertSlotToTimezone(0, "", "Africa/Cairo", "Asia/Singapore");
    expect(r.weekday).toBe("Sunday");
    expect(r.dayIndex).toBe(0);
  });

  // The regression this file was edited for. Before the fix these returned the
  // SOURCE weekday and the raw "15:00:00" — which the caller then printed under
  // the student's own timezone, so the class looked like it started at the
  // Cairo hour wherever she lived.
  it("converts a `time` value with seconds, rather than silently passing it through", () => {
    const r = convertSlotToTimezone(1, "15:00:00", "Africa/Cairo", "Asia/Bangkok");
    // Cairo 15:00 is 19:00 or 20:00 in Bangkok depending on Cairo's DST.
    expect(r.weekday).toBe("Monday");
    expect(r.timeFormatted).toMatch(/^(7:00 PM|8:00 PM)$/);
    expect(r.timeFormatted).not.toContain(":00:00");
  });

  it("gives the same answer with and without seconds", () => {
    const withSec = convertSlotToTimezone(4, "16:00:00", "Africa/Cairo", "Asia/Riyadh");
    const without = convertSlotToTimezone(4, "16:00", "Africa/Cairo", "Asia/Riyadh");
    expect(withSec).toEqual(without);
  });
});

describe("convertDateTimeToTimezone (specific date)", () => {
  it("preserves Cairo → Cairo", () => {
    const r = convertDateTimeToTimezone("2026-05-14", "18:00", "Africa/Cairo", "Africa/Cairo");
    expect(r.dateStr).toBe("2026-05-14");
    expect(r.weekday).toBe("Thursday");
    expect(r.timeFormatted).toBe("6:00 PM");
  });

  it("shifts forward a day when crossing midnight east-bound", () => {
    const r = convertDateTimeToTimezone("2026-05-14", "22:00", "Africa/Cairo", "Asia/Singapore");
    expect(r.dateStr).toBe("2026-05-15");
    expect(r.weekday).toBe("Friday");
  });

  it("shifts backward a day when crossing midnight west-bound", () => {
    const r = convertDateTimeToTimezone("2026-05-14", "02:00", "Africa/Cairo", "America/Los_Angeles");
    expect(r.dateStr).toBe("2026-05-13");
  });

  it("handles invalid input", () => {
    const r = convertDateTimeToTimezone("", "18:00", "Africa/Cairo", "Africa/Cairo");
    expect(r.dateStr).toBe("");
  });

  it("accepts seconds here too", () => {
    const withSec = convertDateTimeToTimezone("2026-05-14", "18:00:00", "Africa/Cairo", "Asia/Singapore");
    const without = convertDateTimeToTimezone("2026-05-14", "18:00", "Africa/Cairo", "Asia/Singapore");
    expect(withSec).toEqual(without);
    expect(Number.isNaN(withSec.hour24)).toBe(false);
  });

  it("gives hour24 as the real 24h hour, not derived from the 12h+AM/PM string", () => {
    // The exact bug this file exists to catch: 5:30am mislabelled evening.
    expect(convertDateTimeToTimezone("2026-09-05", "05:30", "Africa/Cairo", "Africa/Cairo").hour24).toBe(5);
    expect(convertDateTimeToTimezone("2026-09-05", "17:00", "Africa/Cairo", "Africa/Cairo").hour24).toBe(17);
    expect(convertDateTimeToTimezone("2026-09-05", "00:15", "Africa/Cairo", "Africa/Cairo").hour24).toBe(0);
    expect(convertDateTimeToTimezone("2026-09-05", "12:00", "Africa/Cairo", "Africa/Cairo").hour24).toBe(12);
  });
});

describe("deriveSessionPeriod", () => {
  it("is morning before noon", () => {
    expect(deriveSessionPeriod(0)).toBe("morning");
    expect(deriveSessionPeriod(5)).toBe("morning");
    expect(deriveSessionPeriod(11)).toBe("morning");
  });

  it("is daytime from noon up to (not including) 5pm", () => {
    expect(deriveSessionPeriod(12)).toBe("daytime");
    expect(deriveSessionPeriod(14)).toBe("daytime"); // the known Friday anchor
    expect(deriveSessionPeriod(16)).toBe("daytime");
  });

  it("is evening from 5pm on", () => {
    expect(deriveSessionPeriod(17)).toBe("evening"); // the known Sat/Sun/Mon anchor
    expect(deriveSessionPeriod(20)).toBe("evening");
    expect(deriveSessionPeriod(23)).toBe("evening");
  });
});
