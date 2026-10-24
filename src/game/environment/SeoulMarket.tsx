import { useEffect, useMemo } from "react";
import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from "three";
import { ALLEY } from "../config/rooms";
import { FLOOR_GRID } from "../config/world";
import { MAT } from "../config/materials";
import Batch from "./Batch";
import { Kit, bunting, flowers, jitter, planter, type MatKey } from "./kit";
import { Signboard } from "./parts";
import { floorBreakup, FLOOR_BREAKUP_KEY, paintPaving, useTiledTexture, usePhotoFloor } from "./textures";

/**
 * Seoul Journey, part 2 — the market alley (골목 시장), canon worlds
 * "seoul-journey", levelJourney.l5. One subway stop from the street corner.
 *
 * Two- and three-storey shop houses line the alley; at street level, stalls
 * under coloured awnings (fruit, side dishes, hats and socks, fish cakes,
 * flowers), each with its name on a board; the street-food cart in the
 * middle; strings of flags overhead; a small café closing the north end;
 * the subway exit's glass canopy at the south end, under the alley's arch.
 *
 * Every stop is in config/interactions ("Seoul Journey part 2").
 */

const HW = ALLEY.halfWidth;
const HL = ALLEY.halfLength;
const KO = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", sans-serif';

/* ───────────────────────── Shop-house fronts ───────────────────────── */

/** Painted upper storeys: rows of windows, a shop sign band, each house its own colour. */
function facadeTexture(seed: number, base: string, signs: string[]): CanvasTexture | null {
  try {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 384;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 384);
    // A little weathering.
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(60,45,35,${0.02 + ((i * 37 + seed) % 7) * 0.006})`;
      ctx.fillRect((i * 53 + seed * 11) % 256, (i * 97 + seed * 7) % 384, 6 + (i % 5) * 4, 3 + (i % 3) * 3);
    }
    // Upper floors: windows with warm or sky reflections, a few with plants.
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = 22 + col * 76;
        const y = 34 + row * 112;
        ctx.fillStyle = "#3B3A38";
        ctx.fillRect(x - 3, y - 3, 64, 78);
        const warm = (seed + row * 3 + col) % 3 === 0;
        const g = ctx.createLinearGradient(x, y, x + 58, y + 72);
        g.addColorStop(0, warm ? "#F6D9A2" : "#B8CBDA");
        g.addColorStop(1, warm ? "#C98E52" : "#6F8698");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, 58, 72);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x + 28, y, 2, 72);
        ctx.fillRect(x, y + 34, 58, 2);
        if ((seed + col + row) % 4 === 1) {
          ctx.fillStyle = "#4E7A4C";
          for (let k = 0; k < 5; k++) ctx.fillRect(x + 4 + k * 11, y + 62 - (k % 2) * 5, 8, 12);
        }
      }
    }
    // A shop sign band across the bottom (the stall stands in front of it).
    const sy = 270;
    ctx.fillStyle = ["#2F4C6E", "#7A2E2A", "#2E5A43", "#5B3A6E"][seed % 4];
    ctx.fillRect(8, sy, 240, 56);
    ctx.fillStyle = "#FFF6E0";
    ctx.font = `700 34px ${KO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(signs[seed % signs.length], 128, sy + 29);
    // Ground floor: a shutter, half raised.
    ctx.fillStyle = "#8C8C88";
    ctx.fillRect(16, 330, 224, 54);
    ctx.fillStyle = "rgba(40,40,40,0.25)";
    for (let y = 332; y < 384; y += 6) ctx.fillRect(16, y, 224, 2);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  } catch {
    return null;
  }
}

const HOUSE_COLOURS = ["#E6D6BE", "#D9C2A6", "#CFD5D2", "#E8CFB8", "#D6CBB8", "#C9B9A4"];
const HOUSE_SIGNS = ["떡집", "약국", "미용실", "분식", "철물점", "세탁소", "정육점", "반찬가게"];

/** The shop houses on both sides: a box each, and a painted front facing the alley. */
function Houses() {
  const houses = useMemo(() => {
    const out: { x: number; z: number; len: number; h: number; side: -1 | 1; mat: MeshStandardMaterial }[] = [];
    const n = 6;
    const len = (HL * 2) / n;
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < n; i++) {
        const seed = i * 2 + (side > 0 ? 1 : 0);
        const map = facadeTexture(seed, HOUSE_COLOURS[(i + (side > 0 ? 3 : 0)) % HOUSE_COLOURS.length], HOUSE_SIGNS);
        const mat = new MeshStandardMaterial({ map, roughness: 0.9 });
        out.push({ x: side * (HW + 1.6), z: -HL + len * (i + 0.5), len: len - 0.08, h: 6.2 + (seed % 3) * 1.1, side, mat });
      }
    }
    return out;
  }, []);
  useEffect(() => () => houses.forEach((h) => (h.mat.map?.dispose(), h.mat.dispose())), [houses]);
  return (
    <>
      {houses.map((h, i) => (
        <group key={i}>
          <mesh castShadow receiveShadow position={[h.x, h.h / 2, h.z]}>
            <boxGeometry args={[3.2, h.h, h.len]} />
            <primitive object={MAT.plaster} attach="material" />
          </mesh>
          {/* The painted front, facing into the alley. */}
          <mesh receiveShadow position={[h.x - h.side * 1.61, h.h / 2, h.z]} rotation={[0, -h.side * (Math.PI / 2), 0]}>
            <planeGeometry args={[h.len, h.h]} />
            <primitive object={h.mat} attach="material" />
          </mesh>
          {/* A flat roof edge. */}
          <mesh position={[h.x, h.h + 0.08, h.z]}>
            <boxGeometry args={[3.3, 0.16, h.len + 0.04]} />
            <primitive object={MAT.charcoal} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ───────────────────────── Stalls, cart, arch ───────────────────────── */

const AWNINGS: MatKey[] = ["clothRed", "clothBlue", "clothSage", "clothRed", "fabric"];

/** What each stall shows on its counter. */
function goods(k: Kit, kind: string, x: number, z: number, seed: number) {
  const top = 0.98;
  const row = (mats: MatKey[], geo: "ball" | "box" | "cyl", s: [number, number, number], perRow = 4, rows = 3) => {
    for (let r = 0; r < rows; r++)
      for (let i = 0; i < perRow; i++) {
        const zz = z - 1.2 + (i + 0.5) * (2.4 / perRow);
        const xx = x + (r - 1) * 0.36;
        k.add(mats[(i + r + seed) % mats.length], geo, [xx, top + s[1] / 2, zz + jitter(seed + i * 7 + r, 0.04)], s, [0, jitter(seed + i + r * 5, 1), 0]);
      }
  };
  if (kind === "fruit") {
    // Baskets heaped with apples and tangerines.
    for (let i = 0; i < 4; i++) k.add("woodLight", "cyl", [x, top + 0.07, z - 1.05 + i * 0.7], [0.5, 0.14, 0.5]);
    row(["fruitRed", "fruitOrange", "fruitRed"], "ball", [0.13, 0.12, 0.13], 6, 3);
  } else if (kind === "banchan") {
    // Trays of side dishes in a row.
    row(["clothRed", "leaf", "fruitOrange", "leafDark", "flowerWhite"], "box", [0.3, 0.06, 0.4], 5, 2);
  } else if (kind === "hats") {
    row(["clothBlue", "clothSage", "fabric", "clothRed", "charcoal"], "box", [0.28, 0.12, 0.34], 5, 3);
  } else if (kind === "eomuk") {
    // A steaming pot and skewers.
    k.add("metal", "cyl", [x, top + 0.18, z - 0.5], [0.7, 0.36, 0.7]);
    for (let i = 0; i < 6; i++) k.add("woodLight", "cyl", [x - 0.2 + (i % 3) * 0.2, top + 0.5, z - 0.6 + Math.floor(i / 3) * 0.2], [0.02, 0.35, 0.02]);
    row(["fruitOrange", "woodLight"], "box", [0.22, 0.05, 0.3], 3, 2);
  } else {
    // Buckets of flowers.
    for (let i = 0; i < 4; i++) {
      k.add("metal", "cyl", [x, top + 0.18, z - 1.05 + i * 0.7], [0.36, 0.36, 0.36]);
      flowers(k, x, z - 1.05 + i * 0.7, 0.48, seed + i * 3, top + 0.3);
    }
  }
}

function stallsKit(): Kit {
  const k = new Kit();
  ALLEY.stalls.forEach((st, i) => {
    const cx = st.side * (HW - ALLEY.stallW / 2 + 0.05);
    const front = st.side * (HW - ALLEY.stallW + 0.05);
    // Counter: a timber table along the stall's front, a crate shelf behind.
    k.box("woodLight", [front - st.side * 0.35, 0.47, st.z], [0.75, 0.94, ALLEY.stallD - 0.2], true);
    k.box("woodDark", [cx + st.side * 0.45, 0.6, st.z], [0.5, 1.2, ALLEY.stallD - 0.3], true);
    goods(k, st.goods, front - st.side * 0.35, st.z, i * 11 + 3);
    // Posts and an awning sloping down toward the alley.
    for (const dz of [-1, 1]) k.box("metal", [front + st.side * 0.02, 1.25, st.z + dz * (ALLEY.stallD / 2 - 0.1)], [0.06, 2.5, 0.06]);
    k.box(AWNINGS[i % AWNINGS.length], [cx - st.side * 0.15, 2.48, st.z], [ALLEY.stallW + 0.7, 0.05, ALLEY.stallD + 0.1], true, [0, 0, st.side * -0.22]);
  });
  // The street-food cart: a counter on wheels with a red awning.
  const C = ALLEY.cart;
  k.box("woodLight", [C.x, 0.5, C.z], [C.w, 0.62, C.d], true);
  k.box("metal", [C.x, 0.86, C.z], [C.w + 0.06, 0.06, C.d + 0.06], false);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) k.add("charcoal", "cyl", [C.x + dx * (C.w / 2 - 0.12), 0.16, C.z + dz * (C.d / 2 - 0.3)], [0.32, 0.08, 0.32], [0, 0, Math.PI / 2]);
  // On the counter: hotteok on a griddle, eomuk skewers in broth, gimbap rolls.
  k.box("charcoal", [C.x - 0.15, 0.92, C.z - 0.9], [0.8, 0.04, 0.6]);
  for (let i = 0; i < 4; i++) k.add("woodLight", "cyl", [C.x - 0.35 + (i % 2) * 0.35, 0.96, C.z - 1.0 + Math.floor(i / 2) * 0.25], [0.18, 0.04, 0.18]);
  k.add("metal", "cyl", [C.x - 0.1, 1.02, C.z], [0.5, 0.22, 0.5]);
  for (let i = 0; i < 5; i++) k.add("fruitOrange", "cyl", [C.x - 0.2 + (i % 3) * 0.15, 1.18, C.z - 0.1 + Math.floor(i / 3) * 0.18], [0.03, 0.32, 0.03]);
  for (let i = 0; i < 3; i++) k.add("charcoal", "cyl", [C.x - 0.2, 0.95, C.z + 0.75 + i * 0.16], [0.11, 0.42, 0.11], [0, 0, Math.PI / 2]);
  for (const dz of [-1, 1]) k.box("metal", [C.x + C.w / 2 - 0.05, 1.45, C.z + dz * (C.d / 2 - 0.05)], [0.05, 1.2, 0.05]);
  k.box("clothRed", [C.x, 2.08, C.z], [C.w + 0.5, 0.05, C.d + 0.4], true, [0, 0, -0.12]);

  // The arch over the entrance: two posts and a beam (the board is drawn apart).
  for (const sd of [-1, 1]) k.box("charcoal", [sd * (HW - 0.25), 2.1, ALLEY.archZ], [0.3, 4.2, 0.3], true);
  k.box("charcoal", [0, 4.05, ALLEY.archZ], [HW * 2 - 0.2, 0.22, 0.26], true);

  // The subway exit: stair walls, a glass canopy on posts, a green line-2 post.
  const E = ALLEY.exit;
  for (const sd of [-1, 1]) k.box("stoneWarm", [E.x + sd * (E.w / 2 - 0.1), 0.55, E.z], [0.2, 1.1, E.d], true);
  k.box("stoneWarm", [E.x, 0.55, E.z + E.d / 2 - 0.1], [E.w, 1.1, 0.2], true);
  k.box("charcoal", [E.x, 0.02, E.z], [E.w - 0.4, 0.04, E.d - 0.3]);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) k.box("metal", [E.x + dx * (E.w / 2 - 0.08), 1.5, E.z + dz * (E.d / 2 - 0.08)], [0.08, 3.0, 0.08]);
  k.box("paper", [E.x, 3.02, E.z], [E.w + 0.3, 0.06, E.d + 0.3]);

  // The bench by the café, planters, and flags strung across the alley.
  const B = ALLEY.bench;
  k.box("woodDark", [B.x, 0.44, B.z], [B.w, 0.08, B.d], true);
  for (const sx of [-1, 1]) k.box("metal", [B.x + sx * (B.w / 2 - 0.15), 0.22, B.z], [0.06, 0.44, B.d - 0.08]);
  planter(k, 3.4, -10.2, 1.6, false);
  for (let i = 0; i < 5; i++) {
    const z = -9 + i * 4.4;
    bunting(k, -HW - 0.1, z, HW + 0.1, z + 1.2, 4.6, i);
  }
  return k;
}

let STALLS: Kit | null = null;

/** The café closing the north end: a warm front with big windows and its sign. */
function Cafe() {
  const tex = useMemo(() => {
    try {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#6B4A33";
      ctx.fillRect(0, 0, 512, 256);
      for (const x of [24, 296]) {
        const g = ctx.createLinearGradient(0, 70, 0, 230);
        g.addColorStop(0, "#FBE3B4");
        g.addColorStop(1, "#D99A5B");
        ctx.fillStyle = g;
        ctx.fillRect(x, 70, 192, 160);
        ctx.fillStyle = "rgba(60,40,25,0.45)";
        ctx.fillRect(x + 94, 70, 4, 160);
        // Cups on the sill.
        ctx.fillStyle = "#FFF6E6";
        for (let i = 0; i < 4; i++) ctx.fillRect(x + 20 + i * 44, 206, 18, 22);
      }
      ctx.fillStyle = "#3A2A1E";
      ctx.fillRect(226, 96, 60, 160);
      ctx.fillStyle = "#F4D27A";
      ctx.fillRect(272, 170, 6, 14);
      ctx.fillStyle = "#2E2E2E";
      ctx.fillRect(140, 8, 232, 50);
      ctx.fillStyle = "#FFF6E0";
      ctx.font = `700 36px ${KO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("골목 카페", 256, 34);
      const t = new CanvasTexture(c);
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    } catch {
      return null;
    }
  }, []);
  useEffect(() => () => tex?.dispose(), [tex]);
  const w = ALLEY.cafe.w;
  return (
    <group position={[ALLEY.cafe.x, 0, -HL - 0.05]}>
      <mesh castShadow receiveShadow position={[0, 3.2, -1.5]}>
        <boxGeometry args={[HW * 2 + 3.2, 6.4, 3]} />
        <primitive object={MAT.plaster} attach="material" />
      </mesh>
      <mesh position={[0, 1.55, 0.02]}>
        <planeGeometry args={[w, w / 2]} />
        <meshStandardMaterial map={tex} roughness={0.85} emissive="#FFD9A0" emissiveIntensity={0.18} emissiveMap={tex} />
      </mesh>
      <mesh castShadow position={[0, 3.3, 0.45]} rotation={[0.28, 0, 0]}>
        <boxGeometry args={[w + 0.6, 0.05, 1.1]} />
        <primitive object={MAT.clothSage} attach="material" />
      </mesh>
    </group>
  );
}

export default function SeoulMarket() {
  const paving = useTiledTexture(paintPaving, HW, HL);
  const photo = usePhotoFloor("paving", HW, HL);
  const kit = useMemo(() => (STALLS ??= stallsKit()), []);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HL * 2, ...FLOOR_GRID]} />
        <meshStandardMaterial key={photo ? "photo" : "painted"} map={photo?.map ?? paving} normalMap={photo?.normal ?? null} roughnessMap={photo?.rough ?? null} roughness={photo ? 1 : 0.95} color={photo ? "#E9E3D6" : "#ffffff"} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <Houses />
      <Batch kit={kit} />
      <Cafe />
      {/* Stall names, hung under each awning facing the alley. */}
      {ALLEY.stalls.map((st) => (
        <group key={st.sign} position={[st.side * (HW - ALLEY.stallW - 0.02), 2.05, st.z]} rotation={[0, -st.side * (Math.PI / 2), 0]}>
          <Signboard text={st.sign} w={1.5} h={0.45} aspect={3.3} />
        </group>
      ))}
      {/* The arch's name board, read walking in from the subway. */}
      <group position={[0, 4.42, ALLEY.archZ]}>
        <Signboard text={ALLEY.sign} w={2.4} h={0.6} aspect={4} />
      </group>
      {/* The exit's sign: 출구 and line 2, beside the stairs. */}
      <group position={[ALLEY.exit.x, 3.3, ALLEY.exit.z - ALLEY.exit.d / 2 - 0.2]}>
        <Signboard text="출구 · 2호선" w={1.4} h={0.32} aspect={4.5} />
      </group>
    </group>
  );
}
