import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { GARDEN, GARDEN_BEDS } from "../config/rooms";
import { FLOOR_GRID } from "../config/world";
import Batch from "./Batch";
import { Kit, flowers, jitter, rock, steppingStones, stoneLantern, tree } from "./kit";
import { GateWall } from "./parts";
import { floorBreakup, FLOOR_BREAKUP_KEY } from "./textures";

/**
 * Cluby's Memory Garden (canon worlds "memory-garden"): a quiet green garden
 * where previously learned words come back for review.
 *
 * What it shows is the learner's real review schedule: one flower per word
 * in review (up to 24, three to a bed), open once the word has been reviewed
 * and is resting until its next review, a closed bud while it is due or not
 * yet reviewed. Reviewing at the memory stone opens the buds — the garden
 * changes with real learning.
 *
 * A pond in the middle, the memory tree (the room's one flowering tree) on
 * its north bank beside the memory stone, a ring of flower beds round the
 * pond, clipped hedges on three sides and the gate back to the Hub east.
 */

const H = GARDEN.half;
const SLOTS_PER_BED = 3;
export const GARDEN_SLOTS = GARDEN_BEDS.length * SLOTS_PER_BED;

const WATER = new MeshStandardMaterial({ color: "#4F7F89", roughness: 0.08, metalness: 0.1, envMapIntensity: 1.4 });
const GRASS = "#8EA662";

/** The still parts of the garden: hedges, pond rim, tree, stone, path, bench. */
function gardenKit(): Kit {
  const k = new Kit();
  // Clipped hedges on the north, south and west sides: a body and soft lumps on top.
  const hedge = (x1: number, z1: number, x2: number, z2: number, seed: number) => {
    const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
    const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    k.box("leafDark", [cx, 0.8, cz], alongX ? [len, 1.6, 0.9] : [0.9, 1.6, len], true);
    const n = Math.round(len / 0.9);
    for (let i = 0; i < n; i++) {
      const t = -len / 2 + (i + 0.5) * (len / n);
      const r = 0.62 + jitter(seed + i, 0.1);
      k.add(i % 3 ? "leafDark" : "leaf", "leafy", alongX ? [cx + t, 1.62, cz + jitter(seed * 3 + i, 0.08)] : [cx + jitter(seed * 3 + i, 0.08), 1.62, cz + t], [r * 1.3, r * 0.75, r * 1.2], [0, jitter(seed * 5 + i, 2), 0]);
    }
  };
  hedge(-H - 0.45, -H - 0.45, H + 0.45, -H - 0.45, 3);
  hedge(-H - 0.45, H + 0.45, H + 0.45, H + 0.45, 17);
  hedge(-H - 0.45, -H, -H - 0.45, H, 31);

  // The pond's rim: weathered stones set into the bank all the way round,
  // big and small mixed, a few smaller ones behind the gaps.
  const P = GARDEN.pond;
  const rimN = 30;
  for (let i = 0; i < rimN; i++) {
    const a = (i / rimN) * Math.PI * 2 + jitter(i * 3, 0.05);
    const s = (i % 3 === 0 ? 1.05 : 0.8) + jitter(i * 7, 0.18);
    rock(k, P.x + Math.sin(a) * (P.r + 0.06), P.z + Math.cos(a) * (P.r + 0.06), s, i + 40);
    if (i % 2) {
      const b = a + Math.PI / rimN;
      rock(k, P.x + Math.sin(b) * (P.r + 0.42), P.z + Math.cos(b) * (P.r + 0.42), 0.55 + jitter(i * 11, 0.12), i + 90);
    }
  }
  // Lily pads on the water.
  [[-0.8, 0.9], [0.6, -0.4], [1.1, 1.3], [-1.2, -0.6]].forEach(([dx, dz], i) => {
    k.add(i % 2 ? "leaf" : "leafDark", "lilyPad", [P.x + dx, 0.066, P.z + dz], [0.5 + jitter(i, 0.12), 0.012, 0.48 + jitter(i * 3, 0.1)], [0, i * 1.9, 0]);
  });

  // The memory tree (the garden's one flowering tree) and the memory stone.
  tree(k, GARDEN.tree.x, GARDEN.tree.z, 1.55, true, 7);
  const S = GARDEN.stone;
  k.add("stoneWarm", "oct", [S.x, 0.1, S.z], [1.0, 0.2, 0.8], undefined, true);
  k.add("stoneWarm", "ball", [S.x, 0.72, S.z], [0.72, 1.2, 0.5], [0.08, 0.3, 0], true);
  // Stone lanterns either side of the way in.
  stoneLantern(k, H - 1.4, -2.0, 0.9);
  stoneLantern(k, H - 1.4, 2.0, 0.9);

  // The way in: stepping stones from the gate between two beds, then round
  // the pond's east bank to the memory stone.
  steppingStones(k, H - 0.6, 0.4, 3.3, 0.4, 0.9, 5, "stoneWarm");
  steppingStones(k, 3.0, -0.4, 2.85, -4.75, 0.85, 9, "stoneWarm");

  // A bench facing the pond.
  const B = GARDEN.bench;
  k.box("woodDark", [B.x, 0.42, B.z], [B.w, 0.08, B.d], true);
  for (const sx of [-1, 1]) k.box("stoneWarm", [B.x + sx * (B.w / 2 - 0.2), 0.2, B.z], [0.22, 0.4, B.d - 0.1]);

  // The beds' stone kerbs and moss.
  for (const b of GARDEN_BEDS) {
    k.add("stoneWarm", "oct", [b.x, 0.08, b.z], [1.3, 0.16, 1.3], [0, b.a, 0]);
    k.add("moss", "oct", [b.x, 0.12, b.z], [1.1, 0.12, 1.1], [0, b.a, 0]);
  }
  return k;
}

let STILL: Kit | null = null;

/** One flower per word in review: open (reviewed, resting) or a closed bud. */
function flowerKit(total: number, open: number): Kit {
  const k = new Kit();
  const shown = Math.min(total, GARDEN_SLOTS);
  const bloom = Math.min(open, shown);
  for (let i = 0; i < shown; i++) {
    const bed = GARDEN_BEDS[i % GARDEN_BEDS.length];
    const slot = Math.floor(i / GARDEN_BEDS.length);
    const a = bed.a + (slot - 1) * 0.9 + Math.PI / 2;
    const x = bed.x + Math.sin(a) * 0.33 * (slot === 1 ? 0 : 1);
    const z = bed.z + Math.cos(a) * 0.33 * (slot === 1 ? 0 : 1);
    if (i < bloom) {
      flowers(k, x, z, 0.62, i * 13 + 1, 0.16);
    } else {
      // A bud: a low leafy mound with a closed pink bud on a short stem.
      k.add("leafDark", "ball", [x, 0.24, z], [0.42, 0.2, 0.38], [0, jitter(i, 2), 0]);
      k.add("leaf", "cyl", [x, 0.4, z], [0.035, 0.26, 0.035]);
      k.add("blossom", "ball", [x, 0.56, z], [0.13, 0.2, 0.13]);
    }
  }
  return k;
}

export default function MemoryGarden({ words, reviewed }: { words: number; reviewed: number }) {
  const still = useMemo(() => (STILL ??= gardenKit()), []);
  const blooms = useMemo(() => flowerKit(words, reviewed), [words, reviewed]);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[H * 2 + 1, H * 2 + 1, ...FLOOR_GRID]} />
        <meshStandardMaterial color={GRASS} roughness={1} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[GARDEN.pond.x, 0.05, GARDEN.pond.z]}>
        <circleGeometry args={[GARDEN.pond.r, 40]} />
        <primitive object={WATER} attach="material" />
      </mesh>
      <Batch kit={still} />
      <Batch kit={blooms} />
      {/* The gate back to the Hub, in the east side, with the garden's name over it. */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <GateWall z={H + 0.2} facing={-1} open accent={false} halfWidth={H} sign={GARDEN.sign} />
      </group>
    </group>
  );
}
