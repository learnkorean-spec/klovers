import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { ACCENT, MAT, std } from "../config/materials";
import { MARKET } from "../config/rooms";
import { PALETTE } from "../config/world";
import Instanced, { type Part } from "./Instanced";
import Batch from "./Batch";
import { Kit, azalea, jitter, awningPlace, kitGeometry, basket, bunting, gutter, parasol, pot, shopfront, tree, wallRun, type MatKey, flowers } from "./kit";
import { GateWall, Lamps, Signboard, Sway } from "./parts";
import ModelProp, { type PropPlacement } from "./ModelProp";
import MarketShop, { type ShopItem } from "./MarketShop";
import { REAL_PROPS } from "../systems/styleMode";
import { paintPaving, useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY } from "./textures";
import { FLOOR_GRID } from "../config/world";

/**
 * Vocabulary Market — the second world (canon: worlds[1]).
 *
 * A busier street than the village: six stalls under canvas awnings, shop
 * fronts rising behind them, paper lanterns strung across the square. Each
 * stall sells one everyday thing (물 밥 빵 · 책 옷 꽃). Its word is not shown
 * until the learner walks up and learns it: then the signboard goes up over
 * the thing — "words learned by the student begin appearing as
 * understandable objects inside the world" (canon).
 */

const HW = MARKET.halfWidth;

/** On each produce table: a flat bamboo tray in the middle, a basket of cabbages at each end. */
const TABLE_TOP = 0.8;
/** The shop's table holds its own three things instead (MarketShop). */
const PRODUCE_TABLES = MARKET.tables.filter((_, i) => i !== MARKET.shop.table);
const TRAYS: PropPlacement[] = PRODUCE_TABLES.map(([x, z]) => ({ x, z, y: TABLE_TOP, width: 0.62 }));
const TABLE_BASKETS: PropPlacement[] = PRODUCE_TABLES.flatMap(([x, z, w, d]) =>
  [-0.3, 0.3].map((t) => ({ x: w >= d ? x + t * w : x, z: w >= d ? z : z + t * d, y: TABLE_TOP, width: 0.5 })),
);
const CABBAGES: PropPlacement[] = TABLE_BASKETS.flatMap((b, i) =>
  [[-0.08, 0.02], [0.08, -0.03], [0, 0.09]].map(([dx, dz], j) => ({ x: b.x + dx, z: b.z + dz, y: TABLE_TOP + 0.05, height: 0.2, rotY: i * 1.3 + j * 2.1 })),
);
const HD = MARKET.halfDepth;
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
              <cylinderGeometry args={[0.045, 0.045, 0.26, 24]} />
              {white()}
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.04, 16]} />
              <primitive object={MAT.charcoal} attach="material" />
            </mesh>
          </group>
        )),
      );
    case "밥": // rice bowls
      return each(() => (
        <>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.12, 0.07, 0.09, 32]} />
            <primitive object={MAT.charcoal} attach="material" />
          </mesh>
          <mesh position={[0, 0.085, 0]} scale={[1, 0.55, 1]}>
            <sphereGeometry args={[0.11, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {white()}
          </mesh>
        </>
      ));
    case "빵": // loaves
      return each(() => (
        <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.8]}>
          <capsuleGeometry args={[0.08, 0.18, 10, 20]} />
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
            <cylinderGeometry args={[0.1, 0.075, 0.2, 28]} />
            <primitive object={MAT.woodDark} attach="material" />
          </mesh>
          {[[0, 0.3, 0], [0.07, 0.26, 0.05], [-0.07, 0.27, -0.04]].map((p, k) => (
            <mesh key={k} position={p as [number, number, number]}>
              <sphereGeometry args={[0.065, 20, 14]} />
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
    const counter: Part[] = [], top: Part[] = [], post: Part[] = [], stripe: Part[] = [];
    // Awning cloth in three muted dyes, so neighbouring stalls differ.
    const awning: Part[][] = [[], [], []];
    const hw = MARKET.stallW / 2;
    const hd = MARKET.stallD / 2;
    STALLS.forEach(({ side, z }, n) => {
      const cx = side * MARKET.stallX;
      const front = -side;
      counter.push({ p: [cx + front * 0.55, 0.45, z], s: [1, 0.9, MARKET.stallD - 0.4] });
      top.push({ p: [cx + front * 0.55, 0.92, z], s: [1.1, 0.05, MARKET.stallD - 0.3] });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) post.push({ p: [cx + sx * (hw - 0.08), 1.2, z + sz * (hd - 0.08)], s: [0.1, 2.4, 0.1] });
      // Striped canvas awning, sagging between its bars, lower at the front
      // edge, with a scalloped valance: dyed lanes per stall, ivory between.
      const a = awningPlace(cx, 2.5, z, MARKET.stallW + 0.3, MARKET.stallD + 0.2, front as -1 | 1, 0.18);
      awning[n % 3].push(a);
      stripe.push(a);
    });
    return { counter, top, post, awning, stripe };
  }, []);
}

/**
 * One tier of the centre produce stand: a dark octagonal core faced with
 * upright boards (gaps show the core), a corner post at each angle and a
 * plinth rail — a built wooden stand instead of a smooth turned block.
 * Boards are instances of the shared box, so the stand adds no draw calls.
 */
function plankDrum(k: Kit, x: number, z: number, size: number, y0: number, h: number): void {
  const r = size / 2;
  const apo = r * Math.cos(Math.PI / 8);
  const face = 2 * r * Math.sin(Math.PI / 8);
  k.add("woodDark", "oct", [x, y0 + h / 2, z], [size - 0.04, h, size - 0.04], [0, Math.PI / 8, 0], true);
  const n = face > 0.5 ? 4 : 3;
  const bw = face / n;
  for (let j = 0; j < 8; j++) {
    const a = (j * Math.PI) / 4;
    const nx = Math.sin(a);
    const nz = Math.cos(a);
    for (let b = 0; b < n; b++) {
      const t = (b - (n - 1) / 2) * bw;
      const seed = j * 7 + b + size * 13;
      // Boards stand a hair proud by different amounts and lean a touch:
      // each catches the light on its own, like hand-nailed planks.
      const out = apo - 0.018 + 0.008 + jitter(seed, 0.005);
      const bh = h - 0.05 + jitter(seed + 3, 0.02);
      k.box("woodLight", [x + nx * out + Math.cos(a) * t, y0 + 0.03 + bh / 2, z + nz * out - Math.sin(a) * t], [bw - 0.016, bh, 0.022], false, [jitter(seed + 5, 0.015), a + jitter(seed + 9, 0.03), 0]);
    }
    // Corner post and a low rail at the foot.
    const c = a + Math.PI / 8;
    k.box("woodDark", [x + Math.sin(c) * (r - 0.005), y0 + h / 2, z + Math.cos(c) * (r - 0.005)], [0.045, h, 0.045], false, [0, c, 0]);
    k.box("woodDark", [x + nx * (apo + 0.012), y0 + 0.05, z + nz * (apo + 0.012)], [face + 0.01, 0.07, 0.03], false, [0, a, 0]);
  }
}

/** Shop fronts, walls, baskets and banner poles: one Kit for the square. */
const MARKET_KIT: Kit = (() => {
  const k = new Kit();
  const heights = [3.6, 4.4, 3.2, 4.0];
  for (const side of [-1, 1] as const) {
    // Low walls behind the stalls, then two-storey shops rising behind them.
    wallRun(k, side * (HW + 0.2), -HD - 0.4, side * (HW + 0.2), HD + 0.4, 1.6, 0.35);
    heights.forEach((_, i) => {
      const h = heights[(i + (side > 0 ? 2 : 0)) % 4];
      shopfront(k, { x: side * (HW + 2.8), z: -HD + 2 + i * 4, w: 3.6, d: 3.7, h, face: side > 0 ? "-x" : "+x" });
    });
  }
  // Baskets of goods in front of the stalls: the square looks traded in.
  // Produce in the baskets: apples, citrus, greens, bread-brown.
  const heaps: MatKey[] = ["fruitRed", "fruitOrange", "leaf", "woodLight", "fruitRed", "fruitOrange"];
  MARKET.baskets.forEach(([x, z, sc], i) => basket(k, x, z, sc, heaps[i % heaps.length]));
  // Banner poles by the north gate.
  for (const s of [-1, 1]) gutter(k, s * (HW - 0.27), -HD, s * (HW - 0.27), HD);
  // Cloth bunting across the square, and flowers by the gate.
  bunting(k, -HW, -4.9, HW, -4.9, 4.35, 1);
  // The centrepiece: a two-tier produce stand under a big striped parasol —
  // the square's one landmark, full of the colours the words name.
  {
    const { x, z, size } = MARKET.crates;
    const r = size / 2;
    plankDrum(k, x, z, size, 0, 0.56);
    k.add("woodDark", "oct", [x, 0.58, z], [size + 0.08, 0.06, size + 0.08], [0, Math.PI / 8, 0]);
    plankDrum(k, x, z, size * 0.55, 0.61, 0.37);
    k.add("woodDark", "oct", [x, 1.0, z], [size * 0.55 + 0.06, 0.05, size * 0.55 + 0.06], [0, Math.PI / 8, 0]);
    const heapsLow: MatKey[] = ["fruitRed", "fruitOrange", "leaf", "fruitRed", "woodLight", "fruitOrange"];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      basket(k, x + Math.sin(a) * r * 0.72, z + Math.cos(a) * r * 0.72, 0.5, heapsLow[i], 0.61);
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      basket(k, x + Math.sin(a) * r * 0.3, z + Math.cos(a) * r * 0.3, 0.42, (["fruitOrange", "leaf", "fruitRed"] as MatKey[])[i], 1.03);
    }
    k.add("woodDark", "cyl", [x, 2.0, z], [0.09, 2.6, 0.09]);
    parasol(k, "clothRed", x, 3.2, z, 3.6, 0.7);
    k.add("woodDark", "ball", [x, 3.72, z], [0.1, 0.1, 0.1]);
  }
  // Flowers by the stall ends: green and colour between the counters.
  for (const [fx, fz] of MARKET.flowers) flowers(k, fx, fz, 0.7, fx + fz);
  for (const x of [-3.6, 3.6]) {
    pot(k, x, -HD + 0.7, 0.8, false);
    azalea(k, x, -HD + 0.7, 0.5, x > 0 ? 4 : 5);
  }
  // Trees rising behind the shop roofs.
  for (const [tx, tz] of [[-13.5, -5], [13.8, 3], [-13.2, 6.5]] as const) tree(k, tx, tz, 1.4, false, tx + tz);
  // Produce tables under parasols in the square: the middle is traded in
  // too, and the parasols give the square a skyline of colour.
  MARKET.tables.forEach(([x, z, w, d], i) => {
    k.box("woodLight", [x, 0.74, z], [w, 0.07, d], true);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box("woodDark", [x + sx * (w / 2 - 0.08), 0.36, z + sz * (d / 2 - 0.08)], [0.07, 0.72, 0.07]);
    k.box("fabric", [x, 0.79, z], [w * 0.8, 0.02, d * 0.8]);
    const along = w >= d;
    // Real bamboo baskets of cabbage replace these when the props load.
    if (!REAL_PROPS && i !== MARKET.shop.table)
      for (const t of [-0.3, 0.3]) {
        const bx = along ? x + t * w : x;
        const bz = along ? z : z + t * d;
        basket(k, bx, bz, 0.62, (["fruitRed", "fruitOrange", "leaf", "woodLight"] as MatKey[])[(i * 2 + (t > 0 ? 1 : 0)) % 4], 0.8);
      }
    // A crate at the table's end.
    k.box("woodLight", along ? [x - w / 2 - 0.35, 0.2, z] : [x, 0.2, z - d / 2 - 0.35], [0.5, 0.4, 0.5], true, [0, 0.3, 0]);
    k.add("woodDark", "cyl", [x, 1.6, z], [0.07, 3.2, 0.07]);
    parasol(k, i % 2 ? "clothBlue" : "clothRed", x, 2.95, z, 2.6, 0.55);
  });
  for (const x of [-2.6, 2.6]) {
    k.add("stoneWarm", "oct", [x, 0.12, -HD + 0.9], [0.4, 0.24, 0.4]);
    k.box("woodDark", [x, 1.7, -HD + 0.9], [0.1, 3.4, 0.1], true);
    k.box("woodDark", [x, 3.3, -HD + 0.9], [0.9, 0.06, 0.06]);
  }
  return k;
})();

/** A sign that has just gone up: it swings into place (a new word learned). */
function PopIn({ animate, children }: { animate: boolean; children: ReactNode }) {
  const g = useRef<Group>(null);
  const t0 = useRef(-1);
  useFrame(({ clock }) => {
    if (!animate || !g.current) return;
    if (t0.current < 0) t0.current = clock.elapsedTime;
    const k = Math.min(1, (clock.elapsedTime - t0.current) / 0.5);
    const e = 1 + 2.4 * (k - 1) ** 3 + 1.4 * (k - 1) ** 2;
    g.current.scale.setScalar(Math.max(0.001, e));
  });
  return (
    <group ref={g} scale={animate ? 0.001 : 1}>
      {children}
    </group>
  );
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

export default function VocabularyMarket({
  nextOpen,
  breadSign,
  words,
  shopChosen,
  onShopPress,
}: {
  nextOpen: boolean;
  breadSign: boolean;
  words: string[];
  shopChosen?: { item: string; at: number } | null;
  onShopPress?: (item: ShopItem) => void;
}) {
  const paving = useTiledTexture(paintPaving, HW, HD);
  const photo = usePhotoFloor("paving", HW, HD);
  // Signs already up when the market opened stay still; new ones swing in.
  const atMount = useRef(new Set([...words, ...(breadSign ? ["빵"] : [])]));
  const stalls = useStallParts();
  const strings = useStringLights();
  return (
    <group>
      {REAL_PROPS && (
        <>
          <ModelProp name="tray" at={TRAYS} />
          <ModelProp name="basket" at={TABLE_BASKETS} />
          <ModelProp name="cabbage" at={CABBAGES} />
        </>
      )}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HD * 2, ...FLOOR_GRID]} />
        <meshStandardMaterial key={photo ? "photo" : "painted"} map={photo?.map ?? paving} normalMap={photo?.normal ?? null} roughnessMap={photo?.rough ?? null} roughness={photo ? 1 : 0.95} color={photo ? "#F4EBDD" : "#ffffff"} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80, ...FLOOR_GRID]} />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      <Batch kit={MARKET_KIT} />
      <MarketShop words={words} chosen={shopChosen} onPress={onShopPress} />
      {/* Two cloth banners by the gate: the market's small movement. */}
      {[-2.6, 2.6].map((x, i) => (
        <group key={x} position={[x + 0.3, 3.28, -HD + 0.9]}>
          <Sway axis="x" amp={0.08} speed={1.6} phase={i * 2.1}>
            <mesh position={[0, -0.75, 0]}>
              <boxGeometry args={[0.55, 1.5, 0.02]} />
              <primitive object={MAT.plaster} attach="material" />
            </mesh>
            <mesh position={[0, -0.75, 0.012]}>
              <boxGeometry args={[0.55, 0.12, 0.01]} />
              <primitive object={MAT.charcoal} attach="material" />
            </mesh>
          </Sway>
        </group>
      ))}

      <Instanced parts={stalls.counter} material={MAT.woodWarm} castShadow receiveShadow />
      <Instanced parts={stalls.top} material={MAT.woodDark} />
      <Instanced parts={stalls.post} material={MAT.woodDark} castShadow />
      <Instanced parts={stalls.awning[0]} material={MAT.clothRed} geometry={kitGeometry("awningA")} castShadow />
      <Instanced parts={stalls.awning[1]} material={MAT.clothBlue} geometry={kitGeometry("awningA")} castShadow />
      <Instanced parts={stalls.awning[2]} material={MAT.clothSage} geometry={kitGeometry("awningA")} castShadow />
      <Instanced parts={stalls.stripe} material={MAT.fabric} geometry={kitGeometry("awningB")} castShadow />
      {STALLS.map(({ side, z, word }) => {
        const front = -side;
        return (
          <group key={word}>
            <group position={[side * MARKET.stallX + front * 0.55, 0.945, z]}>
              <Goods word={word} />
            </group>
            {/* The word, hanging at the front edge of the awning. */}
            <group
              position={[side * MARKET.stallX + front * (MARKET.stallW / 2 + 0.15), 2.36, z]}
              rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            >
              {word !== "빵" && !words.includes(word) ? null : word === "빵" && !breadSign ? (
                // The baker's sign has come down: it hangs by one corner from
                // its hook, blank. Something clearly belongs here.
                <>
                  <mesh position={[0.34, 0.02, 0]} scale={[0.07, 0.07, 0.07]}>
                    <torusGeometry args={[0.6, 0.25, 6, 12]} />
                    <primitive object={ACCENT} attach="material" />
                  </mesh>
                  <group position={[0.34, -0.02, 0]} rotation={[0, 0, 0.62]}>
                    <group position={[-0.45, -0.27, 0]}>
                      <Signboard text="" w={0.9} h={0.54} aspect={1.7} />
                    </group>
                  </group>
                </>
              ) : (
                <PopIn animate={!atMount.current.has(word)}>
                  <Sway amp={0.035} speed={1.2} phase={z}>
                    <group position={[0, -0.27, 0]}>
                      <Signboard text={word} w={0.9} h={0.54} aspect={1.7} />
                    </group>
                  </Sway>
                </PopIn>
              )}
            </group>
          </group>
        );
      })}

      <Instanced parts={strings.line} material={MAT.charcoal} />
      <Instanced parts={strings.lights} material={MAT.lanternPaper} />
      <Lamps spots={LAMP_SPOTS} size={MARKET.lampSize} />
      {/* North: on to the KLOVERS Hub. South: back to the village. */}
      <GateWall z={-HD - 0.2} facing={1} open={nextOpen} sign={MARKET.nextSign} halfWidth={HW} />
      <GateWall z={HD + 0.2} facing={-1} open accent={false} halfWidth={HW} />
    </group>
  );
}
