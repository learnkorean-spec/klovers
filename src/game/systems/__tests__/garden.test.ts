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

describe("Seoul Journey part 2: the market alley", () => {
  it("opens at Level 5 (canon levelJourney.l5 → seoul-journey part 2), not before", () => {
    expect(worldAccess("l4", false).open.has("seoul-market")).toBe(false);
    expect(worldAccess("l5", false).open.has("seoul-market")).toBe(true);
    expect(worldAccess("l6", false).open.has("seoul-market")).toBe(true);
    expect(GUEST_ACCESS.open.has("seoul-market")).toBe(false);
  });

  it("is reached by the subway from part 1, and the subway goes back", () => {
    const into = INTERACTABLES.find((i) => i.id === "door-subway-market");
    const back = INTERACTABLES.find((i) => i.id === "door-alley-subway");
    expect(into?.to).toBe("seoul-market");
    expect(ROOMS["seoul-market"].spawns[into!.arrive!]).toBeDefined();
    expect(ROOMS["seoul-journey"].spawns[back!.arrive!]).toBeDefined();
  });
});

describe("Seoul Journey part 3: Namsan Tower", () => {
  it("opens at Level 6 (canon levelJourney.l6 → seoul-journey part 3), not before", () => {
    expect(worldAccess("l5", false).open.has("seoul-namsan")).toBe(false);
    expect(worldAccess("l6", false).open.has("seoul-namsan")).toBe(true);
  });

  it("is reached by the 02 bus from part 1, and the bus goes back down", () => {
    const up = INTERACTABLES.find((i) => i.id === "door-bus-namsan");
    const down = INTERACTABLES.find((i) => i.id === "door-namsan-bus");
    expect(up?.to).toBe("seoul-namsan");
    expect(ROOMS["seoul-namsan"].spawns[up!.arrive!]).toBeDefined();
    expect(ROOMS["seoul-journey"].spawns[down!.arrive!]).toBeDefined();
  });
});
