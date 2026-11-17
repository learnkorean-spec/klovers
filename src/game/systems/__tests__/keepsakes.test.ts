import { describe, expect, it } from "vitest";
import { INTERACTABLES, keepsakes } from "../../config/interactions";
import { MEMORY_ORDER } from "../../config/memories";
import { GARDEN, GARDEN_LANTERNS, ROOMS } from "../../config/rooms";
import { isBlocked } from "../collision";

/** Cluby's kept memories stay in his Memory Garden: one lantern each, to be read again. */
describe("kept memories in the Memory Garden", () => {
  it("shows nothing before a memory is kept, and nothing of those still to come", () => {
    expect(keepsakes([])).toEqual([]);
    expect(INTERACTABLES.some((i) => i.kind === "keepsake")).toBe(false);
    const two = keepsakes(["apple", "warmth"]);
    expect(two.map((k) => k.memory)).toEqual(["apple", "warmth"]);
    expect(two.every((k) => k.room === "memory-garden")).toBe(true);
  });

  it("stands them in the order they returned, and ignores anything that is not a memory", () => {
    const k = keepsakes(["strokes", "not-a-memory", "light"]);
    expect(k.map((x) => x.memory)).toEqual(["strokes", "light"]);
    expect(k[0].z).toBe(GARDEN_LANTERNS[0].z);
    expect(k[1].z).toBe(GARDEN_LANTERNS[1].z);
  });

  it("has a lantern for every memory, inside the garden, clear of the beds, bench and stone", () => {
    expect(GARDEN_LANTERNS.length).toBe(MEMORY_ORDER.length);
    const room = ROOMS["memory-garden"];
    const mid = (c: { minX: number; maxX: number; minZ: number; maxZ: number }) => ({ x: (c.minX + c.maxX) / 2, z: (c.minZ + c.maxZ) / 2 });
    const others = room.colliders.filter((c) => !GARDEN_LANTERNS.some((l) => Math.abs(mid(c).x - l.x) < 0.01 && Math.abs(mid(c).z - l.z) < 0.01));
    for (const l of GARDEN_LANTERNS) {
      expect(Math.abs(l.x)).toBeLessThan(GARDEN.half - 0.4);
      expect(Math.abs(l.z)).toBeLessThan(GARDEN.half - 0.4);
      for (const c of others) expect(l.x < c.minX - 0.4 || l.x > c.maxX + 0.4 || l.z < c.minZ - 0.4 || l.z > c.maxZ + 0.4, `${l.z}`).toBe(true);
    }
  });

  it("can be walked up to: the reading spot in front of each lantern is free", () => {
    const room = ROOMS["memory-garden"];
    for (const k of keepsakes([...MEMORY_ORDER])) expect(isBlocked(k.x, k.z, 0.3, room.colliders, room.bounds), k.id).toBe(false);
  });
});
