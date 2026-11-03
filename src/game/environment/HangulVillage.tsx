import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedBufferAttribute, Matrix4, MeshBasicMaterial, type InstancedMesh } from "three";
import { MAT } from "../config/materials";
import { REDUCED_MOTION } from "../systems/motion";
import { useSignAtlas } from "./signTexture";
import { UNIT } from "./Instanced";
import { VILLAGE } from "../config/rooms";
import { PALETTE } from "../config/world";
import Batch from "./Batch";
import { Kit, bed, cart, curvedRoofOn, grass, hanokHouse, hanokRoof, jitter, platform, pot, shrub, slabWalk, tree, wallRun, gatehouse, flowerBox } from "./kit";
import { Gate, GateWall, Lamps, Signboard, signGeometry } from "./parts";
import { VILLAGE_LETTERS } from "../config/interactions";
import { paintPaving, useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY } from "./textures";
import { curvedRoof } from "./shapes";
import { FLOOR_GRID } from "../config/world";

/**
 * Room 2 — Hangul Village, the first learning world (canon: worlds[0]).
 *
 * "I am walking inside the Korean language": one street of hanok houses,
 * each a little different in size and roof, every door with a hanging
 * signboard carrying one of the first letters a learner reads (ㄱ ㄴ ㄷ ㄹ ㅁ
 * on the left, ㅏ ㅓ ㅗ ㅜ on the right). The 한글 마을 gate is the landmark,
 * the well marks the middle. Where the last house on the right would be, a
 * yellow-framed lane leads to the KLOVERS Hub (open to all); at the far end
 * the market gate, 시장, opens at Level 1. The ㄱ sign — the one a learner
 * can read closely — carries a thin yellow edge: noticed, not announced.
 */

const HW = VILLAGE.halfWidth;
const HL = VILLAGE.halfLength;
const FACE_X = HW + 0.3;
const ARCH_Z = VILLAGE.arch.z;
const ARCH_X = VILLAGE.arch.x;
const LAMP_SPOTS = VILLAGE.lampZ.flatMap((z) => [
  { x: -VILLAGE.lampX, z },
  { x: VILLAGE.lampX, z },
]);

interface SignSpot {
  x: number;
  z: number;
  letter: string;
}

/** Houses on both sides (the right side stops at the Hub lane). */
const HOUSES: { side: -1 | 1; z: number; i: number }[] = VILLAGE.houseZ.flatMap((z, i) => {
  const out: { side: -1 | 1; z: number; i: number }[] = [{ side: -1, z, i }];
  if (z !== VILLAGE.hubLaneZ) out.push({ side: 1, z, i });
  return out;
});

const SIGNS: SignSpot[] = HOUSES.map(({ side, z, i }) => {
  const letters = side < 0 ? VILLAGE.lettersLeft : VILLAGE.lettersRight;
  // South → north: the house nearest the village gate carries the first letter.
  const southIndex = VILLAGE.houseZ.length - 1 - i;
  const letter = letters[southIndex] ?? "";
  return { x: side * FACE_X - side * 0.62, z: z + 0.9, letter };
}).filter((s) => s.letter);

const VILLAGE_KIT: Kit = (() => {
  const k = new Kit();
  HOUSES.forEach(({ side, z, i }, n) => {
    const w = 4.4 + jitter(n + 1, 0.35);
    const d = VILLAGE.houseLength + jitter(n + 7, 0.3);
    hanokHouse(k, {
      x: side * (FACE_X + w / 2),
      z,
      w,
      d,
      h: 2.35 + ((i + (side > 0 ? 1 : 0)) % 3) * 0.2,
      face: side < 0 ? "+x" : "-x",
      door: 0.9,
      roofH: 1.0 + ((i + n) % 2) * 0.25,
    });
    // Bracket for the hanging signboard.
    k.box("woodDark", [side * FACE_X - side * 0.4, 2.62, z + 0.9], [0.8, 0.07, 0.07]);
    // An onggi pot or two by some doors.
    if ((i + n) % 2 === 0) pot(k, side * (FACE_X - 0.55), z - 1.6, 0.7, n % 3 !== 0);
  });

  // The lane to the Hub: short walls either side, and the Hub's roofs beyond.
  const laneZ = VILLAGE.hubLaneZ;
  wallRun(k, HW + 0.3, laneZ - 1.9, HW + 6, laneZ - 1.9, 2.2);
  wallRun(k, HW + 0.3, laneZ + 1.9, HW + 6, laneZ + 1.9, 2.2);
  slabWalk(k, HW + 0.3, laneZ, HW + 5.7, laneZ, 1.1, 41);
  hanokRoof(k, HW + 9, laneZ, 3.2, 5, 6, 1.4);
  gatehouse(k, HW + 0.25, laneZ, -Math.PI / 2, { open: true, accent: true });

  // The landmark gate: two posts, a double beam, a small tiled roof.
  for (const x of [-ARCH_X, ARCH_X]) {
    k.add("stoneWarm", "oct", [x, 0.15, ARCH_Z], [0.55, 0.3, 0.55], undefined, true);
    k.box("woodDark", [x, 2.3, ARCH_Z], [VILLAGE.arch.post, 4.6, VILLAGE.arch.post], true);
  }
  k.box("woodDark", [0, 4.15, ARCH_Z], [ARCH_X * 2 + 0.6, 0.2, 0.3], true);
  k.box("woodDark", [0, 4.55, ARCH_Z], [ARCH_X * 2 + 1.2, 0.24, 0.34], true);
  k.box("accent", [0, 4.15, ARCH_Z + 0.16], [ARCH_X * 2 - 0.6, 0.03, 0.015]);
  for (let x = -ARCH_X + 0.5; x <= ARCH_X - 0.4; x += 0.6) k.box("woodLight", [x, 4.7, ARCH_Z], [0.2, 0.1, 0.46]);
  curvedRoofOn(k, 0, 4.72, ARCH_Z, ARCH_X * 2 + 2.2, 1.5, 0.7);

  // The landmark past the far gate: a two-storey gate tower over the market.
  hanokHouse(k, { x: 0, z: -VILLAGE.halfLength - 4.6, w: 6.4, d: 3.6, h: 3.2, face: "+z", roofH: 1.0 });
  k.box("plaster", [0, 5.6, -VILLAGE.halfLength - 4.6], [3.6, 1.5, 2.2], true);
  for (const sx of [-1, 1]) k.box("woodDark", [sx * 1.8, 5.6, -VILLAGE.halfLength - 4.6], [0.16, 1.5, 2.3]);
  hanokRoof(k, 0, -VILLAGE.halfLength - 4.6, 6.35, 3.6, 2.2, 1.1);

  // Greens along both kerbs (not mirrored): a tree and bed on the right,
  // shrubs and pots on the left, grass at lamp feet.
  bed(k, VILLAGE.bedRight.x, VILLAGE.bedRight.z, VILLAGE.bedRight.w, VILLAGE.bedRight.d, 11);
  tree(k, VILLAGE.bedRight.x + 0.1, VILLAGE.bedRight.z, 1.0, false, 12);
  bed(k, VILLAGE.bedLeft.x, VILLAGE.bedLeft.z, VILLAGE.bedLeft.w, VILLAGE.bedLeft.d, 13, true);
  pot(k, -4.5, -8.2, 0.75, true);
  shrub(k, 4.4, 10.6, 0.6, 17);
  for (const z of VILLAGE.lampZ) grass(k, -VILLAGE.lampX - 0.3, z + 0.3, 0.7, z);
  // Trees behind the houses, over the roofs.
  for (const [tx, tz] of [[-11.5, -8], [-12, 3], [11.8, 6], [12.2, -2]] as const) tree(k, tx, tz, 1.5, false, tx * tz);
  // The village's one blossom accent, over the roofs by the entrance.
  tree(k, -11.2, 10, 1.45, true, 31);
  // Flower boxes along the veranda edges: colour at eye level down the street.
  VILLAGE.planters.forEach(([x, z, l], i) => flowerBox(k, x, z, l, false, 50 + i * 7));
  // Cloth shop banners hanging from a few eaves: depth and colour.
  HOUSES.forEach(({ side, z }, n) => {
    if (n % 3 !== 1) return;
    k.box(n % 2 ? "clothBlue" : "clothRed", [side * (FACE_X - 0.35), 2.05, z - 1.75], [0.03, 1.25, 0.46]);
    k.box("woodDark", [side * (FACE_X - 0.35), 2.72, z - 1.75], [0.05, 0.05, 0.56]);
  });

  // A bench by the kerb and a vendor's cart near the well.
  platform(k, VILLAGE.bench.x, VILLAGE.bench.z, VILLAGE.bench.d, VILLAGE.bench.w, Math.PI / 2);
  bed(k, 4.35, 9.3, 0.8, 1.2, 19);
  cart(k, VILLAGE.cart.x, VILLAGE.cart.z, VILLAGE.cart.w, VILLAGE.cart.d);

  // A laid granite walk (박석) up the middle of the cobbled street, parting
  // round the well. Round stepping stones read as pale discs on paving.
  slabWalk(k, 0, HL - 0.5, 0, 1.2, 1.25, 5);
  slabWalk(k, 0, -1.2, 0, -HL + 0.5, 1.25, 29);
  return k;
})();

/** Where a letter sign hangs: its bracket's end, the board 0.46 m below. */
const SIGN_TEXTS = SIGNS.map((s) => s.letter);
const _hang = new Matrix4();
const _swing = new Matrix4();
const _drop = new Matrix4().makeTranslation(0, -0.46, 0);
const _edge = new Matrix4().makeScale(0.74, 0.74, 0.012);

/**
 * The letter signs on the doors as ONE instanced draw: every letter painted
 * on one canvas (useSignAtlas), each board picking its cell in the shader,
 * each still swinging on its own. The yellow edge on the next letters to
 * find is a second small instanced draw. (They were one draw per sign —
 * nine on the street — plus one per edge.)
 */
function LetterSigns({ next }: { next: string[] }) {
  const { texture, cols, rows } = useSignAtlas(SIGN_TEXTS);
  const material = useMemo(() => {
    const m = new MeshBasicMaterial({ map: texture, toneMapped: false });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 aCell;")
        .replace("#include <uv_vertex>", `#include <uv_vertex>\nvMapUv = (vMapUv + vec2(aCell.x, ${rows.toFixed(1)} - 1.0 - aCell.y)) / vec2(${cols.toFixed(1)}, ${rows.toFixed(1)});`);
    };
    m.customProgramCacheKey = () => `klovers-sign-atlas-${cols}x${rows}`;
    return m;
  }, [texture, cols, rows]);
  useEffect(() => () => material.dispose(), [material]);
  const geometry = useMemo(() => {
    const g = signGeometry(0.62, 0.62).clone();
    const cell = new Float32Array(SIGNS.length * 2);
    SIGNS.forEach((_, i) => {
      cell[i * 2] = i % cols;
      cell[i * 2 + 1] = Math.floor(i / cols);
    });
    g.setAttribute("aCell", new InstancedBufferAttribute(cell, 2));
    return g;
  }, [cols]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const edgeIdx = useMemo(() => SIGNS.map((s, i) => (next.includes(s.letter) ? i : -1)).filter((i) => i >= 0), [next]);
  const boards = useRef<InstancedMesh>(null);
  const edges = useRef<InstancedMesh>(null);
  const m = useMemo(() => new Matrix4(), []);
  const place = (t: number) => {
    const at = (i: number) => {
      const s = SIGNS[i];
      const a = REDUCED_MOTION ? 0 : Math.sin(t * (1.1 + (i % 3) * 0.17) + i * 1.7) * 0.045;
      return m.copy(_hang.makeTranslation(s.x, 2.58, s.z)).multiply(_swing.makeRotationZ(a)).multiply(_drop);
    };
    if (boards.current) {
      SIGNS.forEach((_, i) => boards.current?.setMatrixAt(i, at(i)));
      boards.current.instanceMatrix.needsUpdate = true;
    }
    if (edges.current) {
      edgeIdx.forEach((i, n) => edges.current?.setMatrixAt(n, at(i).multiply(_edge)));
      edges.current.count = edgeIdx.length;
      edges.current.instanceMatrix.needsUpdate = true;
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => place(0), [edgeIdx]);
  useFrame(({ clock }) => {
    if (!REDUCED_MOTION) place(clock.elapsedTime);
  });
  return (
    <>
      <instancedMesh ref={boards} args={[geometry, material, SIGNS.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={edges} args={[UNIT.box, EDGE_MAT, 2]} frustumCulled={false} dispose={null} />
    </>
  );
}

/** The thin yellow edge round a sign still to be found. */
const EDGE_MAT = new MeshBasicMaterial({ color: PALETTE.yellow, toneMapped: false });

function Well() {
  const { x, z } = VILLAGE.well;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.37, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[0.8, 0.86, 0.74, 8]} />
        <primitive object={MAT.stoneWarm} attach="material" />
      </mesh>
      <mesh position={[0, 0.745, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[0.84, 0.84, 0.06, 8]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      <mesh position={[0, 0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.66, 16]} />
        <primitive object={MAT.charcoal} attach="material" />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} castShadow position={[sx * 0.72, 1.2, 0]}>
          <boxGeometry args={[0.1, 1.7, 0.1]} />
          <primitive object={MAT.woodDark} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.02, 0]} geometry={curvedRoof(1.5)} scale={[2.3 / 1.5, 0.55, 1.5]} dispose={null}>
        <primitive object={MAT.roofSoft} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
        <primitive object={MAT.woodWarm} attach="material" />
      </mesh>
    </group>
  );
}

export default function HangulVillage({ marketOpen, letters }: { marketOpen: boolean; letters: string[] }) {
  const paving = useTiledTexture(paintPaving, HW, HL);
  const photo = usePhotoFloor("paving", HW, HL);
  // The next two letters still to find carry the yellow edge (a pointer, not decoration).
  const nextLetters = (VILLAGE_LETTERS as readonly string[]).filter((l) => !letters.includes(l)).slice(0, 2);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2 + 0.6, HL * 2, ...FLOOR_GRID]} />
        <meshStandardMaterial key={photo ? "photo" : "painted"} map={photo?.map ?? paving} normalMap={photo?.normal ?? null} roughnessMap={photo?.rough ?? null} roughness={photo ? 1 : 0.95} color={photo ? "#F4EBDD" : "#ffffff"} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[90, 90, ...FLOOR_GRID]} />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      {/* Kerbs */}
      {[-1, 1].map((s) => (
        <mesh key={s} receiveShadow position={[s * (HW + 0.15), 0.08, 0]} scale={[0.3, 0.16, HL * 2]}>
          <boxGeometry />
          <primitive object={MAT.charcoal} attach="material" />
        </mesh>
      ))}
      <Batch kit={VILLAGE_KIT} />
      <Lamps spots={LAMP_SPOTS} size={VILLAGE.lampSize} />
      <Well />

      {/* Hanging signboards, one letter per door, gently swaying. */}
      <LetterSigns next={nextLetters} />

      <group position={[0, 3.72, ARCH_Z]}>
        <Signboard text={VILLAGE.entranceSign} w={2.6} h={0.72} aspect={3.4} />
      </group>

      {/* East: the lane to the KLOVERS Hub (yellow: the way on). */}
      <Gate x={HW + 0.25} z={VILLAGE.hubLaneZ} rotY={-Math.PI / 2} sign={VILLAGE.hubSign} />
      {/* North: the market (Level 1). South: back to the courtyard. */}
      <GateWall z={-HL - 0.2} facing={1} open={marketOpen} sign={VILLAGE.marketSign} halfWidth={HW} />
      <GateWall z={HL + 0.2} facing={-1} open accent={false} halfWidth={HW} />
    </group>
  );
}
