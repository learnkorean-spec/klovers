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

/**
 * Stepping stones as real stones, not one cast repeated: every stone (its
 * instance position, hashed) gets its own tone and a slight warm/cool cast,
 * soft mottling at a hand's scale, and a darker, weathered rim where the
 * bevel meets the ground. A path of identical pale discs read as dough or
 * snow; a path of varied stones reads as a path. All in the shader: no
 * textures, no draw calls. Expects the flagstone geometry (top ≈ 0.07, edge
 * ≈ 0.01 in its own units).
 */
function naturalStone(m: MeshStandardMaterial): MeshStandardMaterial {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    prev?.call(m, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vStone;
varying vec2 vStoneP;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
{
  vec3 so = modelMatrix[3].xyz;
  vec4 sp = vec4(position, 1.0);
  #ifdef USE_INSTANCING
    so += instanceMatrix[3].xyz;
    sp = instanceMatrix * sp;
  #endif
  sp = modelMatrix * sp;
  float h1 = fract(sin(dot(so.xz, vec2(12.9898, 78.233))) * 43758.5453);
  float h2 = fract(sin(dot(so.xz, vec2(39.3468, 11.135))) * 24634.6345);
  vStone = vec3(h1, h2, 1.0 - smoothstep(0.018, 0.062, position.y));
  vStoneP = sp.xz + vec2(0.7, -0.6) * sp.y;
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vStone;
varying vec2 vStoneP;
float stoneNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
{
  float tone = mix(0.74, 1.04, vStone.x);
  vec3 stoneCast = mix(vec3(1.04, 0.99, 0.92), vec3(0.94, 0.98, 1.04), vStone.y);
  float mottle = 0.86 + 0.2 * stoneNoise(vStoneP * 7.0 + vStone.xy * 31.0) + 0.06 * stoneNoise(vStoneP * 23.0);
  diffuseColor.rgb *= tone * stoneCast * mottle * mix(1.0, 0.7, vStone.z);
}`,
      );
  };
  const key = m.customProgramCacheKey?.bind(m);
  m.customProgramCacheKey = () => `${key ? key() : ""}|stone`;
  return m;
}

/**
 * The far hills: wooded slopes seen through the haze. Smooth geometry
 * (kit "ridge") shaded with crowns of trees from the world position — small
 * dark gaps between rounded canopies, bigger patches of lighter and darker
 * woods, lighter towards the sunlit crests. Fades to its average tone where a
 * crown would be finer than a pixel, so the distance never shimmers.
 */
export function hillWoods(color: string = NATURAL.hill): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: new Color(color), roughness: 1, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHillP;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
{
  vec4 hp = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    hp = instanceMatrix * hp;
  #endif
  vHillP = (modelMatrix * hp).xyz;
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vHillP;
float hillNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  vec2 q = vHillP.xz + vec2(vHillP.y * 0.7, -vHillP.y * 0.4);
  // Crowns: a cell pattern of rounded canopies with dark gaps between.
  vec2 cq = q / 2.0;
  vec2 ci = floor(cq);
  vec2 cf = fract(cq) - 0.5;
  float jx = fract(sin(dot(ci, vec2(41.3, 289.1))) * 43758.5453) - 0.5;
  float jy = fract(sin(dot(ci, vec2(17.7, 113.5))) * 24634.6345) - 0.5;
  float d = length(cf - 0.35 * vec2(jx, jy));
  float crown = 1.0 - smoothstep(0.28, 0.5, d);
  float aa = clamp(1.5 - 1.2 * length(fwidth(cq)), 0.0, 1.0);
  float crowns = mix(0.93, mix(0.87, 1.0, crown) * (0.94 + 0.12 * hillNoise(q / 1.3)), aa);
  float woodsPatch = 0.84 + 0.3 * hillNoise(q / 14.0) + 0.08 * hillNoise(q / 5.0);
  float crest = mix(0.92, 1.1, smoothstep(-10.0, 16.0, vHillP.y));
  vec3 woods = mix(vec3(0.86, 1.0, 0.94), vec3(1.06, 1.02, 0.9), hillNoise(q / 22.0 + 7.0));
  diffuseColor.rgb *= crowns * woodsPatch * crest * woods;
}`,
      );
  };
  m.customProgramCacheKey = () => "klovers-hill-woods";
  return m;
}

/**
 * Seoul seen from the top of Namsan: far-off apartment slabs and office
 * blocks, every one drawn as a plain box. The shader paints each its own
 * pale façade tone (cream, white, warm grey, a few blue-glass towers, from a
 * hash of where it stands) and storeys of windows from its world position —
 * on every wall; roofs a flat grey. The city is built at reduced scale (see
 * Backdrop), so a storey is 1.1 m and a bay 0.95 m here. Where a storey
 * would be finer than a pixel the pattern fades to its average tone, so the
 * distant city never shimmers. One draw call for the whole city.
 */
function cityBlock(): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: new Color("#ffffff"), roughness: 0.85, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    const vary = "varying vec3 vCityP;\nvarying vec3 vCityN;\nvarying float vCityHash;\nvarying vec3 vCityL;\nvarying vec3 vCityS;\nvarying vec3 vCityLN;";
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${vary}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
{
  vec4 cp = vec4(transformed, 1.0);
  vec3 cn = objectNormal;
  vec3 co = modelMatrix[3].xyz;
  vec3 cs = vec3(1.0);
  #ifdef USE_INSTANCING
    cp = instanceMatrix * cp;
    cn = mat3(instanceMatrix) * cn;
    co += instanceMatrix[3].xyz;
    cs = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  #endif
  vCityP = (modelMatrix * cp).xyz;
  vCityN = normalize(mat3(modelMatrix) * cn);
  vCityHash = fract(sin(dot(co.xz, vec2(12.9898, 78.233))) * 43758.5453);
  vCityS = cs;
  vCityL = transformed * cs;
  vCityLN = objectNormal;
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${vary}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  vec3 n = normalize(vCityN);
  vec3 S = vCityS;
  vec3 L = vCityL;
  vec3 ln = normalize(vCityLN);
  // Apartment slabs (아파트): long and thin, glazed balconies on the long
  // sides, blank gable ends with the estate's colour band near the top.
  bool slab = S.z < 1.6 && S.x > 4.5;
  bool glassy = !slab && vCityHash > 0.86;
  vec3 wall = vCityHash < 0.3 ? vec3(0.93, 0.91, 0.86) : vCityHash < 0.55 ? vec3(0.86, 0.84, 0.80) : vCityHash < 0.72 ? vec3(0.90, 0.85, 0.76) : vCityHash < 0.86 ? vec3(0.78, 0.77, 0.76) : vec3(0.55, 0.64, 0.72);
  if (slab) wall = vec3(0.94, 0.93, 0.90);
  float h2 = fract(vCityHash * 7.13);
  vec3 band = h2 < 0.25 ? vec3(0.27, 0.55, 0.62) : h2 < 0.5 ? vec3(0.85, 0.50, 0.30) : h2 < 0.75 ? vec3(0.36, 0.50, 0.75) : vec3(0.52, 0.66, 0.42);
  vec3 glass = glassy ? vec3(0.42, 0.52, 0.62) : vec3(0.44, 0.50, 0.56);
  vec3 c = wall;
  float below = S.y * 0.5 - L.y;
  if (abs(n.y) > 0.5) {
    // Roofs: most low Seoul roofs are painted in green waterproofing (옥상
    // 방수 페인트); the rest bare concrete or dark felt. A pale coping round
    // the parapet.
    vec3 roof = h2 < 0.45 ? vec3(0.50, 0.66, 0.52) : h2 < 0.8 ? vec3(0.66, 0.66, 0.64) : vec3(0.46, 0.46, 0.47);
    if (S.y > 9.0 && h2 < 0.45) roof = vec3(0.66, 0.66, 0.64);
    float edge = min(S.x * 0.5 - abs(L.x), S.z * 0.5 - abs(L.z));
    float rim = 1.0 - smoothstep(0.08, 0.1 + fwidth(edge), edge);
    c = mix(roof, wall * 0.97, rim);
  } else {
    vec2 t = normalize(vec2(-n.z, n.x));
    float along = dot(vCityP.xz, t);
    float u = along / 0.95;
    float v = vCityP.y / 1.1;
    float fu = fract(u);
    float fv = fract(v);
    float aa = clamp(1.6 - 2.2 * max(fwidth(u), fwidth(v)), 0.0, 1.0);
    float w = fract(sin(dot(floor(vec2(u, v)), vec2(41.3, 289.1)) + vCityHash * 17.0) * 43758.5453);
    vec3 detailed;
    vec3 flat_;
    if (slab && abs(ln.x) > 0.5) {
      // Gable end: plain wall, the colour band across its top storeys.
      float b = step(0.6, below) * step(below, 1.9);
      detailed = mix(wall, band, b);
      flat_ = detailed;
    } else if (slab) {
      // Long side: a balcony per flat — solid white rail below, glazing above,
      // thin frames between the flats.
      float rail = step(fv, 0.36);
      float frame = step(0.06, fu) * step(fu, 0.94);
      float pane = (1.0 - rail) * frame * step(fv, 0.94);
      detailed = mix(wall, glass * (0.9 + 0.25 * w), pane);
      flat_ = mix(wall, glass, 0.5);
    } else {
      float win = step(0.18, fu) * step(fu, 0.82) * step(0.32, fv) * step(fv, 0.86);
      if (glassy) win = max(win, step(0.3, fv));
      detailed = mix(wall, glass * (0.85 + 0.3 * w), win);
      flat_ = mix(wall, glass, glassy ? 0.75 : 0.33);
    }
    c = mix(flat_, detailed, aa);
    // A plain parapet band at the top (no windows in it).
    c = mix(c, wall * 0.98, 1.0 - step(0.32, below));
    // Street level (the city floor is at y -30): shopfronts — dark glass
    // under a sign band in a shop's own colour.
    if (!slab && vCityP.y < -29.0) {
      float shop = fract(sin(floor(u) * 12.7 + vCityHash * 31.0) * 43758.5453);
      vec3 signC = shop < 0.3 ? vec3(0.80, 0.30, 0.25) : shop < 0.55 ? vec3(0.95, 0.80, 0.35) : shop < 0.8 ? vec3(0.30, 0.45, 0.70) : vec3(0.92, 0.92, 0.90);
      float sy = vCityP.y + 30.0;
      vec3 front = sy > 0.72 ? signC : vec3(0.30, 0.34, 0.37);
      c = mix(mix(wall, front, 0.6), front, aa);
    }
  }
  diffuseColor.rgb *= c * c;
}`,
      );
  };
  m.customProgramCacheKey = () => "klovers-city-block-2";
  return m;
}

/**
 * The city floor far below Namsan: a grid of streets (every 10 m, wider
 * boulevards every 30 m) with pale pavements, between blocks of paving.
 * Painted from world position, fading to its average where the lines get
 * thinner than a pixel. Parks are separate green slabs (Backdrop).
 */
function cityGround(): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: new Color("#ffffff"), roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGroundP;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
{
  vec4 gp = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    gp = instanceMatrix * gp;
  #endif
  vGroundP = (modelMatrix * gp).xyz;
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGroundP;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  vec2 p = vGroundP.xz;
  vec2 d = abs(p - floor(p / 10.0 + 0.5) * 10.0);
  vec2 big = abs(p - floor(p / 30.0 + 0.5) * 30.0);
  vec2 hw = vec2(big.x < 1.0 ? 1.0 : 0.62, big.y < 1.0 ? 1.0 : 0.62);
  vec2 fw = max(fwidth(p), vec2(0.001));
  vec2 road2 = 1.0 - smoothstep(hw - fw, hw + fw, d);
  vec2 walk2 = 1.0 - smoothstep(hw + 0.28 - fw, hw + 0.28 + fw, d);
  float road = max(road2.x, road2.y);
  float walk = max(walk2.x, walk2.y);
  vec3 paving = vec3(0.71, 0.70, 0.67);
  vec3 c = mix(paving, vec3(0.80, 0.79, 0.76), walk);
  c = mix(c, vec3(0.38, 0.39, 0.41), road);
  float lane = (1.0 - smoothstep(0.03, 0.03 + fw.x, d.x)) * step(0.9, hw.x) + (1.0 - smoothstep(0.03, 0.03 + fw.y, d.y)) * step(0.9, hw.y);
  c = mix(c, vec3(0.92, 0.84, 0.50), clamp(lane, 0.0, 1.0) * 0.8);
  float far = clamp(max(fw.x, fw.y) * 1.2 - 0.3, 0.0, 1.0);
  c = mix(c, vec3(0.62, 0.62, 0.60), far);
  diffuseColor.rgb *= c * c;
}`,
      );
  };
  m.customProgramCacheKey = () => "klovers-city-ground";
  return m;
}

/** The Han river far below Namsan: still, a little sheen, the sky in it. */
const RIVER = std("#7F9DB0", 0.25, { metalness: 0.1 });

/**
 * Love locks on the Namsan fence: one material for every lock body, each
 * painted its own colour from a hash of where it hangs (red, pink, yellow,
 * sky blue, green, violet, white, black, or bare brass — the brass ones
 * metallic). Glossy enamel. One draw call for hundreds of locks. Fresh
 * material (not the std cache) because it rewrites the shader.
 */
function lockPaint(): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: new Color("#ffffff"), roughness: 0.32, metalness: 0.1 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vLockHash;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
{
  vec3 lo = modelMatrix[3].xyz;
  #ifdef USE_INSTANCING
    lo += instanceMatrix[3].xyz;
  #endif
  vLockHash = fract(sin(dot(lo, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vLockHash;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float lockMetal = 0.1;
{
  int i = int(floor(vLockHash * 11.0));
  vec3 c = vec3(0.80, 0.16, 0.16);
  if (i == 1) c = vec3(0.93, 0.42, 0.58);
  else if (i == 2) c = vec3(0.95, 0.74, 0.16);
  else if (i == 3) c = vec3(0.24, 0.52, 0.85);
  else if (i == 4) c = vec3(0.25, 0.66, 0.38);
  else if (i == 5) c = vec3(0.55, 0.36, 0.80);
  else if (i == 6) c = vec3(0.94, 0.93, 0.90);
  else if (i == 7) c = vec3(0.12, 0.12, 0.13);
  else if (i == 8) c = vec3(0.98, 0.55, 0.62);
  else if (i >= 9) { c = vec3(0.78, 0.60, 0.28); lockMetal = 0.85; }
  diffuseColor.rgb *= c * c * 1.1;
}`,
      )
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = lockMetal;");
  };
  m.customProgramCacheKey = () => "klovers-lock-paint";
  return m;
}

/**
 * A woven basket (대바구니): upright stakes with flat cane woven over and
 * under them, all in the shader from the basket's own unit shape (angle
 * around the axis, height) — so the weave stays the same size on every
 * instance and follows the curve. Each crossing is shaded as a rounded
 * strand with dark gaps between; the pattern fades to a flat straw tone
 * where it would be finer than a pixel (no shimmer on phones). Fresh
 * material (not the std cache) because it rewrites the shader.
 */
function wicker(color: string): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: new Color(color), roughness: 0.86, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWeave;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWeave = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWeave;")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
{
  float wu = (atan(vWeave.z, vWeave.x) / 6.2831853 + 0.5) * 30.0;
  float wv = vWeave.y * 9.0;
  float fade = clamp(1.6 - 1.4 * max(fwidth(wu), fwidth(wv)), 0.0, 1.0);
  float over = mod(floor(wu) + floor(wv), 2.0);
  float across = over > 0.5 ? fract(wv) : fract(wu);
  float along = over > 0.5 ? fract(wu) : fract(wv);
  float strand = sin(across * 3.14159);
  float pinch = 0.8 + 0.2 * sin(along * 3.14159);
  float tone = mix(0.86, mix(0.5, 1.12, strand * pinch), fade);
  vec3 cane = over > 0.5 ? vec3(1.0) : vec3(0.93, 0.9, 0.84);
  diffuseColor.rgb *= tone * mix(vec3(1.0), cane, fade);
}`,
      );
  };
  m.customProgramCacheKey = () => "wicker";
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
export function foliage(color: string, roughness = 0.9, florets = false, far = false): MeshStandardMaterial {
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
${far ? "#define FOL_FAR" : ""}
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
#ifdef FOL_FAR
  // Trees over the walls are seen from 10–30 m: leaf-sized facets there
  // turn a crown into a lime sponge. Shade them by clumps of leaves instead.
  vec3 lq = vFolPos * 1.9;
  float bend = 0.42;
#else
  vec3 lq = vFolPos * 7.5;
  float bend = 0.28;
#endif
  float l0 = folNoise(lq);
  vec3 lg = vec3(folNoise(lq + vec3(0.2, 0.0, 0.0)) - l0, folNoise(lq + vec3(0.0, 0.2, 0.0)) - l0, folNoise(lq + vec3(0.0, 0.0, 0.2)) - l0) / 0.2;
  normal = normalize(normal - (viewMatrix * vec4(lg, 0.0)).xyz * bend);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
#ifdef FOL_FAR
  // Clumps a metre across, deep shade low in the crown and in the gaps
  // between clumps, a little sky in the colour (air between us and it).
  float clump = folNoise(vFolPos * 1.3) * 0.6 + folNoise(vFolPos * 2.9) * 0.4;
  float lit = mix(0.6, 1.08, smoothstep(0.1, 0.95, vFolUp));
  diffuseColor.rgb *= lit * mix(0.8, 1.1, clump);
  float grey = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(grey) * vec3(0.92, 1.0, 1.06), 0.18);
#else
  float clump = folNoise(vFolPos * 3.1) * 0.65 + folNoise(vFolPos * 7.3) * 0.35;
  float lit = mix(0.74, 1.12, smoothstep(0.0, 1.0, vFolUp));
  diffuseColor.rgb *= lit * mix(0.88, 1.1, clump);
#endif
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
  m.customProgramCacheKey = () => (florets ? "klovers-foliage-2-florets" : far ? "klovers-foliage-2-far" : "klovers-foliage-2");
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
  /** Crowns of the trees beyond the walls (shaded by clumps, not leaves). */
  farLeaf: foliage("#5F8C48", 0.95, false, true),
  farLeafDark: foliage("#3E6436", 0.95, false, true),
  blossom: foliage(NATURAL.blossom, 0.85, true),
  blossomPale: foliage(NATURAL.blossomPale, 0.85, true),
  moss: std(NATURAL.moss, 1, { detail: "stone" }),
  /** Raked gravel either side of a stone path. */
  gravel: std("#A99A7F", 1, { detail: "stone" }),
  hill: hillWoods(),
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
  /** A single natural stepping stone: fine tooth, no paving grid; each stone its own tone. */
  flagstone: naturalStone(std("#968E7F", 0.92, { detail: "plaster" })),
  /** Garden boulders (kit "boulderA/B"): the same stone, a little lighter, weathered at the foot. */
  boulder: naturalStone(std("#736C61", 0.86)),
  /** Brushed stainless steel of a street-food cart: pale, a soft sheen. */
  steel: std("#B9BFC3", 0.34, { metalness: 0.6 }),
  /** Glossy eomuk broth in its pot. */
  broth: std("#A8743E", 0.2),
  /** Folded fish cake on a skewer. */
  fishcake: std("#D8B07A", 0.7),
  /** Banchan in their trays: red-dressed kimchi, pale bean sprouts, glossy braised black beans. */
  kimchi: std("#B4422B", 0.45),
  sprouts: std("#E4D8AE", 0.6),
  beans: std("#2E211B", 0.28),
  /** Woven cane baskets of produce. */
  wicker: wicker("#C49A62"),
  /** Dark, damp garden soil in a planting bed. */
  soil: std("#5E4A38", 1, { detail: "plaster" }),
  /** Seoul far below Namsan: façades with storeys of windows (see cityBlock). */
  cityBlock: cityBlock(),
  /** The city floor below Namsan: streets, pavements, paving (see cityGround). */
  cityGround: cityGround(),
  river: RIVER,
  /** Love locks on the Namsan fence: each its own enamel colour (see lockPaint). */
  lockPaint: lockPaint(),
  /** Onggi (옹기): dark brown glazed earthenware — a soft sheen, not a plastic shine. */
  onggi: std("#4E2F22", 0.42),
  /** The warm yellow middle of a garden flower. */
  pollen: std("#E9B949", 0.75),
  fruitRed: std(NATURAL.fruitRed, 0.55),
  fruitOrange: std(NATURAL.fruitOrange, 0.6),
  metal: std(PALETTE.charcoal, 0.38, { metalness: 0.55 }),
  /** Hanji paper in a window: warm late-day light glowing through. */
  paper: std("#FFF6E6", 0.95, { emissive: "#FFDDAA", emissiveIntensity: 0.45 }),
  /** Lantern paper: a warm glow, the world's "lights" without real lights. */
  lanternPaper: std("#FFEBC8", 0.9, { emissive: "#FFBE62", emissiveIntensity: 0.95 }),
  /** Glazed white china: cups, saucers, plates. */
  ceramic: std("#F6F3EE", 0.28),
  /** Clear glass (a cake case, coffee jars): faint, catches a little light. */
  glass: clearGlass(),
  /** Café bakes: sponge, cream, strawberries. */
  sponge: std("#EBC88F", 0.85),
  cream: std("#FFF8EE", 0.6),
  berry: std("#C42A31", 0.32),
} as const;

/** Thin clear glass: mostly see-through, brighter at grazing angles. */
function clearGlass(): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: new Color("#DDE8EA"), roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `{
  float fres = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.5);
  diffuseColor.a = clamp(diffuseColor.a + 0.3 * fres, 0.0, 0.42);
  outgoingLight += vec3(0.12) * fres;
}
#include <opaque_fragment>`,
    );
  };
  m.customProgramCacheKey = () => "klovers-clear-glass";
  return m;
}
