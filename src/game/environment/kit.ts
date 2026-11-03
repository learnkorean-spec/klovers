import { BoxGeometry, BufferAttribute, BufferGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, IcosahedronGeometry, LatheGeometry, Shape, TorusGeometry, Vector2, Vector3, type Material } from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ACCENT, MAT } from "../config/materials";
import { pickQuality } from "../systems/quality";
import { UNIT, type Part } from "./Instanced";
import { curvedRoof, roofAspect } from "./shapes";

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

export type MatKey =
  | "plaster" | "stoneWarm" | "stone" | "woodLight" | "woodDark" | "roof" | "roofSoft" | "charcoal" | "paper" | "lantern"
  | "pine" | "accent" | "fabric" | "metal" | "gravel" | "leaf" | "leafDark" | "farLeaf" | "farLeafDark" | "blossom" | "blossomPale" | "moss" | "bedCover" | "hill"
  | "clothRed" | "clothBlue" | "clothSage" | "fruitRed" | "fruitOrange" | "flowerWhite" | "flowerLilac" | "flowerPink" | "pollen" | "flagstone" | "boulder" | "soil" | "wicker" | "steel" | "broth" | "fishcake" | "kimchi" | "sprouts" | "beans" | "onggi" | "lockPaint" | "cityBlock" | "cityGround" | "river" | "ceramic" | "glass" | "sponge" | "cream" | "berry" | "bark" | "barkCherry" | "barkPine";
/** Unit shapes, plus curved roofs by aspect ("roof:2" …). */
export type GeoKey = "box" | "hip" | "oct" | "cyl" | "cone" | "parasolA" | "parasolB" | "parasolRibs" | "awningA" | "awningB" | "flagA" | "flagB" | "slab" | "boulderA" | "boulderB" | "lilyPad" | "hedge" | "hedgeB" | "bloom" | "leaves" | "pinePadA" | "pinePadB" | "ball" | "bloomA" | "bloomB" | "leafy" | "leafyLow" | "crownA" | "crownB" | "fruit" | "ballLow" | "ridge" | "cylLow" | "basket" | "basketRim" | "onggi" | "rootFlare" | "taper" | "taperLow" | "lockBox" | "lockHeart" | "shackle" | `roof:${number}`;

export const KIT_MATERIALS: Record<MatKey, Material> = {
  plaster: MAT.plaster,
  stoneWarm: MAT.stoneWarm,
  stone: MAT.stoneWarm,
  woodLight: MAT.woodWarm,
  woodDark: MAT.woodDark,
  roof: MAT.roofTile,
  roofSoft: MAT.roofSoft,
  charcoal: MAT.charcoal,
  paper: MAT.paper,
  lantern: MAT.lanternPaper,
  pine: MAT.pine,
  accent: ACCENT,
  fabric: MAT.fabric,
  metal: MAT.metal,
  leaf: MAT.leaf,
  leafDark: MAT.leafDark,
  farLeaf: MAT.farLeaf,
  farLeafDark: MAT.farLeafDark,
  blossom: MAT.blossom,
  blossomPale: MAT.blossomPale,
  moss: MAT.moss,
  bedCover: MAT.bedCover,
  gravel: MAT.gravel,
  hill: MAT.hill,
  clothRed: MAT.clothRed,
  clothBlue: MAT.clothBlue,
  clothSage: MAT.clothSage,
  fruitRed: MAT.fruitRed,
  fruitOrange: MAT.fruitOrange,
  flowerWhite: MAT.flowerWhite,
  flowerLilac: MAT.flowerLilac,
  flowerPink: MAT.flowerPink,
  pollen: MAT.pollen,
  flagstone: MAT.flagstone,
  boulder: MAT.boulder,
  soil: MAT.soil,
  wicker: MAT.wicker,
  steel: MAT.steel,
  broth: MAT.broth,
  fishcake: MAT.fishcake,
  kimchi: MAT.kimchi,
  sprouts: MAT.sprouts,
  beans: MAT.beans,
  onggi: MAT.onggi,
  lockPaint: MAT.lockPaint,
  cityBlock: MAT.cityBlock,
  cityGround: MAT.cityGround,
  river: MAT.river,
  ceramic: MAT.ceramic,
  glass: MAT.glass,
  sponge: MAT.sponge,
  cream: MAT.cream,
  berry: MAT.berry,
  bark: MAT.bark,
  barkCherry: MAT.barkCherry,
  barkPine: MAT.barkPine,
};

/**
 * A soft, lumpy crown: an icosphere with shared vertices (so it shades
 * smoothly instead of in facets) whose radius swells and dips a little in a
 * few low waves, so no two crowns of the same kind look like the same ball.
 * Built once; every tree, shrub and rock instances it.
 */
function lumpyBall(detail: number, lump: number): BufferGeometry {
  const raw = new IcosahedronGeometry(0.5, detail);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw, 1e-4);
  const pos = g.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const w = Math.sin(v.x * 3.1 + 0.7) * Math.sin(v.y * 2.7 + 1.9) * Math.sin(v.z * 3.4 + 0.3) + 0.5 * Math.sin(v.x * 6.2 + v.z * 5.1 + 2.0) * Math.sin(v.y * 5.3 + 0.4);
    v.multiplyScalar(0.5 * (1 + lump * w));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * A leafy cluster: a ball whose outline is ragged at a fine scale (sprigs of
 * leaves standing out) but whose shading stays soft — the normals point
 * mostly straight out from the middle, as if light fell on one rounded mass
 * of leaves. A lumpy ball lit by its own bumps reads as a rock or a
 * cauliflower; this reads as foliage.
 */
function leafyBall(detail: number): BufferGeometry {
  const raw = new IcosahedronGeometry(0.5, detail);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw, 1e-4);
  const pos = g.getAttribute("position");
  const dirs: Vector3[] = [];
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    dirs.push(v.clone());
    const low = Math.sin(v.x * 2.9 + 0.4) * Math.sin(v.y * 2.3 + 1.1) * Math.sin(v.z * 3.1 + 2.2);
    const h = Math.sin(v.x * 13.3 + v.y * 5.1) * Math.sin(v.z * 12.7 - v.x * 4.9) * Math.sin(v.y * 11.3 + v.z * 3.3);
    v.multiplyScalar(0.5 * (1 + 0.1 * low + 0.2 * h));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const nrm = g.getAttribute("normal");
  const n = new Vector3();
  for (let i = 0; i < nrm.count; i++) {
    n.fromBufferAttribute(nrm, i).multiplyScalar(0.25).addScaledVector(dirs[i], 0.75).normalize();
    nrm.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
}

/**
 * A clipped hedge block (unit box): flat-ish faces with rounded edges (a
 * superellipsoid, so the top and ends are soft as on a real clipped hedge),
 * a lumpy surface of shoots, and normals leaning 65% toward the smooth body,
 * so light rolls over it as one mass with small leafy breaks — not a flat
 * green slab. The bottom stays flat on the ground. Laid end to end, each
 * block a little longer than its slot, the lumps hide the joins.
 */
function hedgeBlock(phase = 0): BufferGeometry {
  const raw = new BoxGeometry(1, 1, 1, 10, 7, 5);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw, 1e-4);
  const pos = g.getAttribute("position");
  const body: Vector3[] = [];
  const v = new Vector3();
  const P = 5;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const bottom = v.y < -0.499;
    // Project the cube point onto the superellipsoid |x|^P+|y|^P+|z|^P = 0.5^P.
    const k = Math.pow(Math.abs(v.x) ** P + Math.abs(v.y) ** P + Math.abs(v.z) ** P, 1 / P);
    const q = v.clone().multiplyScalar(0.5 / k);
    if (bottom) q.y = -0.5;
    // Smooth-body normal (the superellipsoid's gradient).
    const n = new Vector3(Math.sign(q.x) * Math.abs(q.x) ** (P - 1), Math.sign(q.y) * Math.abs(q.y) ** (P - 1), Math.sign(q.z) * Math.abs(q.z) ** (P - 1)).normalize();
    body.push(n);
    if (!bottom) {
      const d = Math.sin(q.x * 23.1 + q.y * 7.3 + phase * 2.1) * Math.sin(q.z * 19.7 - q.x * 5.1 + phase * 1.3) * Math.sin(q.y * 17.9 + q.z * 4.3 + phase * 0.7);
      const lo = Math.sin(q.x * 6.3 + 1.1 + phase * 2.9) * Math.sin(q.y * 5.2 + q.z * 3.3 + phase);
      q.addScaledVector(n, 0.035 * d + 0.02 * lo);
    }
    pos.setXYZ(i, q.x, q.y, q.z);
  }
  g.computeVertexNormals();
  const nrm = g.getAttribute("normal");
  const n = new Vector3();
  for (let i = 0; i < nrm.count; i++) {
    n.fromBufferAttribute(nrm, i).multiplyScalar(0.35).addScaledVector(body[i], 0.65).normalize();
    nrm.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
}

/**
 * A clump of cherry blossom (벚꽃): not one ball but six or seven small,
 * ragged knots of flowers bunched round a twig's end, with gaps between them.
 * Their normals lean toward "out from the clump's middle", so the clump is
 * lit as one soft mass while its outline stays broken — a flowering branch,
 * not cotton candy. Fits a unit box (radius 0.5).
 */
/**
 * Drops the faces of a clump's knot that lie wholly inside another knot
 * (every corner well within that knot's smallest surface radius): they can
 * never be seen, only drawn. `inner` is that smallest radius as a share of
 * the knot's nominal one (its ripple and any flattening taken off).
 */
function cullBuried(parts: BufferGeometry[], knots: [number, number, number, number][], inner: number): void {
  const p = new Vector3();
  const buried = (i: number) => {
    for (let j = 0; j < knots.length; j++) {
      if (j === i) continue;
      const [x, y, z, r] = knots[j];
      if ((p.x - x) ** 2 + (p.y - y) ** 2 + (p.z - z) ** 2 < (r * inner) ** 2) return true;
    }
    return false;
  };
  parts.forEach((g, i) => {
    const pos = g.getAttribute("position");
    const idx = g.getIndex();
    if (!idx) return;
    const hidden = new Uint8Array(pos.count);
    for (let v = 0; v < pos.count; v++) {
      p.fromBufferAttribute(pos, v);
      hidden[v] = buried(i) ? 1 : 0;
    }
    const keep: number[] = [];
    for (let t = 0; t < idx.count; t += 3) {
      const a = idx.getX(t);
      const b = idx.getX(t + 1);
      const c = idx.getX(t + 2);
      if (!(hidden[a] && hidden[b] && hidden[c])) keep.push(a, b, c);
    }
    g.setIndex(keep);
  });
}

function blossomClump(detail: number, variant: number, n: number): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const knots: [number, number, number, number][] = [[0, 0.02, 0, 0.22]];
  // Fewer, larger knots when there are few of them (phones).
  const kr = 0.17 * Math.sqrt(6 / n);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 * (n > 7 ? 2 : 1) + variant * 0.9 + jitter(variant * 17 + i, 0.35);
    const up = (i % 2 ? 0.45 : -0.25) + (n > 7 && i >= n / 2 ? 0.25 : 0) + jitter(variant * 5 + i * 3, 0.25);
    const d = 0.27 + jitter(variant * 9 + i, 0.04);
    const r = kr + jitter(variant * 13 + i * 7, kr * 0.2);
    knots.push([Math.cos(a) * Math.cos(up) * d, Math.sin(up) * d, Math.sin(a) * Math.cos(up) * d, r]);
  }
  const v = new Vector3();
  const n0 = new Vector3();
  for (const [kx, ky, kz, kr] of knots) {
    const raw = new IcosahedronGeometry(1, detail);
    raw.deleteAttribute("normal");
    raw.deleteAttribute("uv");
    const g = mergeVertices(raw, 1e-4);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      // Florets standing out of each knot: a fine, sharp ripple.
      const h = Math.sin(v.x * 9.7 + kx * 20) * Math.sin(v.z * 10.3 - v.y * 3.1) * Math.sin(v.y * 8.9 + kz * 15);
      v.multiplyScalar(kr * (1 + 0.22 * h));
      pos.setXYZ(i, kx + v.x, ky + v.y, kz + v.z);
    }
    g.computeVertexNormals();
    const nrm = g.getAttribute("normal");
    for (let i = 0; i < nrm.count; i++) {
      v.fromBufferAttribute(pos, i);
      n0.fromBufferAttribute(nrm, i).multiplyScalar(0.4).addScaledVector(v.normalize(), 0.6).normalize();
      nrm.setXYZ(i, n0.x, n0.y, n0.z);
    }
    parts.push(g);
  }
  cullBuried(parts, knots, 0.74);
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged ?? lumpyBall(detail, 0.24);
}

/**
 * A whole far-tree crown in one piece: a broad dome of eight or nine leafy
 * knots (a big middle one, a ring round it, two on top), each a small ragged
 * icosphere. Normals lean 70% toward "out from the crown's middle", so the
 * crown is lit as one rounded mass while its outline stays broken into
 * clumps — a tree seen over a roof, not a pile of faceted rocks. About the
 * triangles of the five separate crowns it replaces, in one instance.
 * Fits a unit box (y −0.5…0.5, so the foliage shader's sunlit top works).
 */
function farCrown(variant: number, detail = 1): BufferGeometry {
  const knots: [number, number, number, number][] = [[0, -0.02, 0, 0.33]];
  const ring = 6;
  for (let i = 0; i < ring; i++) {
    const a = (i / ring) * Math.PI * 2 + variant * 0.7 + jitter(variant * 11 + i, 0.3);
    const d = 0.24 + jitter(variant * 7 + i * 3, 0.04);
    knots.push([Math.cos(a) * d, -0.06 + jitter(variant * 5 + i, 0.1), Math.sin(a) * d, 0.22 + jitter(variant * 13 + i, 0.03)]);
  }
  knots.push([0.1 * Math.cos(variant), 0.24, 0.1 * Math.sin(variant), 0.21], [-0.14 * Math.cos(variant), 0.2, 0.12, 0.17]);
  const parts: BufferGeometry[] = [];
  const v = new Vector3();
  const n0 = new Vector3();
  for (const [kx, ky, kz, kr] of knots) {
    const raw = new IcosahedronGeometry(1, detail);
    raw.deleteAttribute("normal");
    raw.deleteAttribute("uv");
    const g = mergeVertices(raw, 1e-4);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      const h = Math.sin(v.x * 7.3 + kx * 11) * Math.sin(v.z * 6.9 - v.y * 2.3) * Math.sin(v.y * 7.7 + kz * 9);
      v.multiplyScalar(kr * (1 + 0.16 * h));
      // Flatter underneath, as a crown is.
      pos.setXYZ(i, kx + v.x, ky + v.y * (v.y < 0 ? 0.85 : 1), kz + v.z);
    }
    g.computeVertexNormals();
    const nrm = g.getAttribute("normal");
    for (let i = 0; i < nrm.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.y *= 1.25;
      n0.fromBufferAttribute(nrm, i).multiplyScalar(0.15).addScaledVector(v.normalize(), 0.85).normalize();
      nrm.setXYZ(i, n0.x, n0.y, n0.z);
    }
    parts.push(g);
  }
  cullBuried(parts, knots, 0.68);
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged ?? lumpyBall(1, 0.12);
}

/**
 * A foliage pad of a Korean red pine (소나무): the flat, cloud-like layer of
 * needles at the end of a bough. A squashed icosphere whose rim breaks into
 * ragged tufts (bigger round the edge than on top), with a domed top and a
 * flatter underside; normals lean 75% toward the smooth body, so the pad
 * reads as one sunlit layer with tufts, not a pile of balls. Unit box
 * (radius 0.5); the instance flattens it.
 */
function pinePad(detail: number, phase: number): BufferGeometry {
  const raw = new IcosahedronGeometry(0.5, detail);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw, 1e-4);
  const pos = g.getAttribute("position");
  const dirs: Vector3[] = [];
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    dirs.push(v.clone());
    const rim = 1 - Math.abs(v.y);
    const low = Math.sin(v.x * 2.6 + phase) * Math.sin(v.z * 2.9 + 1.1 + phase);
    const tuft = Math.sin(v.x * 11.7 + v.z * 3.1 + phase * 2) * Math.sin(v.z * 12.9 - v.x * 4.3) * Math.sin(v.y * 9.1 + v.x * 2.3);
    v.multiplyScalar(0.5 * (1 + 0.1 * low + (0.05 + 0.11 * rim) * tuft));
    // A flatter underside: the needles hang off the bough, they don't wrap it.
    if (v.y < 0) v.y *= 0.55;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const nrm = g.getAttribute("normal");
  const n = new Vector3();
  for (let i = 0; i < nrm.count; i++) {
    n.fromBufferAttribute(nrm, i).multiplyScalar(0.25).addScaledVector(dirs[i], 0.75).normalize();
    nrm.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
}

/** Panels (gores) of a market parasol: eight, alternating two cloths. */
const PARASOL_GORES = 8;

/** Canopy height (unit parasol: apex y = 0.5, rim y = -0.5 at r = 0.5) at radius fraction t. */
function parasolY(t: number): number {
  // Domed, not a straight cone: flatter by the top, steeper toward the rim.
  return 0.5 - Math.pow(t, 1.45);
}

/**
 * One cloth of a market parasol, in the same unit box as the cone it
 * replaces (radius 0.5, y -0.5…0.5), so the existing sizes still apply.
 *
 * The old parasols were 8-sided cones with a flat base: from under them —
 * where an eye-level camera always is — they were one dark, flat octagon
 * filling the top of the screen. This one is the real thing:
 *  - eight panels, each sagging a little between its ribs, with a short
 *    scalloped valance at the rim; `parity` 0 or 1 picks every other panel,
 *    so two cloths make the stripes (one instanced draw each);
 *  - an underside that copies the top surface with the winding reversed and
 *    the SAME (upward) normals: seen from below it is lit like the top —
 *    sunlight through cloth — instead of a black lid. It shares the top's
 *    depth, so the shadow map (back faces) never shades it, and it is
 *    culled from above, so it never fights the top.
 */
function parasolCloth(parity: 0 | 1): BufferGeometry {
  const RINGS = 7;
  const ACROSS = 6;
  const VALANCE = 0.2;
  const parts: BufferGeometry[] = [];
  for (let g = parity; g < PARASOL_GORES; g += 2) {
    const a0 = (g / PARASOL_GORES) * Math.PI * 2;
    const da = (Math.PI * 2) / PARASOL_GORES;
    const pos: number[] = [];
    const uv: number[] = [];
    // Canopy rings 0..RINGS, then one valance ring below the rim.
    for (let i = 0; i <= RINGS + 1; i++) {
      for (let j = 0; j <= ACROSS; j++) {
        const u = j / ACROSS;
        const a = a0 + u * da;
        const mid = Math.sin(Math.PI * u);
        let r: number;
        let y: number;
        if (i <= RINGS) {
          const t = i / RINGS;
          // Cloth pulls in and dips between ribs, most toward the rim.
          r = 0.5 * t * (1 - 0.045 * mid * t);
          y = parasolY(t) - 0.035 * mid * t;
        } else {
          // Valance: hangs straight down, two scallops per panel.
          r = 0.5 * (1 - 0.045 * mid);
          y = parasolY(1) - 0.035 * mid - VALANCE * (0.55 + 0.45 * Math.abs(Math.sin(Math.PI * 2 * u)));
        }
        pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
        // Weave about every 35 cm across a panel (the detail map is coarse).
        uv.push(u * 4, (i / (RINGS + 1)) * 5);
      }
    }
    const idx: number[] = [];
    const row = ACROSS + 1;
    for (let i = 0; i <= RINGS; i++)
      for (let j = 0; j < ACROSS; j++) {
        const p0 = i * row + j;
        const p1 = p0 + 1;
        const p2 = p0 + row;
        const p3 = p2 + 1;
        // Outward-facing (seen from above / outside).
        idx.push(p0, p2, p1, p1, p2, p3);
      }
    const top = new BufferGeometry();
    top.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    top.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
    top.setIndex(idx);
    top.computeVertexNormals();
    // Underside: same vertices and normals, reversed winding.
    const under = top.clone();
    const rev: number[] = [];
    for (let k = 0; k < idx.length; k += 3) rev.push(idx[k], idx[k + 2], idx[k + 1]);
    under.setIndex(rev);
    parts.push(top, under);
  }
  const merged = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return merged;
}

/**
 * A stall awning in the unit box: a canvas sheet (x = depth, z = length)
 * that sags between its front and back bars and a little in each lane, with
 * a scalloped valance hanging from the front edge (local −x). Lanes alternate
 * between two pieces (parity 0 = the dyed lanes, 1 = the ivory ones), so one
 * instanced draw per cloth gives a striped awning. Y is in metres (instance
 * it with y-scale 1). Both faces carry the same upward normals, like the
 * parasol, so the underside reads as sunlit canvas from the street.
 */
const AWNING_LANES = 8;
function awningCloth(parity: 0 | 1): BufferGeometry {
  const AX = 8;
  const AZ = 4;
  const parts: BufferGeometry[] = [];
  for (let lane = parity; lane < AWNING_LANES; lane += 2) {
    const pos: number[] = [];
    const uv: number[] = [];
    for (let i = 0; i <= AX + 1; i++) {
      for (let j = 0; j <= AZ; j++) {
        const uz = j / AZ;
        const z = -0.5 + (lane + uz) / AWNING_LANES;
        const dip = Math.sin(Math.PI * uz);
        let x: number;
        let y: number;
        if (i <= AX) {
          const ux = i / AX;
          x = 0.5 - ux;
          y = -0.05 * Math.sin(Math.PI * ux) - 0.022 * dip * Math.sin(Math.PI * ux);
        } else {
          // Valance: two scallops per lane.
          x = -0.5;
          y = -0.17 * (0.6 + 0.4 * Math.abs(Math.sin(Math.PI * 2 * uz)));
        }
        pos.push(x, y, z);
        uv.push((z + 0.5) * 8, (i / (AX + 1)) * 6);
      }
    }
    const idx: number[] = [];
    const row = AZ + 1;
    for (let i = 0; i <= AX; i++)
      for (let j = 0; j < AZ; j++) {
        const p0 = i * row + j;
        const p1 = p0 + 1;
        const p2 = p0 + row;
        const p3 = p2 + 1;
        idx.push(p0, p2, p1, p1, p2, p3);
      }
    const top = new BufferGeometry();
    top.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    top.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
    top.setIndex(idx);
    top.computeVertexNormals();
    // The valance's normals face out (front); the sheet's face up.
    const under = top.clone();
    const rev: number[] = [];
    for (let k = 0; k < idx.length; k += 3) rev.push(idx[k], idx[k + 2], idx[k + 1]);
    under.setIndex(rev);
    parts.push(top, under);
  }
  const merged = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return merged;
}

/**
 * Placement of a stall awning: centre (x, y, z), width w across the stall
 * (x), length d along it (z). `front` is the side (−1 = −x, 1 = +x) whose
 * edge carries the valance; `drop` tilts that edge down (radians; negative
 * raises it).
 */
export function awningPlace(x: number, y: number, z: number, w: number, d: number, front: -1 | 1, drop: number): Part {
  return { p: [x, y, z], s: [w, 1, d], r: [0, front > 0 ? Math.PI : 0, drop] };
}

/** A striped stall awning in a kit: dyed lanes in `cloth`, ivory between. */
export function awning(k: Kit, cloth: MatKey, x: number, y: number, z: number, w: number, d: number, front: -1 | 1, drop: number): void {
  const a = awningPlace(x, y, z, w, d, front, drop);
  k.add(cloth, "awningA", a.p, a.s, a.r, true);
  k.add("fabric", "awningB", a.p, a.s, a.r, true);
}

/**
 * The parasol's ribs and stretchers as seen from below: thin dark strips
 * just under each rib line, facing down (culled from above).
 */
function parasolRibs(): BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const W = 0.008;
  const STEPS = 7;
  const quad = (a: Vector3, b: Vector3, c: Vector3, d: Vector3) => {
    // a-b along one edge, c-d the other; facing down.
    for (const v of [a, c, b, b, c, d]) {
      pos.push(v.x, v.y, v.z);
      nor.push(0, -1, 0);
    }
  };
  for (let g = 0; g < PARASOL_GORES; g++) {
    const a = (g / PARASOL_GORES) * Math.PI * 2;
    const cx = Math.cos(a);
    const cz = Math.sin(a);
    const sx = -cz * W;
    const sz = cx * W;
    // The rib, following the canopy just beneath it.
    for (let i = 0; i < STEPS; i++) {
      const t0 = Math.max(0.02, i / STEPS);
      const t1 = (i + 1) / STEPS;
      const r0 = 0.5 * t0;
      const r1 = 0.5 * t1;
      const y0 = parasolY(t0) - 0.012;
      const y1 = parasolY(t1) - 0.012;
      quad(new Vector3(cx * r0 - sx, y0, cz * r0 - sz), new Vector3(cx * r1 - sx, y1, cz * r1 - sz), new Vector3(cx * r0 + sx, y0, cz * r0 + sz), new Vector3(cx * r1 + sx, y1, cz * r1 + sz));
    }
    // A stretcher from the pole up to the middle of the rib.
    const tm = 0.55;
    const ym = parasolY(tm) - 0.015;
    const yp = parasolY(0) - 0.55;
    quad(new Vector3(-sx, yp, -sz), new Vector3(cx * 0.5 * tm - sx, ym, cz * 0.5 * tm - sz), new Vector3(sx, yp, sz), new Vector3(cx * 0.5 * tm + sx, ym, cz * 0.5 * tm + sz));
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return g;
}

/**
 * Add the back of a thin, one-layer surface (petals, leaves): the same
 * triangles with reversed winding but the SAME normals, so the underside of
 * a petal reads as lit cloth-thin colour instead of a black back face.
 */
function withUnderside(g: BufferGeometry): BufferGeometry {
  const flat = g.index ? g.toNonIndexed() : g;
  const p = flat.getAttribute("position").array as ArrayLike<number>;
  const n = flat.getAttribute("normal").array as ArrayLike<number>;
  const pos: number[] = Array.from(p);
  const nor: number[] = Array.from(n);
  for (let t = 0; t < p.length; t += 9) {
    for (const v of [0, 2, 1]) {
      pos.push(p[t + v * 3], p[t + v * 3 + 1], p[t + v * 3 + 2]);
      nor.push(n[t + v * 3], n[t + v * 3 + 1], n[t + v * 3 + 2]);
    }
  }
  const out = new BufferGeometry();
  out.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  out.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  return out;
}

/**
 * A stepping stone: an irregular, rounded flagstone with a softly domed top
 * and an eased (bevelled) edge, instead of a sharp 8-sided disc. Real
 * proportions (≈0.5 radius, ≈0.1 thick before scaling), so it is scaled
 * almost uniformly and its lighting stays right. Two shapes (`seed`) so a
 * path is not one stone repeated.
 */
function flagstone(seed: number): BufferGeometry {
  const N = 16;
  const rings: [number, number][] = [[0.7, 0.066], [0.95, 0.042], [1.0, 0.012], [1.0, -0.04]];
  const edge = (a: number) => 0.5 * (0.9 + 0.055 * Math.sin(3 * a + seed) + 0.035 * Math.sin(5 * a + seed * 2.1) + 0.02 * Math.sin(8 * a + seed * 0.6));
  const pos: number[] = [0, 0.074, 0];
  rings.forEach(([f, y], r) => {
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const R = edge(a) * f;
      // A slight wobble in the top, so light catches it unevenly.
      const dy = r < 2 ? 0.005 * Math.sin(2 * a + seed * 3) : 0;
      pos.push(Math.cos(a) * R, y + dy, Math.sin(a) * R);
    }
  });
  const idx: number[] = [];
  const at = (r: number, i: number) => 1 + r * N + (i % N);
  for (let i = 0; i < N; i++) idx.push(0, at(0, i + 1), at(0, i));
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < N; i++) {
      const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i), d = at(r + 1, i + 1);
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * A dressed paving slab (박석 walk): a 1×1 footprint, top at y 0.06 with a
 * crisp 2 cm chamfer, sides down to y −0.03 (bedded in the joint fill).
 * Flat-shaded, so each chamfer catches its own light — the slab reads cut,
 * not cast. MAT.flagstone darkens it below y 0.06 (its rim band).
 */
function pavingSlab(): BufferGeometry {
  const rings: [number, number][] = [[0.47, 0.06], [0.5, 0.038], [0.5, -0.03]];
  const pos: number[] = [];
  const corner = (h: number, i: number): [number, number] => {
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]][i % 4];
    return [c[0] * h, c[1] * h];
  };
  const pt = (r: number, i: number) => {
    const [h, y] = rings[r];
    const [x, z] = corner(h, i);
    return [x, y, z];
  };
  // Top: two triangles, facing +y.
  const t = [0, 1, 2, 3].map((i) => pt(0, i));
  pos.push(...t[0], ...t[2], ...t[1], ...t[0], ...t[3], ...t[2]);
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < 4; i++) {
      const a = pt(r, i), b = pt(r, i + 1), c = pt(r + 1, i), d = pt(r + 1, i + 1);
      pos.push(...a, ...b, ...c, ...b, ...d, ...c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.computeVertexNormals();
  return g;
}

/**
 * A garden boulder: a squat, irregular stone sitting in the ground — broad
 * low lobes, a few flatter faces, a flat bed underneath — instead of a
 * smooth pale ball (which read as dough). Base at y 0, top at y 1, x/z in
 * −0.5…0.5, so MAT.boulder's weathered band lands on the foot.
 */
function boulder(seed: number): BufferGeometry {
  const raw = new IcosahedronGeometry(0.5, 2);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw, 1e-4);
  const pos = g.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const low = Math.sin(v.x * 2.1 + seed) * Math.sin(v.z * 2.4 - seed * 0.7) + 0.5 * Math.sin(v.y * 2.7 + seed * 1.9);
    const mid = Math.sin(v.x * 5.3 + v.y * 2.2 + seed * 3.1) * Math.sin(v.z * 4.7 - v.x * 1.3);
    // Planed faces: pull the bulge back where a cleavage plane cuts it.
    const cut = Math.max(0, v.dot(new Vector3(Math.cos(seed), 0.35, Math.sin(seed)).normalize()) - 0.72) * 0.6;
    const r = 0.5 * (1 + 0.16 * low + 0.06 * mid) - cut * 0.5;
    v.multiplyScalar(r);
    if (v.y < -0.12) v.y = -0.12 + (v.y + 0.12) * 0.12;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeBoundingBox();
  const b = g.boundingBox!;
  const sx = 1 / (b.max.x - b.min.x), sy = 1 / (b.max.y - b.min.y), sz = 1 / (b.max.z - b.min.z);
  const cx = (b.max.x + b.min.x) / 2, cz = (b.max.z + b.min.z) / 2;
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, (pos.getX(i) - cx) * sx, (pos.getY(i) - b.min.y) * sy, (pos.getZ(i) - cz) * sz);
  g.computeVertexNormals();
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/**
 * One garden flower seen from above: five rounded petals with small notches
 * between them, cupped up a little toward the rim (radius 0.5, about 0.2
 * tall). Its yellow middle is a separate small ball (see `flowers`).
 */
function bloomHead(): BufferGeometry {
  const N = 20;
  const rings = [0.35, 1.0];
  const lobe = (a: number) => 0.5 * (0.5 + 0.5 * Math.pow(Math.abs(Math.cos(2.5 * a)), 0.6));
  const pos: number[] = [0, 0.0, 0];
  for (const f of rings) {
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const R = lobe(a) * f;
      pos.push(Math.cos(a) * R, 0.2 * f * f, Math.sin(a) * R);
    }
  }
  const idx: number[] = [];
  const at = (r: number, i: number) => 1 + r * N + (i % N);
  for (let i = 0; i < N; i++) idx.push(0, at(0, i + 1), at(0, i));
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < N; i++) {
      const a = at(r, i), b = at(r, i + 1), c = at(r + 1, i), d = at(r + 1, i + 1);
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return withUnderside(g);
}

/**
 * The leaves of a garden clump: seven pointed leaves fanning out from the
 * middle, each arching up and over with a raised midrib (radius 0.5, about
 * 0.4 tall). Reads as a plant, where the old mound read as a green pillow.
 */
function leafRosette(): BufferGeometry {
  const LEAVES = 7;
  const SEG = 5;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let l = 0; l < LEAVES; l++) {
    const yaw = (l / LEAVES) * Math.PI * 2 + (l % 2) * 0.25;
    const len = 0.5 * (0.82 + 0.18 * ((l * 3) % 5) / 4);
    const lift = 0.4 * (0.75 + 0.25 * ((l * 2) % 3) / 2);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const base = pos.length / 3;
    for (let s = 0; s <= SEG; s++) {
      const t = s / SEG;
      const along = len * t;
      // An arch: up from the middle, over, and down toward the tip.
      const y = lift * Math.sin(Math.PI * Math.min(t * 0.85, 1)) * (1 - 0.35 * t) + 0.02;
      const half = 0.16 * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - 0.1 * t);
      for (const side of [-1, 0, 1]) {
        const w = side * half;
        const yy = y + (side === 0 ? 0.03 * Math.sin(Math.PI * t) : 0);
        pos.push(cy * along - sy * w, yy, sy * along + cy * w);
      }
    }
    for (let s = 0; s < SEG; s++) {
      const r0 = base + s * 3;
      const r1 = r0 + 3;
      // left half (side −1 → 0), right half (0 → +1)
      idx.push(r0, r0 + 1, r1, r0 + 1, r1 + 1, r1);
      idx.push(r0 + 1, r0 + 2, r1 + 1, r0 + 2, r1 + 2, r1 + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Make every leaf face up (some winding comes out downward).
  const n = g.getAttribute("normal");
  for (let i = 0; i < n.count; i++) if (n.getY(i) < 0) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return withUnderside(g);
}

/**
 * A woven basket's body in the cylinder's unit box (y −0.5…0.5, rim radius
 * 0.5): a rounded foot, walls bellying out to the rim, a thin wall and a
 * floor of goods a little below the rim. Drop-in for the old solid "cyl".
 */
function basketBody(): BufferGeometry {
  const pts = [
    [0, -0.5], [0.33, -0.5], [0.4, -0.48], [0.44, -0.42], [0.47, -0.25], [0.49, 0.05],
    [0.5, 0.35], [0.5, 0.5], [0.465, 0.5], [0.46, 0.38], [0.45, 0.33], [0, 0.33],
  ].map(([r, y]) => new Vector2(r, y));
  return new LatheGeometry(pts, 20);
}

/**
 * An onggi jar (옹기) in the cylinder's unit box (y −0.5…0.5, belly radius
 * 0.5): a narrow foot, a full rounded belly high on the body, a short
 * shoulder into a rolled lip, and soil a little below the mouth.
 */
function onggiJar(): BufferGeometry {
  const pts = [
    [0, -0.5], [0.3, -0.5], [0.34, -0.47], [0.42, -0.32], [0.48, -0.12], [0.5, 0.06], [0.48, 0.2],
    [0.42, 0.33], [0.35, 0.41], [0.33, 0.45], [0.355, 0.48], [0.35, 0.5], [0.31, 0.5], [0.3, 0.44], [0, 0.42],
  ].map(([r, y]) => new Vector2(r, y));
  return new LatheGeometry(pts, 24);
}

/**
 * The foot of a tree trunk (뿌리목) in the cylinder's unit box (y −0.5…0.5):
 * the trunk (radius 0.28 at the top, just inside the trunk rod) swells into five root buttresses that
 * reach radius 0.5 where they meet the ground — instead of a flat drum with a
 * hard ring round the trunk. Scale it by ~0.46 of the tree's size so the top
 * sits just inside the trunk rod (radius 0.135·s).
 */
function rootFlare(segs: number): BufferGeometry {
  const rings = 7;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= rings; j++) {
    const h = j / rings;
    // Most of the swelling is low down: the buttresses run out quickly.
    const taper = Math.pow(1 - h, 2.4);
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const lobe = Math.pow(0.5 + 0.5 * Math.cos(5 * a + 0.7 * Math.sin(2 * a + 1)), 1.6);
      const r = 0.28 + 0.22 * taper * (0.3 + 0.7 * lobe) + 0.012 * Math.sin(3 * a + h * 4) * (1 - h);
      pos.push(Math.cos(a) * r, h - 0.5, Math.sin(a) * r);
      uv.push((i / segs) * 2, h * 0.5);
    }
  }
  const row = segs + 1;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segs; i++) {
      const a = j * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // The seam column (first and last vertex of a ring) shares one normal.
  const n = g.getAttribute("normal") as BufferAttribute;
  for (let j = 0; j <= rings; j++) {
    const a = j * row;
    const b = a + segs;
    const x = n.getX(a) + n.getX(b);
    const y = n.getY(a) + n.getY(b);
    const z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}

/**
 * A trunk or branch piece for the trees: a cylinder in the unit box that
 * narrows to 0.8 of its width at the top (+y), so the next piece starts as
 * wide as this one ends (no step or ring where two pieces meet).
 */
function barkRod(): BufferGeometry {
  return new CylinderGeometry(0.4, 0.5, 1, 16);
}

/** The bound cane rim of a basket: a flat ring at y = 0, radius 0.5. */
function basketRim(): BufferGeometry {
  const g = new TorusGeometry(0.5, 0.055, 5, 20);
  g.rotateX(Math.PI / 2);
  return g;
}

/**
 * A love lock (사랑의 자물쇠) on Namsan, in metres, hung from its origin:
 * the body's top edge 3.2 cm below the hanging point, its broad face to ±x.
 * Two bodies — a plain padlock with rounded corners and a heart — and the
 * steel shackle that goes with either (a separate shape so it can be steel
 * while the body is painted). Few triangles: hundreds hang on the fence.
 */
function lockBody(heart: boolean): BufferGeometry {
  const s = new Shape();
  if (heart) {
    // Lobes at the top (y 0 … −0.012), point at the bottom (−0.06).
    const w = 0.031;
    s.moveTo(0, -0.062);
    s.bezierCurveTo(-w * 0.55, -0.045, -w, -0.03, -w, -0.012);
    s.bezierCurveTo(-w, 0.004, -w * 0.45, 0.008, 0, -0.006);
    s.bezierCurveTo(w * 0.45, 0.008, w, 0.004, w, -0.012);
    s.bezierCurveTo(w, -0.03, w * 0.55, -0.045, 0, -0.062);
  } else {
    const w = 0.026;
    const h = 0.056;
    const r = 0.008;
    s.moveTo(-w, 0);
    s.lineTo(w, 0);
    s.lineTo(w, -h + r);
    s.quadraticCurveTo(w, -h, w - r, -h);
    s.lineTo(-w + r, -h);
    s.quadraticCurveTo(-w, -h, -w, -h + r);
    s.lineTo(-w, 0);
  }
  const g = new ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: false, curveSegments: heart ? 3 : 2 });
  // Centred on its thickness, broad face turned to ±x, top 3.2 cm under the hook.
  g.translate(0, -0.032, -0.009);
  g.rotateY(Math.PI / 2);
  return g;
}

function lockShackle(): BufferGeometry {
  // A half ring over the hook (its plane facing ±x, like the body) and two legs into the body.
  const arc = new TorusGeometry(0.016, 0.0035, 3, 5, Math.PI);
  arc.rotateY(Math.PI / 2);
  const legs = [-1, 1].map((sz) => {
    const c = new CylinderGeometry(0.0035, 0.0035, 0.034, 3, 1, true);
    c.translate(0, -0.017, sz * 0.016);
    return c;
  });
  const g = mergeGeometries([arc.toNonIndexed(), ...legs.map((c) => c.toNonIndexed())]);
  return g ?? arc;
}

/**
 * A far hill: a smooth ball whose upper half is lifted into a ridge line
 * with two or three summits and saddles along its length (local x), and
 * gentle spurs down its flanks. Smoothly shaded — the old faceted ball read
 * as low-poly cardboard behind the city and over the rooftops.
 */
function ridgeHill(detail: number): BufferGeometry {
  const raw = new IcosahedronGeometry(0.5, detail);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw, 1e-4);
  const pos = g.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const crest = 0.55 * Math.sin(v.x * 4.6 + 0.9) + 0.25 * Math.sin(v.x * 9.0 + v.z * 2.0 + 2.1) + 0.06 * Math.sin(v.x * 19.0 + v.z * 7.0 + 0.4);
    const spur = 0.06 * Math.sin(Math.atan2(v.z, v.x) * 9.0 + v.y * 4.0);
    const up = Math.max(0, v.y);
    v.y *= 1 + 0.2 * crest * up * up;
    v.multiplyScalar(0.5 * (1 + spur * up));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function phoneTier(): boolean {
  try {
    return pickQuality().maxTexture <= 1024;
  } catch {
    return false;
  }
}

const BASE_GEOMETRY: Record<string, BufferGeometry> = {
  box: UNIT.box,
  hip: UNIT.hipRoof,
  oct: new CylinderGeometry(0.5, 0.5, 1, 8),
  cyl: UNIT.cylinder,
  cone: new ConeGeometry(0.5, 1, 8),
  parasolA: parasolCloth(0),
  parasolB: parasolCloth(1),
  parasolRibs: parasolRibs(),
  awningA: awningCloth(0),
  awningB: awningCloth(1),
  flagA: flagstone(1.3),
  flagB: flagstone(4.1),
  slab: pavingSlab(),
  boulderA: boulder(1.7),
  boulderB: boulder(4.4),
  // A water-lily pad: a disc with its notch cut out (the notch side is 1 cm, left open).
  hedge: hedgeBlock(),
  hedgeB: hedgeBlock(1.7),
  lilyPad: new CylinderGeometry(0.5, 0.5, 1, 22, 1, false, 0.35, Math.PI * 2 - 0.35),
  bloom: bloomHead(),
  leaves: leafRosette(),
  // Foliage pads of a red pine (two shapes, so neighbouring pads differ).
  // (B, for the small side pads, is lighter on desktop.)
  pinePadA: pinePad(phoneTier() ? 2 : 3, 0),
  pinePadB: pinePad(2, 2.3),
  ball: lumpyBall(3, 0.16),
  // Blossom clumps of a cherry crown (two shapes, so neighbours differ);
  // on phones each knot is a quarter of the triangles.
  bloomA: blossomClump(1, 1, phoneTier() ? 6 : 10),
  bloomB: blossomClump(1, 2, phoneTier() ? 6 : 10),
  // Leaf clusters of a broadleaf crown (the Seoul ginkgos).
  leafy: leafyBall(phoneTier() ? 2 : 3),
  // Far crowns (backdrop tree rings, Namsan's hillside): as cheap as ballLow, but ragged like leaves.
  leafyLow: leafyBall(1),
  // Whole far-tree crowns (the tree rings past the rooftops), two shapes.
  // Desktop: rounder knots (the faceted outline showed against the sky).
  crownA: farCrown(1, phoneTier() ? 1 : 2),
  crownB: farCrown(2, phoneTier() ? 1 : 2),
  // One apple, tangerine or potato in a heap: a small smooth ball.
  fruit: lumpyBall(1, 0.05),
  // Far scenery (the tree ring past the rooftops): a quarter of the triangles.
  ballLow: lumpyBall(1, 0.12),
  // The far hills round every room.
  ridge: ridgeHill(phoneTier() ? 2 : 3),
  cylLow: new CylinderGeometry(0.5, 0.5, 1, 6),
  basket: basketBody(),
  basketRim: basketRim(),
  onggi: onggiJar(),
  rootFlare: rootFlare(phoneTier() ? 15 : 25),
  taper: barkRod(),
  // Far trunks and limbs: seven sides, open ends (they run into the crown).
  taperLow: new CylinderGeometry(0.4, 0.5, 1, 7, 1, true),
  lockBox: lockBody(false),
  lockHeart: lockBody(true),
  shackle: lockShackle(),
};

export function kitGeometry(key: GeoKey): BufferGeometry {
  if (key.startsWith("roof:")) return curvedRoof(Number(key.slice(5)));
  return BASE_GEOMETRY[key];
}

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
 * A curved hanok roof covering a footprint of w × d (already including the
 * overhang), sitting at `y`, `h` tall: concave slopes, lifted corners, a
 * real ridge. Long thin roofs (wall caps) use the stretched aspects.
 */
export function curvedRoofOn(k: Kit, x: number, y: number, z: number, w: number, d: number, h: number, cast = true): void {
  const alongX = w >= d;
  const long = alongX ? w : d;
  const short = alongX ? d : w;
  const a = roofAspect(long / short);
  // Geometry is A × 1 along x; turn it for roofs that run along z.
  k.add("roofSoft", `roof:${a}`, [x, y, z], [long / a, h, short], alongX ? undefined : [0, Math.PI / 2, 0], cast);
}

/**
 * Hanok roof over a w × d footprint whose walls end at `baseY`: a bracketed
 * wooden eave (warm soffit, rafter ends), the curved tiled roof, and a ridge
 * with white mortar ends that tips up at both ends.
 */
export function hanokRoof(k: Kit, x: number, z: number, baseY: number, w: number, d: number, h = 1.1): void {
  // Deep eaves (≈1.15 m past the walls): the overhang and its shadow are
  // what give a hanok its depth.
  const W = w + 2.3;
  const D = d + 2.3;
  // Soffit: the underside of the eaves, warm wood seen from the ground.
  k.box("woodLight", [x, baseY + 0.1, z], [w + 1.9, 0.06, d + 1.9]);
  k.box("woodDark", [x, baseY + 0.04, z], [w + 0.3, 0.14, d + 0.3], true);
  // A second eave layer: a light timber fascia just under the tile edge,
  // which keeps overlapping roofs apart even when both sit in shade.
  for (const s of [-1, 1]) {
    k.box("woodLight", [x, baseY + 0.2, z + s * (D / 2 - 0.2)], [W - 0.5, 0.13, 0.09]);
    k.box("woodLight", [x + s * (W / 2 - 0.2), baseY + 0.2, z], [0.09, 0.13, D - 0.5]);
  }
  curvedRoofOn(k, x, baseY + 0.16, z, W, D, h + 0.45);
  const along = w >= d;
  // The ridge line of the curved roof (see shapes.ts): (long − short) wide.
  const len = Math.max(Math.abs(W - D), 0.5) + 0.3;
  const top = baseY + 0.16 + h + 0.45;
  k.box("roofSoft", [x, top + 0.02, z], along ? [len, 0.2, 0.26] : [0.26, 0.2, len], true);
  k.box("plaster", [x, top - 0.06, z], along ? [len + 0.02, 0.05, 0.3] : [0.3, 0.05, len + 0.02]);
  for (const s of [-1, 1]) {
    const o = (len / 2) * s;
    // Upturned ridge ends (yongmaru) with pale mortar.
    k.box("roofSoft", along ? [x + o, top + 0.12, z] : [x, top + 0.12, z + o], [0.24, 0.24, 0.28], false, along ? [0, 0, -s * 0.5] : [s * 0.5, 0, 0]);
    k.box("plaster", along ? [x + o * 0.98, top - 0.02, z] : [x, top - 0.02, z + o * 0.98], [0.2, 0.12, 0.2]);
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
 * A hanok house, built for depth rather than as a box:
 * - a raised stone platform (gidan) with a darker footing course;
 * - the front wall set BACK under the eave, leaving a wooden veranda (maru)
 *   in front of it, with round timber columns on stone plinths at the eave
 *   line — the column rhythm and the shadowed recess are what make a hanok
 *   facade read at a glance;
 * - lattice-paper door panels in every bay, one pair standing open onto a
 *   dark interior; paper lanterns hanging from the front beam;
 * - the curved tiled roof over the whole footprint.
 * The footprint (w × d) is unchanged, so colliders stay what they were.
 */
export function hanokHouse(k: Kit, spec: HouseSpec): void {
  const { x, z, w, d, face } = spec;
  const h = spec.h ?? 2.4;
  const found = 0.5;
  const { n, alongX } = faceFrame(face);
  const half = alongX ? d / 2 : w / 2;
  const span = alongX ? w : d;
  const depthN = half * 2;
  // Veranda depth: generous on real halls, none on shallow gatehouses.
  const R = depthN >= 3.2 ? Math.min(0.95, depthN * 0.24) : 0;
  const at = (along: number, y: number, out: number): V3 =>
    alongX ? [x + along, y, z + n[2] * (half + out)] : [x + n[0] * (half + out), y, z + along];
  const size = (a: number, y: number, t: number): V3 => (alongX ? [a, y, t] : [t, y, a]);

  // Platform: footing course, dressed stone, a thin top slab edge.
  k.box("gravel", [x, 0.08, z], [w + 0.46, 0.16, d + 0.46], true);
  k.box("stoneWarm", [x, found / 2 + 0.06, z], [w + 0.3, found - 0.12, d + 0.3], true);
  k.box("stoneWarm", [x, found - 0.03, z], [w + 0.36, 0.06, d + 0.36]);

  // Walls, the front one pulled back by R.
  // Centre of the body: shifted half the recess away from the face.
  const bx = alongX ? x : x - n[0] * (R / 2);
  const bz = alongX ? z - n[2] * (R / 2) : z;
  k.box("plaster", [bx, found + h / 2, bz], alongX ? [w, h, d - R] : [w - R, h, d], true);
  // Timber frame on the recessed body: corner posts and a top beam.
  const bw = alongX ? w : w - R;
  const bd = alongX ? d - R : d;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box("woodDark", [bx + sx * (bw / 2), found + h / 2, bz + sz * (bd / 2)], [0.2, h, 0.2], true);
  k.box("woodDark", [bx, found + h - 0.09, bz], [bw + 0.06, 0.18, bd + 0.06]);

  const bays = Math.max(2, Math.round(span / 1.7));
  const bayW = span / bays;
  const door = spec.door ?? 0;
  const doorBay = Math.min(bays - 1, Math.max(0, Math.floor((door + span / 2) / bayW)));

  // Recessed front wall: a low timber band, a rail at door-head height, and
  // lattice paper in every bay (the door bay taller, one leaf open).
  const wallOut = -R + 0.02;
  k.box("woodDark", at(0, found + 0.22, wallOut + 0.02), size(span, 0.44, 0.08));
  k.box("woodDark", at(0, found + 2.12, wallOut + 0.03), size(span, 0.1, 0.1));
  for (let b = 0; b < bays; b++) {
    const a = -span / 2 + bayW * (b + 0.5);
    const pw = bayW - 0.34;
    const isDoor = b === doorBay;
    const ph = isDoor ? 1.62 : 1.12;
    const py = isDoor ? found + 0.44 + ph / 2 : found + 0.62 + ph / 2 + 0.2;
    k.box("woodDark", at(a, py, wallOut + 0.04), size(pw + 0.12, ph + 0.12, 0.06));
    if (isDoor) {
      // Two leaves: the left open (dark interior), the right shut paper.
      k.box("charcoal", at(a - pw / 4, py, wallOut + 0.06), size(pw / 2 - 0.02, ph, 0.02));
      k.box("paper", at(a + pw / 4, py, wallOut + 0.07), size(pw / 2 - 0.04, ph, 0.02));
      k.box("paper", at(a - pw / 2 - 0.02, py, wallOut + 0.3), size(0.03, ph, 0.46));
      for (const g of [-0.25, 0.05, 0.35]) k.box("woodDark", at(a + pw / 4, py + g * ph, wallOut + 0.085), size(pw / 2 - 0.04, 0.025, 0.012));
      k.box("woodDark", at(a + pw / 4, py, wallOut + 0.085), size(0.025, ph, 0.012));
    } else {
      k.box("paper", at(a, py, wallOut + 0.07), size(pw, ph, 0.02));
      const cols = Math.max(3, Math.round(pw / 0.2));
      for (let c = 1; c < cols; c++) k.box("woodDark", at(a - pw / 2 + (pw / cols) * c, py, wallOut + 0.085), size(0.022, ph, 0.012));
      for (const g of [-0.3, -0.1, 0.1, 0.3]) k.box("woodDark", at(a, py + g * ph, wallOut + 0.085), size(pw, 0.022, 0.012));
      // Sill
      k.box("woodDark", at(a, py - ph / 2 - 0.08, wallOut + 0.1), size(pw + 0.2, 0.05, 0.16));
    }
  }

  if (R > 0) {
    // Maru: the wooden veranda floor, its edge beam, and floor boards.
    k.box("woodLight", at(0, found + 0.05, -R / 2), size(span, 0.1, R), true);
    k.box("woodDark", at(0, found - 0.02, -0.04), size(span + 0.04, 0.12, 0.08));
    // Columns on stone plinths along the eave line, with a front beam.
    for (let b = 0; b <= bays; b++) {
      const a = -span / 2 + bayW * b;
      const inset = b === 0 ? 0.12 : b === bays ? -0.12 : 0;
      k.add("stoneWarm", "oct", at(a + inset, found + 0.07, -0.14), [0.34, 0.14, 0.34]);
      k.add("woodDark", "cyl", at(a + inset, found + h / 2 + 0.07, -0.14), [0.2, h - 0.1, 0.2], undefined, true);
    }
    k.box("woodDark", at(0, found + h - 0.12, -0.14), size(span + 0.1, 0.22, 0.2), true);
    k.box("woodLight", at(0, found + h - 0.34, -0.12), size(span, 0.07, 0.12));
    // Paper lanterns from the front beam (every other bay).
    for (let b = 0; b < bays; b += 2) {
      const a = -span / 2 + bayW * (b + 0.5);
      k.box("woodDark", at(a, found + h - 0.36, -0.2), size(0.012, 0.3, 0.012));
      k.add("lantern", "cyl", at(a, found + h - 0.72, -0.2), [0.3, 0.42, 0.3]);
      k.add("woodDark", "cyl", at(a, found + h - 0.49, -0.2), [0.2, 0.05, 0.2]);
    }
  }

  // Eave brackets and rafter ends past the columns.
  for (let b = 0; b <= bays; b++) {
    const a = -span / 2 + bayW * b;
    k.box("woodLight", at(a, found + h + 0.06, 0.14), size(0.2, 0.16, 0.36));
  }
  for (let b = 0; b < bays * 3; b++) {
    const a = -span / 2 + (span / (bays * 3)) * (b + 0.5);
    k.box("woodLight", at(a, found + h + 0.14, 0.6), size(0.09, 0.09, 0.2));
  }
  // Stone steps up to the door: two treads.
  const da = -span / 2 + bayW * (doorBay + 0.5);
  k.box("stoneWarm", at(da, 0.13, 0.3), size(1.3, 0.26, 0.46), true);
  k.box("stoneWarm", at(da, 0.32, 0.08), size(1.2, 0.2, 0.3));
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
  // Timber posts and a low rail on the stone course: the wall reads as a
  // framed structure, not a flat slab.
  k.box("woodDark", [cx, 0.64, cz], s(len + 0.02, 0.08, t + 0.05));
  const posts = Math.max(1, Math.round(len / 2.4));
  for (let i = 0; i <= posts; i++) {
    const a = -len / 2 + (len / posts) * i;
    k.box("woodDark", alongX ? [cx + a, h / 2 + 0.3, cz] : [cx, h / 2 + 0.3, cz + a], s(0.16, h - 0.6, t + 0.06));
  }
  const cap = s(len + 0.5, 0, t + 0.8);
  curvedRoofOn(k, cx, h - 0.04, cz, cap[0], cap[2], 0.5);
}

/** A stone lantern (seokdeung): octagonal foot, shaft, paper light, small roof. */
export function stoneLantern(k: Kit, x: number, z: number, s = 1): void {
  k.add("stoneWarm", "oct", [x, 0.12 * s, z], [0.55 * s, 0.24 * s, 0.55 * s], undefined, true);
  k.add("stoneWarm", "oct", [x, 0.55 * s, z], [0.22 * s, 0.7 * s, 0.22 * s], undefined, true);
  k.box("lantern", [x, 1.05 * s, z], [0.36 * s, 0.34 * s, 0.36 * s]);
  curvedRoofOn(k, x, 1.22 * s, z, 0.56 * s, 0.56 * s, 0.22 * s);
  k.add("stoneWarm", "ball", [x, 1.47 * s, z], [0.09 * s, 0.11 * s, 0.09 * s]);
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
  // A Korean red pine (소나무), as in a hanok courtyard: a trunk that leans
  // and kinks as it climbs (grey plated bark below, orange-red above),
  // boughs held out nearly level, each ending in a flat cloud-like pad of
  // needles, and a crown of pads on top — not a stack of green cones.
  const seed = x * 3.1 + z * 1.7;
  // Lean toward the open (a pine reaching for light away from the hall
  // behind it), more or less by the seed.
  const lean = Math.atan2(-z, -x) + jitter(seed, 0.5);
  const tilt = 0.13 + Math.abs(jitter(seed * 2, 0.05));
  const rod = (ax: number, ay: number, az: number, a: number, t: number, len: number, w: number, cast: boolean): V3 => {
    const dx = Math.sin(t) * Math.cos(a);
    const dy = Math.cos(t);
    const dz = Math.sin(t) * Math.sin(a);
    k.add("barkPine", "taper", [ax + (dx * len) / 2, ay + (dy * len) / 2, az + (dz * len) / 2], [w, len, w], [0, -a, -t], cast);
    return [ax + dx * len, ay + dy * len, az + dz * len];
  };
  const knuckle = (p: V3, w: number) => k.add("barkPine", "fruit", p, [w, w, w]);
  k.add("barkPine", "rootFlare", [x, 0.18 * s, z], [0.4 * s, 0.38 * s, 0.4 * s], [0, seed, 0], true);
  // Trunk in three pieces, each kinked a little off the last.
  const p1 = rod(x, 0, z, lean, tilt, 1.45 * s, 0.25 * s, true);
  const p2 = rod(p1[0], p1[1], p1[2], lean + 0.6, tilt * 0.35, 1.05 * s, 0.2 * s, true);
  const p3 = rod(p2[0], p2[1], p2[2], lean - 0.5, tilt * 1.5, 0.85 * s, 0.16 * s, true);
  knuckle(p1, 0.2 * s);
  knuckle(p2, 0.16 * s);
  let c = 0;
  const pad = (p: V3, r: number, h: number, geo: GeoKey) => {
    const j = 1 + jitter(seed * 5 + c * 7, 0.1);
    c++;
    k.add("pine", geo, p, [r * s * j, h * s, r * s * j * 0.9], [0, jitter(seed * 3 + c, 3), jitter(seed + c, 0.08)], true);
  };
  // A cloud of needles: a main pad with two smaller ones tucked either side
  // of it and a little lower, so the layer has a soft, lumpy edge.
  const cloud = (p: V3, r: number, h: number, dir: number) => {
    pad(p, r, h, "pinePadA");
    for (const sd of [-1, 1]) {
      const a = dir + sd * (1.35 + jitter(seed + c, 0.25));
      pad([p[0] + Math.cos(a) * 0.4 * r * s, p[1] - 0.05 * s, p[2] + Math.sin(a) * 0.4 * r * s], r * 0.62, h * 0.8, "pinePadB");
    }
  };
  // Boughs: from the upper trunk, held out nearly level, shorter higher up
  // and shorter on the side away from the lean (the hall wall behind).
  const from: [V3, V3, number][] = [
    [p1, p2, 0.5],
    [p1, p2, 0.95],
    [p2, p3, 0.3],
    [p2, p3, 0.75],
  ];
  from.forEach(([a, b, f], i) => {
    const o: V3 = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    const h = lean + Math.PI * 0.55 + i * 2.4 + jitter(seed + i * 11, 0.3);
    const toward = 0.72 + 0.28 * Math.cos(h - lean);
    const len = (0.95 - 0.12 * i) * s * toward;
    const t = 1.28 - 0.05 * i;
    const mid = rod(o[0], o[1], o[2], h, t, len * 0.6, 0.075 * s, i < 2);
    const tip = rod(mid[0], mid[1], mid[2], h + jitter(seed + i, 0.3), t - 0.25, len * 0.45, 0.05 * s, false);
    // A cloud on the bough's end, a single pad by its bend.
    cloud([tip[0], tip[1] + 0.06 * s, tip[2]], 0.88 - 0.08 * i, 0.34, h);
    const side = h + (i % 2 ? 1.2 : -1.2);
    pad([mid[0] + Math.cos(side) * 0.18 * s, mid[1] + 0.1 * s, mid[2] + Math.sin(side) * 0.18 * s], 0.55 - 0.04 * i, 0.26, "pinePadB");
  });
  // The crown: a broad cloud over the top, a smaller pad above it.
  cloud([p3[0], p3[1] + 0.02 * s, p3[2]], 1.0, 0.4, lean);
  pad([p3[0] + Math.cos(lean) * 0.12 * s, p3[1] + 0.26 * s, p3[2] + Math.sin(lean) * 0.12 * s], 0.66, 0.32, "pinePadA");
}

/** A glazed onggi jar with a small leafy shrub. */
export function pot(k: Kit, x: number, z: number, s = 1, shrub = true): void {
  k.add("onggi", "onggi", [x, 0.26 * s, z], [0.56 * s, 0.52 * s, 0.56 * s], undefined, true);
  if (shrub) {
    // Three sprigs round the mouth, one a little taller.
    for (let i = 0; i < 3; i++) {
      const a = x * 2 + z + (i / 3) * Math.PI * 2;
      const r = (i === 0 ? 0.4 : 0.33) * s;
      k.add(i === 1 ? "leafDark" : "pine", "leafy", [x + Math.cos(a) * 0.1 * s, (i === 0 ? 0.74 : 0.64) * s, z + Math.sin(a) * 0.1 * s], [r, r * 0.85, r], [0, a, 0]);
    }
  }
}

/** Flat slate stepping stones from one point to another: a path the eye follows. */
export function steppingStones(k: Kit, x1: number, z1: number, x2: number, z2: number, gap = 0.95, seed = 1, mat: MatKey = "charcoal"): void {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.max(1, Math.floor(len / gap));
  // One whole stone each: the paving photo on "stoneWarm" printed a grid of
  // little blocks onto every stepping stone.
  const m: MatKey = mat === "stoneWarm" ? "flagstone" : mat;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x1 + (x2 - x1) * t + jitter(seed + i, 0.12);
    const pz = z1 + (z2 - z1) * t + jitter(seed + i * 7, 0.12);
    const sz = 0.72 + jitter(seed + i * 3, 0.08);
    // A rounded flagstone (two shapes, alternating), scaled almost evenly so
    // its bevel keeps its light; it stands about 5 cm proud of the ground.
    k.add(m, (seed + i) % 2 ? "flagA" : "flagB", [px, 0.0, pz], [sz, 0.7, sz * 0.9], [0, jitter(seed + i * 11, Math.PI), 0]);
  }
}

/**
 * A laid stone walk across a paved square (the Hub): dressed granite slabs
 * in running courses between two kerb stones, bedded in dark grey joint fill —
 * not stepping stones on a sand strip, which on paving read as scattered
 * pale discs. Each slab is its own instance, so MAT.flagstone tones each
 * one differently. `skip(x, z)` drops a slab (where another walk already
 * lies, so converging walks don't overlap).
 */
export function slabWalk(k: Kit, x1: number, z1: number, x2: number, z2: number, w = 1.2, seed = 1, skip?: (x: number, z: number) => boolean): void {
  const len = Math.hypot(x2 - x1, z2 - z1);
  if (len < 0.3) return;
  const ux = (x2 - x1) / len, uz = (z2 - z1) / len;
  const px = uz, pz = -ux;
  const yaw = Math.atan2(x2 - x1, z2 - z1);
  // Slabs are set nearly flush with the paving (top 2.5 cm proud), so the
  // walk reads laid into the square, not tiles lying on it.
  const KERB = 0.1, GAP = 0.024, SINK = -0.035;
  const at = (a: number, b: number): [number, number] => [x1 + ux * a + px * b, z1 + uz * a + pz * b];
  const [mx, mz] = at(len / 2, 0);
  k.box("charcoal", [mx, 0.007, mz], [w, 0.014, len], false, [0, yaw, 0]);
  for (const side of [-1, 1]) {
    const [kx, kz] = at(len / 2, side * (w / 2 - KERB / 2));
    k.add("flagstone", "slab", [kx, SINK + 0.006, kz], [KERB - 0.008, 1, len], [0, yaw, 0]);
  }
  const inner = w - 2 * KERB - GAP;
  let a = 0.02, course = 0, lastSplit = 0.5;
  while (a < len - 0.12) {
    const d = Math.min(0.4 + 0.16 * (0.5 + jitter(seed + course * 13, 0.5)), len - a);
    // Running bond: the joint moves well away from the course before.
    let split = 0.5 + jitter(seed + course * 7, 0.22);
    if (Math.abs(split - lastSplit) < 0.16) split = split > 0.5 ? split - 0.3 : split + 0.3;
    lastSplit = split;
    const pieces = inner < 0.8 ? [[0, 1]] : [[0, split], [split, 1]];
    for (const [f0, f1] of pieces) {
      const pw = (f1 - f0) * inner - GAP;
      const off = -inner / 2 + ((f0 + f1) / 2) * inner;
      const [sx, sz] = at(a + d / 2, off);
      if (skip?.(sx, sz)) continue;
      const lift = jitter(seed + course * 5 + f0 * 31, 0.004);
      k.add("flagstone", "slab", [sx, SINK + lift, sz], [pw, 1, d - GAP], [0, yaw, 0]);
    }
    a += d;
    course++;
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
  k.box("roofSoft", at(0, 2.55, 0.45), size(span + 0.6, 0.12, 0.95), true, alongX ? [n[2] * 0.25, 0, 0] : [0, 0, -n[0] * 0.25]);
  k.box("woodDark", at(0, 2.42, 0.05), size(span + 0.2, 0.14, 0.12));
  // Upper floor: a row of paper windows.
  const count = Math.max(2, Math.round(span / 1.3));
  for (let i = 0; i < count; i++) {
    const a = -span / 2 + (span / count) * (i + 0.5);
    k.box("woodDark", at(a, 0.4 + h - 1.0, 0.03), size(0.9, 0.75, 0.06));
    k.box("paper", at(a, 0.4 + h - 1.0, 0.065), size(0.78, 0.63, 0.02));
  }
  // A lower, flatter roof than the village houses.
  k.box("woodLight", [x, 0.4 + h + 0.06, z], [w + 0.8, 0.05, d + 0.8]);
  k.box("woodDark", [x, 0.4 + h, z], [w + 0.2, 0.12, d + 0.2], true);
  curvedRoofOn(k, x, 0.4 + h + 0.1, z, w + 1.2, d + 1.2, 0.85);
}

/** A woven basket with a few round goods heaped in it. */
export function basket(k: Kit, x: number, z: number, s = 1, heap: MatKey = "woodLight", y = 0): void {
  k.add("wicker", "basket", [x, y + 0.14 * s, z], [0.55 * s, 0.28 * s, 0.55 * s], [0, x * 1.7 + z, 0]);
  k.add("woodDark", "basketRim", [x, y + 0.28 * s, z], [0.55 * s, 0.5 * s, 0.55 * s]);
  // A heap of single goods (apples, tangerines, potatoes…): a ring of six
  // with three on top, so each reads as a thing to buy, not a coloured lid.
  const seed = x * 7.1 + z * 3.3;
  const f = 0.17 * s;
  for (let i = 0; i < 9; i++) {
    const top = i >= 6;
    const a = (top ? (i - 6) / 3 : i / 6) * Math.PI * 2 + seed + (top ? 0.5 : 0);
    const r = (top ? 0.065 : 0.155) * s;
    const fj = f * (1 + jitter(seed + i * 3, 0.1));
    k.add(heap, "fruit", [x + Math.cos(a) * r, y + (top ? 0.4 : 0.33) * s, z + Math.sin(a) * r], [fj, fj * 0.88, fj], [jitter(seed + i, 0.5), jitter(seed * 2 + i, 3), 0]);
  }
}

/**
 * A village notice board (게시판): two posts, a board with pinned papers,
 * a little tiled roof. `face` is the side people read from.
 */
export function noticeBoard(k: Kit, x: number, z: number, face: Face): void {
  const { n, alongX } = faceFrame(face);
  const s = (a: number, y: number, t: number): V3 => (alongX ? [a, y, t] : [t, y, a]);
  const at = (a: number, y: number, o: number): V3 => (alongX ? [x + a, y, z + n[2] * o] : [x + n[0] * o, y, z + a]);
  for (const a of [-0.8, 0.8]) k.box("woodDark", at(a, 1.0, 0), s(0.1, 2.0, 0.1), true);
  k.box("woodLight", at(0, 1.35, 0.02), s(1.7, 0.95, 0.06), true);
  const sheets: [number, number, number, number][] = [[-0.5, 1.5, 0.34, 0.42], [0.05, 1.45, 0.4, 0.5], [0.55, 1.55, 0.3, 0.36], [-0.3, 1.08, 0.46, 0.3], [0.45, 1.1, 0.34, 0.3]];
  for (const [a, y, w, h] of sheets) k.box("paper", at(a, y, 0.06), s(w, h, 0.01));
  const r = s(2.2, 0, 0.7);
  curvedRoofOn(k, at(0, 0, 0)[0], 1.9, at(0, 0, 0)[2], r[0], r[2], 0.32);
}

/** A two-wheeled wooden hand cart (sonsure) loaded with crates. */
export function cart(k: Kit, x: number, z: number, w: number, d: number): void {
  k.box("woodLight", [x, 0.62, z], [w, 0.08, d], true);
  k.box("woodDark", [x, 0.75, z - d / 2 + 0.04], [w, 0.22, 0.06]);
  k.box("woodDark", [x, 0.75, z + d / 2 - 0.04], [w, 0.22, 0.06]);
  for (const sx of [-1, 1]) {
    k.add("woodDark", "cyl", [x + sx * (w / 2 + 0.05), 0.36, z], [0.72, 0.08, 0.72], [0, 0, Math.PI / 2], true);
    k.box("woodDark", [x + sx * 0.3, 0.55, z - d / 2 - 0.5], [0.06, 0.06, 1.0]);
  }
  k.box("woodLight", [x - 0.2, 0.86, z - 0.4], [0.5, 0.4, 0.5], true);
  k.box("woodLight", [x + 0.22, 0.83, z + 0.35], [0.5, 0.34, 0.6], true);
  k.add("pine", "ball", [x + 0.22, 1.05, z + 0.35], [0.4, 0.18, 0.5]);
}

/** A low wooden planter with a few rounded shrubs. */
export function planter(k: Kit, x: number, z: number, len: number, alongX = true): void {
  k.box("woodDark", [x, 0.2, z], alongX ? [len, 0.4, 0.5] : [0.5, 0.4, len], true);
  const n = Math.max(2, Math.round(len / 0.55));
  for (let i = 0; i < n; i++) {
    const t = -len / 2 + (len / n) * (i + 0.5);
    const sc = 0.45 + jitter(i + x * 3 + z, 0.1);
    k.add("pine", "leafy", alongX ? [x + t, 0.48, z] : [x, 0.48, z + t], [sc, sc * 0.8, sc], [0, jitter(i * 5 + x, 3), 0]);
  }
}


/* ───────────────────────── Landscaping ───────────────────────── */

/**
 * A rounded broadleaf tree: a slightly leaning trunk under a cluster of
 * faceted crowns in two greens. `blossom` makes it the room's one flowering
 * hero tree (use sparingly — one per room at most).
 */
export function tree(k: Kit, x: number, z: number, s = 1, blossom = false, seed = 1, far = false): void {
  if (blossom && !far) {
    cherryTree(k, x, z, s, seed);
    return;
  }
  if (!far) {
    broadleafTree(k, x, z, s, seed);
    return;
  }
  const lean = jitter(seed, 0.08);
  // Far trees (beyond the walls): low-poly, and no shadow (they fall
  // outside the sun's shadow box anyway, so casting would only cost).
  // A tapering trunk that runs on up into the crown and forks there into
  // three limbs — a tree, not a ball on a stick.
  const bark: MatKey = blossom ? "barkCherry" : "bark";
  const trunkH = 2.3 * s;
  k.add(bark, "taperLow", [x, trunkH / 2, z], [0.3 * s, trunkH, 0.3 * s], [lean, 0, -lean], false);
  const fork = 1.7 * s;
  const len = 0.95 * s;
  for (let i = 0; i < 3; i++) {
    const a = jitter(seed * 17, Math.PI) + (i * Math.PI * 2) / 3 + jitter(seed * 19 + i, 0.4);
    const t = 0.6 + jitter(seed * 23 + i, 0.12);
    const dx = Math.sin(t) * Math.cos(a);
    const dy = Math.cos(t);
    const dz = Math.sin(t) * Math.sin(a);
    k.add(bark, "taperLow", [x + (dx * len) / 2, fork + (dy * len) / 2, z + (dz * len) / 2], [0.13 * s, len, 0.13 * s], [0, -a, -t], false);
  }
  // One whole crown (two shapes, two greens, by the seed).
  const j = 1 + jitter(seed * 3, 0.12);
  const geo: GeoKey = seed % 2 ? "crownA" : "crownB";
  const yaw = jitter(seed * 7, Math.PI);
  k.add(blossom ? "blossom" : seed % 3 ? "farLeaf" : "farLeafDark", geo, [x, 2.8 * s, z], [2.45 * s * j, 2.25 * s * j, 2.45 * s * j], [0, yaw, 0], false);
}

/**
 * A village shade tree (느티나무-like broadleaf): a trunk that forks into
 * four rising limbs, each with an outward side branch, carrying leafy
 * clusters round their ends, plus a domed top and a darker inner layer so
 * the crown doesn't look hollow from below. Branches show between the
 * clusters — a tree, not a stack of green balls.
 */
function broadleafTree(k: Kit, x: number, z: number, s: number, seed: number): void {
  const lean = jitter(seed, 0.07);
  // Rod from a in direction (tilt t from vertical, heading a), length len.
  const rod = (ax: number, ay: number, az: number, a: number, t: number, len: number, w: number, cast: boolean): V3 => {
    const dx = Math.sin(t) * Math.cos(a);
    const dy = Math.cos(t);
    const dz = Math.sin(t) * Math.sin(a);
    k.add("bark", "taper", [ax + (dx * len) / 2, ay + (dy * len) / 2, az + (dz * len) / 2], [w, len, w], [0, -a, -t], cast);
    return [ax + dx * len, ay + dy * len, az + dz * len];
  };
  let c = 0;
  const cluster = (p: V3, r: number, dark: boolean) => {
    const jr = r * s * (1 + jitter(seed * 5 + c * 7, 0.12));
    c++;
    k.add(dark ? "leafDark" : "leaf", "leafy", p, [jr, jr * 0.8, jr], [jitter(seed + c, 0.4), jitter(seed * 3 + c, 3), 0], true);
  };
  // Root flare (buttresses running into the ground) and trunk.
  k.add("bark", "rootFlare", [x, 0.2 * s, z], [0.45 * s, 0.44 * s, 0.45 * s], [0, seed, 0], true);
  const [fx, fork, fz] = rod(x, 0, z, seed * 1.3, Math.abs(lean), 1.55 * s, 0.27 * s, true);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const a = seed * 2.1 + (i / n) * Math.PI * 2 + jitter(seed + i * 13, 0.4);
    const t = 0.55 + jitter(seed * 2 + i, 0.12);
    const len = (1.45 + jitter(seed * 3 + i, 0.2)) * s;
    // Side branch from two-thirds up the limb, flatter and outward.
    const mid = rod(fx, fork, fz, a, t, len * 0.62, 0.15 * s, true);
    const tip = rod(mid[0], mid[1], mid[2], a, t - 0.12, len * 0.42, 0.1 * s, i < 2);
    const sa = a + (i % 2 ? 0.7 : -0.7);
    const side = rod(mid[0], mid[1], mid[2], sa, t + 0.5, 0.75 * s, 0.065 * s, false);
    // Clusters: over the tip, either side of it (a little lower), and at the side branch's end.
    const ox = Math.cos(a);
    const oz = Math.sin(a);
    cluster([tip[0], tip[1] + 0.22 * s, tip[2]], 1.08, (i + seed) % 2 === 0);
    cluster([tip[0] - oz * 0.55 * s + ox * 0.15 * s, tip[1] - 0.12 * s, tip[2] + ox * 0.55 * s + oz * 0.15 * s], 0.86, true);
    cluster([tip[0] + oz * 0.5 * s + ox * 0.2 * s, tip[1] + 0.02 * s, tip[2] - ox * 0.5 * s + oz * 0.2 * s], 0.82, false);
    cluster([side[0] + Math.cos(sa) * 0.15 * s, side[1] + 0.08 * s, side[2] + Math.sin(sa) * 0.15 * s], 0.8, i % 2 === 1);
  }
  // The domed top over the fork, and a darker inner layer just above it.
  for (let j = 0; j < 3; j++) {
    const a = seed + j * 2.1;
    cluster([fx + Math.cos(a) * 0.42 * s, fork + 1.75 * s + j * 0.1 * s, fz + Math.sin(a) * 0.42 * s], 1.0, false);
  }
  for (let j = 0; j < 2; j++) {
    const a = seed + 0.9 + j * Math.PI;
    cluster([fx + Math.cos(a) * 0.35 * s, fork + 0.85 * s, fz + Math.sin(a) * 0.35 * s], 0.95, true);
  }
}

/**
 * A flowering cherry (벚나무): a short trunk that splits into spreading limbs,
 * each carrying a few clusters of pink and near-white flowers. The crown is
 * wide and open, so branches and sky show between the clusters — read from
 * the start view as a tree in bloom, not one pink ball.
 */
function cherryTree(k: Kit, x: number, z: number, s: number, seed: number): void {
  const lean = jitter(seed, 0.08);
  // Rod from a in direction (tilt t from vertical, heading a), length len.
  const rod = (ax: number, ay: number, az: number, a: number, t: number, len: number, w: number, cast: boolean): V3 => {
    const dx = Math.sin(t) * Math.cos(a);
    const dy = Math.cos(t);
    const dz = Math.sin(t) * Math.sin(a);
    k.add("barkCherry", "taper", [ax + (dx * len) / 2, ay + (dy * len) / 2, az + (dz * len) / 2], [w, len, w], [0, -a, -t], cast);
    return [ax + dx * len, ay + dy * len, az + dz * len];
  };
  let c = 0;
  const clump = (p: V3, r: number) => {
    const jr = 1.18 * r * s * (1 + jitter(seed * 7 + c * 5, 0.14));
    const mat: MatKey = (c + seed) % 3 === 0 ? "blossomPale" : "blossom";
    const geo: GeoKey = c % 2 ? "bloomB" : "bloomA";
    c++;
    k.add(mat, geo, p, [jr, jr * 0.78, jr], [jitter(c, 0.4), jitter(c * 3, 3), jitter(c * 5, 0.3)], true);
  };
  // Root flare, then a trunk in two pieces that narrows to the fork.
  k.add("barkCherry", "rootFlare", [x, 0.2 * s, z], [0.45 * s, 0.44 * s, 0.45 * s], [0, seed, 0], true);
  const low = rod(x, 0, z, seed, Math.abs(lean), 0.8 * s, 0.27 * s, true);
  const [fx, fork, fz] = rod(low[0], low[1], low[2], seed + 2.4, Math.abs(lean) * 1.6, 0.62 * s, 0.22 * s, true);
  // Knuckles where one piece of wood meets the next: without them the open
  // ends of the rods showed as cut pipes from a low view.
  const knuckle = (p: V3, w: number) => k.add("barkCherry", "fruit", p, [w, w, w]);
  // As wide as the wood they join (each rod ends at 0.8 of its width).
  knuckle(low, 0.22 * s);
  knuckle([fx, fork, fz], 0.2 * s);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = seed * 1.7 + (i / n) * Math.PI * 2 + jitter(seed + i * 11, 0.35);
    const t = 0.78 + jitter(seed * 2 + i, 0.16);
    const len = (1.55 + jitter(seed * 3 + i, 0.25)) * s;
    // Each limb bends upward a little toward its tip, thinning as it goes.
    const mid = rod(fx, fork, fz, a, t, len * 0.55, 0.13 * s, i < 3);
    const tip = rod(mid[0], mid[1], mid[2], a + jitter(seed + i, 0.2), t - 0.22, len * 0.5, 0.08 * s, false);
    knuckle(mid, 0.105 * s);
    knuckle(tip, 0.065 * s);
    // Two thin twigs: one out and down from the bend, one on from the tip.
    const sa = a + (i % 2 ? 0.75 : -0.75);
    const side = rod(mid[0], mid[1], mid[2], sa, t + 0.45, 0.62 * s, 0.05 * s, false);
    const end = rod(tip[0], tip[1], tip[2], a - 0.25, t + 0.25, 0.5 * s, 0.04 * s, false);
    const ox = Math.cos(a);
    const oz = Math.sin(a);
    // Blossom bunched along the outer half of each limb: at the tip (the
    // biggest), at the twig ends, either side of the tip, one on the bend.
    clump([tip[0], tip[1] + 0.16 * s, tip[2]], 0.82);
    clump([end[0], end[1] + 0.02 * s, end[2]], 0.64);
    clump([side[0], side[1] + 0.04 * s, side[2]], 0.6);
    clump([tip[0] - oz * 0.48 * s, tip[1] - 0.08 * s, tip[2] + ox * 0.48 * s], 0.6);
    clump([tip[0] + oz * 0.44 * s + ox * 0.1 * s, tip[1] + 0.05 * s, tip[2] - ox * 0.44 * s + oz * 0.1 * s], 0.56);
    clump([mid[0] + ox * 0.05 * s, mid[1] + 0.22 * s, mid[2] + oz * 0.05 * s], 0.5);
  }
  // The crown's top over the fork: a few clumps, loosely spaced so sky shows.
  for (let j = 0; j < 4; j++) {
    const a = seed + j * 1.6;
    const r = (0.66 + jitter(seed + j * 13, 0.08)) * s;
    clump([fx + Math.cos(a) * 0.55 * s, fork + 1.45 * s + (j % 2) * 0.22 * s, fz + Math.sin(a) * 0.55 * s], r / s);
  }
}

/** A low flowering or green shrub: two or three soft mounds. */
export function shrub(k: Kit, x: number, z: number, s = 1, seed = 1, mat: MatKey = "leaf"): void {
  const n = 2 + (Math.abs(Math.round(jitter(seed, 1.4))) % 2);
  for (let i = 0; i < n; i++) {
    const r = (0.55 + jitter(seed + i, 0.12)) * s;
    k.add(i === 0 ? mat : "leafDark", "leafy", [x + jitter(seed * 5 + i, 0.35) * s, r * 0.36, z + jitter(seed * 7 + i, 0.35) * s], [r, r * 0.72, r], [0, jitter(seed * 11 + i, 3), 0], true);
  }
}

/**
 * A flowering azalea (철쭉) cushion: a dark, dense leafy mound with pink
 * five-petalled flowers over its top and sides, tilted to face out — the
 * way Korean gardens clip them. `y` is the ground it stands on.
 */
export function azalea(k: Kit, x: number, z: number, s = 1, seed = 1, y = 0): void {
  const R = 0.5 * s;
  // (leafy is a unit-box ball: radius = half its scale.)
  k.add("leafDark", "leafy", [x, y + R * 0.45, z], [R * 1.7, R * 1.2, R * 1.6], [0, seed, 0], true);
  for (let j = 0; j < 3; j++) {
    const a = seed + j * 2.1;
    k.add(j === 1 ? "leaf" : "leafDark", "leafy", [x + Math.cos(a) * R * 0.42, y + R * 0.6, z + Math.sin(a) * R * 0.4], [R * 0.95, R * 0.75, R * 0.9], [0, a, 0], true);
  }
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + seed;
    const u = (i + 0.5) / n;
    // Spread over the dome: from the crown down to a little below the waist.
    const el = 1.4 - u * 1.3;
    const cx = Math.cos(a) * Math.cos(el);
    const cz = Math.sin(a) * Math.cos(el);
    const cy = Math.sin(el);
    const px = x + cx * R * 0.9;
    const py = y + R * 0.47 + cy * R * 0.66;
    const pz = z + cz * R * 0.86;
    const size = (0.14 + jitter(seed + i * 3, 0.025)) * s;
    const col: MatKey = i % 5 === 4 ? "flowerWhite" : "flowerPink";
    const tilt = Math.PI / 2 - el;
    k.add(col, "bloom", [px, py, pz], [size, size, size], [Math.sin(a) * tilt * 0.8, jitter(seed + i, 3), -Math.cos(a) * tilt * 0.8]);
  }
}

/** A tuft of grass: a few thin blades (cones) leaning outward. */
export function grass(k: Kit, x: number, z: number, s = 1, seed = 1): void {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + seed;
    k.add(i % 2 ? "leaf" : "leafDark", "cone", [x + Math.cos(a) * 0.08 * s, 0.18 * s, z + Math.sin(a) * 0.08 * s], [0.07 * s, 0.38 * s * (1 + jitter(seed + i, 0.25)), 0.07 * s], [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]);
  }
}

/** A garden rock, half sunk into the ground. */
export function rock(k: Kit, x: number, z: number, s = 1, seed = 1): void {
  // Sunk a little into the ground, tipped a touch, in weathered stone.
  k.add("boulder", seed % 2 ? "boulderA" : "boulderB", [x, -0.04 * s, z], [0.72 * s, 0.3 * s, 0.58 * s], [jitter(seed, 0.12), jitter(seed * 3, 3), jitter(seed * 5, 0.1)], true);
}

/** The same kit, with everything added to it lifted by `dy` (plants set into a raised bed). */
function raised(k: Kit, dy: number): Kit {
  const r = Object.create(k) as Kit;
  r.add = (mat, geo, p, s, rr, cast) => k.add(mat, geo, [p[0], p[1] + dy, p[2]], s, rr, cast);
  return r;
}

/**
 * A planting bed: a low stone kerb round soil and low ground cover, with
 * shrubs, leafy clumps, grass tufts and a rock or two, all set on the bed's
 * surface (they used to sit at paving level and sink into it). Breaks up flat
 * paving along walls and in corners.
 */
/** The surface of a planting bed (see `bed`), where its plants stand. */
export const BED_SOIL = 0.14;

export function bed(k: Kit, x: number, z: number, w: number, d: number, seed = 1, flowers = false): void {
  const TOP = 0.16;
  const KH = 0.19;
  // A kerb of four stone curbs; the fill sits 3 cm under their top, so the stone reads as a rim.
  k.box("stoneWarm", [x, KH / 2, z - d / 2 - 0.04], [w + 0.16, KH, 0.08], false);
  k.box("stoneWarm", [x, KH / 2, z + d / 2 + 0.04], [w + 0.16, KH, 0.08], false);
  k.box("stoneWarm", [x - w / 2 - 0.04, KH / 2, z], [0.08, KH, d], false);
  k.box("stoneWarm", [x + w / 2 + 0.04, KH / 2, z], [0.08, KH, d], false);
  k.box("bedCover", [x, TOP / 2, z], [w + 0.01, TOP, d + 0.01]);
  const b = raised(k, BED_SOIL);
  const along = w >= d;
  const len = along ? w : d;
  const n = Math.max(1, Math.round(len / 1.3));
  for (let i = 0; i < n; i++) {
    const t = -len / 2 + (len / n) * (i + 0.5);
    const px = along ? x + t : x + jitter(seed + i, d * 0.15);
    const pz = along ? z + jitter(seed + i, d * 0.15) : z + t;
    if ((i + seed) % 3 === 2) rock(b, px, pz, 0.7, seed + i);
    else if (flowers && i % 2 === 0) azalea(b, px, pz, 0.62, seed + i * 3);
    else shrub(b, px, pz, 0.62, seed + i * 3, "leaf");
    grass(b, px + (along ? 0.55 : 0.2), pz + (along ? 0.2 : 0.55), 0.9, seed + i * 5);
    // A low fan of leaves between the shrubs, kept inside the kerb.
    const lx = along ? x + t + len / n / 2 : x - jitter(seed + i * 3, w * 0.2);
    const lz = along ? z - jitter(seed + i * 3, d * 0.2) : z + t + len / n / 2;
    if (i < n - 1 || n === 1) {
      const ls = Math.min(0.7, (along ? d : w) * 0.42);
      b.add(i % 2 ? "leaf" : "leafDark", "leaves", [n === 1 ? x + w * 0.25 : lx, 0, n === 1 ? z + d * 0.25 : lz], [ls, ls * 0.7, ls], [0, seed + i * 1.7, 0]);
    }
  }
}

/**
 * A gravel drip-line along the foot of a wall (x1,z1 → x2,z2): the darker
 * band real courtyards have where the eaves drip. Zones the floor cheaply.
 */
export function gutter(k: Kit, x1: number, z1: number, x2: number, z2: number, w = 0.55): void {
  const alongX = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
  const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  k.box("gravel", [(x1 + x2) / 2, 0.008, (z1 + z2) / 2], alongX ? [len, 0.016, w] : [w, 0.016, len]);
}

/** Cloth bunting on a line from (x1, y, z1) to (x2, y, z2), gently sagging. */
export function bunting(k: Kit, x1: number, z1: number, x2: number, z2: number, y: number, seed = 1): void {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.max(3, Math.floor(len / 0.55));
  const yaw = Math.atan2(x2 - x1, z2 - z1);
  const cloths: MatKey[] = ["clothRed", "fabric", "clothBlue", "clothSage"];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const sag = 0.45 * Math.sin(t * Math.PI);
    // A flag: a cone flattened into a triangle, point down.
    k.add(cloths[(i + seed) % cloths.length], "cone", [x1 + (x2 - x1) * t, y - sag - 0.17, z1 + (z2 - z1) * t], [0.34, 0.34, 0.02], [Math.PI, yaw + Math.PI / 2, 0]);
  }
  k.box("charcoal", [(x1 + x2) / 2, y - 0.3, (z1 + z2) / 2], [0.015, 0.015, len], false, [0, yaw, 0]);
}

/**
 * A hanok gatehouse (daemun) standing on a wall line, drawn into the room's
 * kit (so eight gates cost no more draw calls than one): round columns on
 * octagonal stone plinths, a double lintel with bracket blocks, a curved
 * roof with a pale-mortared ridge, two paper lanterns on the room side, and
 * doors — folded back when open, shut (and barred for a world not built yet)
 * otherwise. Local +z faces into the room; rotY is a multiple of π/2.
 * A usable gate carries the room's one thin yellow line on its lintel.
 */
export function gatehouse(k: Kit, x: number, z: number, rotY: number, o: { open: boolean; accent: boolean; barred?: boolean }): void {
  const c = Math.round(Math.cos(rotY));
  const sn = Math.round(Math.sin(rotY));
  const turned = sn !== 0;
  const P = (lx: number, y: number, lz: number): V3 => [x + lx * c + lz * sn, y, z - lx * sn + lz * c];
  const S = (sx: number, sy: number, sz: number): V3 => (turned ? [sz, sy, sx] : [sx, sy, sz]);
  for (const fx of [-1.75, 1.75]) {
    k.add("woodDark", "cyl", P(fx, 1.75, 0), [0.32, 3.5, 0.32], undefined, true);
    k.add("stoneWarm", "oct", P(fx, 0.13, 0), [0.62, 0.26, 0.62], undefined, true);
    // Lanterns hang just outside the posts: they flank the gate, and stay
    // out of the way when the camera stands in the gateway.
    const lx = fx * 1.28;
    k.add("lantern", "cyl", P(lx, 2.55, 0.22), [0.3, 0.4, 0.3]);
    k.add("woodDark", "cyl", P(lx, 2.8, 0.22), [0.2, 0.06, 0.2]);
    k.box("woodDark", P(lx, 3.0, 0.22), [0.015, 0.36, 0.015]);
  }
  k.box("woodDark", P(0, 3.2, 0), S(4.0, 0.24, 0.32), true);
  k.box("woodDark", P(0, 3.62, 0), S(4.5, 0.2, 0.36), true);
  for (const bx of [-1.5, -0.75, 0, 0.75, 1.5]) k.box("woodLight", P(bx, 3.42, 0), S(0.22, 0.2, 0.3));
  if (o.accent) k.box("accent", P(0, 3.2, 0.17), S(3.4, 0.045, 0.02));
  const roof = S(5.4, 0, 2.1);
  k.box("woodLight", P(0, 3.73, 0), S(5.1, 0.1, 1.6), true);
  curvedRoofOn(k, P(0, 0, 0)[0], 3.76, P(0, 0, 0)[2], roof[0], roof[2], 0.62);
  k.box("roofSoft", P(0, 4.45, 0), S(2.1, 0.18, 0.24), true);
  k.box("plaster", P(0, 4.38, 0), S(2.12, 0.05, 0.28));
  // An open gate is simply open (its doors folded away out of sight).
  if (!o.open) {
    k.box("woodDark", P(0, 1.45, -0.05), S(3.3, 2.9, 0.1), true);
    k.box("charcoal", P(0, 1.45, 0.005), S(0.04, 2.9, 0.02));
    for (const dx of [-0.8, 0.8]) for (const dy of [0.7, 1.45, 2.2]) k.box("woodLight", P(dx, dy, 0.01), S(1.35, 0.06, 0.02));
    if (o.barred) k.box("charcoal", P(0, 1.45, 0.04), S(3.6, 0.18, 0.08));
  }
}

/**
 * A clump of garden flowers: a low green mound dotted with blooms (pink,
 * white, lilac). Cheap low-poly shapes with no shadows — colour, not cost.
 */
export function flowers(k: Kit, x: number, z: number, s = 1, seed = 1, y = 0): void {
  // Leaves: two fans of pointed leaves, a dark one and a lighter one turned
  // across it, instead of two green pillows.
  k.add("leafDark", "leaves", [x, y, z], [0.86 * s, 0.55 * s, 0.8 * s], [0, seed, 0]);
  k.add("leaf", "leaves", [x + 0.05 * s, y, z - 0.03 * s], [0.62 * s, 0.62 * s, 0.6 * s], [0, seed + 0.45, 0]);
  // Blooms: five-petalled flowers over the leaves, each with a yellow middle,
  // one colour leading per clump.
  const cols: MatKey[] = ["flowerPink", "flowerWhite", "flowerLilac"];
  const lead = Math.abs(Math.round(seed)) % 3;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 * 1.618 + seed;
    const r = (0.05 + 0.27 * Math.sqrt((i + 0.5) / 9)) * s;
    const col = cols[i % 4 === 3 ? (lead + 1) % 3 : lead];
    const size = (0.15 + 0.04 * ((i * 7) % 3) / 2) * s;
    const bx = x + Math.cos(a) * r;
    const bz = z + Math.sin(a) * r * 0.9;
    const by = y + (0.27 - 0.12 * (r / s / 0.32) + jitter(seed + i, 0.025)) * s;
    // Tilted outward a little, as flowers face the light around a clump.
    const tilt = 0.25 + 0.5 * (r / s / 0.32);
    k.add(col, "bloom", [bx, by, bz], [size, size, size], [Math.sin(a) * tilt * 0.6, jitter(seed + i * 5, 3), -Math.cos(a) * tilt * 0.6]);
    k.add("pollen", "cylLow", [bx, by + 0.02 * s, bz], [0.045 * s, 0.02 * s, 0.045 * s]);
  }
}

/** A wooden planter box full of flowers (street edges, square corners). */
export function flowerBox(k: Kit, x: number, z: number, len: number, alongX = false, seed = 1): void {
  k.box("woodDark", [x, 0.22, z], alongX ? [len, 0.44, 0.55] : [0.55, 0.44, len], true);
  k.box("woodLight", [x, 0.45, z], alongX ? [len + 0.06, 0.04, 0.6] : [0.6, 0.04, len + 0.06]);
  const n = Math.max(1, Math.round(len / 0.6));
  for (let i = 0; i < n; i++) {
    const t = -len / 2 + (len / n) * (i + 0.5);
    flowers(k, alongX ? x + t : x, alongX ? z : z + t, 0.62, seed + i * 3, 0.36);
  }
}

/**
 * A market parasol: striped panels (`cloth` and ivory), ribs underneath and
 * a small cap. `y` is the canopy's middle, `d` its diameter, `h` its height —
 * the same numbers the old cone parasol took.
 */
export function parasol(k: Kit, cloth: MatKey, x: number, y: number, z: number, d: number, h: number): void {
  k.add(cloth, "parasolA", [x, y, z], [d, h, d], undefined, true);
  k.add("fabric", "parasolB", [x, y, z], [d, h, d], undefined, true);
  k.add("woodDark", "parasolRibs", [x, y, z], [d, h, d]);
  k.add("woodDark", "cone", [x, y + h / 2 + 0.05, z], [0.12, 0.16, 0.12]);
}
