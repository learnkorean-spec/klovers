import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace, type Group, type Mesh } from "three";
import { ACCENT, std } from "../config/materials";
import { tourSpot, VILLAGE, type TourStop } from "../config/rooms";
import type { WorldLang } from "../config/copy";
import { tourSlides, type TourSlide } from "../config/tour";
import { drawIcon, rr } from "./icons";
import { PALETTE } from "../config/world";
import type { PlayerState } from "../systems/state";
import { REDUCED_MOTION } from "../systems/motion";
import { Signboard } from "./parts";

/**
 * The Klovers tour as an exhibition along the Hangul Village street: who
 * Klovers is, what makes it different, the courses, how we teach, why
 * Korean, how to start — as posters, not pages: a headline and a picture
 * of the idea on each board (config/tour.ts). Once a board has unrolled it
 * "presents": its numbers, icons, steps or photos arrive one by one.
 *
 * Each board is a hanok-framed panel under a tiled cap with its Korean name
 * on top. Its panel is rolled up like a hanging scroll until the learner
 * comes near, then unrolls; standing at it counts it as seen (the page
 * moves the yellow marker on to the next one). Next to "Courses" and
 * "Start" a yellow post leads out to that page of the site.
 */

const BOARD_H = 1.5;
const PANEL_TOP = 2.3;
const CANVAS_W = 1280;

const FONT: Record<WorldLang, string> = {
  ar: '"Cairo", "Noto Sans Arabic", "Segoe UI", sans-serif',
  en: '"Inter", "Segoe UI", system-ui, sans-serif',
};

/** Wraps text to a width; returns the lines (at most `max`, the last one cut with "…"). */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > max) {
    const cut = lines.slice(0, max);
    cut[max - 1] = `${cut[max - 1].replace(/[\s،,.]+\S*$/, "")} …`;
    return cut;
  }
  return lines;
}

const INK = PALETTE.charcoal;
const PAPER = "#FBF6EA";

/** Ease for items arriving: a little overshoot. */
const pop = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Paints one board: its headline and its picture of the idea. `progress`
 * (0 → 1) is how far the presentation has run: items arrive one by one.
 * Exported for checks (drawn straight to a canvas, no 3D needed).
 */
export function drawExhibit(canvas: HTMLCanvasElement, slide: TourSlide, lang: WorldLang, n: number, of: number, progress: number, images: (HTMLImageElement | null)[] = []): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rtl = lang === "ar";
  const font = FONT[lang];
  const W = canvas.width;
  const H = canvas.height;
  const pad = 64;
  const x0 = rtl ? W - pad : pad;
  const t = progress;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.textBaseline = "alphabetic";
  // Paper on a wooden frame.
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAPER;
  ctx.fillRect(18, 18, W - 36, H - 36);
  // Step and the yellow rule.
  ctx.fillStyle = PALETTE.yellow;
  ctx.fillRect(rtl ? W - pad - 90 : pad, 62, 90, 12);
  ctx.fillStyle = "rgba(42,42,42,0.55)";
  ctx.font = `700 30px ${font}`;
  const step = rtl ? `${n.toLocaleString("ar-EG")} / ${of.toLocaleString("ar-EG")}` : `${n} / ${of}`;
  ctx.fillText(step, rtl ? W - pad - 110 : pad + 110, 78);
  // Title, and one short line.
  ctx.fillStyle = INK;
  ctx.font = `800 80px ${font}`;
  ctx.fillText(slide.title, x0, 170);
  let top = 200;
  if (slide.tagline) {
    ctx.font = `500 38px ${font}`;
    ctx.fillStyle = "rgba(42,42,42,0.7)";
    ctx.fillText(slide.tagline, x0, 228);
    top = 262;
  }
  const width = W - pad * 2;
  const bottom = H - 50;
  const areaH = bottom - top;
  const count = Math.max(1, slide.items.length || slide.pictures?.length || 1);
  // Item i arrives over its own slice of the presentation time.
  const arrive = (i: number) => clamp01(t * (count + 1.5) - i);
  // Lay items out in reading order (right to left in Arabic).
  const colX = (i: number, cols: number, cw: number, gap: number) => {
    const col = rtl ? cols - 1 - i : i;
    return pad + col * (cw + gap);
  };
  const center = (fn: () => void, a: number, cx: number, cy: number) => {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp01(a * 2);
    const k = pop(a);
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    ctx.translate(-cx, -cy);
    fn();
    ctx.restore();
  };
  ctx.textAlign = "center";

  if (slide.layout === "stats") {
    const gap = 28;
    const cols = slide.items.length;
    const cw = (width - gap * (cols - 1)) / cols;
    slide.items.forEach((it, i) => {
      const x = colX(i, cols, cw, gap);
      const cx = x + cw / 2;
      const cy = top + areaH / 2;
      center(
        () => {
          ctx.fillStyle = "#F3EAD7";
          rr(ctx, x, top + 10, cw, areaH - 20, 28);
          ctx.fill();
          ctx.fillStyle = PALETTE.yellow;
          ctx.fillRect(cx - 50, cy - 140, 100, 10);
          ctx.fillStyle = INK;
          const big = it.big ?? "";
          ctx.font = `900 ${big.length > 4 ? 72 : 120}px ${font}`;
          ctx.fillText(big, cx, cy + 10);
          ctx.font = `600 34px ${font}`;
          wrap(ctx, it.label, cw - 40, 2).forEach((l, k) => ctx.fillText(l, cx, cy + 86 + k * 44));
        },
        arrive(i),
        cx,
        cy,
      );
    });
  } else if (slide.layout === "icons") {
    const cols = 2;
    const gap = 24;
    const cw = (width - gap) / cols;
    const rh = (areaH - gap) / 2;
    slide.items.forEach((it, i) => {
      const x = colX(i % cols, cols, cw, gap);
      const y = top + Math.floor(i / cols) * (rh + gap);
      const r = Math.min(rh * 0.38, 78);
      const iconX = rtl ? x + cw - 30 - r : x + 30 + r;
      center(
        () => {
          ctx.fillStyle = "#F3EAD7";
          rr(ctx, x, y, cw, rh, 26);
          ctx.fill();
          drawIcon(ctx, it.icon ?? "globe", iconX, y + rh / 2, r);
          ctx.fillStyle = INK;
          // Shrink a long single word (no place to break it) until it fits.
          let size = 40;
          ctx.font = `700 ${size}px ${font}`;
          const room = cw - 2 * r - 90;
          while (size > 26 && Math.max(...it.label.split(/\s+/).map((w) => ctx.measureText(w).width)) > room) {
            size -= 2;
            ctx.font = `700 ${size}px ${font}`;
          }
          ctx.textAlign = rtl ? "right" : "left";
          const tx = rtl ? iconX - r - 26 : iconX + r + 26;
          const lines = wrap(ctx, it.label, cw - 2 * r - 90, 2);
          lines.forEach((l, k) => ctx.fillText(l, tx, y + rh / 2 + 14 + (k - (lines.length - 1) / 2) * 46));
          ctx.textAlign = "center";
        },
        arrive(i),
        x + cw / 2,
        y + rh / 2,
      );
    });
  } else if (slide.layout === "ladder") {
    // A staircase of levels, rising toward TOPIK.
    const steps = slide.items.length;
    const gap = 10;
    const sw = (width - gap * (steps - 1)) / steps;
    slide.items.forEach((it, i) => {
      const h = 120 + (areaH - 150) * (i / (steps - 1));
      const x = colX(i, steps, sw, gap);
      const y = bottom - h;
      const last = i === steps - 1;
      center(
        () => {
          ctx.fillStyle = last ? PALETTE.yellow : i === 0 ? "#E6D9BF" : `rgba(46,46,46,${0.12 + 0.1 * (i / steps)})`;
          rr(ctx, x, y, sw, h, 14);
          ctx.fill();
          if (last) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = INK;
            ctx.stroke();
          }
          ctx.fillStyle = INK;
          const big = it.big ?? "";
          ctx.font = `900 ${big.length > 3 ? 34 : 58}px ${big === "한글" ? '"Noto Sans KR", sans-serif' : font}`;
          ctx.fillText(big, x + sw / 2, y + (it.label ? 74 : 68));
          if (it.label) {
            ctx.font = `600 24px ${font}`;
            ctx.fillStyle = "rgba(42,42,42,0.7)";
            ctx.fillText(it.label, x + sw / 2, y + 106);
          }
        },
        arrive(i),
        x + sw / 2,
        bottom,
      );
    });
  } else if (slide.layout === "steps") {
    // Three steps in a row, joined by arrows, looping weekly.
    const cols = slide.items.length;
    const r = Math.min(110, areaH * 0.3);
    const span = width - 2 * r;
    slide.items.forEach((it, i) => {
      const f = cols === 1 ? 0.5 : i / (cols - 1);
      const cx = pad + r + (rtl ? 1 - f : f) * span;
      const cy = top + areaH * 0.42;
      const a = arrive(i);
      if (i > 0 && a > 0) {
        const pf = (i - 1) / (cols - 1);
        const px = pad + r + (rtl ? 1 - pf : pf) * span;
        const dir = Math.sign(cx - px);
        const x1 = px + dir * (r + 22);
        const x2 = x1 + (cx - dir * (r + 22) - x1) * clamp01(a * 1.5);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, cy);
        ctx.lineTo(x2, cy);
        ctx.stroke();
        if (a > 0.6) {
          ctx.beginPath();
          ctx.moveTo(x2 - dir * 24, cy - 20);
          ctx.lineTo(x2, cy);
          ctx.lineTo(x2 - dir * 24, cy + 20);
          ctx.stroke();
        }
      }
      center(
        () => {
          drawIcon(ctx, it.icon ?? "book", cx, cy, r);
          ctx.fillStyle = INK;
          ctx.font = `800 42px ${font}`;
          ctx.fillText(it.label, cx, cy + r + 62);
          ctx.fillStyle = "rgba(42,42,42,0.45)";
          ctx.font = `800 30px ${font}`;
          ctx.fillText(rtl ? (i + 1).toLocaleString("ar-EG") : String(i + 1), cx, cy - r - 18);
        },
        a,
        cx,
        cy,
      );
    });
  } else if (slide.layout === "pictures") {
    const gap = 22;
    const pics = (slide.pictures ?? []).slice(0, 4);
    const cols = 2;
    const cw = (width - gap) / cols;
    const ch = (areaH - gap) / 2;
    pics.forEach((p, i) => {
      const px = colX(i % cols, cols, cw, gap);
      const py = top + Math.floor(i / 2) * (ch + gap);
      center(
        () => {
          ctx.save();
          rr(ctx, px, py, cw, ch, 22);
          ctx.clip();
          ctx.fillStyle = "#E9E1D2";
          ctx.fillRect(px, py, cw, ch);
          const img = images[i];
          if (img) {
            const s = Math.max(cw / img.width, ch / img.height);
            const sw = cw / s;
            const sh = ch / s;
            ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, px, py, cw, ch);
          }
          // The label on a dark band across the photo's foot.
          const g = ctx.createLinearGradient(0, py + ch - 110, 0, py + ch);
          g.addColorStop(0, "rgba(20,20,20,0)");
          g.addColorStop(1, "rgba(20,20,20,0.75)");
          ctx.fillStyle = g;
          ctx.fillRect(px, py + ch - 110, cw, 110);
          ctx.restore();
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `800 46px ${font}`;
          ctx.textAlign = rtl ? "right" : "left";
          ctx.fillText(p.label, rtl ? px + cw - 28 : px + 28, py + ch - 28);
          ctx.textAlign = "center";
        },
        arrive(i),
        px + cw / 2,
        py + ch / 2,
      );
    });
  } else if (slide.layout === "cta") {
    // A big free-class badge, and three small promises beside it.
    const [badge, ...rest] = slide.items;
    const R = Math.min(areaH * 0.48, 230);
    const bx = rtl ? W - pad - R - 10 : pad + R + 10;
    const by = top + areaH / 2 - 10;
    center(
      () => {
        ctx.fillStyle = PALETTE.yellow;
        ctx.beginPath();
        // A starburst seal.
        const spikes = 18;
        for (let k = 0; k <= spikes * 2; k++) {
          const a = (k / (spikes * 2)) * Math.PI * 2;
          const rad = k % 2 ? R * 0.9 : R;
          ctx.lineTo(bx + Math.cos(a) * rad, by + Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.font = `900 ${R * 0.42}px ${font}`;
        ctx.fillText(badge?.big ?? "", bx, by + R * 0.08);
        ctx.font = `700 ${R * 0.15}px ${font}`;
        wrap(ctx, badge?.label ?? "", R * 1.4, 2).forEach((l, k) => ctx.fillText(l, bx, by + R * 0.33 + k * R * 0.18));
      },
      arrive(0),
      bx,
      by,
    );
    const lx0 = rtl ? pad : pad + 2 * R + 60;
    const lw = width - 2 * R - 50;
    const rowH = Math.min(140, (areaH - 20) / Math.max(1, rest.length));
    rest.forEach((it, i) => {
      const y = top + 20 + i * rowH + rowH / 2;
      const r = rowH * 0.36;
      const ix = rtl ? lx0 + lw - r : lx0 + r;
      center(
        () => {
          drawIcon(ctx, it.icon ?? "globe", ix, y, r);
          ctx.fillStyle = INK;
          ctx.font = `700 40px ${font}`;
          ctx.textAlign = rtl ? "right" : "left";
          ctx.fillText(wrap(ctx, it.label, lw - 2 * r - 30, 1)[0], rtl ? ix - r - 24 : ix + r + 24, y + 14);
          ctx.textAlign = "center";
        },
        arrive(i + 1),
        ix,
        y,
      );
    });
  }
}

/**
 * The board's picture: drawn again while it "presents" (items arrive one
 * after another once the scroll has unrolled), then left alone.
 */
function useExhibitTexture(slide: TourSlide, lang: WorldLang, n: number, of: number, aspect: number) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = CANVAS_W;
    c.height = Math.round(CANVAS_W / aspect);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 16;
    return { canvas: c, texture: t };
  }, [aspect]);
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const progress = useRef(REDUCED_MOTION ? 1 : 0);

  const draw = useMemo(
    () => () => {
      drawExhibit(canvas, slide, lang, n, of, progress.current, images.current);
      texture.needsUpdate = true;
    },
    [canvas, texture, slide, lang, n, of],
  );

  useEffect(() => {
    let cancelled = false;
    const font = FONT[lang];
    images.current = (slide.pictures ?? []).map(() => null);
    draw();
    // Redraw once the site's fonts and the pictures have arrived.
    Promise.all([document.fonts?.load(`800 80px ${font}`, slide.title), document.fonts?.load(`700 40px "Noto Sans KR"`, "한글")])
      .then(() => !cancelled && draw())
      .catch(() => undefined);
    (slide.pictures ?? []).forEach((p, i) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        images.current[i] = img;
        draw();
      };
      img.src = p.src;
    });
    return () => {
      cancelled = true;
    };
  }, [draw, slide, lang]);

  useEffect(() => () => texture.dispose(), [texture]);
  /** Advance the presentation; redraws only while it is still moving. */
  const present = (dt: number) => {
    if (progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + dt / 2.4);
    draw();
  };
  return { texture, present };
}

const WOOD = () => std(PALETTE.woodDark, 0.75);
const CAP = () => std(PALETTE.charcoal, 0.7);

function Exhibit({
  b,
  slide,
  lang,
  n,
  of,
  player,
  onSeen,
}: {
  b: (typeof VILLAGE.tour)[number];
  slide: TourSlide;
  lang: WorldLang;
  n: number;
  of: number;
  player: MutableRefObject<PlayerState>;
  onSeen: (stop: TourStop) => void;
}) {
  const w = b.w;
  const { texture: tex, present } = useExhibitTexture(slide, lang, n, of, w / BOARD_H);
  const material = useMemo(() => new MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  useEffect(() => () => material.dispose(), [material]);
  const panel = useRef<Mesh>(null);
  const roller = useRef<Group>(null);
  const st = useRef({ open: REDUCED_MOTION ? 1 : 0, seen: false });
  const spot = useMemo(() => tourSpot(b), [b]);

  useFrame((_, dt) => {
    const p = player.current.position;
    const near = Math.hypot(p.x - b.x, p.z - b.z) < 7.5;
    const s = st.current;
    // Unroll once the learner comes near (and stay open).
    if (near && s.open < 1) s.open = Math.min(1, s.open + Math.min(dt, 0.1) * 0.9);
    const e = 1 - (1 - s.open) ** 3;
    const h = Math.max(0.02, BOARD_H * e);
    if (panel.current) {
      panel.current.scale.set(1, h / BOARD_H, 1);
      panel.current.position.y = PANEL_TOP - h / 2;
      // The paper shows only what has unrolled (the top part of the picture).
      tex.repeat.set(1, h / BOARD_H);
      tex.offset.set(0, 1 - h / BOARD_H);
    }
    if (roller.current) roller.current.position.y = PANEL_TOP - h - 0.03;
    // Once unrolled, the board presents: its pictures arrive one by one.
    if (s.open > 0.85) present(Math.min(dt, 0.1));
    if (!s.seen && s.open > 0.9 && Math.hypot(p.x - spot.x, p.z - spot.z) < 2.4) {
      s.seen = true;
      onSeen(b.id);
    }
  });

  return (
    <group position={[b.x, 0, b.z]} rotation={[0, b.yaw, 0]}>
      {/* Posts and a back of planks, so the board has a body from every side. */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} castShadow position={[sx * (w / 2 + 0.08), 1.45, -0.05]}>
          <boxGeometry args={[0.12, 2.9, 0.12]} />
          <primitive object={WOOD()} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, PANEL_TOP - BOARD_H / 2, -0.07]}>
        <boxGeometry args={[w + 0.06, BOARD_H + 0.06, 0.05]} />
        <primitive object={WOOD()} attach="material" />
      </mesh>
      {/* The scroll: its rod on top, the paper, and the weighted roller below. */}
      <mesh position={[0, PANEL_TOP + 0.03, -0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, w + 0.1, 10]} />
        <primitive object={WOOD()} attach="material" />
      </mesh>
      <mesh ref={panel} position={[0, PANEL_TOP - BOARD_H / 2, -0.035]} material={material}>
        <planeGeometry args={[w, BOARD_H]} />
      </mesh>
      <group ref={roller}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, w + 0.14, 12]} />
          <primitive object={WOOD()} attach="material" />
        </mesh>
        {/* The yellow rail: boards to walk up to. */}
        <mesh position={[0, -0.06, 0.01]}>
          <boxGeometry args={[w * 0.6, 0.03, 0.02]} />
          <primitive object={ACCENT} attach="material" />
        </mesh>
      </group>
      {/* The Korean name, under a little tiled cap. */}
      <group position={[0, PANEL_TOP + 0.33, -0.03]}>
        <Signboard text={b.sign} w={Math.min(1.5, w * 0.62)} h={0.36} aspect={Math.min(1.5, w * 0.62) / 0.36} />
      </group>
      <mesh castShadow position={[0, PANEL_TOP + 0.62, -0.05]}>
        <boxGeometry args={[w + 0.55, 0.09, 0.5]} />
        <primitive object={CAP()} attach="material" />
      </mesh>
    </group>
  );
}

/** A yellow post that leads out to a page of the site (its interactable is in config/interactions). */
function LinkPost({ x, z, yaw, sign }: { x: number; z: number; yaw: number; sign: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.5, 10]} />
        <primitive object={WOOD()} attach="material" />
      </mesh>
      <group position={[0, 1.42, 0.05]}>
        <Signboard text={sign} w={0.8} h={0.3} aspect={0.8 / 0.3} />
      </group>
      <mesh position={[0, 1.22, 0.06]}>
        <boxGeometry args={[0.8, 0.05, 0.02]} />
        <primitive object={ACCENT} attach="material" />
      </mesh>
    </group>
  );
}

export default function TourExhibit({ lang, player, onSeen }: { lang: WorldLang; player: MutableRefObject<PlayerState>; onSeen: (stop: TourStop) => void }) {
  const slides = useMemo(() => tourSlides(lang), [lang]);
  const seen = useRef(onSeen);
  seen.current = onSeen;
  const report = useMemo(() => (s: TourStop) => seen.current(s), []);
  return (
    <group>
      {VILLAGE.tour.map((b, i) => (
        <Exhibit key={`${b.id}-${lang}`} b={b} slide={slides[i]} lang={lang} n={i + 1} of={VILLAGE.tour.length} player={player} onSeen={report} />
      ))}
      {VILLAGE.tourLinks.map((l) => (
        <LinkPost key={l.id} x={l.x} z={l.z} yaw={l.yaw} sign={l.sign} />
      ))}
    </group>
  );
}
