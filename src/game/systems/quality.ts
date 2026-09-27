import { isTouchFirst } from "./webgl";

/**
 * Two quality tiers, chosen once. Phones and small machines skip real-time
 * shadows (the single biggest cost here) and render at a lower pixel ratio;
 * everything else looks the same, so the world stays one world.
 */
export interface Quality {
  shadows: boolean;
  dpr: [number, number];
}

export function pickQuality(): Quality {
  // Checks only: ?hq forces the desktop tier (screenshots on slow machines).
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("hq")) return { shadows: true, dpr: [1, 1.5] };
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = (nav.deviceMemory ?? 8) < 4 || (nav.hardwareConcurrency ?? 8) <= 4;
  if (isTouchFirst() || small) return { shadows: false, dpr: [1, 1.25] };
  return { shadows: true, dpr: [1, 1.5] };
}
