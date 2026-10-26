import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  CanvasTexture,
  Color,
  DoubleSide,
  LatheGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector2,
  type BufferGeometry,
  type Group,
} from "three";
import { ACCENT, MAT } from "../config/materials";
import { PALETTE, PROPS } from "../config/world";
import { HATCH, type StoryState } from "../systems/story";
import { REDUCED_MOTION } from "../systems/motion";
import { pickQuality } from "../systems/quality";

/**
 * The clover egg on its plinth in the middle of the courtyard.
 *
 * Canon (originStory): ivory shell, a small green four-leaf clover mark,
 * dormant until real learning wakes it. Phases come from StoryState:
 * - dormant  : perfectly still (guests, and learners whose egg has not
 *              hatched on the dashboard yet)
 * - stirring : Cluby has really hatched but the learner has not seen it here
 *              yet — a small rock now and then, inviting a closer look
 * - hatching : rocks harder, the cap cracks off (≈ 2.3 s), Cluby appears
 * - open     : the two halves of the shell rest in the nest
 * A thin yellow line on the platform is the only accent: navigation, not glow.
 */
const PLINTH_H = 0.5;
const EGG_R = 0.5;
const EGG_Y = PLINTH_H + EGG_R * 1.25;
const EGG_H = EGG_R * 1.3; // half height: an egg, not a ball
const SPLIT_Y = 0.16; // height (above the middle) where the cap breaks off

/**
 * The shell, turned on a lathe from a true egg profile: fuller below the
 * middle, narrower at the top. Points are spaced evenly along the outline so
 * the painted shell map is not stretched; the cap and the lower shell are
 * cut from the same profile and keep the whole shell's normals, so no
 * lighting seam shows where they meet while the egg is whole.
 */
const SHELL = (() => {
  const dense: Vector2[] = [];
  for (let i = 0; i <= 400; i++) {
    const t = (i / 400) * Math.PI; // 0 = bottom, π = top
    dense.push(new Vector2(EGG_R * Math.sin(t) * (1 + 0.1 * Math.cos(t)), -EGG_H * Math.cos(t)));
  }
  dense[0].x = 0;
  dense[400].x = 0;
  const along = [0];
  for (let i = 1; i < dense.length; i++) along.push(along[i - 1] + dense[i].distanceTo(dense[i - 1]));
  const total = along[along.length - 1];
  const N = 48;
  const pts: Vector2[] = [];
  for (let j = 0, k = 0; j <= N; j++) {
    const d = (j / N) * total;
    while (k < dense.length - 2 && along[k + 1] < d) k++;
    const f = (d - along[k]) / Math.max(1e-9, along[k + 1] - along[k]);
    pts.push(dense[k].clone().lerp(dense[k + 1], Math.min(1, Math.max(0, f))));
  }
  let cut = 0;
  while (cut < N && pts[cut + 1].y < SPLIT_Y) cut++;
  cut++;
  const SEG = 40;
  const whole = new LatheGeometry(pts, SEG, -Math.PI, Math.PI * 2); // u = 0.5 faces +z (spawn)
  const part = (from: number, to: number): BufferGeometry => {
    const g = new LatheGeometry(pts.slice(from, to + 1), SEG, -Math.PI, Math.PI * 2);
    const rows = to - from + 1;
    const n = g.getAttribute("normal") as BufferAttribute;
    const uv = g.getAttribute("uv") as BufferAttribute;
    const wn = whole.getAttribute("normal") as BufferAttribute;
    for (let i = 0; i <= SEG; i++) {
      for (let j = 0; j < rows; j++) {
        const a = i * rows + j;
        const b = i * pts.length + from + j;
        n.setXYZ(a, wn.getX(b), wn.getY(b), wn.getZ(b));
        uv.setY(a, (from + j) / N);
      }
    }
    return g;
  };
  const lower = part(0, cut);
  const cap = part(cut, N);
  whole.dispose();
  // Map size in metres, to paint the clover round rather than stretched.
  return { lower, cap, around: Math.PI * 2 * EGG_R, along: total };
})();

/**
 * Ivory shell paint: a faint warm mottle and fine speckles (a real shell,
 * never a plastic ball), a little warmer toward the base, and the small green
 * four-leaf clover painted on the side that faces the arrival path. The
 * clover also has its own faint emissive map so it stays readable in shade.
 */
const SHELL_MAT = (() => {
  const m = new MeshStandardMaterial({ color: new Color("#ffffff"), roughness: 0.48, side: DoubleSide });
  try {
    // Sharp enough for a close look on a computer; phones keep to their budget.
    const W = Math.min(2048, pickQuality().maxTexture);
    const H = W / 2;
    const k = W / 1024;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const e = document.createElement("canvas"); // the clover's own light: small is enough
    e.width = 512;
    e.height = 256;
    const ctx = c.getContext("2d");
    const ectx = e.getContext("2d");
    if (!ctx || !ectx) return m;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const base = ctx.createLinearGradient(0, 0, 0, H); // canvas top = egg top
    base.addColorStop(0, "#fffaf0");
    base.addColorStop(0.55, PALETTE.ivory);
    base.addColorStop(1, "#f1e6d0");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const r = (30 + rnd() * 70) * k;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rnd() < 0.5 ? "rgba(236,222,196,0.35)" : "rgba(255,253,246,0.4)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      for (const ox of [-W, 0, W]) {
        ctx.save();
        ctx.translate(ox, 0);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.restore();
      }
    }
    for (let i = 0; i < 1400 * k * k; i++) {
      const y = rnd() * H;
      ctx.fillStyle = `rgba(${150 + rnd() * 40},${120 + rnd() * 30},${90 + rnd() * 20},${0.06 + rnd() * 0.12})`;
      ctx.beginPath();
      ctx.arc(rnd() * W, y, (0.6 + rnd() * 1.3) * k, 0, Math.PI * 2);
      ctx.fill();
    }
    ectx.fillStyle = "#000";
    ectx.fillRect(0, 0, e.width, e.height);
    // The clover, centred where u = 0.5 (facing +z), a little below the
    // middle; drawn in metres so it stays round on the curved shell.
    const cv = 1 - 0.47;
    const leaf = (g: CanvasRenderingContext2D, fill: string | CanvasGradient) => {
      for (let k = 0; k < 4; k++) {
        g.save();
        g.rotate((k * Math.PI) / 2 + Math.PI / 4);
        g.beginPath();
        // A heart-shaped leaf pointing out from the middle.
        g.moveTo(0, 0);
        g.bezierCurveTo(-0.012, -0.03, -0.062, -0.044, -0.05, -0.078);
        g.bezierCurveTo(-0.042, -0.1, -0.012, -0.098, 0, -0.08);
        g.bezierCurveTo(0.012, -0.098, 0.042, -0.1, 0.05, -0.078);
        g.bezierCurveTo(0.062, -0.044, 0.012, -0.03, 0, 0);
        g.closePath();
        g.fillStyle = fill;
        g.fill();
        g.restore();
      }
    };
    for (const g of [ctx, ectx]) {
      const gw = g.canvas.width;
      const gh = g.canvas.height;
      g.save();
      g.translate(gw / 2, gh * cv);
      g.scale(gw / SHELL.around, gh / SHELL.along);
      // Stem first, under the leaves.
      g.strokeStyle = g === ctx ? "#1f9a2a" : "#3a7a20";
      g.lineWidth = 0.011;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(0.012, 0.05, 0.03, 0.085);
      g.stroke();
      if (g === ctx) {
        const fill = g.createRadialGradient(0, 0, 0.005, 0, 0, 0.1);
        fill.addColorStop(0, "#2cbf2a");
        fill.addColorStop(1, "#3fdc2c");
        leaf(g, fill);
        // A pale vein down each leaf.
        g.strokeStyle = "rgba(225,255,200,0.55)";
        g.lineWidth = 0.004;
        for (let k = 0; k < 4; k++) {
          g.save();
          g.rotate((k * Math.PI) / 2 + Math.PI / 4);
          g.beginPath();
          g.moveTo(0, -0.012);
          g.lineTo(0, -0.07);
          g.stroke();
          g.restore();
        }
      } else {
        leaf(g, "#3fae22");
      }
      g.restore();
    }
    const map = new CanvasTexture(c);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    const glow = new CanvasTexture(e);
    glow.colorSpace = SRGBColorSpace;
    m.map = map;
    m.emissiveMap = glow;
    m.emissive = new Color("#ffffff");
    m.emissiveIntensity = 0.55;
  } catch {
    m.color = new Color(PALETTE.ivory);
  }
  return m;
})();

/** Warm radial glow (canvas, painted once), added softly over the timber. */
const GLOW = (() => {
  let map: CanvasTexture | null = null;
  try {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 31);
      g.addColorStop(0, "rgba(255,214,140,0.9)");
      g.addColorStop(0.5, "rgba(255,200,120,0.35)");
      g.addColorStop(1, "rgba(255,200,120,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      map = new CanvasTexture(c);
    }
  } catch {
    map = null;
  }
  return new MeshBasicMaterial({ map, transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
})();

/** The same warm light, spread wide on the paving round the platform: the
 * brightest pool in the courtyard is where the egg sleeps (focal point). */
const FLOOR_GLOW = new MeshBasicMaterial({ map: GLOW.map, transparent: true, opacity: 0.3, blending: AdditiveBlending, depthWrite: false, toneMapped: false });

export default function CloverEgg({ story }: { story: MutableRefObject<StoryState> }) {
  const { x, z, w } = PROPS.eggPlinth;
  const egg = useRef<Group>(null);
  const cap = useRef<Group>(null);

  useFrame(() => {
    const s = story.current;
    const now = performance.now();
    let rock = 0;
    let capOff = 0; // 0 = on, 1 = lying beside the nest
    if (s.egg === "stirring" && !REDUCED_MOTION) {
      const t = (now % 3200) / 3200;
      rock = t < 0.25 ? Math.sin(t * Math.PI * 16) * 0.05 * (1 - t / 0.25) : 0;
    } else if (s.egg === "hatching") {
      const t = now - s.eggT0;
      const k = Math.min(t / HATCH.crackAt, 1);
      rock = t < HATCH.crackAt ? Math.sin(t / 55) * (0.03 + 0.11 * k) : 0;
      capOff = t < HATCH.crackAt ? 0 : Math.min((t - HATCH.crackAt) / 600, 1);
    } else if (s.egg === "open") {
      capOff = 1;
    }
    if (egg.current) egg.current.rotation.z = rock;
    // A slow warm breath of light round the nest. The egg itself stays
    // perfectly still while dormant (canon); only the light lives.
    GLOW.opacity = REDUCED_MOTION ? 0.6 : 0.56 + 0.1 * Math.sin(now / 1500);
    // Inspected: the warm light answers — brighter for a moment, then calm.
    const pulse = Math.max(0, Math.min(1, (s.eggPulseUntil - now) / 1400));
    GLOW.opacity += 0.4 * pulse;
    FLOOR_GLOW.opacity = 0.3 + 0.3 * pulse;
    if (cap.current) {
      const e = 1 - (1 - capOff) ** 3;
      cap.current.position.set(e * 0.74, -e * 0.45 + Math.sin(e * Math.PI) * 0.3, e * 0.25);
      cap.current.rotation.set(e * 0.4, 0, -e * 2.2);
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Octagonal ceremonial platform: warm stone base, dark timber top,
          a thin Klovers-yellow line round the top edge — the room's one
          pointer. It frames the egg rather than overpowering it. */}
      <mesh castShadow receiveShadow position={[0, 0.14, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[w / 2 / Math.cos(Math.PI / 8), w / 2 / Math.cos(Math.PI / 8) + 0.08, 0.28, 8]} />
        <primitive object={MAT.stoneWarm} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.39, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[w / 2 - 0.28, w / 2 - 0.2, 0.22, 8]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      <mesh position={[0, PLINTH_H + 0.004, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <ringGeometry args={[w / 2 - 0.42, w / 2 - 0.36, 8, 1]} />
        <primitive object={ACCENT} attach="material" />
      </mesh>
      {/* A wide low stone tier under the platform: it sits in the ground. */}
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[w / 2 / Math.cos(Math.PI / 8) + 0.42, w / 2 / Math.cos(Math.PI / 8) + 0.46, 0.1, 8]} />
        <primitive object={MAT.stoneWarm} attach="material" />
      </mesh>
      <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[6.2, 6.2]} />
        <primitive object={FLOOR_GLOW} attach="material" />
      </mesh>
      {/* A soft warm glow on the timber round the egg: presence, not magic. */}
      <mesh position={[0, PLINTH_H + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[2.3, 2.3]} />
        <primitive object={GLOW} attach="material" />
      </mesh>
      {/* A low step on the arrival side */}
      <mesh receiveShadow position={[0, 0.07, w / 2 + 0.28]}>
        <boxGeometry args={[1.2, 0.14, 0.4]} />
        <primitive object={MAT.stoneWarm} attach="material" />
      </mesh>
      <mesh castShadow position={[0, PLINTH_H + 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.08, 10, 32]} />
        <primitive object={MAT.woodWarm} attach="material" />
      </mesh>
      <group ref={egg} position={[0, PLINTH_H + 0.05, 0]}>
        <group position={[0, EGG_Y - PLINTH_H - 0.05, 0]}>
          {/* Lower shell */}
          <mesh castShadow geometry={SHELL.lower} material={SHELL_MAT} />
          {/* Cap (the clover is painted on the shell below the break) */}
          <group ref={cap}>
            <mesh castShadow geometry={SHELL.cap} material={SHELL_MAT} />
          </group>
        </group>
      </group>
    </group>
  );
}
