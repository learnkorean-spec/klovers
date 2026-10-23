import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { PALETTE } from "../config/world";
import { drawIcon, type WorldIcon } from "./icons";
import { pickQuality } from "../systems/quality";

/** Sign resolution: crisper on computers; phones keep the lighter one. */
const SIGN_H = typeof window !== "undefined" && pickQuality().shadows ? 448 : 256;

/** Korean-capable font stack; Noto Sans KR is already loaded by the site. */
const KO_FONT = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", sans-serif';

/**
 * A wooden signboard with real Hangul (one line, or several lines), drawn on a small canvas (no image
 * download). Redraws once the Korean web font has loaded so the letters use
 * the site's type, not a system fallback.
 */
export function useSignTexture(text: string, aspect = 1, icon?: WorldIcon) {
  const { canvas, texture } = useMemo(() => {
    const h = SIGN_H;
    const w = Math.round(h * aspect);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 16;
    return { canvas: c, texture: t };
  }, [aspect]);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;
      const { width: w, height: h } = canvas;
      // Measurements below were made for a 256-pixel-tall board.
      const k = h / 256;
      ctx.fillStyle = PALETTE.woodDark;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.ivory;
      ctx.fillRect(14 * k, 14 * k, w - 28 * k, h - 28 * k);
      // A picture on the left, when the board has one: the text moves over.
      let left = 0;
      if (icon) {
        const r = Math.min(h * 0.3, w * 0.16);
        drawIcon(ctx, icon, 34 * k + r, h / 2, r);
        left = 2 * r + 40 * k;
      }
      ctx.fillStyle = PALETTE.charcoal;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // One or more lines ("\n"), each as large as the board allows.
      const lines = text.split("\n");
      const lineH = (h - 40 * k) / lines.length;
      let size = lineH * (lines.length > 1 ? 0.7 : 0.62 / 0.84);
      ctx.font = `700 ${size}px ${KO_FONT}`;
      const max = w - 64 * k - left;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (widest > max) {
        size *= max / widest;
        ctx.font = `700 ${size}px ${KO_FONT}`;
      }
      lines.forEach((l, i) => ctx.fillText(l, left + (w - left) / 2, 20 * k + lineH * (i + 0.5) + size * 0.04));
      texture.needsUpdate = true;
    };
    draw();
    document.fonts?.load(`700 64px "Noto Sans KR"`, text).then(draw).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [canvas, texture, text, icon]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}
