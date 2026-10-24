import { useMemo } from "react";
import { NAMSAN } from "../config/rooms";
import { FLOOR_GRID } from "../config/world";
import { MAT, std } from "../config/materials";
import Batch from "./Batch";
import { Kit, jitter, pine, type MatKey } from "./kit";
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
const WHITE = std("#F2F0EA", 0.5);
const RED = std("#C8463C", 0.6);
const GLASS = std("#7E97A8", 0.15, { metalness: 0.3 });

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
  // The padlock fence on the east: posts, three rails, and the locks.
  const L = NAMSAN.locks;
  const len = L.z1 - L.z0;
  for (let i = 0; i <= 8; i++) k.box("metal", [L.x, 0.7, L.z0 + (len / 8) * i], [0.07, 1.4, 0.07]);
  for (const y of [0.45, 0.85, 1.25]) k.box("metal", [L.x, y, (L.z0 + L.z1) / 2], [0.05, 0.05, len]);
  const lockMats: MatKey[] = ["clothRed", "clothBlue", "fruitOrange", "fruitRed", "flowerLilac", "leaf", "metal", "flowerWhite", "blossom"];
  for (let i = 0; i < 260; i++) {
    const z = L.z0 + 0.1 + Math.abs(jitter(i * 3 + 1, 1)) * (len - 0.2);
    const y = 0.3 + Math.abs(jitter(i * 7 + 2, 1)) * 1.05;
    const sd = i % 2 ? 1 : -1;
    k.box(lockMats[i % lockMats.length], [L.x + sd * 0.06, y, z], [0.04, 0.09 + (i % 3) * 0.02, 0.07], false, [jitter(i, 0.4), 0, jitter(i * 5, 0.3)]);
  }
  // Coin viewers at the rail.
  for (const v of NAMSAN.viewers) {
    k.add("metal", "cyl", [v.x, 0.55, v.z], [0.12, 1.1, 0.12]);
    k.box("charcoal", [v.x, 1.18, v.z], [0.32, 0.26, 0.42], true, [-0.2, 0, 0]);
  }
  // A bench, pines and the 02 bus stop (open: no roof between the camera and the arrival spot).
  const B = NAMSAN.bench;
  k.box("woodDark", [B.x, 0.44, B.z], [B.w, 0.08, B.d], true);
  for (const sz of [-1, 1]) k.box("metal", [B.x, 0.22, B.z + sz * (B.d / 2 - 0.15)], [B.w - 0.08, 0.44, 0.06]);
  for (const p of NAMSAN.pines) pine(k, p.x, p.z, p.s);
  const S = NAMSAN.busStop;
  for (const sx of [-1, 1]) k.box("metal", [S.x + sx * 0.6, 1.2, S.z + 0.5], [0.07, 2.4, 0.07]);
  k.box("woodDark", [S.x, 0.44, S.z + 0.45], [1.2, 0.08, 0.36]);
  // The ticket booth: a small kiosk with a window.
  const T = NAMSAN.booth;
  k.box("plaster", [T.x, 1.25, T.z - 0.15], [T.w, 2.5, T.d - 0.3], true);
  k.box("woodDark", [T.x, 0.95, T.z + T.d / 2 - 0.2], [T.w + 0.1, 0.08, 0.3]);
  k.box("roof", [T.x, 2.6, T.z], [T.w + 0.4, 0.2, T.d + 0.4], true);
  return k;
}

let TERRACE: Kit | null = null;

/** The tower: base building, tapering shaft, the observation deck, the antenna. */
function Tower() {
  return (
    <group>
      {/* The base building closing the plaza's north side, its glass front facing the plaza. */}
      <mesh castShadow receiveShadow position={[0, 2.2, NAMSAN.base.z - 3]}>
        <boxGeometry args={[NAMSAN.base.w + 6, 4.4, 6]} />
        <primitive object={MAT.plaster} attach="material" />
      </mesh>
      <mesh position={[0, 1.6, NAMSAN.base.z - 0.02]}>
        <boxGeometry args={[NAMSAN.base.w, 3.0, 0.1]} />
        <primitive object={GLASS} attach="material" />
      </mesh>
      <mesh position={[0, 4.5, NAMSAN.base.z - 3]}>
        <boxGeometry args={[NAMSAN.base.w + 6.4, 0.2, 6.4]} />
        <primitive object={MAT.charcoal} attach="material" />
      </mesh>
      {/* The shaft rises behind the base. */}
      <mesh castShadow position={[0, 18, TOWER_Z]}>
        <cylinderGeometry args={[1.1, 1.7, 32, 24]} />
        <primitive object={WHITE} attach="material" />
      </mesh>
      {/* The observation deck: layered rings with a band of windows. */}
      <mesh castShadow position={[0, 32, TOWER_Z]}>
        <cylinderGeometry args={[3.0, 2.4, 2.2, 32]} />
        <primitive object={WHITE} attach="material" />
      </mesh>
      <mesh position={[0, 33.6, TOWER_Z]}>
        <cylinderGeometry args={[3.3, 3.3, 1.2, 32]} />
        <primitive object={GLASS} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 34.8, TOWER_Z]}>
        <cylinderGeometry args={[2.6, 3.4, 1.2, 32]} />
        <primitive object={WHITE} attach="material" />
      </mesh>
      {/* The antenna, red and white bands to the top. */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, 37 + i * 2.2, TOWER_Z]}>
          <cylinderGeometry args={[0.32 - i * 0.04, 0.36 - i * 0.04, 2.2, 12]} />
          <primitive object={i % 2 ? WHITE : RED} attach="material" />
        </mesh>
      ))}
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
