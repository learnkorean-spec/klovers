import { CanvasTexture, Color, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
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
    if (extra.detail) m.map = detail(extra.detail);
    if (extra.emissive) {
      m.emissive = new Color(extra.emissive);
      m.emissiveIntensity = extra.emissiveIntensity ?? 1;
    }
    cache.set(key, m);
  }
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
  stoneWarm: "#D6CAB4",
  /** Packed earth of a madang (courtyard floor). */
  madang: "#E4D9C4",
  pine: "#6E8B67",
} as const;

/** Named finishes of the world's visual system. */
export const MAT = {
  // Each finish differs in colour AND surface: matte toothy plaster, grained
  // wood with a soft sheen, rough mottled stone, tiled roofs, woven canvas,
  // a little metal for fittings, flat-shaded foliage.
  plaster: std(PALETTE.ivory, 0.97, { detail: "plaster" }),
  charcoal: std(PALETTE.charcoal, 0.85),
  roofTile: std(PALETTE.charcoal, 0.7, { flatShading: true, detail: "tile" }),
  woodDark: std(PALETTE.woodDark, 0.62, { detail: "grain" }),
  woodWarm: std(PALETTE.woodWarm, 0.66, { detail: "grain" }),
  stone: std(PALETTE.stone, 1),
  stoneWarm: std(NATURAL.stoneWarm, 0.98, { detail: "stone" }),
  pine: std(NATURAL.pine, 0.9, { flatShading: true }),
  fabric: std(PALETTE.ivory, 0.92, { detail: "fabric" }),
  metal: std(PALETTE.charcoal, 0.38, { metalness: 0.55 }),
  /** Hanji paper in a window: a little self-light so it reads as daylight. */
  paper: std(PALETTE.white, 0.95, { emissive: PALETTE.ivory, emissiveIntensity: 0.3 }),
  /** Lantern paper: brighter than a window. */
  lanternPaper: std(PALETTE.white, 0.9, { emissive: PALETTE.ivory, emissiveIntensity: 0.45 }),
} as const;
