import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { GARDEN, GARDEN_BEDS } from "../config/rooms";
import { FLOOR_GRID } from "../config/world";
import Batch from "./Batch";
import { Kit, flowers, jitter, rock, steppingStones, stoneLantern, tree } from "./kit";
import { GateWall } from "./parts";
import { floorBreakup } from "./textures";

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
const GRASS = "#7F9D53";

/**
 * A kept lawn: the floor's broad tone breakup, plus faint mowing stripes,
 * patches of clover and darker grass, and blade-sized speckle that tilts
 * the normal a little so the sun glints across it. Fine detail fades out
 * with distance (fwidth) so it never shimmers on phones.
 */
const LAWN = (() => {
  const m = new MeshStandardMaterial({ color: GRASS, roughness: 0.96 });
  m.onBeforeCompile = (shader) => {
    floorBreakup(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
{
  vec2 q = vFbPos.xz;
  // Mowing stripes, a pass 1.4 m wide, alternately light and dark.
  float st = smoothstep(0.42, 0.58, abs(fract(q.x / 2.8) * 2.0 - 1.0));
  diffuseColor.rgb *= mix(0.93, 1.06, st);
  // Clover and lusher patches.
  float pa = fbNoise(q * 0.9 + 21.3);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.84, 0.95, 0.86), smoothstep(0.62, 0.8, pa) * 0.8);
  float dry = fbNoise(q * 0.55 + 4.1);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.08, 1.03, 0.86), smoothstep(0.66, 0.86, dry) * 0.6);
  // Blades: speckle at grass scale, faded by screen-space size.
  float fw = fwidth(q.x * 30.0) + fwidth(q.y * 30.0);
  float amp = 1.0 - smoothstep(0.35, 1.2, fw);
  float bl = fbNoise(q * 30.0) * 0.6 + fbNoise(q * 71.0) * 0.4;
  diffuseColor.rgb *= mix(1.0, mix(0.82, 1.1, bl), amp);
}`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
{
  vec2 q = vFbPos.xz * 30.0;
  float fw = fwidth(q.x) + fwidth(q.y);
  float amp = (1.0 - smoothstep(0.35, 1.2, fw)) * 0.35;
  float b0 = fbNoise(q);
  vec2 gr = vec2(fbNoise(q + vec2(0.25, 0.0)) - b0, fbNoise(q + vec2(0.0, 0.25)) - b0) / 0.25;
  normal = normalize(normal - (viewMatrix * vec4(gr.x, 0.0, gr.y, 0.0)).xyz * amp);
}`,
      );
  };
  m.customProgramCacheKey = () => "klovers-lawn-1";
  return m;
})();

/** The still parts of the garden: hedges, pond rim, tree, stone, path, bench. */
function gardenKit(): Kit {
  const k = new Kit();
  // Clipped hedges on the north, south and west sides: a body and soft lumps on top.
  const hedge = (x1: number, z1: number, x2: number, z2: number, seed: number) => {
    const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
    const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    // The body: clipped blocks end to end, each well past its slot
    // so their soft ends overlap into one hedge.
    const nb = Math.max(1, Math.round(len / 1.8));
    for (let i = 0; i < nb; i++) {
      const t = -len / 2 + (i + 0.5) * (len / nb);
      const bl = (len / nb) * 1.4;
      const w = 0.92 + jitter(seed * 7 + i, 0.04);
      const hh = 1.62 + jitter(seed * 11 + i, 0.05);
      // Two lump patterns, each also turned end for end, stepped along the hedge, so
      // neighbouring blocks never repeat the same quilting.
      const v = (i * 3 + seed) % 4;
      k.add("leafDark", v & 1 ? "hedgeB" : "hedge", alongX ? [cx + t, hh / 2, cz] : [cx, hh / 2, cz + t], alongX ? [bl, hh, w] : [w, hh, bl], [0, jitter(seed * 13 + i, 0.03) + (v & 2 ? Math.PI : 0), 0], true);
    }
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
  // Five seat boards with gaps, overhanging a little, on two bearers resting
  // on cut-stone legs.
  const slat = (B.d - 0.04) / 5;
  for (let i = 0; i < 5; i++) k.box("woodDark", [B.x + jitter(i * 5 + 2, 0.008), 0.43, B.z - B.d / 2 + 0.02 + slat * (i + 0.5)], [B.w, 0.045, slat - 0.025], true, [0, 0, jitter(i * 3 + 1, 0.006)]);
  for (const sx of [-1, 1]) {
    k.box("woodLight", [B.x + sx * (B.w / 2 - 0.2), 0.385, B.z], [0.12, 0.05, B.d - 0.06]);
    k.box("stoneWarm", [B.x + sx * (B.w / 2 - 0.2), 0.18, B.z], [0.26, 0.36, B.d - 0.2], true);
    k.box("stoneWarm", [B.x + sx * (B.w / 2 - 0.2), 0.02, B.z], [0.32, 0.04, B.d - 0.12]);
  }

  // The beds' stone kerbs and moss.
  for (const b of GARDEN_BEDS) {
    // A round kerb of cut stone holding dark, freshly turned soil.
    k.add("stoneWarm", "cyl", [b.x, 0.08, b.z], [1.3, 0.16, 1.3], [0, b.a, 0]);
    k.add("soil", "cyl", [b.x, 0.12, b.z], [1.12, 0.1, 1.12], [0, b.a, 0]);
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
        <primitive object={LAWN} attach="material" />
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
