import { ConeGeometry, CylinderGeometry, IcosahedronGeometry, type BufferGeometry, type Material } from "three";
import { ACCENT, MAT } from "../config/materials";
import { UNIT, type Part } from "./Instanced";

/**
 * KLOVERS World environment kit.
 *
 * Every room is assembled from the same small set of Korean building parts —
 * hanok houses, roofs with a lower skirt and a ridge, stone foundations,
 * timber frames, walls with tiled caps, stone lanterns, raised wooden
 * platforms, pines, stepping stones. Each generator only ADDS transforms to
 * a Kit; the room then draws the whole kit as a handful of instanced meshes
 * (one per finish × shape). Variety comes from sizes, heights and
 * orientation, not from new materials.
 */

export type MatKey = "plaster" | "stoneWarm" | "stone" | "woodLight" | "woodDark" | "roof" | "charcoal" | "paper" | "lantern" | "pine" | "accent";
export type GeoKey = "box" | "hip" | "oct" | "cyl" | "cone" | "ball";

export const KIT_MATERIALS: Record<MatKey, Material> = {
  plaster: MAT.plaster,
  stoneWarm: MAT.stoneWarm,
  stone: MAT.stone,
  woodLight: MAT.woodWarm,
  woodDark: MAT.woodDark,
  roof: MAT.roofTile,
  charcoal: MAT.charcoal,
  paper: MAT.paper,
  lantern: MAT.lanternPaper,
  pine: MAT.pine,
  accent: ACCENT,
};

export const KIT_GEOMETRY: Record<GeoKey, BufferGeometry> = {
  box: UNIT.box,
  hip: UNIT.hipRoof,
  oct: new CylinderGeometry(0.5, 0.5, 1, 8),
  cyl: UNIT.cylinder,
  cone: new ConeGeometry(0.5, 1, 8),
  ball: new IcosahedronGeometry(0.5, 1),
};

type V3 = [number, number, number];

export class Kit {
  readonly lists = new Map<string, Part[]>();

  add(mat: MatKey, geo: GeoKey, p: V3, s: V3, r?: V3, cast = false): this {
    const key = `${mat}|${geo}|${cast ? 1 : 0}`;
    let l = this.lists.get(key);
    if (!l) this.lists.set(key, (l = []));
    l.push({ p, s, r });
    return this;
  }

  box(mat: MatKey, p: V3, s: V3, cast = false, r?: V3): this {
    return this.add(mat, "box", p, s, r, cast);
  }
}

/** A tiny, stable pseudo-random from a seed — variety without flicker. */
export function jitter(seed: number, amount: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amount;
}

/**
 * Hanok roof over a w × d footprint whose walls end at `baseY`: a wood eave
 * board, a wide shallow lower skirt (the upturned-eave read), a steeper
 * upper hip, and a ridge along the long side with pale mortar ends.
 */
export function hanokRoof(k: Kit, x: number, z: number, baseY: number, w: number, d: number, h = 1.1): void {
  k.box("woodDark", [x, baseY + 0.07, z], [w + 1.0, 0.14, d + 1.0], true);
  k.add("roof", "hip", [x, baseY + 0.14 + 0.22, z], [w + 1.7, 0.44, d + 1.7], undefined, true);
  k.add("roof", "hip", [x, baseY + 0.36 + h / 2, z], [w + 0.55, h, d + 0.55], undefined, true);
  const along = w >= d;
  const len = Math.abs(w - d) * 0.55 + 0.6;
  const top = baseY + 0.36 + h - 0.12;
  k.box("roof", [x, top, z], along ? [len, 0.16, 0.2] : [0.2, 0.16, len]);
  for (const s of [-1, 1]) {
    const o = (len / 2) * s;
    k.box("plaster", along ? [x + o, top + 0.02, z] : [x, top + 0.02, z + o], [0.16, 0.14, 0.16]);
  }
}

export type Face = "+x" | "-x" | "+z" | "-z";

/** Local frame of a wall face: its outward normal and the axis along it. */
function faceFrame(face: Face) {
  const n: V3 = face === "+x" ? [1, 0, 0] : face === "-x" ? [-1, 0, 0] : face === "+z" ? [0, 0, 1] : [0, 0, -1];
  const alongX = face === "+z" || face === "-z";
  return { n, alongX };
}

export interface HouseSpec {
  x: number;
  z: number;
  /** Size along x and z, and wall height above the foundation. */
  w: number;
  d: number;
  h?: number;
  /** The face with the door and windows. */
  face: Face;
  /** Door offset along the face (0 = centre). */
  door?: number;
  roofH?: number;
}

/**
 * A hanok house: stone foundation, ivory plaster between timber posts and a
 * top beam, a recessed door, paper windows with lattice, and a hanok roof.
 */
export function hanokHouse(k: Kit, spec: HouseSpec): void {
  const { x, z, w, d, face } = spec;
  const h = spec.h ?? 2.4;
  const found = 0.4;
  k.box("stoneWarm", [x, found / 2, z], [w + 0.3, found, d + 0.3], true);
  k.box("plaster", [x, found + h / 2, z], [w, h, d], true);
  // Timber frame: corner posts and the top beam.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box("woodDark", [x + sx * (w / 2), found + h / 2, z + sz * (d / 2)], [0.22, h, 0.22], true);
  k.box("woodDark", [x, found + h - 0.09, z], [w + 0.06, 0.18, d + 0.06]);

  const { n, alongX } = faceFrame(face);
  const half = alongX ? d / 2 : w / 2;
  const span = alongX ? w : d;
  const at = (along: number, y: number, out: number): V3 =>
    alongX ? [x + along, y, z + n[2] * (half + out)] : [x + n[0] * (half + out), y, z + along];
  const size = (a: number, y: number, t: number): V3 => (alongX ? [a, y, t] : [t, y, a]);

  // Middle posts along the facade.
  for (const a of [-span / 4, span / 4]) k.box("woodDark", at(a, found + h / 2, 0.02), size(0.16, h, 0.16));
  // Recessed door: a dark frame, and the panel set back into the wall.
  const door = spec.door ?? 0;
  k.box("woodDark", at(door, found + 1.0, 0.04), size(1.2, 2.0, 0.08));
  k.box("charcoal", at(door, found + 0.95, 0.06), size(0.9, 1.8, 0.04));
  k.box("woodLight", at(door, found + 0.95, 0.075), size(0.04, 1.8, 0.02));
  // Two paper windows with a simple lattice.
  for (const a of [-span / 2 + span * 0.18, span / 2 - span * 0.18]) {
    if (Math.abs(a - door) < 1.1) continue;
    k.box("woodDark", at(a, found + 1.35, 0.03), size(0.95, 0.8, 0.06));
    k.box("paper", at(a, found + 1.35, 0.065), size(0.82, 0.67, 0.02));
    k.box("woodDark", at(a, found + 1.35, 0.08), size(0.03, 0.67, 0.02));
    k.box("woodDark", at(a, found + 1.35, 0.08), size(0.82, 0.03, 0.02));
  }
  hanokRoof(k, x, z, found + h, w, d, spec.roofH ?? 1.1);
}

/**
 * An axis-aligned courtyard wall from (x1, z1) to (x2, z2): stone base,
 * plaster, a timber rail and a small tiled cap.
 */
export function wallRun(k: Kit, x1: number, z1: number, x2: number, z2: number, h = 2.4, t = 0.4): void {
  const alongX = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
  const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const s = (l: number, y: number, tt: number): V3 => (alongX ? [l, y, tt] : [tt, y, l]);
  k.box("stoneWarm", [cx, 0.3, cz], s(len, 0.6, t + 0.08), false);
  k.box("plaster", [cx, h / 2, cz], s(len, h, t), true);
  k.box("woodDark", [cx, h - 0.12, cz], s(len + 0.02, 0.12, t + 0.04));
  k.add("roof", "hip", [cx, h + 0.2, cz], s(len + 0.5, 0.42, t + 0.8), undefined, true);
}

/** A stone lantern (seokdeung): octagonal foot, shaft, paper light, small roof. */
export function stoneLantern(k: Kit, x: number, z: number, s = 1): void {
  k.add("stoneWarm", "oct", [x, 0.12 * s, z], [0.55 * s, 0.24 * s, 0.55 * s], undefined, true);
  k.add("stoneWarm", "oct", [x, 0.55 * s, z], [0.22 * s, 0.7 * s, 0.22 * s], undefined, true);
  k.box("lantern", [x, 1.05 * s, z], [0.36 * s, 0.34 * s, 0.36 * s]);
  k.add("roof", "hip", [x, 1.33 * s, z], [0.62 * s, 0.24 * s, 0.62 * s], undefined, true);
}

/** A raised wooden platform to sit on (pyeongsang) — replaces box benches. */
export function platform(k: Kit, x: number, z: number, w: number, d: number, rotY = 0): void {
  const r: V3 = [0, rotY, 0];
  k.box("woodLight", [x, 0.42, z], [w, 0.08, d], true, r);
  const c = Math.cos(rotY);
  const sn = Math.sin(rotY);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const lx = sx * (w / 2 - 0.12);
    const lz = sz * (d / 2 - 0.12);
    k.box("woodDark", [x + lx * c + lz * sn, 0.19, z - lx * sn + lz * c], [0.1, 0.38, 0.1], false, r);
  }
  k.box("woodDark", [x, 0.47, z], [w + 0.04, 0.03, d + 0.04], false, r);
}

/** A stylised pine: a leaning trunk and three stacked crowns. */
export function pine(k: Kit, x: number, z: number, s = 1): void {
  k.add("woodDark", "cyl", [x, 0.8 * s, z], [0.2 * s, 1.6 * s, 0.2 * s], [0, 0, 0.06], true);
  k.add("pine", "cone", [x + 0.05 * s, 1.55 * s, z], [1.5 * s, 0.9 * s, 1.5 * s], undefined, true);
  k.add("pine", "cone", [x + 0.08 * s, 2.1 * s, z], [1.15 * s, 0.8 * s, 1.15 * s], undefined, true);
  k.add("pine", "cone", [x + 0.1 * s, 2.55 * s, z], [0.75 * s, 0.7 * s, 0.75 * s], undefined, true);
}

/** A glazed pot (onggi) with a small round shrub. */
export function pot(k: Kit, x: number, z: number, s = 1, shrub = true): void {
  k.add("charcoal", "oct", [x, 0.22 * s, z], [0.5 * s, 0.44 * s, 0.5 * s]);
  k.add("charcoal", "oct", [x, 0.46 * s, z], [0.36 * s, 0.06 * s, 0.36 * s]);
  if (shrub) k.add("pine", "ball", [x, 0.72 * s, z], [0.6 * s, 0.5 * s, 0.6 * s]);
}

/** Flat slate stepping stones from one point to another: a path the eye follows. */
export function steppingStones(k: Kit, x1: number, z1: number, x2: number, z2: number, gap = 0.95, seed = 1, mat: MatKey = "charcoal"): void {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.max(1, Math.floor(len / gap));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x1 + (x2 - x1) * t + jitter(seed + i, 0.12);
    const pz = z1 + (z2 - z1) * t + jitter(seed + i * 7, 0.12);
    const sz = 0.68 + jitter(seed + i * 3, 0.08);
    k.add(mat, "oct", [px, 0.025, pz], [sz, 0.05, sz * 0.9], [0, jitter(seed + i * 11, 0.6), 0]);
  }
}

/**
 * A two-storey market shop front: open ground-floor shop under a tiled
 * canopy, paper windows above, a low roof. A different silhouette from the
 * village's single-storey hanok — the market reads busier from afar.
 */
export function shopfront(k: Kit, spec: { x: number; z: number; w: number; d: number; h: number; face: Face }): void {
  const { x, z, w, d, h, face } = spec;
  k.box("stoneWarm", [x, 0.2, z], [w + 0.2, 0.4, d + 0.2], true);
  k.box("plaster", [x, 0.4 + h / 2, z], [w, h, d], true);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box("woodDark", [x + sx * (w / 2), 0.4 + h / 2, z + sz * (d / 2)], [0.2, h, 0.2], true);
  const { n, alongX } = faceFrame(face);
  const half = alongX ? d / 2 : w / 2;
  const span = (alongX ? w : d) - 0.6;
  const at = (along: number, y: number, out: number): V3 =>
    alongX ? [x + along, y, z + n[2] * (half + out)] : [x + n[0] * (half + out), y, z + along];
  const size = (a: number, y: number, t: number): V3 => (alongX ? [a, y, t] : [t, y, a]);
  // Ground floor: the shop opening and its counter.
  k.box("charcoal", at(0, 1.35, 0.03), size(span, 1.9, 0.06));
  k.box("woodLight", at(0, 0.75, 0.2), size(span, 0.12, 0.36));
  // Tiled canopy over the shop.
  k.box("roof", at(0, 2.55, 0.45), size(span + 0.6, 0.12, 0.95), true, alongX ? [n[2] * 0.25, 0, 0] : [0, 0, -n[0] * 0.25]);
  k.box("woodDark", at(0, 2.42, 0.05), size(span + 0.2, 0.14, 0.12));
  // Upper floor: a row of paper windows.
  const count = Math.max(2, Math.round(span / 1.3));
  for (let i = 0; i < count; i++) {
    const a = -span / 2 + (span / count) * (i + 0.5);
    k.box("woodDark", at(a, 0.4 + h - 1.0, 0.03), size(0.9, 0.75, 0.06));
    k.box("paper", at(a, 0.4 + h - 1.0, 0.065), size(0.78, 0.63, 0.02));
  }
  // A lower, flatter roof than the village houses.
  k.box("woodDark", [x, 0.4 + h + 0.06, z], [w + 0.7, 0.12, d + 0.7], true);
  k.add("roof", "hip", [x, 0.4 + h + 0.4, z], [w + 1.1, 0.6, d + 1.1], undefined, true);
}

/** A woven basket with a few round goods heaped in it. */
export function basket(k: Kit, x: number, z: number, s = 1, heap: MatKey = "woodLight"): void {
  k.add("woodLight", "cyl", [x, 0.14 * s, z], [0.55 * s, 0.28 * s, 0.55 * s]);
  k.add("woodDark", "cyl", [x, 0.29 * s, z], [0.58 * s, 0.04 * s, 0.58 * s]);
  k.add(heap, "ball", [x, 0.32 * s, z], [0.42 * s, 0.2 * s, 0.42 * s]);
}
