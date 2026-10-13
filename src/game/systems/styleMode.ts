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

/** Real (rigged) people by default; /world?avatar=classic shows the simple figures. */
export const REAL_PEOPLE = typeof window === "undefined" || new URLSearchParams(window.location.search).get("avatar") !== "classic";

/** Real modelled props (Sketchfab, CC BY) by default; /world?props=classic keeps the simple ones. */
export const REAL_PROPS = typeof window === "undefined" || new URLSearchParams(window.location.search).get("props") !== "classic";
