import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from "three";
import { NATURAL } from "../config/materials";
import { PALETTE } from "../config/world";

/** Small procedural floor textures, painted once on a canvas (no download). */

export type Paint = (ctx: CanvasRenderingContext2D, size: number) => void;

/** A 256 px tiling texture painted once, repeated `rx` × `ry` times. */
export function useTiledTexture(paint: Paint, rx: number, ry: number) {
  const texture = useMemo(() => {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (ctx) paint(ctx, size);
    const t = new CanvasTexture(c);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(rx, ry);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
    // The painters are module-level constants; only the repeat varies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rx, ry]);
  // Free the GPU copy when the room unmounts (rooms load one at a time).
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/**
 * Dressed stone paving: warm slabs in staggered rows, each a slightly
 * different tone, with soft joints and a little wear. Variation comes from
 * tone, not noise, so the floor reads as stone without shimmering.
 */
export const paintPaving: Paint = (ctx, size) => slabs(ctx, size, NATURAL.paving, 4, 2, 0.17);

/** Shared slab painter: rows × cols per tile, tone jitter per slab. */
function slabs(ctx: CanvasRenderingContext2D, size: number, base: string, rows: number, cols: number, tone: number) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const rh = size / rows;
  const cw = size / cols;
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? cw / 2 : 0;
    for (let c = -1; c < cols + 1; c++) {
      const x = c * cw + off;
      const t = (rnd() - 0.5) * 2 * tone;
      ctx.fillStyle = t > 0 ? `rgba(255,250,240,${t})` : `rgba(90,70,50,${-t})`;
      ctx.fillRect(x + 1, r * rh + 1, cw - 2, rh - 2);
      // A few wear marks inside the slab.
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = `rgba(90,70,50,${0.03 + rnd() * 0.04})`;
        ctx.beginPath();
        ctx.arc(x + rnd() * cw, r * rh + rnd() * rh, 2 + rnd() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = "rgba(70,54,40,0.42)";
    ctx.fillRect(0, r * rh, size, 2);
    for (let c = 0; c <= cols; c++) ctx.fillRect((c * cw + off) % size, r * rh, 2, rh);
  }
}

/** Warm wooden planks (maru floor). */
export const paintPlanks: Paint = (ctx, size) => {
  ctx.fillStyle = PALETTE.woodWarm;
  ctx.fillRect(0, 0, size, size);
  const rows = 8;
  for (let r = 0; r < rows; r++) {
    const y = (r * size) / rows;
    ctx.fillStyle = r % 2 ? "rgba(107,74,51,0.10)" : "rgba(255,249,236,0.06)";
    ctx.fillRect(0, y, size, size / rows);
    ctx.fillStyle = "rgba(46,46,46,0.35)";
    ctx.fillRect(0, y, size, 1.5);
    const seam = ((r * 97) % size) + 20;
    ctx.fillRect(seam % size, y, 1.5, size / rows);
  }
};


/** Courtyard madang: larger, rougher slabs in a warmer earth tone. */
export const paintMadang: Paint = (ctx, size) => slabs(ctx, size, NATURAL.madang, 3, 2, 0.19);

/* ── Photographic floors (Poly Haven, CC0), loaded after the room shows ── */

type PhotoKind = "paving" | "planks";
type PhotoSet = { map: Texture; normal: Texture; rough: Texture };
const photoCache = new Map<PhotoKind, Promise<PhotoSet>>();
const TEX = "/assets/world/tex/";

function loadPhoto(kind: PhotoKind): Promise<PhotoSet> {
  let p = photoCache.get(kind);
  if (!p) {
    const loader = new TextureLoader();
    const one = (name: string, srgb: boolean) =>
      loader.loadAsync(`${TEX}${kind}_${name}.webp`).then((t) => {
        t.wrapS = RepeatWrapping;
        t.wrapT = RepeatWrapping;
        t.anisotropy = 16;
        if (srgb) t.colorSpace = SRGBColorSpace;
        return t;
      });
    p = Promise.all([one("diff", true), one("nor", false), one("rough", false)]).then(([map, normal, rough]) => ({ map, normal, rough }));
    photoCache.set(kind, p);
  }
  return p;
}

/**
 * A real photographed floor (stone paving or wood planks), repeated `rx` ×
 * `ry` times. Null until it has loaded — the painted floor shows meanwhile,
 * and stays if the photos cannot load.
 */
export function usePhotoFloor(kind: PhotoKind, rx: number, ry: number): PhotoSet | null {
  const [set, setSet] = useState<PhotoSet | null>(null);
  useEffect(() => {
    let live = true;
    let made: PhotoSet | null = null;
    loadPhoto(kind)
      .then((base) => {
        if (!live) return;
        const c = (t: Texture) => {
          const k = t.clone();
          k.repeat.set(rx, ry);
          k.needsUpdate = true;
          return k;
        };
        made = { map: c(base.map), normal: c(base.normal), rough: c(base.rough) };
        setSet(made);
      })
      .catch(() => undefined);
    return () => {
      live = false;
      if (made) {
        made.map.dispose();
        made.normal.dispose();
        made.rough.dispose();
      }
    };
  }, [kind, rx, ry]);
  return set;
}

/**
 * Breaks up a tiled floor (attach as the floor material's onBeforeCompile).
 * The painted floor tile repeats every couple of metres, so a square full of
 * it showed the same slabs over and over. This lays a world-positioned tone
 * on top, in the material's own shader: broad patches a few metres across,
 * a little warmer or cooler, lighter or darker, plus a fine mottle — so no
 * two stretches of floor are alike. No extra draw calls or textures.
 */
export function floorBreakup(shader: { vertexShader: string; fragmentShader: string }): void {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vFbPos;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFbPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
  shader.fragmentShader = shader.fragmentShader
    .replace(
      "#include <common>",
      `#include <common>
varying vec3 vFbPos;
float fbHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float fbNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(fbHash(i), fbHash(i + vec2(1.0, 0.0)), u.x), mix(fbHash(i + vec2(0.0, 1.0)), fbHash(i + vec2(1.0, 1.0)), u.x), u.y);
}`,
    )
    .replace(
      "#include <map_fragment>",
      `#include <map_fragment>
{
  vec2 q = vFbPos.xz;
  float broad = fbNoise(q / 4.3) * 0.6 + fbNoise(q / 1.7 + 7.1) * 0.4;
  float warm = fbNoise(q / 6.1 + 13.7);
  float fine = fbNoise(q * 2.3 + 3.3) * 0.5 + fbNoise(q * 5.9) * 0.5;
  diffuseColor.rgb *= mix(0.86, 1.08, broad) * mix(0.95, 1.03, fine);
  diffuseColor.rgb *= mix(vec3(0.97, 0.99, 1.03), vec3(1.04, 1.0, 0.94), warm);
}`,
    );
}
export const FLOOR_BREAKUP_KEY = () => "klovers-floor-breakup-1";
