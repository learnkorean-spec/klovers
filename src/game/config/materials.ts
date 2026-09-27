import { Color, MeshBasicMaterial, MeshStandardMaterial } from "three";
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

export interface StdOptions {
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  flatShading?: boolean;
}

const cache = new Map<string, MeshStandardMaterial>();

/** A cached lit material for this colour and finish. */
export function std(color: string, roughness = 0.8, extra: Omit<StdOptions, "roughness"> = {}): MeshStandardMaterial {
  const key = `${color}|${roughness}|${extra.metalness ?? 0}|${extra.emissive ?? ""}|${extra.emissiveIntensity ?? 0}|${extra.flatShading ? 1 : 0}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({
      color: new Color(color),
      roughness,
      metalness: extra.metalness ?? 0,
      flatShading: extra.flatShading ?? false,
    });
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

/** Named finishes of the world's visual system. */
export const MAT = {
  plaster: std(PALETTE.ivory, 0.95),
  charcoal: std(PALETTE.charcoal, 0.85),
  roofTile: std(PALETTE.charcoal, 0.75, { flatShading: true }),
  woodDark: std(PALETTE.woodDark, 0.7),
  woodWarm: std(PALETTE.woodWarm, 0.75),
  stone: std(PALETTE.stone, 1),
  /** Hanji paper in a window: a little self-light so it reads as daylight. */
  paper: std(PALETTE.white, 0.95, { emissive: PALETTE.ivory, emissiveIntensity: 0.3 }),
  /** Lantern paper: brighter than a window. */
  lanternPaper: std(PALETTE.white, 0.9, { emissive: PALETTE.ivory, emissiveIntensity: 0.45 }),
} as const;
