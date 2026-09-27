import { BufferGeometry, Float32BufferAttribute } from "three";

/**
 * Procedural shapes the kit shares — built once, reused by every room.
 *
 * The hanok roof is the single most recognisable Korean silhouette, and a
 * plain pyramid reads as "box with a hat". This one is a hip roof whose
 * slopes are concave (flat at the eaves, steep toward the ridge) and whose
 * four corners lift upward (the cheoma curve). It is a real ridge, not a
 * point, and it is closed underneath so a low camera never sees through it.
 *
 * Unit space: the footprint spans x ∈ [−A/2, A/2], z ∈ [−½, ½] and the
 * ridge sits at y = 1, so an instance scaled by (w/A, h, d) covers a w × d
 * footprint with a roof h tall. A few aspect buckets cover every building.
 */

const RINGS = 5;
const PER_SIDE = 6;
/** How far the corners rise, as a share of the roof height. */
const LIFT = 0.24;
/** Eave thickness under the lowest ring, as a share of the roof height. */
const THICK = 0.07;

const cache = new Map<number, BufferGeometry>();

export const ROOF_ASPECTS = [1, 1.25, 1.5, 2, 2.5, 3, 4, 6, 9, 14] as const;

/** Nearest bucket for a footprint's long/short ratio (≥ 1). */
export function roofAspect(ratio: number): number {
  let best: number = ROOF_ASPECTS[0];
  for (const a of ROOF_ASPECTS) if (Math.abs(Math.log(a / ratio)) < Math.abs(Math.log(best / ratio))) best = a;
  return best;
}

export function curvedRoof(aspect: number): BufferGeometry {
  const hit = cache.get(aspect);
  if (hit) return hit;
  const A = aspect;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];

  // One strip per side, so the hip creases stay crisp.
  const corners = (xh: number, zh: number): [number, number][] => [
    [-xh, zh],
    [xh, zh],
    [xh, -zh],
    [-xh, -zh],
  ];
  const vert = (x: number, y: number, z: number, u: number, v: number) => {
    pos.push(x, y, z);
    uv.push(u, v);
    return pos.length / 3 - 1;
  };

  for (let side = 0; side < 4; side++) {
    const base = pos.length / 3;
    for (let r = 0; r <= RINGS; r++) {
      const t = r / RINGS;
      const inset = t * 0.5;
      const c = corners(A / 2 - inset, 0.5 - inset);
      const [ax, az] = c[side];
      const [bx, bz] = c[(side + 1) % 4];
      for (let s = 0; s <= PER_SIDE; s++) {
        const f = s / PER_SIDE;
        const u = 2 * f - 1;
        const corner = Math.abs(u) ** 3;
        const lift = LIFT * (1 - t) ** 2 * corner;
        // Corners also sweep a little outward, as real eaves do.
        const flare = 0.035 * (1 - t) * corner;
        const x = ax + (bx - ax) * f;
        const z = az + (bz - az) * f;
        const len = Math.hypot(x, z) || 1;
        vert(x + (x / len) * flare, t ** 1.6 + lift, z + (z / len) * flare, f * (side % 2 ? 2 : 2 * A), t * 2.5);
      }
    }
    const row = PER_SIDE + 1;
    for (let r = 0; r < RINGS; r++)
      for (let s = 0; s < PER_SIDE; s++) {
        const a = base + r * row + s;
        const b = a + 1;
        const c2 = a + row;
        const d = c2 + 1;
        idx.push(a, b, c2, b, d, c2);
      }
  }

  // Eave edge (fascia) and the closed underside.
  const eave: number[] = [];
  for (let side = 0; side < 4; side++) {
    const base = side * (RINGS + 1) * (PER_SIDE + 1);
    for (let s = 0; s < PER_SIDE; s++) eave.push(base + s);
  }
  const low: number[] = eave.map((i) => vert(pos[i * 3], pos[i * 3 + 1] - THICK, pos[i * 3 + 2], uv[i * 2], 0));
  const high: number[] = eave.map((i) => vert(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], uv[i * 2], 0.08));
  const n = eave.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    idx.push(high[i], low[i], high[j], low[i], low[j], high[j]);
  }
  const centre = vert(0, 0.05, 0, 0.5, 0.5);
  for (let i = 0; i < n; i++) idx.push(centre, low[(i + 1) % n], low[i]);

  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  cache.set(aspect, g);
  return g;
}
