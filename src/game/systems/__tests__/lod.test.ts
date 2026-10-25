import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Every body in the world has a light and a far copy (scripts/world-lod),
 * and RiggedBody swaps them in by mesh name on the same skeleton: a copy
 * missing a mesh, or made from another version of the body, would draw a
 * person in pieces.
 */

const DIR = join(__dirname, "../../../../public/assets/world/people");

interface Gltf {
  meshes: { name?: string; primitives: { indices?: number; attributes: Record<string, number> }[] }[];
  nodes: { name?: string; mesh?: number; skin?: number }[];
  accessors: { count: number }[];
}

function readGltf(file: string): Gltf {
  const buf = readFileSync(join(DIR, file));
  // GLB: 12-byte header, then the JSON chunk (length, type, data).
  const len = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + len).toString("utf8")) as Gltf;
}

/** Skinned meshes by (rig-number-free) node name → triangles. */
function skinned(g: Gltf): Map<string, number> {
  const out = new Map<string, number>();
  for (const n of g.nodes) {
    if (n.mesh === undefined) continue;
    const m = g.meshes[n.mesh];
    const tris = m.primitives.reduce((a, p) => a + (p.indices !== undefined ? g.accessors[p.indices].count / 3 : 0), 0);
    out.set((n.name ?? m.name ?? "").replace(/^mixamorig\d+/, "mixamorig"), tris);
  }
  return out;
}

const bodies = readdirSync(DIR).filter((f) => f.endsWith(".glb") && !f.startsWith("anim-") && !/\.(lod|far)\.glb$/.test(f));

describe("people's light and far copies", () => {
  it("there are bodies to check", () => {
    expect(bodies.length).toBeGreaterThanOrEqual(7);
  });

  for (const body of bodies) {
    it(`${body}: each copy has every mesh, fewer triangles, the far one fewest`, () => {
      const full = skinned(readGltf(body));
      const total = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
      let previous = total(full);
      for (const kind of ["lod", "far"]) {
        const file = body.replace(/\.glb$/, `.${kind}.glb`);
        expect(existsSync(join(DIR, file)), file).toBe(true);
        const copy = skinned(readGltf(file));
        for (const name of full.keys()) expect(copy.has(name), `${file} lacks ${name}`).toBe(true);
        const t = total(copy);
        expect(t, file).toBeLessThan(previous);
        previous = t;
      }
      // The far copy is for people a few dozen pixels tall: well under a quarter.
      expect(previous / total(full)).toBeLessThan(0.25);
    });
  }
});
