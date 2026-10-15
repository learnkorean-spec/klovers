import { isTouchFirst } from "./webgl";

/**
 * Two quality tiers, chosen once. Phones and small machines skip real-time
 * shadows (the single biggest cost here) and ambient occlusion, and render
 * at a lower pixel ratio;
 * everything else looks the same, so the world stays one world.
 */
export interface Quality {
  shadows: boolean;
  dpr: [number, number];
  /** Ambient occlusion (systems/post.ts). */
  post: boolean;
}

/** Checks only: ?post=0 turns the finish off, ?post=1 forces it on, ?post=ao shows the shade alone. */
function postFlag(): boolean | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("post");
  return v === "0" ? false : v === "1" || v === "ao" ? true : null;
}

export function pickQuality(): Quality {
  // Checks only: ?hq forces the desktop tier (screenshots on slow machines).
  const forced = postFlag();
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("hq")) return { shadows: true, dpr: [1, 1.5], post: forced ?? true };
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = (nav.deviceMemory ?? 8) < 4 || (nav.hardwareConcurrency ?? 8) <= 4;
  if (isTouchFirst() || small) return { shadows: false, dpr: [1, 1.25], post: forced ?? false };
  return { shadows: true, dpr: [1, 1.5], post: forced ?? true };
}
