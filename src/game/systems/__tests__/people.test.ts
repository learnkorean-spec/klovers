import { describe, expect, it } from "vitest";
import { NPCS } from "../../config/npcs";
import { realPersonInRoom } from "../../npc/realCast";

describe("the world's people", () => {
  it("never look like twins: within a room, no two share body, hair and skin", () => {
    const rooms = new Map<string, Set<string>>();
    for (const n of NPCS) {
      const p = realPersonInRoom(n, NPCS);
      const hair = p.rules.find((r) => r.match.test("Ch01_Hair"))!.color;
      const skin = p.rules.find((r) => r.match.test("Ch01_Body"))!.color;
      const key = `${p.model}|${hair}|${skin}`;
      const seen = rooms.get(n.room) ?? new Set<string>();
      expect(seen.has(key), `${n.id} looks like someone else in ${n.room}`).toBe(false);
      seen.add(key);
      rooms.set(n.room, seen);
    }
  });

  it("have dark Korean hair (grey for elders) and a Korean skin tone", () => {
    for (const n of NPCS) {
      const p = realPersonInRoom(n, NPCS);
      const skin = p.rules.find((r) => r.match.test("Ch01_Body"))!;
      expect(skin.tint).toBe(true);
      const hair = p.rules.find((r) => r.match.test("Ch01_Hair"))!.color;
      const lum = parseInt(hair.slice(1, 3), 16);
      if (n.cast !== "elder" && n.cast !== "gardener") expect(lum).toBeLessThan(0x30);
    }
  });

  it("have their own face proportions, kept natural (within ±10%)", () => {
    const shapes = new Set<string>();
    for (const n of NPCS) {
      const { head } = realPersonInRoom(n, NPCS);
      for (const v of head) expect(v).toBeGreaterThan(0.9), expect(v).toBeLessThan(1.1);
      shapes.add(head.map((v) => v.toFixed(3)).join(","));
    }
    expect(shapes.size).toBeGreaterThan(NPCS.length * 0.6);
  });

});
