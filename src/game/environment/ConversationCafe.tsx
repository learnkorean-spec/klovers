import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, MeshBasicMaterial, SRGBColorSpace, type Material } from "three";
import { CAFE } from "../config/rooms";
import { PALETTE } from "../config/world";
import { GateWall, Signboard } from "./parts";
import { paintPlanks, useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY } from "./textures";
import { MAT, std } from "../config/materials";
import { FLOOR_GRID } from "../config/world";
import Batch from "./Batch";
import { Kit, jitter, type MatKey } from "./kit";
import { pickQuality } from "../systems/quality";

/**
 * Conversation Café — the third world (canon: worlds[2]).
 *
 * "Warm Korean café designed around small real-life conversation
 * situations": a counter with a menu board (메뉴 · 커피 · 녹차 · 케이크),
 * four tables for two, pendant lamps on wooden beams. The barista takes
 * orders (config/interactions "shop-cafe"); two students at a table talk.
 * What the learner has ordered appears on the tables, once it is a word
 * they know (canon memorySystem: 커피 → coffee).
 */

const HW = CAFE.halfWidth;
const HD = CAFE.halfDepth;
const WALL_H = 2.8;
const BEAM_Z = [CAFE.tables[0].z, CAFE.tables[2].z];

function Walls() {
  type V3 = [number, number, number];
  const walls: { pos: V3; size: V3 }[] = [
    { pos: [0, WALL_H / 2, -HD - 0.2], size: [HW * 2 + 0.8, WALL_H, 0.4] },
    { pos: [-HW - 0.2, WALL_H / 2, 0], size: [0.4, WALL_H, HD * 2 + 0.4] },
    { pos: [HW + 0.2, WALL_H / 2, 0], size: [0.4, WALL_H, HD * 2 + 0.4] },
  ];
  return (
    <>
      {walls.map((w, i) => (
        <group key={i}>
          <mesh receiveShadow position={w.pos}>
            <boxGeometry args={w.size} />
            <primitive object={std(PALETTE.ivory, 0.95)} attach="material" />
          </mesh>
          <mesh position={[w.pos[0], 0.45, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 0.02, 0.9, w.size[2] + 0.02]} />
            <primitive object={std(PALETTE.charcoal, 0.85)} attach="material" />
          </mesh>
          <mesh castShadow position={[w.pos[0], WALL_H + 0.12, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 0.7, 0.2, w.size[2] + 0.7]} />
            <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** The windows: x of the wall face for a side, centre heights and sizes. */
const WIN = { zs: [-2.5, 2.5], y: 1.65, w: 1.86, h: 0.96 };
const WIN_SPOTS = [-1, 1].flatMap((side) => WIN.zs.map((z) => ({ side: side as -1 | 1, z })));

type V3 = [number, number, number];
const cyl = (k: Kit, mat: MatKey, p: V3, r: number, h: number, cast = false, rot?: V3) => k.add(mat, "cyl", p, [r * 2, h, r * 2], rot, cast);

/**
 * Window frames: a real wooden frame (jambs, head), two mullions and a
 * transom across the upper lights, and a sill you could set a cup on.
 */
function windowsKit(k: Kit): void {
  const { y, w, h } = WIN;
  for (const { side, z } of WIN_SPOTS) {
    const x = (d: number) => side * (HW - d);
    for (const s of [-1, 1]) k.box("woodDark", [x(0.03), y, z + s * (w / 2 + 0.035)], [0.06, h + 0.14, 0.07]);
    k.box("woodDark", [x(0.03), y + h / 2 + 0.035, z], [0.06, 0.07, w + 0.14]);
    k.box("woodLight", [x(0.07), y - h / 2 - 0.022, z], [0.14, 0.045, w + 0.26], true);
    k.box("woodDark", [x(0.015), y - h / 2 - 0.1, z], [0.03, 0.11, w + 0.12]);
    for (const m of [-0.31, 0.31]) k.box("woodDark", [x(0.02), y, z + m], [0.03, h, 0.032]);
    k.box("woodDark", [x(0.02), y + h / 2 - 0.3, z], [0.03, 0.032, w]);
  }
}

/**
 * The counter, dressed: a boarded front between a dark kick and a rail; an
 * espresso machine with two group heads, portafilters, gauges, a steam wand
 * and cups warming on top; a grinder with beans in its hopper; saucers and
 * cups; a tray with an order waiting; and a glass cake case — whole cakes
 * (strawberry, chocolate, green tea) below, small cakes on the shelf above,
 * the cakes the menu board offers.
 */
function counterKit(k: Kit): void {
  const { x: cx, z: cz, w, d } = CAFE.counter;
  const T = 1.1;
  const F = cz + d / 2;
  k.box("woodLight", [cx, 0.52, cz], [w, 1.04, d], true);
  k.box("charcoal", [cx, 1.07, cz], [w + 0.1, 0.06, d + 0.1], true);
  k.box("charcoal", [cx, 0.05, F + 0.006], [w, 0.1, 0.02]);
  k.box("woodDark", [cx, 0.99, F + 0.008], [w, 0.05, 0.025]);
  for (let gx = -w / 2 + 0.2; gx < w / 2 - 0.1; gx += 0.2) k.box("woodDark", [cx + gx, 0.54, F + 0.004], [0.014, 0.82, 0.012]);

  // Espresso machine.
  const mx = cx - 1.9, mz = cz - 0.05;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(k, "charcoal", [mx + sx * 0.33, T + 0.015, mz + sz * 0.18], 0.02, 0.03);
  k.box("steel", [mx, T + 0.21, mz], [0.8, 0.36, 0.5], true);
  k.box("charcoal", [mx, T + 0.405, mz], [0.82, 0.03, 0.52], true);
  k.box("charcoal", [mx, T + 0.08, mz + 0.252], [0.8, 0.1, 0.01]);
  k.box("accent", [mx, T + 0.35, mz + 0.253], [0.5, 0.025, 0.008]);
  k.box("steel", [mx, T + 0.045, mz + 0.33], [0.74, 0.03, 0.2]);
  for (const gx of [mx - 0.2, mx + 0.2]) {
    k.box("charcoal", [gx, T + 0.2, mz + 0.29], [0.14, 0.06, 0.1]);
    cyl(k, "steel", [gx, T + 0.155, mz + 0.31], 0.05, 0.05);
    cyl(k, "charcoal", [gx, T + 0.115, mz + 0.31], 0.052, 0.035);
    k.box("charcoal", [gx, T + 0.11, mz + 0.43], [0.034, 0.03, 0.17], false, [-0.15, 0, 0]);
    cyl(k, "ceramic", [gx, T + 0.07, mz + 0.31], 0.032, 0.045);
    cyl(k, "steel", [gx, T + 0.32, mz + 0.256], 0.04, 0.012, false, [Math.PI / 2, 0, 0]);
    cyl(k, "ceramic", [gx, T + 0.32, mz + 0.262], 0.031, 0.006, false, [Math.PI / 2, 0, 0]);
  }
  cyl(k, "steel", [mx + 0.36, T + 0.15, mz + 0.3], 0.008, 0.2, false, [0, 0, 0.25]);
  cyl(k, "charcoal", [mx + 0.36, T + 0.3, mz + 0.27], 0.02, 0.03, false, [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) {
    k.box("steel", [mx, T + 0.44, mz + s * 0.24], [0.8, 0.012, 0.012]);
    k.box("steel", [mx + s * 0.39, T + 0.44, mz], [0.012, 0.012, 0.48]);
  }
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) cyl(k, "ceramic", [mx - 0.27 + i * 0.18, T + 0.453, mz + s * 0.1], 0.038, 0.065);

  // Grinder.
  const gx = cx - 1.2, gz = cz - 0.1;
  k.box("charcoal", [gx, T + 0.04, gz], [0.2, 0.08, 0.24], true);
  cyl(k, "steel", [gx, T + 0.21, gz], 0.075, 0.26, true);
  k.box("charcoal", [gx, T + 0.15, gz + 0.09], [0.05, 0.04, 0.06]);
  cyl(k, "glass", [gx, T + 0.43, gz], 0.085, 0.18);
  cyl(k, "beans", [gx, T + 0.4, gz], 0.078, 0.12);
  cyl(k, "charcoal", [gx, T + 0.53, gz], 0.09, 0.02);

  // Saucers and cups, stacked; an order waiting on a tray.
  for (let i = 0; i < 5; i++) cyl(k, "ceramic", [cx - 0.6, T + 0.006 + i * 0.013, cz - 0.15], 0.075, 0.012);
  for (const [sx, n] of [[-0.38, 3], [-0.24, 2]] as const) for (let i = 0; i < n; i++) cyl(k, "ceramic", [cx + sx, T + 0.03 + i * 0.058, cz - 0.2], 0.04, 0.055);
  k.box("woodDark", [cx + 0.45, T + 0.01, cz + 0.25], [0.42, 0.02, 0.28]);
  for (const sx of [-0.1, 0.1]) {
    cyl(k, "ceramic", [cx + 0.45 + sx, T + 0.026, cz + 0.25], 0.07, 0.012);
    cyl(k, "ceramic", [cx + 0.45 + sx, T + 0.06, cz + 0.25], 0.042, 0.06);
    cyl(k, sx < 0 ? "beans" : "clothSage", [cx + 0.45 + sx, T + 0.088, cz + 0.25], 0.036, 0.006);
  }

  // Cake case.
  const kx = cx + 2.15, kz = cz + 0.02, kw = 1.4, kd = 0.62, kh = 0.44, kb = T + 0.06;
  k.box("woodDark", [kx, T + 0.03, kz], [kw + 0.04, 0.06, kd + 0.04], true);
  k.box("glass", [kx, kb + kh / 2, kz], [kw, kh, kd]);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) k.box("steel", [kx + sx * kw / 2, kb + kh / 2, kz + sz * kd / 2], [0.02, kh, 0.02]);
    k.box("steel", [kx, kb + kh, kz + sx * kd / 2], [kw, 0.02, 0.02]);
    k.box("steel", [kx + sx * kw / 2, kb + kh, kz], [0.02, 0.02, kd]);
  }
  const shelfY = kb + 0.25;
  k.box("glass", [kx, shelfY, kz], [kw - 0.04, 0.012, kd - 0.06]);
  const cakes: MatKey[] = ["sponge", "beans", "clothSage"];
  cakes.forEach((body, i) => {
    const x = kx + (i - 1) * 0.45, z = kz + 0.02;
    cyl(k, "ceramic", [x, kb + 0.005, z], 0.13, 0.01);
    cyl(k, body, [x, kb + 0.055, z], 0.11, 0.09);
    cyl(k, "cream", [x, kb + 0.11, z], 0.113, 0.022);
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * Math.PI * 2 + i;
      k.add(j % 2 && body !== "sponge" ? "cream" : "berry", "fruit", [x + Math.cos(a) * 0.08, kb + 0.13, z + Math.sin(a) * 0.08], [0.03, 0.028, 0.03]);
    }
  });
  for (let i = 0; i < 4; i++) {
    const x = kx - 0.48 + i * 0.32, z = kz + 0.03;
    cyl(k, "ceramic", [x, shelfY + 0.01, z], 0.06, 0.008);
    cyl(k, i % 2 ? "beans" : "sponge", [x, shelfY + 0.036, z], 0.045, 0.045);
    k.add("cream", "fruit", [x, shelfY + 0.072, z], [0.085, 0.05, 0.085]);
    k.add("berry", "fruit", [x, shelfY + 0.1, z], [0.028, 0.026, 0.028]);
  }

  // A little plant at the far end.
  cyl(k, "ceramic", [cx - 2.72, T + 0.06, cz + 0.15], 0.07, 0.12, true);
  k.add("leafDark", "leaves", [cx - 2.72, T + 0.115, cz + 0.15], [0.36, 0.3, 0.34], [0, 0.7, 0]);
  k.add("leaf", "leaves", [cx - 2.71, T + 0.115, cz + 0.14], [0.27, 0.34, 0.26], [0, 1.15, 0]);
}

/**
 * Two shelves on the back wall either side of the 카페 sign: coffee in glass
 * jars, tea tins, mugs, cups and small plants.
 */
function shelvesKit(k: Kit): void {
  const z = -HD + 0.11;
  for (const cx of [-2.45, 2.45]) {
    for (const [row, sy] of [[0, 1.5], [1, 1.92]] as const) {
      const len = 2.2;
      k.box("woodLight", [cx, sy, z], [len, 0.035, 0.22], true);
      for (const s of [-1, 1]) k.box("woodDark", [cx + s * (len / 2 - 0.18), sy - 0.05, z - 0.03], [0.02, 0.07, 0.15]);
      const top = sy + 0.0175;
      let x = cx - len / 2 + 0.14;
      let n = Math.round(cx * 3 + row * 5 + 20);
      while (x < cx + len / 2 - 0.12) {
        const kind = n % 6;
        const zz = z + jitter(n, 0.025);
        if (kind === 0 || kind === 3) {
          cyl(k, "glass", [x, top + 0.1, zz], 0.06, 0.2);
          cyl(k, kind === 0 ? "beans" : "clothSage", [x, top + 0.066, zz], 0.054, 0.13);
          cyl(k, "steel", [x, top + 0.212, zz], 0.062, 0.025);
          x += 0.19;
        } else if (kind === 1) {
          for (const dx of [0, 0.12]) {
            const m: MatKey = (n + dx * 10) % 3 < 1 ? "clothRed" : (n + dx * 10) % 3 < 2 ? "ceramic" : "clothSage";
            cyl(k, m, [x + dx, top + 0.045, zz], 0.045, 0.09);
            k.box(m, [x + dx + 0.052, top + 0.05, zz], [0.016, 0.05, 0.012]);
          }
          x += 0.29;
        } else if (kind === 2) {
          const m: MatKey = n % 4 < 2 ? "clothRed" : "clothBlue";
          cyl(k, m, [x, top + 0.065, zz], 0.05, 0.13);
          cyl(k, "steel", [x, top + 0.137, zz], 0.052, 0.015);
          x += 0.16;
        } else if (kind === 4) {
          cyl(k, "ceramic", [x, top + 0.045, zz], 0.06, 0.09);
          k.add("leafDark", "leaves", [x, top + 0.085, zz], [0.27, 0.22, 0.25], [0, n, 0]);
          k.add("leaf", "leaves", [x + 0.01, top + 0.085, zz], [0.2, 0.25, 0.19], [0, n + 0.45, 0]);
          x += 0.2;
        } else {
          for (let i = 0; i < 3; i++) cyl(k, "ceramic", [x, top + 0.028 + i * 0.056, zz], 0.04, 0.055);
          x += 0.14;
        }
        n += 1;
      }
    }
  }
}

/** Every built-in fitting of the café, as one instanced kit. */
function CafeFittings() {
  const kit = useMemo(() => {
    const k = new Kit();
    windowsKit(k);
    counterKit(k);
    shelvesKit(k);
    return k;
  }, []);
  return <Batch kit={kit} />;
}

/**
 * The view out of each window: across the street, a row of small Seoul
 * shop buildings (striped awnings, glass shopfronts, windows on the upper
 * floors), a street tree, the pavement — painted softly, as seen through
 * glass, with a faint glint. One canvas (2 × 2 views) and one draw.
 */
function paintStreet(ctx: CanvasRenderingContext2D, ox: number, oy: number, W: number, H: number, seed: number): void {
  const r = (i: number) => jitter(seed * 31 + i, 0.5) + 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, W, H);
  ctx.clip();
  ctx.translate(ox, oy);
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
  sky.addColorStop(0, "#9DC2E4");
  sky.addColorStop(1, "#E6ECEC");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Far towers in the haze.
  ctx.fillStyle = "rgba(160,176,190,0.55)";
  for (let i = 0; i < 6; i++) ctx.fillRect(r(i) * W, H * (0.12 + r(i + 9) * 0.2), W * (0.06 + r(i + 4) * 0.08), H);
  const gy = H * 0.8;
  const fronts = ["#E9DCC4", "#D7BE9C", "#B8866A", "#EFEAE0", "#CBD0D1", "#E3CBB2"];
  const awn = ["#B5644D", "#80926C", "#566E8E", "#C9A04A"];
  let x = -W * r(20) * 0.3;
  let i = 0;
  while (x < W) {
    const bw = W * (0.26 + r(30 + i) * 0.22);
    const bh = H * (0.42 + r(40 + i) * 0.3);
    const top = gy - bh;
    ctx.fillStyle = fronts[Math.floor(r(50 + i) * fronts.length) % fronts.length];
    ctx.fillRect(x, top, bw - 2, bh);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x, top, bw - 2, H * 0.025);
    // Upper-floor windows.
    const fl = H * 0.13;
    for (let fy = top + H * 0.06; fy < gy - H * 0.26; fy += fl) {
      for (let wx = x + bw * 0.1; wx < x + bw - bw * 0.18; wx += bw * 0.26) {
        ctx.fillStyle = "#F4F1EA";
        ctx.fillRect(wx - 1, fy - 1, bw * 0.16 + 2, fl * 0.58 + 2);
        ctx.fillStyle = "#6F8293";
        ctx.fillRect(wx, fy, bw * 0.16, fl * 0.58);
      }
    }
    // Sign band, awning and shop glass on the ground floor.
    ctx.fillStyle = ["#F4E9C8", "#2F3438", "#FFFDF6", "#C84B3C"][i % 4];
    ctx.fillRect(x + bw * 0.08, gy - H * 0.25, bw * 0.84 - 2, H * 0.045);
    ctx.fillStyle = "#3D4850";
    ctx.fillRect(x + bw * 0.06, gy - H * 0.15, bw * 0.88 - 2, H * 0.15);
    const ac = awn[(i + seed) % awn.length];
    const stripes = 7;
    for (let s = 0; s < stripes; s++) {
      ctx.fillStyle = s % 2 ? "#F6F1E6" : ac;
      const sx0 = x + bw * 0.04 + (s / stripes) * bw * 0.92;
      ctx.beginPath();
      ctx.moveTo(sx0, gy - H * 0.2);
      ctx.lineTo(sx0 + (bw * 0.92) / stripes, gy - H * 0.2);
      ctx.lineTo(sx0 + (bw * 0.92) / stripes + 2, gy - H * 0.14);
      ctx.lineTo(sx0 - 2, gy - H * 0.14);
      ctx.fill();
    }
    x += bw;
    i++;
  }
  // Pavement and kerb.
  ctx.fillStyle = "#BDB5A8";
  ctx.fillRect(0, gy, W, H - gy);
  ctx.fillStyle = "#9A9286";
  ctx.fillRect(0, gy + H * 0.1, W, H * 0.02);
  ctx.fillStyle = "#7B7975";
  ctx.fillRect(0, gy + H * 0.12, W, H);
  // A street tree in front.
  const tx = W * (0.2 + r(60) * 0.6);
  ctx.fillStyle = "#5A4334";
  ctx.fillRect(tx - W * 0.008, H * 0.42, W * 0.016, gy + H * 0.06 - H * 0.42);
  const greens = ["#5E8B45", "#77A253", "#8DB35F", "#4F7A3C"];
  for (let j = 0; j < 46; j++) {
    const a = r(70 + j) * Math.PI * 2;
    const d = Math.sqrt(r(130 + j));
    ctx.fillStyle = greens[j % greens.length];
    ctx.beginPath();
    ctx.arc(tx + Math.cos(a) * d * W * 0.13, H * 0.33 + Math.sin(a) * d * H * 0.2, W * (0.022 + r(190 + j) * 0.025), 0, Math.PI * 2);
    ctx.fill();
  }
  // Daylight haze, and a glint across the glass.
  ctx.fillStyle = "rgba(255,252,244,0.14)";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0.3, "rgba(255,255,255,0)");
  g.addColorStop(0.42, "rgba(255,255,255,0.16)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function WindowViews() {
  const { tex, geo } = useMemo(() => {
    const S = pickQuality().maxTexture <= 1024 ? 128 : 256;
    const c = document.createElement("canvas");
    c.width = S * 4;
    c.height = S * 2;
    const ctx = c.getContext("2d");
    if (ctx) WIN_SPOTS.forEach((_, i) => paintStreet(ctx, (i % 2) * S * 2, Math.floor(i / 2) * S, S * 2, S, i + 1));
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    const { y, w, h } = WIN;
    WIN_SPOTS.forEach(({ side, z }, i) => {
      const x = side * (HW - 0.006);
      const u0 = (i % 2) / 2, v1 = 1 - Math.floor(i / 2) / 2, v0 = v1 - 0.5;
      const b = pos.length / 3;
      // Corners: left/right as the learner faces this wall (right = side × +z).
      for (const [cu, cv] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        pos.push(x, y + (cv - 0.5) * h, z + side * (cu - 0.5) * w);
        uv.push(u0 + cu * 0.5, v0 + cv * 0.5);
      }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
    geo.setIndex(idx);
    return { tex, geo };
  }, []);
  const mat = useMemo(() => new MeshBasicMaterial({ map: tex, side: DoubleSide, color: "#F2EEE6" }), [tex]);
  useEffect(() => () => { tex.dispose(); geo.dispose(); mat.dispose(); }, [tex, geo, mat]);
  return <mesh geometry={geo} material={mat} />;
}

const cupMat = std(PALETTE.white, 0.35);
const coffeeMat = std("#5A3418", 0.25);
const teaMat = std("#8DB255", 0.3);
const saucerMat = std(PALETTE.white, 0.4);
const spongeMat = std("#F3DDB8", 0.8);
const creamMat = std("#F2A7B8", 0.6);
const berryMat = std("#C8242B", 0.35);

/** A cup on its saucer, filled with coffee or green tea. */
function Cup({ x, z, tea }: { x: number; z: number; tea?: boolean }) {
  return (
    <group position={[x, 0.765, z]}>
      <mesh castShadow position={[0, 0.006, 0]}>
        <cylinderGeometry args={[0.085, 0.07, 0.012, 28]} />
        <primitive object={saucerMat} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.048, 0.036, 0.08, 28, 1, true]} />
        <primitive object={cupMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.045, 28]} />
        <primitive object={tea ? teaMat : coffeeMat} attach="material" />
      </mesh>
      <mesh position={[0.055, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.018, 0.006, 8, 16, Math.PI]} />
        <primitive object={cupMat} attach="material" />
      </mesh>
    </group>
  );
}

/** A slice of strawberry cake on a plate. */
function Cake({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.765, z]}>
      <mesh castShadow position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.01, 28]} />
        <primitive object={saucerMat} attach="material" />
      </mesh>
      {/* A wedge: a third of a short cylinder. */}
      <mesh castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.06, 20, 1, false, 0, Math.PI / 3]} />
        <primitive object={spongeMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.074, 0]}>
        <cylinderGeometry args={[0.076, 0.076, 0.012, 20, 1, false, 0, Math.PI / 3]} />
        <primitive object={creamMat} attach="material" />
      </mesh>
      <mesh position={[Math.sin(Math.PI / 6) * 0.045, 0.092, Math.cos(Math.PI / 6) * 0.045]}>
        <sphereGeometry args={[0.014, 12, 10]} />
        <primitive object={berryMat} attach="material" />
      </mesh>
    </group>
  );
}

function Table({ x, z, words }: { x: number; z: number; words: string[] }) {
  const coffee = words.includes("커피");
  const tea = words.includes("녹차");
  const cake = words.includes("케이크");
  return (
    <group position={[x, 0, z]}>
      {/* The top: grained warm wood with a darker edge band, smooth-round. */}
      <mesh castShadow receiveShadow position={[0, 0.745, 0]}>
        <cylinderGeometry args={[0.5, 0.49, 0.04, 48]} />
        <primitive object={MAT.woodWarm} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 0.715, 0]}>
        <cylinderGeometry args={[0.49, 0.47, 0.025, 48]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      {/* One pedestal on a round iron foot. */}
      <mesh castShadow position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.68, 16]} />
        <primitive object={MAT.metal} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.24, 0.27, 0.04, 32]} />
        <primitive object={MAT.metal} attach="material" />
      </mesh>
      {/* Two places at the table: a drink each, and a cake between them. */}
      {(coffee || tea) && <Cup x={-0.24} z={0.05} tea={!coffee} />}
      {(coffee || tea) && <Cup x={0.24} z={-0.05} tea={tea} />}
      {cake && <Cake x={0} z={0.18} />}
      {[-1, 1].map((side) => (
        <CafeChair key={side} side={side as -1 | 1} cushion={CUSHIONS[(Math.round(x * 3 + z * 7) + 40) % CUSHIONS.length]} />
      ))}
    </group>
  );
}

const CUSHIONS = [MAT.clothSage, MAT.clothRed, MAT.clothBlue, MAT.fabric];

/**
 * A café chair: round tapered legs, a wooden seat with a cloth cushion, and
 * a back of three slats under a top rail (the back stands on the far side
 * from the table).
 */
function CafeChair({ side, cushion }: { side: -1 | 1; cushion: Material }) {
  const back = side * 0.19;
  return (
    <group position={[side * 0.82, 0, 0]}>
      {[-1, 1].flatMap((lx) =>
        [-1, 1].map((lz) => {
          const rear = lx === side;
          return (
            <mesh key={`${lx}${lz}`} castShadow position={[lx * 0.17, rear ? 0.47 : 0.22, lz * 0.17]}>
              <cylinderGeometry args={[0.018, 0.024, rear ? 0.94 : 0.44, 10]} />
              <primitive object={MAT.woodDark} attach="material" />
            </mesh>
          );
        }),
      )}
      <mesh castShadow receiveShadow position={[0, 0.455, 0]}>
        <boxGeometry args={[0.42, 0.04, 0.42]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[-side * 0.01, 0.49, 0]}>
        <boxGeometry args={[0.38, 0.035, 0.38]} />
        <primitive object={cushion} attach="material" />
      </mesh>
      {/* Back: a curved-feel top rail and three slats. */}
      <mesh castShadow position={[back, 0.9, 0]}>
        <boxGeometry args={[0.035, 0.08, 0.42]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      {[-0.11, 0, 0.11].map((zz) => (
        <mesh key={zz} castShadow position={[back, 0.69, zz]}>
          <boxGeometry args={[0.022, 0.36, 0.045]} />
          <primitive object={MAT.woodDark} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * A plank ceiling at the top of the walls, facing down only. Seen from
 * inside (the Eyes view, a low camera) the café reads as a room instead of
 * walls under open sky; when the camera behind the learner rises above the
 * walls, the plane faces away from it and is culled, so the view in from
 * above stays exactly as before — the camera never fights the ceiling. It
 * casts no shadow: the sun still lights the tables.
 */
function Ceiling() {
  const planks = useTiledTexture(paintPlanks, HW / 1.2, (HD + 0.4) / 1.2);
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_H + 0.02, 0.1]}>
      <planeGeometry args={[HW * 2 + 0.4, HD * 2 + 0.6]} />
      <meshStandardMaterial map={planks} color="#FFF3E0" roughness={0.9} emissive="#C9A27A" emissiveIntensity={0.32} />
    </mesh>
  );
}

/** Wooden beams across the room with a pendant lamp over each table (hung high: the camera behind the learner looks out at about 2.5 m, and a low shade sat in its view). */
function BeamsAndLamps() {
  return (
    <>
      {BEAM_Z.map((z) => (
        <mesh key={z} castShadow position={[0, WALL_H - 0.05, z]}>
          <boxGeometry args={[HW * 2 + 0.4, 0.18, 0.2]} />
          <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
        </mesh>
      ))}
      {CAFE.tables.map((t) => (
        <group key={`${t.x}${t.z}`} position={[t.x, 0, t.z]}>
          <mesh position={[0, 2.6, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
            <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
          </mesh>
          <mesh position={[0, 2.45, 0]}>
            <coneGeometry args={[0.16, 0.15, 18, 1, true]} />
            <meshBasicMaterial color={PALETTE.yellow} toneMapped={false} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 2.39, 0]}>
            <sphereGeometry args={[0.05, 10, 8]} />
            <primitive object={std(PALETTE.white, 0.8, { emissive: PALETTE.ivory, emissiveIntensity: 1 })} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function ConversationCafe({ words = [] }: { words?: string[] }) {
  const planks = useTiledTexture(paintPlanks, HW / 1.5, HD / 1.5);
  const photo = usePhotoFloor("planks", HW / 1.5, HD / 1.5);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HD * 2, ...FLOOR_GRID]} />
        <meshStandardMaterial key={photo ? "photo" : "painted"} map={photo?.map ?? planks} normalMap={photo?.normal ?? null} roughnessMap={photo?.rough ?? null} roughness={photo ? 1 : 0.8} color={photo ? "#FFF4E6" : "#ffffff"} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[70, 70, ...FLOOR_GRID]} />
        <primitive object={std(PALETTE.stone, 1)} attach="material" />
      </mesh>
      <Walls />
      <CafeFittings />
      <WindowViews />
      {/* 카페 over the counter; the menu on the wall beside it */}
      <group position={[0, 2.25, -HD + 0.03]}>
        <Signboard text={CAFE.sign} w={1.8} h={0.7} aspect={2.6} />
      </group>
      <group position={[-4.9, 1.75, -HD + 0.03]}>
        <Signboard text={CAFE.menu} w={1.8} h={1.3} aspect={1.4} />
      </group>
      {CAFE.tables.map((t) => (
        <Table key={`${t.x}${t.z}`} x={t.x} z={t.z} words={words} />
      ))}
      <Ceiling />
      <BeamsAndLamps />
      {/* The door back to the Hub */}
      <GateWall z={HD + 0.2} facing={-1} open accent={false} halfWidth={HW} />
    </group>
  );
}
