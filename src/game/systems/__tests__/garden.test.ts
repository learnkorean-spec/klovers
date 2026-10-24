import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { GUEST_ACCESS, worldAccess } from "../access";
import { gardenCounts } from "../useGarden";
import { INTERACTABLES } from "../../config/interactions";
import { ROOMS } from "../../config/rooms";

describe("Cluby's Memory Garden", () => {
  it("is shut for guests and for learners with nothing in review", () => {
    expect(GUEST_ACCESS.open.has("memory-garden")).toBe(false);
    expect(worldAccess("l2", false, 0).open.has("memory-garden")).toBe(false);
  });

  it("opens with real review data, whatever the level (not a level stop)", () => {
    expect(worldAccess("hangul", false, 3).open.has("memory-garden")).toBe(true);
    expect(worldAccess("l4", false, 1).open.has("memory-garden")).toBe(true);
    expect(worldAccess("", false, 5).open.has("memory-garden")).toBe(true);
  });

  it("never adds the garden to the shared guest set", () => {
    worldAccess("", false, 5);
    expect(GUEST_ACCESS.open.has("memory-garden")).toBe(false);
  });

  it("is open in the teacher's preview", () => {
    expect(worldAccess("", true).open.has("memory-garden")).toBe(true);
  });

  it("has its gate in the Hub and the memory stone to review at", () => {
    expect(ROOMS.hub.portals.some((p) => p.to === "memory-garden" && p.lockedNotice === "gardenLocked")).toBe(true);
    expect(INTERACTABLES.some((i) => i.room === "memory-garden" && i.kind === "review")).toBe(true);
  });

  it("counts words due, and words reviewed and resting (its open flowers)", () => {
    const rows = [
      { review_count: 0, next_review_date: "2026-10-25" }, // new, not yet due: a bud
      { review_count: 2, next_review_date: "2026-10-30" }, // reviewed, resting: open
      { review_count: 1, next_review_date: "2026-10-24" }, // due today: a bud
      { review_count: 3, next_review_date: "2026-10-20" }, // overdue: a bud
    ];
    expect(gardenCounts(rows, "2026-10-24")).toEqual({ words: 4, due: 2, reviewed: 1 });
  });
});
