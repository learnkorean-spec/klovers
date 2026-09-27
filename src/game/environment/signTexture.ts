import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { PALETTE } from "../config/world";

/** Korean-capable font stack; Noto Sans KR is already loaded by the site. */
const KO_FONT = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", sans-serif';

/**
 * A wooden signboard with real Hangul (one line, or several lines), drawn on a small canvas (no image
 * download). Redraws once the Korean web font has loaded so the letters use
 * the site's type, not a system fallback.
 */
export function useSignTexture(text: string, aspect = 1) {
  const { canvas, texture } = useMemo(() => {
    const h = 256;
    const w = Math.round(h * aspect);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return { canvas: c, texture: t };
  }, [aspect]);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;
      const { width: w, height: h } = canvas;
      ctx.fillStyle = PALETTE.woodDark;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.ivory;
      ctx.fillRect(14, 14, w - 28, h - 28);
      ctx.fillStyle = PALETTE.charcoal;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // One or more lines ("\n"), each as large as the board allows.
      const lines = text.split("\n");
      const lineH = (h - 40) / lines.length;
      let size = lineH * (lines.length > 1 ? 0.7 : 0.62 / 0.84);
      ctx.font = `700 ${size}px ${KO_FONT}`;
      const max = w - 64;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (widest > max) {
        size *= max / widest;
        ctx.font = `700 ${size}px ${KO_FONT}`;
      }
      lines.forEach((l, i) => ctx.fillText(l, w / 2, 20 + lineH * (i + 0.5) + size * 0.04));
      texture.needsUpdate = true;
    };
    draw();
    document.fonts?.load(`700 64px "Noto Sans KR"`, text).then(draw).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [canvas, texture, text]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}
