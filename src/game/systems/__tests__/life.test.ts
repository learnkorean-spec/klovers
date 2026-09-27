import { describe, expect, it } from "vitest";
import { ROOMS, findPortal } from "../../config/rooms";
import { NPCS } from "../../config/npcs";
import { CAST } from "../../npc/cast";
import { DISCOVERIES } from "../../config/discoveries";
import { currentObjective, objectiveTarget, OBJECTIVE_ORDER } from "../../config/objectives";
import { INTERACTABLES } from "../../config/interactions";
import { WORLD_COPY } from "../../config/copy";
import { KLOVERS_WORLD } from "@/config/klovers-world";

const inside = (room: keyof typeof ROOMS, x: number, z: number) => {
  const b = ROOMS[room].bounds;
  return x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ;
};

describe("world life (NPCs)", () => {
  it("between 8 and 30 people, every one with a real look and inside a room", () => {
    expect(NPCS.length).toBeGreaterThanOrEqual(8);
    expect(NPCS.length).toBeLessThanOrEqual(30);
    for (const n of NPCS) {
      expect(CAST[n.cast], n.id).toBeDefined();
      expect(inside(n.room, n.x, n.z), n.id).toBe(true);
    }
  });

  it("nobody stands in a doorway", () => {
    for (const n of NPCS) {
      expect(findPortal(n.x, n.z, ROOMS[n.room].portals), n.id).toBeUndefined();
      if (n.path) for (const q of n.path) expect(findPortal(q[0], q[1], ROOMS[n.room].portals), `${n.id} path`).toBeUndefined();
    }
  });

  it("ids are unique", () => {
    expect(new Set(NPCS.map((n) => n.id)).size).toBe(NPCS.length);
  });

  it("Minsu is in the canon and in Hangul Village", () => {
    expect(KLOVERS_WORLD.characters.koreanFriend.name.ko).toBe("민수");
    expect(NPCS.some((n) => n.cast === "minsu" && n.room === "hangul-village")).toBe(true);
    expect(INTERACTABLES.some((i) => i.kind === "talk" && i.who === "minsu")).toBe(true);
  });
});

describe("first-visit objectives", () => {
  it("run in order and end", () => {
    expect(currentObjective({ met: [], done: [] })).toBe("meetCharacters");
    expect(currentObjective({ met: [], done: ["meetCharacters"] })).toBe("readSign");
    expect(currentObjective({ met: [], done: [...OBJECTIVE_ORDER] })).toBeNull();
  });

  it("the marker points to the friend first, then onward to Minsu", () => {
    const friend = INTERACTABLES.find((i) => i.id === "talk-friend")!;
    const minsu = INTERACTABLES.find((i) => i.id === "talk-minsu")!;
    expect(objectiveTarget("meetCharacters", "courtyard", { met: [], done: [] })).toMatchObject({ x: friend.x, z: friend.z });
    expect(objectiveTarget("meetCharacters", "hangul-village", { met: ["friend"], done: [] })).toMatchObject({ x: minsu.x, z: minsu.z });
    expect(objectiveTarget("findHub", "hub", { met: [], done: [] })).toBeNull();
  });

  it("every marker target is inside its room", () => {
    for (const o of OBJECTIVE_ORDER)
      for (const room of Object.keys(ROOMS) as (keyof typeof ROOMS)[]) {
        const t = objectiveTarget(o, room, { met: [], done: [] });
        if (t) expect(inside(room, t.x, t.z), `${o} ${room}`).toBe(true);
      }
  });

  it("discoveries sit inside their rooms", () => {
    for (const d of DISCOVERIES) expect(inside(d.room, d.x, d.z), d.key).toBe(true);
  });
});

describe("onboarding copy", () => {
  it("every string exists in both languages", () => {
    for (const lang of ["en", "ar"] as const) {
      const c = WORLD_COPY[lang];
      expect(c.onboarding.welcomeTitle.length).toBeGreaterThan(0);
      expect(c.onboarding.desktop).toHaveLength(4);
      expect(c.onboarding.touch).toHaveLength(3);
      for (const o of OBJECTIVE_ORDER) expect(c.objective[o].length).toBeGreaterThan(0);
      for (const d of DISCOVERIES) expect(c.discoveries[d.key].line.length).toBeGreaterThan(0);
    }
    expect(WORLD_COPY.en.onboarding.welcomeTitle).toBe("Welcome to KLOVERS World");
    expect(WORLD_COPY.en.objective.meetCharacters).toBe("Meet the KLOVERS characters");
  });
});
