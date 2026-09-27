import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
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

/** Stone paving: ivory slabs in staggered rows. */
export const paintPaving: Paint = (ctx, size) => {
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(46,46,46,0.16)";
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const y = (r * size) / rows;
    ctx.fillRect(0, y, size, 2);
    const off = r % 2 ? size / 4 : 0;
    for (let x = off; x < size + 1; x += size / 2) ctx.fillRect(x % size, y, 2, size / rows);
  }
};

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


/** Packed-earth madang: warm stone with faint, irregular slabs. */
export const paintMadang: Paint = (ctx, size) => {
  ctx.fillStyle = NATURAL.madang;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(107,74,51,0.10)";
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    const y = (r * size) / rows;
    ctx.fillRect(0, y, size, 1.5);
    const off = (r * 53) % 90;
    for (let x = off; x < size + 1; x += 90 + ((r * 17) % 30)) ctx.fillRect(x % size, y, 1.5, size / rows);
  }
};
