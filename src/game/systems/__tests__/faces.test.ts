import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FACE_SHAPES, realPersonInRoom } from "../../npc/realCast";
import { NPCS } from "../../config/npcs";

/**
 * Five bodies, many faces: each background body carries the face blend
 * shapes (scripts/world-faces/morph.py) and every person sets their own.
 * Adam and Lina are never reshaped (canon: foreign learners).
 */

const DIR = join(__dirname, "../../../../public/assets/world/people");

interface Gltf {
  meshes: { name?: string; extras?: { targetNames?: string[] }; primitives: { targets?: unknown[] }[] }[];
}

function readGltf(file: string): Gltf {
  const buf = readFileSync(join(DIR, file));
  const len = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + len).toString("utf8")) as Gltf;
}

describe("faces", () => {
  it("every background body has every face shape on its head", () => {
    for (const body of ["npc-joe", "npc-leonard", "npc-brian", "npc-elizabeth", "npc-megan"]) {
      const g = readGltf(`${body}.glb`);
      const head = g.meshes.find((m) => /_Body$/.test(m.name ?? ""));
      expect(head?.extras?.targetNames, body).toEqual(FACE_SHAPES);
      for (const p of head!.primitives) expect(p.targets?.length, body).toBe(FACE_SHAPES.length);
    }
  });

  it("Adam and Lina keep their own faces", () => {
    for (const body of ["adam", "lina"]) for (const m of readGltf(`${body}.glb`).meshes) expect(m.primitives.every((p) => !p.targets)).toBe(true);
  });

  it("no two people in a place share a face, and every shape stays in range", () => {
    for (const room of new Set(NPCS.map((n) => n.room))) {
      const seen = new Set<string>();
      for (const n of NPCS.filter((p) => p.room === room)) {
        const { face } = realPersonInRoom(n, NPCS);
        for (const v of Object.values(face)) expect(Math.abs(v)).toBeLessThanOrEqual(0.7);
        const key = FACE_SHAPES.map((s) => face[s]).join(",");
        expect(seen.has(key), `${n.id} in ${room}`).toBe(false);
        seen.add(key);
      }
    }
  });
});
