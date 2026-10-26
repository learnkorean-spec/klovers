import { CanvasTexture, Color, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from "three";
import { PALETTE } from "./world";

/**
 * Shared materials for the whole KLOVERS World.
 *
 * Every surface of one colour and finish uses the SAME material object, in
 * every room, so the GPU switches state far less and nothing is rebuilt when
 * the learner changes rooms. Components attach these with
 * `<primitive object={…} attach="material" />`; R3F never disposes a
 * primitive, which is what we want for module-level shared objects.
 */

/**
 * Tiny procedural detail maps (128 px, painted once): wood grain, stone
 * mottle, plaster tooth, tile rows, woven fabric. Near-white, so they only
 * darken the finish's colour a little — enough that wood reads as wood and
 * stone as stone, at no real cost. Created lazily, browser only.
 */
type Detail = "grain" | "stone" | "plaster" | "tile" | "fabric";
const details = new Map<Detail, Texture | null>();

function detail(kind: Detail): Texture | null {
  if (details.has(kind)) return details.get(kind) ?? null;
  let tex: Texture | null = null;
  try {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      let seed = 7;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      if (kind === "grain") {
        for (let i = 0; i < 38; i++) {
          const y = rnd() * size;
          ctx.strokeStyle = `rgba(70,45,25,${0.05 + rnd() * 0.09})`;
          ctx.lineWidth = 0.6 + rnd() * 1.6;
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x <= size; x += 16) ctx.lineTo(x, y + Math.sin(x / 19 + i) * 1.6);
          ctx.stroke();
        }
      } else if (kind === "stone" || kind === "plaster") {
        const n = kind === "stone" ? 260 : 160;
        for (let i = 0; i < n; i++) {
          const r = (kind === "stone" ? 2 : 1.2) + rnd() * (kind === "stone" ? 7 : 4);
          ctx.fillStyle = `rgba(60,50,40,${(kind === "stone" ? 0.05 : 0.025) + rnd() * 0.05})`;
          ctx.beginPath();
          ctx.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (kind === "tile") {
        for (let y = 0; y < size; y += 16) {
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.fillRect(0, y, size, 3);
          for (let x = (y / 16) % 2 ? 0 : 8; x < size; x += 16) {
            ctx.fillStyle = "rgba(0,0,0,0.10)";
            ctx.fillRect(x, y, 2, 16);
          }
        }
      } else {
        for (let i = 0; i < size; i += 4) {
          ctx.fillStyle = "rgba(0,0,0,0.05)";
          ctx.fillRect(i, 0, 2, size);
          ctx.fillRect(0, i, size, 2);
        }
      }
      const t = new CanvasTexture(c);
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
      tex = t;
    }
  } catch {
    tex = null;
  }
  details.set(kind, tex);
  return tex;
}

export interface StdOptions {
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  flatShading?: boolean;
}

const cache = new Map<string, MeshStandardMaterial>();
/** Materials by detail kind, so the photographed details can replace the painted ones. */
const byDetail = new Map<Detail, MeshStandardMaterial[]>();

const PHOTO: Record<Detail, { map: string; normal?: string; scale: number } | null> = {
  plaster: { map: "plaster_detail", normal: "plaster_nor", scale: 0.35 },
  tile: { map: "roof_detail", normal: "roof_nor", scale: 0.6 },
  stone: { map: "stone_detail", normal: "paving_nor", scale: 0.5 },
  grain: { map: "grain_detail", normal: "planks_nor", scale: 0.35 },
  fabric: null,
};
let upgraded = false;

/**
 * Swap the small painted detail maps for photographed ones (Poly Haven,
 * CC0): real plaster tooth, roof tiles, stone and wood grain, with a light
 * normal map for relief. Runs once, after the world is showing; if a photo
 * fails to load, the painted detail simply stays.
 */
export function upgradeMaterialDetails(): void {
  if (upgraded || typeof window === "undefined") return;
  upgraded = true;
  const loader = new TextureLoader();
  const load = (name: string, srgb: boolean) =>
    loader.loadAsync(`/assets/world/tex/${name}.webp`).then((t) => {
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.anisotropy = 16;
      if (srgb) t.colorSpace = SRGBColorSpace;
      return t;
    });
  (Object.keys(PHOTO) as Detail[]).forEach((kind) => {
    const spec = PHOTO[kind];
    if (!spec) return;
    Promise.all([load(spec.map, true), spec.normal ? load(spec.normal, false) : Promise.resolve(null)])
      .then(([map, normal]) => {
        for (const m of byDetail.get(kind) ?? []) {
          m.map = map;
          if (normal) {
            m.normalMap = normal;
            m.normalScale.set(spec.scale, spec.scale);
          }
          m.needsUpdate = true;
        }
      })
      .catch(() => undefined);
  });
}

/**
 * Metres per repeat of a detail map that is laid on by real size instead of
 * by each box's own 0–1 face. The kit draws a 20 m wall (or beam, or wall
 * cap roof) as one unit shape scaled up, so a face-mapped texture was
 * stretched 20× along it: the plaster's tooth smeared into a smooth
 * gradient and the courtyard walls read as grey glass; beams and roofs
 * smeared the same way. Fabric keeps its own mapping.
 */
const WORLD_SCALE: Partial<Record<Detail, number>> = { plaster: 1.4, stone: 1.1, grain: 1.5, tile: 1.8 };
/**
 * How each kind is laid on:
 *  - plane: projected on the face's own plane (no direction — plaster, stone)
 *  - grain: along the part's own longest side, in metres (beams run along
 *    their length, posts and trunks up their height)
 *  - rows:  roof tiles in rows parallel to the eave of each roof side
 */
const WORLD_MODE: Partial<Record<Detail, "plane" | "grain" | "rows">> = { plaster: "plane", stone: "plane", grain: "grain", tile: "rows" };

const UV_BY_MODE = {
  // Walls by (along, up), floors by (x, z).
  plane: "wmUv = wmN.y > max(wmN.x, wmN.z) ? wmP.xz : (wmN.x > wmN.z ? wmP.zy : wmP.xy);",
  // In the part's own frame, in metres: u along its longest side that lies
  // in this face (end grain falls back to the longer of the two others).
  grain: `{
    vec3 wmS = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
    #ifdef USE_INSTANCING
      wmS *= vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    #endif
    vec3 wmL = position * wmS;
    vec3 an = abs(objectNormal);
    int f = an.x > an.y ? (an.x > an.z ? 0 : 2) : (an.y > an.z ? 1 : 2);
    int a = f == 0 ? 1 : 0;
    int b = f == 2 ? 1 : 2;
    bool aLong = wmS[a] >= wmS[b];
    wmUv = aLong ? vec2(wmL[a], wmL[b]) : vec2(wmL[b], wmL[a]);
  }`,
  // Rows parallel to each side's eave: a side facing ±x has its eave along z.
  rows: "wmUv = wmN.x > wmN.z ? vec2(wmP.z, wmP.x) : vec2(wmP.x, wmP.z);",
} as const;

function worldMapped(m: MeshStandardMaterial, metres: number, mode: "plane" | "grain" | "rows"): void {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    prev?.call(m, shader, renderer);
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
{
  vec4 wmP = vec4(transformed, 1.0);
  vec3 wmN = objectNormal;
  #ifdef USE_INSTANCING
    wmP = instanceMatrix * wmP;
    wmN = mat3(instanceMatrix) * wmN;
  #endif
  wmP = modelMatrix * wmP;
  wmN = abs(normalize(mat3(modelMatrix) * wmN));
  vec2 wmUv;
  ${UV_BY_MODE[mode]}
  wmUv /= ${metres.toFixed(2)};
  #ifdef USE_MAP
    vMapUv = wmUv;
  #endif
  #ifdef USE_NORMALMAP
    vNormalMapUv = wmUv;
  #endif
}`,
    );
  };
  const key = m.customProgramCacheKey?.bind(m);
  m.customProgramCacheKey = () => `${key ? key() : ""}|wm${mode}${metres}`;
}

/** A cached lit material for this colour and finish. */
export function std(color: string, roughness = 0.8, extra: Omit<StdOptions, "roughness"> & { detail?: Detail } = {}): MeshStandardMaterial {
  const key = `${color}|${roughness}|${extra.metalness ?? 0}|${extra.emissive ?? ""}|${extra.emissiveIntensity ?? 0}|${extra.flatShading ? 1 : 0}|${extra.detail ?? ""}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({
      color: new Color(color),
      roughness,
      metalness: extra.metalness ?? 0,
      flatShading: extra.flatShading ?? false,
    });
    if (extra.detail) {
      m.map = detail(extra.detail);
      const metres = WORLD_SCALE[extra.detail];
      const mode = WORLD_MODE[extra.detail];
      if (metres && mode) worldMapped(m, metres, mode);
      const list = byDetail.get(extra.detail) ?? [];
      list.push(m);
      byDetail.set(extra.detail, list);
    }
    if (extra.emissive) {
      m.emissive = new Color(extra.emissive);
      m.emissiveIntensity = extra.emissiveIntensity ?? 1;
    }
    cache.set(key, m);
  }
  return m;
}

/** Shared clock for the foliage sway (seconds); advanced by FoliageClock in World.tsx. */
export const FOLIAGE_TIME = { value: 0 };

/**
 * Painted foliage: smooth-shaded, with a deep-shade-to-sunlit-top gradient
 * over each crown, soft dappled clumps (world-space noise) so a crown reads as
 * leaves rather than one flat colour, a warm rim where the edge turns to the
 * light, and a slow breeze that moves the tops more than the bases. All in
 * the material's own shader: no extra draw calls, no textures.
 */
export function foliage(color: string, roughness = 0.9, florets = false): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: new Color(color), roughness, metalness: 0, flatShading: false });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uFoliageTime = FOLIAGE_TIME;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uFoliageTime;
varying vec3 vFolPos;
varying float vFolUp;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vFolUp = clamp(position.y + 0.5, 0.0, 1.0);
{
  vec3 fp = transformed;
  #ifdef USE_INSTANCING
    fp = (instanceMatrix * vec4(fp, 1.0)).xyz;
  #endif
  float ph = fp.x * 0.9 + fp.z * 0.7;
  float sway = sin(uFoliageTime * 1.3 + ph) * 0.5 + sin(uFoliageTime * 0.7 + ph * 1.7) * 0.5;
  transformed.x += sway * 0.03 * vFolUp;
  transformed.z += sway * 0.02 * vFolUp;
}`,
      )
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
{
  vec4 fw = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    fw = instanceMatrix * fw;
  #endif
  vFolPos = (modelMatrix * fw).xyz;
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
${florets ? "#define FOL_FLORETS" : ""}
varying vec3 vFolPos;
varying float vFolUp;
float folHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float folNoise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(folHash(i), folHash(i + vec3(1,0,0)), u.x), mix(folHash(i + vec3(0,1,0)), folHash(i + vec3(1,1,0)), u.x), u.y),
    mix(mix(folHash(i + vec3(0,0,1)), folHash(i + vec3(1,0,1)), u.x), mix(folHash(i + vec3(0,1,1)), folHash(i + vec3(1,1,1)), u.x), u.y),
    u.z);
}`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
{
  // Leaf clusters: bend the normal by a small 3D noise, so a crown catches
  // the sun in many small facets (leaves) instead of as one smooth ball.
  vec3 lq = vFolPos * 7.5;
  float l0 = folNoise(lq);
  vec3 lg = vec3(folNoise(lq + vec3(0.2, 0.0, 0.0)) - l0, folNoise(lq + vec3(0.0, 0.2, 0.0)) - l0, folNoise(lq + vec3(0.0, 0.0, 0.2)) - l0) / 0.2;
  normal = normalize(normal - (viewMatrix * vec4(lg, 0.0)).xyz * 0.28);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  float clump = folNoise(vFolPos * 3.1) * 0.65 + folNoise(vFolPos * 7.3) * 0.35;
  float lit = mix(0.74, 1.12, smoothstep(0.0, 1.0, vFolUp));
  diffuseColor.rgb *= lit * mix(0.88, 1.1, clump);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.06, 1.04, 0.86), smoothstep(0.55, 1.0, clump) * 0.5);
#ifdef FOL_FLORETS
  // Blossom crowns: a fine pattern of pale florets and shadowed gaps, so a
  // flowering tree reads as thousands of small flowers, not pink cotton.
  // Petals are thin: light comes through, so the underside stays pink.
  diffuseColor.rgb *= mix(vec3(1.16, 1.1, 1.08), vec3(1.0), vFolUp);
  float fl = folNoise(vFolPos * 23.0) * 0.6 + folNoise(vFolPos * 47.0) * 0.4;
  diffuseColor.rgb *= mix(0.86, 1.05, smoothstep(0.3, 0.6, fl));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.96, 0.95), smoothstep(0.6, 0.78, fl) * 0.4 * vFolUp);
#endif
}`,
      );
  };
  m.customProgramCacheKey = () => (florets ? "klovers-foliage-2-florets" : "klovers-foliage-2");
  return m;
}

/**
 * KLOVERS yellow as an accent and navigation colour only (gate frames, lamp
 * shades): unlit and not tone-mapped, so it renders as exact #FFFF00.
 */
export const ACCENT = new MeshBasicMaterial({ color: new Color(PALETTE.yellow), toneMapped: false });

/**
 * Natural material colours of the world (not brand colours): warm stone,
 * a muted pine green for the few plants. Brand colours stay the palette's.
 */
export const NATURAL = {
  stoneWarm: "#CBC2AF",
  /**
   * Packed earth of a madang (courtyard floor). Kept clearly warmer and
   * darker than the paving on purpose (5 Oct 2026): the two used to sit
   * within a few points of each other and a courtyard full of both read as
   * one flat beige plane, which is most of what "the floor looks flat"
   * meant. Earth and dressed stone are different materials and now look it.
   */
  madang: "#C2AA84",
  /** Dressed stone paving of streets and squares: cooler, lighter, greyer. */
  paving: "#D3CDC0",
  pine: "#4E7A4C",
  /** Plaster reads ivory under warm light without blowing out to white. */
  plaster: "#F7F1E5",
  leaf: "#6F9E4C",
  leafDark: "#46703D",
  blossom: "#F3A5BD",
  /** The paler, almost white flowers mixed into a cherry crown. */
  blossomPale: "#F7D2DC",
  moss: "#8E9A62",
  /** Ground beyond the walls, and the far hills. */
  ground: "#C9BC98",
  hill: "#8E9E93",
  roof: "#40444B",
  /** Market cloth: muted natural dyes, never brand colours. */
  clothRed: "#B5644D",
  clothBlue: "#566E8E",
  clothSage: "#80926C",
  fruitRed: "#C4473A",
  fruitOrange: "#DD8A3E",
} as const;

/** Named finishes of the world's visual system. */
export const MAT = {
  // Each finish differs in colour AND surface: matte toothy plaster, grained
  // wood with a soft sheen, rough mottled stone, tiled roofs, woven canvas,
  // a little metal for fittings, flat-shaded foliage.
  plaster: std(NATURAL.plaster, 0.97, { detail: "plaster" }),
  charcoal: std(PALETTE.charcoal, 0.85),
  roofTile: std(PALETTE.charcoal, 0.7, { flatShading: true, detail: "tile" }),
  /** Curved hanok roofs: smooth-shaded so the curve reads, tiled rows. */
  roofSoft: std(NATURAL.roof, 0.56, { detail: "tile" }),
  woodDark: std("#664231", 0.6, { detail: "grain" }),
  woodWarm: std("#BC7F48", 0.62, { detail: "grain" }),
  stone: std(NATURAL.ground, 1),
  stoneWarm: std(NATURAL.stoneWarm, 0.98, { detail: "stone" }),
  pine: foliage(NATURAL.pine, 0.9),
  leaf: foliage(NATURAL.leaf, 0.9),
  leafDark: foliage(NATURAL.leafDark, 0.9),
  blossom: foliage(NATURAL.blossom, 0.85, true),
  blossomPale: foliage(NATURAL.blossomPale, 0.85, true),
  moss: std(NATURAL.moss, 1, { detail: "stone" }),
  /** Raked gravel either side of a stone path. */
  gravel: std("#A99A7F", 1, { detail: "stone" }),
  hill: std(NATURAL.hill, 1, { flatShading: true }),
  fabric: std(PALETTE.ivory, 0.92, { detail: "fabric" }),
  clothRed: std(NATURAL.clothRed, 0.92, { detail: "fabric" }),
  clothBlue: std(NATURAL.clothBlue, 0.92, { detail: "fabric" }),
  clothSage: std(NATURAL.clothSage, 0.92, { detail: "fabric" }),
  /** Garden flowers: pink comes from blossom; these add white and lilac. */
  flowerWhite: std("#FBF7F0", 0.75),
  flowerLilac: std("#C8B0E8", 0.75),
  /** Pink petals (the tree blossom material shades by crown height, which
   *  turned small flowers a dark magenta). */
  flowerPink: std("#F2A3BC", 0.75),
  /** A single natural stepping stone: fine tooth, no paving grid. */
  flagstone: std("#A39A87", 0.92, { detail: "plaster" }),
  /** The warm yellow middle of a garden flower. */
  pollen: std("#E9B949", 0.75),
  fruitRed: std(NATURAL.fruitRed, 0.55),
  fruitOrange: std(NATURAL.fruitOrange, 0.6),
  metal: std(PALETTE.charcoal, 0.38, { metalness: 0.55 }),
  /** Hanji paper in a window: warm late-day light glowing through. */
  paper: std("#FFF6E6", 0.95, { emissive: "#FFDDAA", emissiveIntensity: 0.45 }),
  /** Lantern paper: a warm glow, the world's "lights" without real lights. */
  lanternPaper: std("#FFEBC8", 0.9, { emissive: "#FFBE62", emissiveIntensity: 0.95 }),
} as const;
