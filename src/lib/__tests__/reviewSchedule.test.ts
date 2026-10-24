import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { newReviewRows } from "../reviewSchedule";

describe("review schedule: a completed lesson's words", () => {
  it("are first due the next day", () => {
    const rows = newReviewRows("u1", [5, 6], new Date("2026-10-24T22:30:00Z"));
    expect(rows.map((r) => r.next_review_date)).toEqual(["2026-10-25", "2026-10-25"]);
  });
  it("start fresh (SM-2 defaults) and are listed once each", () => {
    const rows = newReviewRows("u1", [5, 5, 6]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ user_id: "u1", lesson_vocabulary_id: 5, difficulty_factor: 2.5, interval_days: 1, review_count: 0 });
  });
});
