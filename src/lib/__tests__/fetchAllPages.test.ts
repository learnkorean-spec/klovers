import { describe, it, expect } from "vitest";
import { fetchAllPages } from "../fetchAllPages";
import { ACTIVE_TRIAL_STATUSES, ACTIVE_TRIAL_STATUS_LIST } from "@/constants/trialStatus";

/** Fake table: returns slices like PostgREST .range(from, to) does. */
const table = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i }));
const source = (rows: { id: number }[]) => (from: number, to: number) =>
  Promise.resolve({ data: rows.slice(from, to + 1), error: null });

describe("fetchAllPages", () => {
  it("returns every row past the 1000-row cap", async () => {
    const { data, error } = await fetchAllPages(source(table(2350)));
    expect(error).toBeNull();
    expect(data).toHaveLength(2350);
    expect(new Set(data.map((r) => r.id)).size).toBe(2350);
  });

  it("handles an exact multiple of the page size without looping forever", async () => {
    const { data } = await fetchAllPages(source(table(2000)));
    expect(data).toHaveLength(2000);
  });

  it("returns an empty list for an empty table", async () => {
    const { data, error } = await fetchAllPages(source([]));
    expect(data).toEqual([]);
    expect(error).toBeNull();
  });

  it("surfaces an error instead of returning a quietly short total", async () => {
    let calls = 0;
    const { data, error } = await fetchAllPages<{ id: number }>((from, to) => {
      calls++;
      if (calls === 2) return Promise.resolve({ data: null, error: { message: "boom" } });
      return source(table(5000))(from, to);
    });
    expect(error?.message).toBe("boom");
    expect(data).toHaveLength(1000);
  });
});

describe("trial status definitions", () => {
  it("counts a signed-in student's booking (awaiting_attendance) as holding a seat", () => {
    expect(ACTIVE_TRIAL_STATUS_LIST).toContain("awaiting_attendance");
    expect(ACTIVE_TRIAL_STATUS_LIST).toContain("confirmed_attendance");
  });

  it("never counts cancelled bookings as live", () => {
    expect(ACTIVE_TRIAL_STATUS_LIST).not.toContain("cancelled");
    expect([...ACTIVE_TRIAL_STATUSES]).toEqual(ACTIVE_TRIAL_STATUS_LIST);
  });
});
