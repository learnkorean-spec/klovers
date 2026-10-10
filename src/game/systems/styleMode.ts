/**
 * Which finish the world is drawn in (DRAFT preview: /world?style=wc or
 * ?style=wcall). Kept apart from watercolor.ts so the page can read it
 * without pulling three.js into its own bundle.
 */
export type WatercolorMode = "off" | "wc" | "wcall";

export function watercolorMode(): WatercolorMode {
  if (typeof window === "undefined") return "off";
  const s = new URLSearchParams(window.location.search).get("style");
  return s === "wc" || s === "wcall" ? s : "off";
}
