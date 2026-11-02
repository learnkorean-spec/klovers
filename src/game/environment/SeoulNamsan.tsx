import { useEffect, useMemo } from "react";
import { BoxGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NAMSAN } from "../config/rooms";
import { FLOOR_GRID } from "../config/world";
import { MAT, std } from "../config/materials";
import Batch from "./Batch";
import { DECK_GLASS, TOWER_RED, TOWER_WHITE, towerGeometry } from "./namsanTower";
import { Kit, azalea, bed, jitter, pine, shrub } from "./kit";
import { pickQuality } from "../systems/quality";
import { Signboard } from "./parts";
import { floorBreakup, FLOOR_BREAKUP_KEY, paintPaving, useTiledTexture, usePhotoFloor } from "./textures";

/**
 * Seoul Journey, part 3 — Namsan Tower (canon worlds "seoul-journey",
 * visualDirection "… and Namsan Tower"; levelJourney.l6).
 *
 * A terrace on the top of Namsan: the tower rising behind its base building
 * (the observation deck high above, the antenna on top), the ticket booth,
 * a fence heavy with padlocks, a lookout rail over the whole city spread
 * out below (environment/Backdrop draws the city for this room), pines, a
 * bench, and the stop for the 02 bus back down.
 *
 * Every stop is in config/interactions ("Seoul Journey part 3").
 */

const HW = NAMSAN.halfWidth;
const HD = NAMSAN.halfDepth;
const TOWER_Z = NAMSAN.base.z - 9;

function terraceKit(): Kit {
  const k = new Kit();
  // The terrace slab and its stone edge, standing over the hillside.
  // Its top sits just under the paving (never level with it: they would fight).
  k.box("stoneWarm", [0, -1.65, 0], [HW * 2 + 0.6, 3.2, HD * 2 + 0.6], true);
  // Lookout rail along the south and west edges: a low stone wall, posts and a rail.
  const rail = (x1: number, z1: number, x2: number, z2: number) => {
    const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
    const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    k.box("stoneWarm", [cx, 0.25, cz], alongX ? [len, 0.5, 0.35] : [0.35, 0.5, len], true);
    k.box("metal", [cx, 1.05, cz], alongX ? [len, 0.05, 0.06] : [0.06, 0.05, len]);
    const n = Math.round(len / 1.2);
    for (let i = 0; i <= n; i++) {
      const t = -len / 2 + (len / n) * i;
      k.box("metal", alongX ? [cx + t, 0.78, cz] : [cx, 0.78, cz + t], [0.05, 0.56, 0.05]);
    }
  };
  rail(-HW, HD + 0.1, HW, HD + 0.1);
  rail(-HW - 0.1, -HD + 1.5, -HW - 0.1, HD);
  // The love-lock fence on the east: posts, a top rail, and five steel
  // cables thick with padlocks (사랑의 자물쇠) — plain and heart-shaped, every
  // one its own colour (MAT.lockPaint), a few hung on another lock, all
  // turned and swinging a little. Fewer on phones.
  const L = NAMSAN.locks;
  const len = L.z1 - L.z0;
  const posts = 8;
  for (let i = 0; i <= posts; i++) k.box("metal", [L.x, 0.72, L.z0 + (len / posts) * i], [0.07, 1.44, 0.07], true);
  k.box("metal", [L.x, 1.45, (L.z0 + L.z1) / 2], [0.09, 0.05, len + 0.07]);
  const cables = [0.36, 0.58, 0.8, 1.02, 1.24];
  for (const y of cables) k.box("steel", [L.x, y, (L.z0 + L.z1) / 2], [0.012, 0.012, len]);
  const phone = pickQuality().maxTexture <= 1024;
  const step = phone ? 0.1 : 0.062;
  let n = 0;
  for (const [ci, y] of cables.entries()) {
    // On phones only the plaza side of the fence carries locks.
    for (const side of phone ? [-1] : [-1, 1]) {
      for (let z = L.z0 + 0.06; z < L.z1 - 0.06; z += step) {
        n++;
        const zz = z + jitter(n * 3 + ci, step * 0.35);
        // Locks bunch up: leave short stretches of bare cable.
        if (jitter(Math.floor(zz * 2.3) + ci * 31 + side * 7, 1) > 0.55) continue;
        // Never on a post.
        if (Math.abs(((zz - L.z0) / (len / posts)) % 1 - 0.5) > 0.47) continue;
        const heart = jitter(n * 11, 1) > 0.45;
        const s = 0.85 + Math.abs(jitter(n * 13, 0.35));
        const r: [number, number, number] = [jitter(n * 5, 0.28), (side < 0 ? Math.PI : 0) + jitter(n * 7, 0.7), 0];
        const p: [number, number, number] = [L.x + side * 0.012, y, zz];
        k.add("lockPaint", heart ? "lockHeart" : "lockBox", p, [s, s, s], r);
        k.add("steel", "shackle", p, [s, s, s], r);
        // Now and then a second lock hangs from the first one's body.
        if (!phone && jitter(n * 17, 1) > 0.76) {
          const q: [number, number, number] = [p[0] + side * 0.004, y - 0.07 * s, zz + jitter(n * 19, 0.01)];
          const r2: [number, number, number] = [jitter(n * 23, 0.3), r[1] + jitter(n * 29, 0.6), 0];
          k.add("lockPaint", jitter(n * 31, 1) > 0 ? "lockHeart" : "lockBox", q, [s * 0.9, s * 0.9, s * 0.9], r2);
          k.add("steel", "shackle", q, [s * 0.9, s * 0.9, s * 0.9], r2);
        }
      }
    }
  }
  // Coin binoculars at the rail, looking out over the city (south, +z):
  // a foot plate, a post, a yoke, and twin barrels with deep sun hoods.
  const dir: [number, number] = [Math.cos(-0.16), Math.sin(-0.16)]; // along z, tipped down
  const barrelR: [number, number, number] = [Math.PI / 2 + 0.16, 0, 0];
  for (const v of NAMSAN.viewers) {
    k.add("charcoal", "cyl", [v.x, 0.03, v.z], [0.42, 0.06, 0.42]);
    k.add("steel", "cyl", [v.x, 0.55, v.z], [0.11, 1.0, 0.11], undefined, true);
    k.box("steel", [v.x, 1.08, v.z], [0.3, 0.06, 0.1]);
    for (const sx of [-1, 1]) k.box("steel", [v.x + sx * 0.14, 1.15, v.z], [0.03, 0.16, 0.08]);
    const at = (t: number, y = 1.21): [number, number, number] => [0, y + dir[1] * t, v.z + dir[0] * t];
    for (const sx of [-1, 1]) {
      const bx = v.x + sx * 0.075;
      const c = at(0);
      k.add("clothBlue", "cyl", [bx, c[1], c[2]], [0.12, 0.34, 0.12], barrelR, true);
      const f = at(0.2);
      k.add("charcoal", "cyl", [bx, f[1], f[2]], [0.15, 0.08, 0.15], barrelR);
      const e = at(-0.19);
      k.add("charcoal", "cyl", [bx, e[1], e[2]], [0.065, 0.06, 0.065], barrelR);
    }
    const m = at(0.02);
    k.box("clothBlue", [v.x, m[1], m[2]], [0.12, 0.09, 0.2], false, [0.16, 0, 0]);
    const coin = at(-0.04, 1.31);
    k.box("charcoal", [v.x, coin[1], coin[2]], [0.06, 0.03, 0.08], false, [0.16, 0, 0]);
  }
  // A bench, pines and the 02 bus stop (open: no roof between the camera and the arrival spot).
  const B = NAMSAN.bench;
  // A park bench facing the plaza (+x), its back to the lookout rail:
  // five seat slats with gaps, a two-slat back on posts, cast-iron ends.
  for (let i = 0; i < 5; i++) k.box("woodDark", [B.x - B.w / 2 + 0.08 + i * ((B.w - 0.16) / 4), 0.44, B.z], [0.1, 0.04, B.d], true);
  for (const [y, dx] of [[0.66, 0.03], [0.84, 0.065]] as const) k.box("woodDark", [B.x - B.w / 2 + 0.02 - dx, y, B.z], [0.035, 0.12, B.d], true, [0, 0, -0.2]);
  for (const sz of [-1, 1]) {
    const z = B.z + sz * (B.d / 2 - 0.16);
    k.box("metal", [B.x, 0.41, z], [B.w - 0.04, 0.04, 0.05]);
    k.box("metal", [B.x + B.w / 2 - 0.1, 0.2, z], [0.05, 0.4, 0.05]);
    k.box("metal", [B.x - B.w / 2 + 0.1, 0.2, z], [0.05, 0.4, 0.05]);
    k.box("metal", [B.x - B.w / 2 + 0.02, 0.65, z], [0.05, 0.5, 0.05], false, [0, 0, -0.2]);
    k.box("metal", [B.x + B.w / 2 - 0.12, 0.58, z], [0.32, 0.04, 0.05]);
  }
  for (const p of NAMSAN.pines) pine(k, p.x, p.z, p.s);
  const S = NAMSAN.busStop;
  for (const sx of [-1, 1]) k.box("metal", [S.x + sx * 0.6, 1.2, S.z + 0.5], [0.07, 2.4, 0.07]);
  k.box("woodDark", [S.x, 0.44, S.z + 0.45], [1.2, 0.08, 0.36]);
  // The base building's glass front: steel mullions, a transom, a pair of
  // dark glass doors in the middle and a slim canopy over the entrance.
  const BZ = NAMSAN.base.z;
  const BW = NAMSAN.base.w;
  for (let i = 0; i <= 8; i++) k.box("steel", [-BW / 2 + (BW / 8) * i, 1.6, BZ + 0.03], [0.07, 3.0, 0.07]);
  for (const y of [0.13, 2.35]) k.box("steel", [0, y, BZ + 0.03], [BW, 0.07, 0.07]);
  for (const sx of [-1, 1]) {
    k.box("charcoal", [sx * 0.56, 1.2, BZ + 0.02], [1.0, 2.1, 0.04]);
    k.box("steel", [sx * 0.12, 1.15, BZ + 0.08], [0.03, 0.6, 0.04]);
  }
  k.box("plaster", [0, 3.08, BZ + 0.7], [4.6, 0.12, 1.4], true);
  k.box("steel", [0, 3.0, BZ + 1.38], [4.6, 0.06, 0.05]);
  // The base building: pilasters either side of the glass and at the
  // corners, a stone plinth under the wings, frames on the wings' ribbon
  // windows, a parapet with a steel coping, and a set-back upper storey of
  // glass on the roof (the tower rises from behind it).
  const wing = (BW + 6) / 2;
  for (const sx of [-1, 1]) {
    for (const x of [BW / 2 + 0.15, wing - 0.15]) k.box("plaster", [sx * x, 2.2, BZ + 0.09], [0.3, 4.4, 0.18], true);
    k.box("stoneWarm", [sx * (BW / 2 + 1.5), 0.22, BZ + 0.05], [2.7, 0.44, 0.1]);
    const cx = sx * (BW / 2 + 1.55);
    for (const y of [3.38, 4.06]) k.box("steel", [cx, y, BZ + 0.04], [2.36, 0.05, 0.06]);
    for (let i = 0; i <= 4; i++) k.box("steel", [cx - 1.15 + i * 0.575, 3.72, BZ + 0.04], [0.04, 0.66, 0.05]);
    k.box("plaster", [cx, 3.33, BZ + 0.08], [2.5, 0.06, 0.14]);
    for (let i = 0; i <= 6; i++) k.box("steel", [sx * (wing + 0.02), 3.72, BZ - 5.3 + i * 0.767], [0.05, 0.66, 0.04]);
  }
  k.box("plaster", [0, 4.56, BZ - 3], [BW + 6.1, 0.32, 6.1], true);
  k.box("steel", [0, 4.74, BZ - 3], [BW + 6.24, 0.05, 6.24]);
  const UZ = BZ - 3.35;
  k.box("plaster", [0, 4.8, UZ], [8.8, 0.2, 3.7]);
  k.box("plaster", [0, 6.36, UZ], [9.2, 0.32, 4.1], true);
  k.box("steel", [0, 6.54, UZ], [9.3, 0.05, 4.2]);
  for (let i = 0; i <= 8; i++) k.box("steel", [-4.3 + i * 1.075, 5.55, UZ + 1.77], [0.06, 1.3, 0.06]);
  for (const sx of [-1, 1]) for (let i = 0; i <= 3; i++) k.box("steel", [sx * 4.32, 5.55, UZ - 1.75 + i * 1.167], [0.06, 1.3, 0.06]);
  // Mullions round the observation deck's two window bands.
  const decks = phone ? 28 : 44;
  for (const [y, r] of [[32.81, 3.07], [34.1, 3.29]] as const) {
    for (let i = 0; i < decks; i++) {
      const a = (i / decks) * Math.PI * 2;
      k.box("charcoal", [Math.sin(a) * r, y, TOWER_Z + Math.cos(a) * r], [0.035, 1.0, 0.1], false, [0, a, 0]);
    }
  }
  // The ticket booth: a small kiosk with a real service window — the
  // ticket seller stands inside and is seen through it (it was a solid box,
  // and her "Talk" label floated over a blank wall).
  const T = NAMSAN.booth;
  const front = T.z - 0.15 + (T.d - 0.3) / 2;
  const back = T.z - 0.15 - (T.d - 0.3) / 2;
  const mid = (front + back) / 2;
  const win = 1.5;
  const pier = (T.w - win) / 2;
  k.box("plaster", [T.x, 1.25, back + 0.06], [T.w, 2.5, 0.12], true);
  for (const sx of [-1, 1]) {
    k.box("plaster", [T.x + sx * (T.w / 2 - 0.06), 1.25, mid], [0.12, 2.5, front - back], true);
    k.box("plaster", [T.x + sx * (win / 2 + pier / 2), 1.425, front - 0.06], [pier, 0.95, 0.12], true);
  }
  k.box("plaster", [T.x, 0.475, front - 0.06], [T.w, 0.95, 0.12], true);
  k.box("plaster", [T.x, 2.2, front - 0.06], [T.w, 0.6, 0.12], true);
  k.box("charcoal", [T.x, 1.25, back + 0.125], [T.w - 0.24, 2.4, 0.01]);
  for (const y of [0.95, 1.9]) k.box("steel", [T.x, y, front - 0.01], [win + 0.04, 0.04, 0.05]);
  for (const sx of [-1, 1]) k.box("steel", [T.x + sx * (win / 2), 1.425, front - 0.01], [0.04, 0.95, 0.05]);
  k.box("woodDark", [T.x, 0.95, T.z + T.d / 2 - 0.2], [T.w + 0.1, 0.08, 0.3]);
  // Stone cladding on the base building's wings (front and ends): panels
  // with thin joints, so the wings read as a dressed stone building, not
  // a grey box.
  {
    const BZ = NAMSAN.base.z;
    const wing = (NAMSAN.base.w + 6) / 2;
    const y0 = 0.46;
    const rows = 4;
    const rh = (3.28 - y0) / rows;
    for (const sx of [-1, 1]) {
      const x0 = NAMSAN.base.w / 2 + 0.3;
      const x1 = wing - 0.3;
      const cols = 3;
      const cw = (x1 - x0) / cols;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) k.box("stoneWarm", [sx * (x0 + cw * (c + 0.5)), y0 + rh * (r + 0.5), BZ + 0.025], [cw - 0.025, rh - 0.025, 0.05]);
      const sc = 7;
      const sw = 6 / sc;
      k.box("stoneWarm", [sx * (wing + 0.05), 0.22, BZ - 3], [0.1, 0.44, 6]);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < sc; c++) k.box("stoneWarm", [sx * (wing + 0.025), y0 + rh * (r + 0.5), BZ - sw * (c + 0.5)], [0.05, rh - 0.025, sw - 0.025]);
    }
  }
  // Planting beds along the wings: shrubs, an azalea and flowers at the foot of the stone.
  NAMSAN.planters.forEach((p, i) => {
    bed(k, p.x, p.z, p.w, p.d, 61 + i * 7, true);
    shrub(k, p.x - p.w * 0.28, p.z, 0.5, 63 + i);
    if (p.w > 2) azalea(k, p.x + p.w * 0.22, p.z, 0.55, 67 + i, 0.14);
  });
  k.box("roof", [T.x, 2.6, T.z], [T.w + 0.4, 0.2, T.d + 0.4], true);
  return k;
}

let TERRACE: Kit | null = null;

/** Flat boxes, merged into one shape (glass bands of the base building). */
function boxes(list: { p: [number, number, number]; s: [number, number, number] }[]): BufferGeometry {
  const parts = list.map(({ p, s }) => {
    const g = new BoxGeometry(...s);
    g.deleteAttribute("uv");
    g.translate(...p);
    return g;
  });
  return mergeGeometries(parts) ?? parts[0];
}

/** The base building's glass: the front, ribbon windows on the wings, the set-back upper storey. */
function baseGlass(): BufferGeometry {
  const BZ = NAMSAN.base.z;
  const W = NAMSAN.base.w;
  const wing = (W + 6) / 2;
  return boxes([
    { p: [0, 1.6, BZ - 0.02], s: [W, 3.0, 0.1] },
    // Ribbon windows in the wings' upper storey.
    ...[-1, 1].map((sx) => ({ p: [sx * (W / 2 + 1.55), 3.72, BZ + 0.0] as [number, number, number], s: [2.3, 0.62, 0.06] as [number, number, number] })),
    // And along both sides.
    ...[-1, 1].map((sx) => ({ p: [sx * (wing + 0.0), 3.72, BZ - 3] as [number, number, number], s: [0.06, 0.62, 4.6] as [number, number, number] })),
    // The upper storey, set back on the roof: a band of glass all round.
    { p: [0, 5.55, BZ - 3.35], s: [8.6, 1.3, 3.5] },
  ]);
}

/** The tower: base building, tapering shaft, the observation deck, the antenna. */
function Tower() {
  const geo = useMemo(() => towerGeometry(pickQuality().maxTexture <= 1024 ? 32 : 56), []);
  const glass = useMemo(() => baseGlass(), []);
  useEffect(
    () => () => {
      geo.white.dispose();
      geo.red.dispose();
      geo.glass.dispose();
      glass.dispose();
    },
    [geo, glass],
  );
  return (
    <group>
      {/* The base building closing the plaza's north side, its glass front facing the plaza. */}
      <mesh castShadow receiveShadow position={[0, 2.2, NAMSAN.base.z - 3]}>
        <boxGeometry args={[NAMSAN.base.w + 6, 4.4, 6]} />
        <primitive object={MAT.plaster} attach="material" />
      </mesh>
      <mesh geometry={glass} material={DECK_GLASS} />
      <group position={[0, 0, TOWER_Z]}>
        <mesh castShadow geometry={geo.white} material={TOWER_WHITE} />
        <mesh geometry={geo.red} material={TOWER_RED} />
        <mesh geometry={geo.glass} material={DECK_GLASS} />
      </group>
    </group>
  );
}

export default function SeoulNamsan() {
  const paving = useTiledTexture(paintPaving, HW, HD);
  const photo = usePhotoFloor("paving", HW, HD);
  const kit = useMemo(() => (TERRACE ??= terraceKit()), []);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HD * 2, ...FLOOR_GRID]} />
        <meshStandardMaterial key={photo ? "photo" : "painted"} map={photo?.map ?? paving} normalMap={photo?.normal ?? null} roughnessMap={photo?.rough ?? null} roughness={photo ? 1 : 0.95} color={photo ? "#EEE8DC" : "#ffffff"} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <Tower />
      <Batch kit={kit} />
      {/* The tower's name over its entrance, the booth's sign, the bus stop's board. */}
      <group position={[0, 3.55, NAMSAN.base.z + 0.04]}>
        <Signboard text={NAMSAN.sign} w={4.2} h={0.75} aspect={5.6} oneSided />
      </group>
      <group position={[NAMSAN.booth.x, 2.2, NAMSAN.booth.z + NAMSAN.booth.d / 2 + 0.02]}>
        <Signboard text="매표소" w={1.4} h={0.4} aspect={3.5} oneSided />
      </group>
      <group position={[NAMSAN.busStop.x - 0.75, 2.0, NAMSAN.busStop.z + 0.5]} rotation={[0, -Math.PI / 2, 0]}>
        <Signboard text="02 · 남산" w={0.9} h={0.42} aspect={2.2} />
      </group>
    </group>
  );
}
