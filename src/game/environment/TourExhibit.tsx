import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace, type Group, type Mesh } from "three";
import { ACCENT, std } from "../config/materials";
import { tourSpot, VILLAGE, type TourStop } from "../config/rooms";
import type { WorldLang } from "../config/copy";
import { tourSlides, type TourSlide } from "../config/tour";
import { PALETTE } from "../config/world";
import type { PlayerState } from "../systems/state";
import { REDUCED_MOTION } from "../systems/motion";
import { Signboard } from "./parts";

/**
 * The Klovers tour as an exhibition along the Hangul Village street: who
 * Klovers is, what makes it different, the courses, how we teach, why
 * Korean, how to start — written on the boards themselves, in the site's
 * own words (config/tour.ts), to be read by walking up to them.
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

function useExhibitTexture(slide: TourSlide, lang: WorldLang, n: number, of: number, aspect: number) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = CANVAS_W;
    c.height = Math.round(CANVAS_W / aspect);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return { canvas: c, texture: t };
  }, [aspect]);

  useEffect(() => {
    let cancelled = false;
    const rtl = lang === "ar";
    const font = FONT[lang];
    const images: (HTMLImageElement | null)[] = (slide.pictures ?? []).map(() => null);
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;
      const W = canvas.width;
      const H = canvas.height;
      const pad = 64;
      const x0 = rtl ? W - pad : pad;
      ctx.direction = rtl ? "rtl" : "ltr";
      ctx.textAlign = rtl ? "right" : "left";
      ctx.textBaseline = "alphabetic";
      // Paper on a wooden frame.
      ctx.fillStyle = PALETTE.woodDark;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#FBF6EA";
      ctx.fillRect(18, 18, W - 36, H - 36);
      // Step and the yellow rule.
      ctx.fillStyle = PALETTE.yellow;
      ctx.fillRect(rtl ? W - pad - 90 : pad, 62, 90, 12);
      ctx.fillStyle = "rgba(42,42,42,0.55)";
      ctx.font = `700 30px ${font}`;
      const step = rtl ? `${n.toLocaleString("ar-EG")} / ${of.toLocaleString("ar-EG")}` : `${n} / ${of}`;
      ctx.fillText(step, rtl ? W - pad - 110 : pad + 110, 78);
      // Title.
      ctx.fillStyle = PALETTE.charcoal;
      ctx.font = `800 76px ${font}`;
      ctx.fillText(slide.title, x0, 168);
      let y = 168;
      const width = W - pad * 2;
      if (slide.pictures?.length) {
        // Four pictures, two by two, each with its label.
        const gap = 28;
        const cw = (width - gap) / 2;
        const ch = (H - y - 60 - gap) / 2 - 46;
        slide.pictures.slice(0, 4).forEach((p, i) => {
          const col = rtl ? 1 - (i % 2) : i % 2;
          const px = pad + col * (cw + gap);
          const py = y + 34 + Math.floor(i / 2) * (ch + 46 + gap);
          const img = images[i];
          ctx.fillStyle = "#E9E1D2";
          ctx.fillRect(px, py, cw, ch);
          if (img) {
            // Cover-fit.
            const s = Math.max(cw / img.width, ch / img.height);
            const sw = cw / s;
            const sh = ch / s;
            ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, px, py, cw, ch);
          }
          ctx.fillStyle = PALETTE.charcoal;
          ctx.font = `700 34px ${font}`;
          ctx.fillText(p.label, rtl ? px + cw : px, py + ch + 38);
        });
      } else {
        ctx.font = `500 36px ${font}`;
        ctx.fillStyle = "rgba(42,42,42,0.85)";
        for (const l of wrap(ctx, slide.lead, width, 3)) {
          y += 54;
          ctx.fillText(l, x0, y);
        }
        y += 22;
        ctx.font = `600 36px ${font}`;
        for (const p of (slide.points ?? []).slice(0, 5)) {
          y += 58;
          if (y > H - 50) break;
          ctx.fillStyle = PALETTE.yellow;
          ctx.beginPath();
          ctx.arc(rtl ? W - pad - 10 : pad + 10, y - 12, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(42,42,42,0.35)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = PALETTE.charcoal;
          const line = wrap(ctx, p, width - 44, 1)[0];
          ctx.fillText(line, rtl ? W - pad - 38 : pad + 38, y);
        }
      }
      texture.needsUpdate = true;
    };
    draw();
    // Redraw once the site's fonts and the pictures have arrived.
    document.fonts?.load(`800 76px ${font}`, slide.title).then(draw).catch(() => undefined);
    (slide.pictures ?? []).forEach((p, i) => {
      const img = new Image();
      img.onload = () => {
        images[i] = img;
        draw();
      };
      img.src = p.src;
    });
    return () => {
      cancelled = true;
    };
  }, [canvas, texture, slide, lang, n, of]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

const WOOD = () => std(PALETTE.woodDark, 0.75);
const CAP = () => std(PALETTE.charcoal, 0.7);

function Exhibit({ b, slide, lang, n, of, player, onSeen }: {
  b: (typeof VILLAGE.tour)[number];
  slide: TourSlide;
  lang: WorldLang;
  n: number;
  of: number;
  player: MutableRefObject<PlayerState>;
  onSeen: (stop: TourStop) => void;
}) {
  const w = b.w;
  const tex = useExhibitTexture(slide, lang, n, of, w / BOARD_H);
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
