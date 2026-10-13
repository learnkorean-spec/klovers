import { describe, expect, it } from "vitest";
import { MISSIONS, missionRooms, missionSteps, missionTarget, routeStep } from "../../config/missions";
import { ROOMS } from "../../config/rooms";
import { worldAccess } from "../access";

describe("KLOVERS World missions", () => {
  it("every mission step is a real thing to use", () => {
    for (const m of MISSIONS) expect(missionSteps(m).length, m.id).toBe(m.steps.length);
  });

  it("a guest can reach every mission whose places are open to guests", () => {
    const guest = worldAccess(null, false);
    const open = (r: keyof typeof ROOMS) => guest.open.has(r);
    for (const m of MISSIONS) {
      if (!missionRooms(m).every(open)) continue;
      for (const r of missionRooms(m)) if (r !== "courtyard") expect(routeStep("courtyard", r, open), `${m.id} → ${r}`).not.toBeNull();
    }
  });

  it("the market's shopping list stays locked until the level opens the market", () => {
    const shopping = MISSIONS.find((m) => m.id === "shopping")!;
    expect(missionRooms(shopping).every((r) => worldAccess(null, false).open.has(r))).toBe(false);
    expect(missionRooms(shopping).every((r) => worldAccess("l1", false).open.has(r))).toBe(true);
  });

  it("points at the nearest step here, else at the gate on the way", () => {
    const guest = worldAccess(null, false);
    const open = (r: keyof typeof ROOMS) => guest.open.has(r);
    const tour = MISSIONS.find((m) => m.id === "tour")!;
    const there = missionTarget(tour, [], "klovers-house", 0, 0, open);
    expect(there?.id).toMatch(/^info-/);
    const fromCourtyard = missionTarget(tour, [], "courtyard", 0, 0, open);
    expect(fromCourtyard && fromCourtyard.id).toBeFalsy();
    expect(fromCourtyard).not.toBeNull();
    expect(missionTarget(tour, tour.steps, "klovers-house", 0, 0, open)).toBeNull();
  });
});
