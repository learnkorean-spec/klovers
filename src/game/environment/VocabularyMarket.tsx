import { useMemo, type ReactNode } from "react";
import { MAT, std } from "../config/materials";
import { MARKET } from "../config/rooms";
import { PALETTE } from "../config/world";
import Instanced, { UNIT, type Part } from "./Instanced";
import { GateWall, Lamps, Signboard } from "./parts";
import { paintPaving, useTiledTexture } from "./textures";

/**
 * Vocabulary Market — the second world (canon: worlds[1]).
 *
 * A busier street than the village: six stalls under canvas awnings, shop
 * fronts rising behind them, paper lanterns strung across the square. Each
 * stall sells one everyday thing and names it in Korean (물 밥 빵 · 책 옷 꽃),
 * so the word hangs right above the object — "words learned by the student
 * begin appearing as understandable objects inside the world" (canon).
 */

const HW = MARKET.halfWidth;
const HD = MARKET.halfDepth;
const WALL_H = 2.8;
const LAMP_SPOTS = MARKET.lamps.map((l) => ({ x: l.x, z: l.z }));

type Word = (typeof MARKET.stallsLeft)[number] | (typeof MARKET.stallsRight)[number];

const white = () => <primitive object={std(PALETTE.white, 0.4)} attach="material" />;

/** Goods on a counter, in the stall's local space (counter top at y 0). */
function Goods({ word }: { word: Word }) {
  const zs = [-0.9, -0.3, 0.3, 0.9];
  const each = (f: (i: number) => ReactNode) => (
    <>
      {zs.map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          {f(i)}
        </group>
      ))}
    </>
  );
  switch (word) {
    case "물": // water bottles
      return each(() =>
        [-0.1, 0.1].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.26, 10]} />
              {white()}
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.04, 8]} />
              <primitive object={MAT.charcoal} attach="material" />
            </mesh>
          </group>
        )),
      );
    case "밥": // rice bowls
      return each(() => (
        <>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.12, 0.07, 0.09, 16]} />
            <primitive object={MAT.charcoal} attach="material" />
          </mesh>
          <mesh position={[0, 0.085, 0]} scale={[1, 0.55, 1]}>
            <sphereGeometry args={[0.11, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {white()}
          </mesh>
        </>
      ));
    case "빵": // loaves
      return each(() => (
        <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.8]}>
          <capsuleGeometry args={[0.08, 0.18, 6, 10]} />
          <primitive object={MAT.woodWarm} attach="material" />
        </mesh>
      ));
    case "책": // stacked books
      return each((i) =>
        [0, 1, 2].map((k) => (
          <mesh key={k} position={[0, 0.035 + k * 0.07, 0]} rotation={[0, (k - 1) * 0.12, 0]}>
            <boxGeometry args={[0.3, 0.065, 0.22]} />
            <primitive object={[MAT.charcoal, MAT.plaster, MAT.woodWarm][(k + i) % 3]} attach="material" />
          </mesh>
        )),
      );
    case "옷": // folded clothes
      return each((i) =>
        [0, 1].map((k) => (
          <mesh key={k} position={[0, 0.03 + k * 0.055, 0]}>
            <boxGeometry args={[0.34, 0.05, 0.3]} />
            <primitive object={[MAT.plaster, MAT.charcoal, MAT.woodDark][(k + i) % 3]} attach="material" />
          </mesh>
        )),
      );
    case "꽃": // flowers in pots — the one stall allowed a touch of yellow
      return each((i) => (
        <>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.1, 0.075, 0.2, 12]} />
            <primitive object={MAT.woodDark} attach="material" />
          </mesh>
          {[[0, 0.3, 0], [0.07, 0.26, 0.05], [-0.07, 0.27, -0.04]].map((p, k) => (
            <mesh key={k} position={p as [number, number, number]}>
              <sphereGeometry args={[0.065, 10, 8]} />
              <primitive object={(k + i) % 3 === 0 ? std(PALETTE.yellow, 0.7) : std(PALETTE.white, 0.7)} attach="material" />
            </mesh>
          ))}
        </>
      ));
    default:
      return null;
  }
}

interface StallSpot {
  side: -1 | 1;
  z: number;
  word: Word;
}

const STALLS: StallSpot[] = MARKET.stallZ.flatMap((z, i) => {
  const n = MARKET.stallZ.length - 1 - i; // south → north
  return [
    { side: -1 as const, z, word: MARKET.stallsLeft[n] },
    { side: 1 as const, z, word: MARKET.stallsRight[n] },
  ];
});

/** Stall frames, counters and awnings: instanced across all six stalls. */
function useStallParts() {
  return useMemo(() => {
    const counter: Part[] = [], top: Part[] = [], post: Part[] = [], awning: Part[] = [], stripe: Part[] = [];
    const hw = MARKET.stallW / 2;
    const hd = MARKET.stallD / 2;
    for (const { side, z } of STALLS) {
      const cx = side * MARKET.stallX;
      const front = -side;
      counter.push({ p: [cx + front * 0.55, 0.45, z], s: [1, 0.9, MARKET.stallD - 0.4] });
      top.push({ p: [cx + front * 0.55, 0.92, z], s: [1.1, 0.05, MARKET.stallD - 0.3] });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) post.push({ p: [cx + sx * (hw - 0.08), 1.2, z + sz * (hd - 0.08)], s: [0.1, 2.4, 0.1] });
      // Canvas awning, lower at the front edge.
      const tilt: [number, number, number] = [0, 0, side * 0.18];
      awning.push({ p: [cx, 2.45, z], s: [MARKET.stallW + 0.3, 0.06, MARKET.stallD + 0.2], r: tilt });
      for (const k of [-1, 0, 1]) stripe.push({ p: [cx, 2.485, z + k * 0.9], s: [MARKET.stallW + 0.31, 0.012, 0.28], r: tilt });
    }
    return { counter, top, post, awning, stripe };
  }, []);
}

/** Two- and three-storey shop fronts behind the stalls: the market's skyline. */
function useSkyline() {
  return useMemo(() => {
    const body: Part[] = [], band: Part[] = [], eave: Part[] = [], win: Part[] = [];
    const heights = [4.2, 5.4, 3.8, 4.8];
    for (const side of [-1, 1]) {
      heights.forEach((_, i) => {
        const z = -HD + 2 + i * 4;
        const x = side * (HW + 2.6);
        const h = heights[(i + (side > 0 ? 2 : 0)) % 4];
        body.push({ p: [x, h / 2, z], s: [4, h, 3.8] });
        band.push({ p: [x, 0.5, z], s: [4.02, 1, 3.82] });
        eave.push({ p: [x, h + 0.1, z], s: [4.6, 0.2, 4.3] });
        win.push({ p: [x - side * 2.01, h - 1.1, z], s: [0.02, 0.7, 2.4] });
      });
    }
    return { body, band, eave, win };
  }, []);
}

/** Paper lanterns strung across the square on two lines. */
function useStringLights() {
  return useMemo(() => {
    const lights: Part[] = [], line: Part[] = [];
    for (const z of [-2.2, 2.2]) {
      line.push({ p: [0, 3.35, z], s: [HW * 2, 0.02, 0.02] });
      for (let x = -HW + 1; x <= HW - 1 + 1e-6; x += 1.4) {
        const sag = 0.35 * (1 - (x / HW) ** 2);
        lights.push({ p: [x, 3.2 - sag, z], s: [0.22, 0.28, 0.22] });
      }
    }
    return { lights, line };
  }, []);
}

function SideWalls() {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (HW + 0.2), 0, 0]}>
          <mesh receiveShadow position={[0, WALL_H / 2, 0]} scale={[0.4, WALL_H, HD * 2 + 0.8]}>
            <primitive object={UNIT.box} attach="geometry" />
            <primitive object={MAT.plaster} attach="material" />
          </mesh>
          <mesh position={[0, 0.45, 0]} scale={[0.42, 0.9, HD * 2 + 0.82]}>
            <primitive object={UNIT.box} attach="geometry" />
            <primitive object={MAT.charcoal} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Crates() {
  const { x, z, size } = MARKET.crates;
  const parts: Part[] = useMemo(
    () => [
      { p: [x - 0.35, size * 0.2, z - 0.3], s: [size * 0.52, size * 0.39, size * 0.52] },
      { p: [x + 0.38, size * 0.2, z + 0.3], s: [size * 0.52, size * 0.39, size * 0.52], r: [0, 0.3, 0] },
      { p: [x + 0.3, size * 0.17, z - 0.38], s: [size * 0.45, size * 0.34, size * 0.45], r: [0, -0.2, 0] },
      { p: [x, size * 0.58, z], s: [size * 0.48, size * 0.36, size * 0.48], r: [0, 0.5, 0] },
    ],
    [x, z, size],
  );
  return <Instanced parts={parts} material={MAT.woodWarm} castShadow receiveShadow />;
}

export default function VocabularyMarket({ nextOpen, breadSign }: { nextOpen: boolean; breadSign: boolean }) {
  const paving = useTiledTexture(paintPaving, HW, HD);
  const stalls = useStallParts();
  const sky = useSkyline();
  const strings = useStringLights();
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HD * 2]} />
        <meshStandardMaterial map={paving} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80]} />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      <SideWalls />
      <Instanced parts={sky.body} material={MAT.plaster} />
      <Instanced parts={sky.band} material={MAT.charcoal} />
      <Instanced parts={sky.eave} material={MAT.roofTile} />
      <Instanced parts={sky.win} material={MAT.paper} />

      <Instanced parts={stalls.counter} material={MAT.woodWarm} castShadow receiveShadow />
      <Instanced parts={stalls.top} material={MAT.woodDark} />
      <Instanced parts={stalls.post} material={MAT.woodDark} castShadow />
      <Instanced parts={stalls.awning} material={MAT.plaster} castShadow />
      <Instanced parts={stalls.stripe} material={MAT.charcoal} />
      {STALLS.map(({ side, z, word }) => {
        const front = -side;
        return (
          <group key={word}>
            <group position={[side * MARKET.stallX + front * 0.55, 0.945, z]}>
              <Goods word={word} />
            </group>
            {/* The word, hanging at the front edge of the awning */}
            <group
              position={[side * MARKET.stallX + front * (MARKET.stallW / 2 + 0.15), 2.1, z]}
              rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            >
              {/* The bread stall's sign is blank until the learner names the
                  loaves — then the word goes back up (world changes after learning). */}
              <Signboard text={word === "빵" && !breadSign ? "" : word} w={0.9} h={0.54} aspect={1.7} />
            </group>
          </group>
        );
      })}

      <Instanced parts={strings.line} material={MAT.charcoal} />
      <Instanced parts={strings.lights} material={MAT.lanternPaper} />
      <Crates />
      <Lamps spots={LAMP_SPOTS} size={MARKET.lampSize} />
      {/* North: on to the KLOVERS Hub. South: back to the village. */}
      <GateWall z={-HD - 0.2} facing={1} open={nextOpen} sign={MARKET.nextSign} halfWidth={HW} />
      <GateWall z={HD + 0.2} facing={-1} open halfWidth={HW} />
    </group>
  );
}
