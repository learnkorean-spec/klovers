/**
 * Pins a real conversion on each side of Egypt's DST boundary (reinstated
 * 2023) so a fixed UTC offset can never quietly replace the IANA conversion
 * again without a test failing. Winter is EET (UTC+2); the whole trial
 * window this task is about (September) is EEST (UTC+3) — the exact case a
 * fixed +2 got wrong for the entire duration of the bug.
 */
import { describe, it, expect } from "vitest";
import { cairoDateKey, cairoHour, cairoWeekday, shiftDateKey, zonedMidnightUtc } from "../cairoTime.ts";

describe("cairoHour / cairoDateKey — DST boundary", () => {
  it("resolves EET (UTC+2) in winter", () => {
    // 12:00 UTC in mid-January is 14:00 in Cairo (winter, no DST).
    const at = new Date("2026-01-15T12:00:00Z");
    expect(cairoHour(at)).toBe(14);
    expect(cairoDateKey(at)).toBe("2026-01-15");
  });

  it("resolves EEST (UTC+3) in summer — the case a fixed +2 got wrong", () => {
    // 12:00 UTC in early September is 15:00 in Cairo (DST, EEST).
    const at = new Date("2026-09-05T12:00:00Z");
    expect(cairoHour(at)).toBe(15);
    expect(cairoDateKey(at)).toBe("2026-09-05");
  });

  it("rolls the date key correctly for a late-evening winter instant", () => {
    // 22:30 UTC in January is 00:30 the next day in Cairo (UTC+2).
    const at = new Date("2026-01-15T22:30:00Z");
    expect(cairoDateKey(at)).toBe("2026-01-16");
    expect(cairoHour(at)).toBe(0);
  });

  it("rolls the date key correctly for a late-evening summer instant", () => {
    // 21:30 UTC in September is 00:30 the next day in Cairo (UTC+3).
    const at = new Date("2026-09-05T21:30:00Z");
    expect(cairoDateKey(at)).toBe("2026-09-06");
    expect(cairoHour(at)).toBe(0);
  });
});

describe("cairoWeekday — DST boundary and midnight rollover", () => {
  it("2026-09-05 12:00 UTC (Saturday 15:00 Cairo, EEST) is Saturday", () => {
    expect(cairoWeekday(new Date("2026-09-05T12:00:00Z"))).toBe(6);
  });

  it("2026-09-05 21:30 UTC rolls to Sunday in Cairo before UTC does", () => {
    // 21:30 UTC Saturday is already 00:30 Sunday in Cairo (UTC+3) — the exact
    // near-midnight case that a plain `at.getUTCDay()` would get wrong.
    expect(cairoWeekday(new Date("2026-09-05T21:30:00Z"))).toBe(0);
  });

  it("2026-01-16 22:30 UTC (Friday) rolls to Saturday in Cairo (UTC+2, winter)", () => {
    expect(cairoWeekday(new Date("2026-01-16T22:30:00Z"))).toBe(6);
  });
});

describe("shiftDateKey", () => {
  it("adds and subtracts calendar days without needing timezone awareness", () => {
    expect(shiftDateKey("2026-09-05", 1)).toBe("2026-09-06");
    expect(shiftDateKey("2026-09-05", -3)).toBe("2026-09-02");
    expect(shiftDateKey("2026-09-05", 7)).toBe("2026-09-12");
  });

  it("crosses Egypt's real 2026 fall-back transition (29→30 Oct) as a plain calendar shift", () => {
    // Pure Y/M/D arithmetic — the DST transition living inside this range
    // must not perturb it by an hour or a day.
    expect(shiftDateKey("2026-10-28", 1)).toBe("2026-10-29");
    expect(shiftDateKey("2026-10-28", 2)).toBe("2026-10-30");
  });
});

describe("zonedMidnightUtc — DST boundary", () => {
  it("winter local midnight is 22:00 UTC the previous day (UTC+2)", () => {
    expect(zonedMidnightUtc("2026-01-15").toISOString()).toBe("2026-01-14T22:00:00.000Z");
  });

  it("summer local midnight is 21:00 UTC the previous day (UTC+3)", () => {
    expect(zonedMidnightUtc("2026-09-05").toISOString()).toBe("2026-09-04T21:00:00.000Z");
  });
});
