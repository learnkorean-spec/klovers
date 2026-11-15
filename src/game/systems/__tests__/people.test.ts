import { describe, expect, it } from "vitest";
import { NPCS } from "../../config/npcs";
import { realPersonInRoom } from "../../npc/realCast";

describe("the world's people", () => {
  it("are never repeated: in the whole world, no two share body, hair and skin", () => {
    const seen = new Map<string, string>();
    for (const n of NPCS) {
      const p = realPersonInRoom(n, NPCS);
      const hair = p.rules.find((r) => r.match.test("Ch01_Hair"))!.color;
      const skin = p.rules.find((r) => r.match.test("Ch01_Body"))!.color;
      const key = `${p.model}|${hair}|${skin}`;
      expect(seen.get(key), `${n.id} (${n.room}) looks like ${seen.get(key)}`).toBeUndefined();
      seen.set(key, n.id);
    }
    expect(seen.size).toBe(NPCS.length);
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
