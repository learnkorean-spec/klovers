import { describe, expect, it } from "vitest";
import { studentCalendarDaysUntil } from "./studentDashboardDate";

describe("studentCalendarDaysUntil", () => {
  it("recognizes today's morning class before noon", () => {
    expect(studentCalendarDaysUntil("2026-09-17", "Africa/Cairo", new Date("2026-09-17T05:00:00Z"))).toBe(0);
  });
  it("uses yesterday's date in New York at 02:00 UTC", () => {
    const now = new Date("2026-09-17T02:00:00Z");
    expect(studentCalendarDaysUntil("2026-09-16", "America/New_York", now)).toBe(0);
    expect(studentCalendarDaysUntil("2026-09-17", "America/New_York", now)).toBe(1);
    expect(studentCalendarDaysUntil("2026-09-17", "Asia/Tokyo", now)).toBe(0);
  });
  it("handles month and year boundaries", () => {
    expect(studentCalendarDaysUntil("2027-01-01", "UTC", new Date("2026-12-31T23:59:00Z"))).toBe(1);
    expect(studentCalendarDaysUntil("2026-12-30", "UTC", new Date("2026-12-31T23:59:00Z"))).toBe(-1);
  });
  it("compares calendar days rather than 23 or 25 hour DST days", () => {
    expect(studentCalendarDaysUntil("2026-03-09", "America/New_York", new Date("2026-03-08T06:30:00Z"))).toBe(1);
    expect(studentCalendarDaysUntil("2026-11-02", "America/New_York", new Date("2026-11-01T05:30:00Z"))).toBe(1);
  });
});
