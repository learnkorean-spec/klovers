import { useEffect, useMemo } from "react";
import { CanvasTexture, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { pickQuality } from "../systems/quality";
import { ALLEY } from "../config/rooms";
import { FLOOR_GRID } from "../config/world";
import { MAT } from "../config/materials";
import Batch from "./Batch";
import { Kit, awning, basket, bunting, flowers, jitter, planter, type MatKey } from "./kit";
import { Signboard } from "./parts";
import { floorBreakup, FLOOR_BREAKUP_KEY, paintPaving, useTiledTexture, usePhotoFloor } from "./textures";

/**
 * Seoul Journey, part 2 — the market alley (골목 시장), canon worlds
 * "seoul-journey", levelJourney.l5. One subway stop from the street corner.
 *
 * Two- and three-storey shop houses line the alley; at street level, stalls
 * under coloured awnings (fruit, side dishes, hats and socks, fish cakes,
 * flowers), each with its name on a board; the street-food cart in the
 * middle; strings of flags overhead; a small café closing the north end;
 * the subway exit's glass canopy at the south end, under the alley's arch.
 *
 * Every stop is in config/interactions ("Seoul Journey part 2").
 */

const HW = ALLEY.halfWidth;
const HL = ALLEY.halfLength;
const KO = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", sans-serif';

/* ───────────────────────── Shop-house fronts ───────────────────────── */

/** Canvas units of one painted front (the atlas scales them up on desktop). */
const FW = 256;
const FH = 384;
/** Window cells on a front, in canvas units: 3 across, 2 storeys. */
const WIN = { x0: 22, dx: 76, y0: 34, dy: 112, w: 58, h: 72 };
const SIGN_Y = 270;

/** Paint one front into ctx (0..FW × 0..FH): windows, a sign band, a shutter. */
function paintFacade(ctx: CanvasRenderingContext2D, seed: number, base: string, signs: string[]): void {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, FW, FH);
  // A little weathering.
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(60,45,35,${0.02 + ((i * 37 + seed) % 7) * 0.006})`;
    ctx.fillRect((i * 53 + seed * 11) % FW, (i * 97 + seed * 7) % FH, 6 + (i % 5) * 4, 3 + (i % 3) * 3);
  }
  // Rain streaks under each sill.
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 3; col++) {
      const x = WIN.x0 + col * WIN.dx;
      const y = WIN.y0 + row * WIN.dy + WIN.h + 6;
      const g = ctx.createLinearGradient(0, y, 0, y + 26);
      g.addColorStop(0, "rgba(70,60,50,0.16)");
      g.addColorStop(1, "rgba(70,60,50,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x + 6, y, WIN.w - 12, 26);
    }
  // Upper floors: glass with warm or sky reflections, a few with plants.
  // (The frames and sills are real geometry in front of the paint.)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const x = WIN.x0 + col * WIN.dx;
      const y = WIN.y0 + row * WIN.dy;
      ctx.fillStyle = "#3B3A38";
      ctx.fillRect(x - 3, y - 3, WIN.w + 6, WIN.h + 6);
      const warm = (seed + row * 3 + col) % 3 === 0;
      const g = ctx.createLinearGradient(x, y, x + WIN.w, y + WIN.h);
      g.addColorStop(0, warm ? "#F6D9A2" : "#B8CBDA");
      g.addColorStop(1, warm ? "#C98E52" : "#6F8698");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, WIN.w, WIN.h);
      // A curtain on one side of some windows.
      if ((seed + col * 5 + row) % 3 === 1) {
        ctx.fillStyle = warm ? "rgba(250,240,220,0.75)" : "rgba(235,232,225,0.7)";
        ctx.fillRect(x + ((col + seed) % 2 ? WIN.w - 18 : 0), y, 18, WIN.h);
      }
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.moveTo(x + 8, y + WIN.h);
      ctx.lineTo(x + 22, y + WIN.h);
      ctx.lineTo(x + 46, y);
      ctx.lineTo(x + 32, y);
      ctx.fill();
      if ((seed + col + row) % 4 === 1) {
        ctx.fillStyle = "#4E7A4C";
        for (let k = 0; k < 5; k++) ctx.fillRect(x + 4 + k * 11, y + 62 - (k % 2) * 5, 8, 12);
      }
    }
  }
  // A shop sign band across the bottom (the stall stands in front of it).
  ctx.fillStyle = ["#2F4C6E", "#7A2E2A", "#2E5A43", "#5B3A6E"][seed % 4];
  ctx.fillRect(8, SIGN_Y, 240, 56);
  ctx.fillStyle = "#FFF6E0";
  ctx.font = `700 34px ${KO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(signs[seed % signs.length], 128, SIGN_Y + 29);
  // Ground floor: a shutter, half raised.
  ctx.fillStyle = "#8C8C88";
  ctx.fillRect(16, 330, 224, 54);
  ctx.fillStyle = "rgba(40,40,40,0.25)";
  for (let y = 332; y < FH; y += 6) ctx.fillRect(16, y, 224, 2);
}

const HOUSE_COLOURS = ["#E6D6BE", "#D9C2A6", "#CFD5D2", "#E8CFB8", "#D6CBB8", "#C9B9A4"];
const HOUSE_SIGNS = ["떡집", "약국", "미용실", "분식", "철물점", "세탁소", "정육점", "반찬가게"];

interface House { x: number; z: number; len: number; h: number; side: -1 | 1; seed: number }

/** The shop houses on both sides of the alley: 6 a side. */
const HOUSES: House[] = (() => {
  const out: House[] = [];
  const n = 6;
  const len = (HL * 2) / n;
  for (const side of [-1, 1] as const)
    for (let i = 0; i < n; i++) {
      const seed = i * 2 + (side > 0 ? 1 : 0);
      out.push({ x: side * (HW + 1.6), z: -HL + len * (i + 0.5), len: len - 0.08, h: 6.2 + (seed % 3) * 1.1, side, seed });
    }
  return out;
})();
const ATLAS_COLS = 4;
const ATLAS_ROWS = Math.ceil(HOUSES.length / ATLAS_COLS);

/** Where a point of a front's canvas (u, v in canvas units) sits in the world. */
function onFront(h: House, u: number, v: number, out = 0): [number, number, number] {
  return [h.side * (HW - 0.01) - h.side * out, h.h * (1 - v / FH), h.z + h.side * (u / FW - 0.5) * h.len];
}

/**
 * The houses' solid parts, added to the alley's kit: the block and roof
 * edge, and in front of every painted window a real frame, a stone sill
 * and here and there a flower box or an air-conditioner — the fronts get
 * depth and shadow instead of reading as flat posters.
 */
function housesKit(k: Kit): void {
  for (const h of HOUSES) {
    k.box("plaster", [h.x, h.h / 2, h.z], [3.2, h.h, h.len], true);
    k.box("charcoal", [h.x, h.h + 0.08, h.z], [3.3, 0.16, h.len + 0.04]);
    // A parapet coping strip a little below the roof edge.
    const [px, , pz] = onFront(h, FW / 2, 0, 0.04);
    k.box("stoneWarm", [px, h.h - 0.3, pz], [0.08, 0.1, h.len]);
    const sx = h.len / FW; // metres per canvas unit along the front
    const sy = h.h / FH;
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 3; col++) {
        const u = WIN.x0 + col * WIN.dx + WIN.w / 2;
        const v = WIN.y0 + row * WIN.dy + WIN.h / 2;
        const ww = (WIN.w + 6) * sx;
        const wh = (WIN.h + 6) * sy;
        const [x, y, z] = onFront(h, u, v, 0.035);
        // Frame: two jambs, a head and a middle transom, standing 7 cm proud.
        for (const s of [-1, 1]) k.box("woodDark", [x, y, z + s * (ww / 2 - 0.03)], [0.07, wh, 0.06]);
        k.box("woodDark", [x, y + wh / 2 - 0.03, z], [0.07, 0.06, ww]);
        k.box("woodDark", [x, y, z], [0.05, wh - 0.06, 0.035]);
        const [lx, , lz] = onFront(h, u, v, 0.08);
        k.box("stoneWarm", [lx, y - wh / 2 - 0.03, lz], [0.16, 0.07, ww + 0.14], true);
        const pick = (h.seed * 7 + row * 3 + col * 5) % 9;
        if (pick === 2 || pick === 6) {
          // Flower box on the sill.
          const [fx, , fz] = onFront(h, u, v, 0.15);
          k.box("woodLight", [fx, y - wh / 2 + 0.08, fz], [0.16, 0.16, ww - 0.1], true);
          for (let f = 0; f < 4; f++) k.add(f % 2 ? "leafDark" : "leaf", "fruit", [fx, y - wh / 2 + 0.2, fz + (f - 1.5) * (ww - 0.2) / 4], [0.24, 0.18, 0.24]);
          k.add(pick === 2 ? "flowerPink" : "clothRed", "ball", [fx - h.side * 0.04, y - wh / 2 + 0.27, fz], [0.08, 0.08, 0.08]);
        } else if (pick === 4 && row === 0) {
          // An air-conditioner hung under the window.
          const [ax, , az] = onFront(h, u, v, 0.18);
          k.box("steel", [ax, y - wh / 2 - 0.42, az + h.side * 0.12], [0.34, 0.5, 0.7], true);
          k.box("charcoal", [ax - h.side * 0.172, y - wh / 2 - 0.42, az + h.side * 0.12], [0.005, 0.36, 0.5]);
        }
      }
    // A shallow canopy over the sign band: it throws a shadow line on the sign.
    const [cx, cy, cz] = onFront(h, FW / 2, SIGN_Y - 4, 0.2);
    k.box("charcoal", [cx, cy, cz], [0.4, 0.05, h.len - 0.1], true);
  }
}

/**
 * The painted fronts: all twelve on one atlas canvas and one merged mesh —
 * one draw and one texture for the alley's walls instead of a material,
 * texture and three meshes per house. Desktop paints the atlas at 1.5×.
 */
function Houses() {
  const made = useMemo(() => {
    const scale = pickQuality().maxTexture <= 1024 ? 1 : 1.5;
    let map: CanvasTexture | null = null;
    try {
      const c = document.createElement("canvas");
      c.width = Math.round(FW * ATLAS_COLS * scale);
      c.height = Math.round(FH * ATLAS_ROWS * scale);
      const ctx = c.getContext("2d");
      if (ctx) {
        HOUSES.forEach((h, i) => {
          const ox = (i % ATLAS_COLS) * FW * scale;
          const oy = Math.floor(i / ATLAS_COLS) * FH * scale;
          ctx.save();
          ctx.setTransform(scale, 0, 0, scale, ox, oy);
          ctx.beginPath();
          ctx.rect(0, 0, FW, FH);
          ctx.clip();
          paintFacade(ctx, h.seed, HOUSE_COLOURS[((h.seed >> 1) + (h.side > 0 ? 3 : 0)) % HOUSE_COLOURS.length], HOUSE_SIGNS);
          ctx.restore();
        });
        map = new CanvasTexture(c);
        map.colorSpace = SRGBColorSpace;
        map.anisotropy = 8;
      }
    } catch {
      map = null;
    }
    const planes = HOUSES.map((h, i) => {
      const g = new PlaneGeometry(h.len, h.h);
      g.rotateY(-h.side * (Math.PI / 2));
      g.translate(h.x - h.side * 1.61, h.h / 2, h.z);
      const uv = g.getAttribute("uv");
      const c0 = (i % ATLAS_COLS) / ATLAS_COLS;
      const r0 = Math.floor(i / ATLAS_COLS);
      for (let j = 0; j < uv.count; j++) {
        // Canvas rows run top-down; texture v runs bottom-up (flipY).
        uv.setXY(j, c0 + uv.getX(j) / ATLAS_COLS, 1 - (r0 + 1 - uv.getY(j)) / ATLAS_ROWS);
      }
      return g;
    });
    const geometry = mergeGeometries(planes) ?? planes[0];
    planes.forEach((g) => g !== geometry && g.dispose());
    const material = new MeshStandardMaterial({ map, roughness: 0.9 });
    return { geometry, material, map };
  }, []);
  useEffect(() => () => (made.geometry.dispose(), made.material.dispose(), made.map?.dispose()), [made]);
  return <mesh receiveShadow geometry={made.geometry} material={made.material} />;
}

/* ───────────────────────── Stalls, cart, arch ───────────────────────── */

const AWNINGS: MatKey[] = ["clothRed", "clothBlue", "clothSage", "clothRed", "fabric"];

/** What each stall shows on its counter. */
function goods(k: Kit, kind: string, x: number, z: number, seed: number) {
  const top = 0.98;
  const row = (mats: MatKey[], geo: "ball" | "box" | "cyl", s: [number, number, number], perRow = 4, rows = 3) => {
    for (let r = 0; r < rows; r++)
      for (let i = 0; i < perRow; i++) {
        const zz = z - 1.2 + (i + 0.5) * (2.4 / perRow);
        const xx = x + (r - 1) * 0.36;
        k.add(mats[(i + r + seed) % mats.length], geo, [xx, top + s[1] / 2, zz + jitter(seed + i * 7 + r, 0.04)], s, [0, jitter(seed + i + r * 5, 1), 0]);
      }
  };
  if (kind === "fruit") {
    // Baskets heaped with apples and tangerines.
    // Two rows of woven baskets, each heaped with single fruit.
    const fruit: MatKey[] = ["fruitRed", "fruitOrange", "fruitRed", "fruitOrange"];
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 4; i++) basket(k, x + (r - 0.5) * 0.36, z - 1.05 + i * 0.7 + r * 0.12, 0.62, fruit[(i + r) % 4], top);
  } else if (kind === "banchan") {
    // Steel trays, each heaped with its own side dish, piece by piece:
    // kimchi, spinach namul, bean sprouts, braised black beans, radish
    // kkakdugi, stir-fried fish cake. A white price card in every tray.
    const dishes = ["kimchi", "namul", "sprouts", "beans", "kkakdugi", "fishcake"] as const;
    const bed: Record<(typeof dishes)[number], MatKey> = { kimchi: "kimchi", namul: "leafDark", sprouts: "sprouts", beans: "beans", kkakdugi: "kimchi", fishcake: "fishcake" };
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 5; i++) {
        const n = i + r * 5;
        const xx = x + (r - 0.5) * 0.34;
        const zz = z - 1.2 + (i + 0.5) * 0.48;
        const dish = dishes[(n + seed) % dishes.length];
        const sd = seed * 31 + n * 97;
        k.add("steel", "box", [xx, top + 0.03, zz], [0.3, 0.06, 0.42]);
        k.add("steel", "box", [xx, top + 0.063, zz], [0.32, 0.008, 0.44]);
        // A low bed of the dish fills the tray; the pieces heap on it.
        k.add(bed[dish], "ball", [xx, top + 0.055, zz], [0.25, 0.035, 0.36], [0, jitter(sd, 0.5), 0]);
        const count = { kimchi: 13, namul: 16, sprouts: 22, beans: 30, kkakdugi: 18, fishcake: 14 }[dish];
        for (let c = 0; c < count; c++) {
          // Denser toward the middle, a little higher there too.
          const u = (c + 0.5) / count;
          const rad = Math.sqrt(u) * 0.9;
          const ang = c * 2.39996 + sd;
          const px = xx + Math.cos(ang) * rad * 0.1;
          const pz = zz + Math.sin(ang) * rad * 0.15;
          const h = top + 0.072 + (1 - rad) * 0.02 + jitter(sd + c, 0.004);
          const tilt = (q: number) => jitter(sd + c * 7 + q, q);
          const yaw = jitter(sd + c * 3, Math.PI);
          if (dish === "kimchi") k.add("kimchi", "fruit", [px, h, pz], [0.085, 0.024, 0.06], [tilt(0.5), yaw, tilt(0.6)]);
          else if (dish === "namul") k.add("leafDark", "fruit", [px, h - 0.004, pz], [0.075, 0.014, 0.028], [tilt(0.3), yaw, tilt(0.3)]);
          else if (dish === "beans") k.add("beans", "fruit", [px, h, pz], [0.024, 0.017, 0.03], [0, yaw, 0]);
          else if (dish === "kkakdugi") k.box("kimchi", [px, h + 0.004, pz], [0.032, 0.03, 0.032], false, [tilt(0.4), yaw, tilt(0.4)]);
          else if (dish === "fishcake") k.box("fishcake", [px, h, pz], [0.09, 0.012, 0.026], false, [tilt(0.3), yaw, tilt(0.4)]);
          else {
            // A bean sprout: a pale stalk lying in the heap, a yellow head.
            k.add("sprouts", "cylLow", [px, h - 0.004, pz], [0.008, 0.09, 0.008], [Math.PI / 2 + tilt(0.2), yaw, 0]);
            k.add("pollen", "fruit", [px + Math.sin(yaw) * 0.045, h - 0.002, pz + Math.cos(yaw) * 0.045], [0.014, 0.012, 0.016]);
          }
        }
        k.box("paper", [xx + Math.sign(x) * 0.1, top + 0.12, zz - 0.15], [0.006, 0.05, 0.07], false, [0, 0, Math.sign(x) * 0.15]);
      }
  } else if (kind === "hats") {
    // Caps on the back of the counter (a crown and a peak facing the
    // alley), folded socks in pairs at the front.
    const back = Math.sign(x);
    const caps: MatKey[] = ["clothBlue", "clothSage", "fabric", "clothRed", "charcoal"];
    for (let i = 0; i < 5; i++) {
      const zz = z - 1.2 + (i + 0.5) * 0.48;
      const xx = x + back * 0.2;
      const m = caps[(i + seed) % caps.length];
      k.add(m, "ball", [xx, top + 0.02, zz], [0.2, 0.22, 0.21]);
      k.add(m, "cylLow", [xx - back * 0.12, top + 0.01, zz], [0.12, 0.012, 0.19], [0, 0, back * 0.12]);
    }
    const socks: MatKey[] = ["flowerWhite", "charcoal", "clothBlue", "fabric", "clothRed", "clothSage"];
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 6; i++) {
        const zz = z - 1.25 + (i + 0.5) * 0.42;
        const xx = x - back * (0.27 - r * 0.15);
        const m = socks[(i + r * 3 + seed) % socks.length];
        for (const dz of [-0.035, 0.035]) k.box(m, [xx, top + 0.015 + (dz > 0 ? 0.002 : 0), zz + dz], [0.13, 0.03, 0.065], false, [0, jitter(seed + i + r, 0.1), 0]);
      }
  } else if (kind === "eomuk") {
    // A steel pot of broth, skewers of folded fish cake standing in it,
    // and trays of more fish cake waiting.
    k.add("steel", "cyl", [x, top + 0.18, z - 0.5], [0.62, 0.36, 0.62]);
    k.add("broth", "cyl", [x, top + 0.345, z - 0.5], [0.56, 0.02, 0.56]);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + seed;
      const r = i % 3 === 0 ? 0.08 : 0.19;
      const px = x + Math.cos(a) * r;
      const pz = z - 0.5 + Math.sin(a) * r;
      const lean: [number, number, number] = [Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2];
      k.add("woodLight", "cyl", [px, top + 0.5, pz], [0.014, 0.46, 0.014], lean);
      k.box("fishcake", [px, top + 0.43, pz], [0.11, 0.16, 0.035], false, [lean[0], -a, lean[2]]);
    }
    row(["fishcake", "steel"], "box", [0.22, 0.05, 0.3], 3, 2);
  } else {
    // Buckets of flowers.
    for (let i = 0; i < 4; i++) {
      k.add("metal", "cyl", [x, top + 0.18, z - 1.05 + i * 0.7], [0.36, 0.36, 0.36]);
      flowers(k, x, z - 1.05 + i * 0.7, 0.48, seed + i * 3, top + 0.3);
    }
  }
}

function stallsKit(): Kit {
  const k = new Kit();
  housesKit(k);
  ALLEY.stalls.forEach((st, i) => {
    const cx = st.side * (HW - ALLEY.stallW / 2 + 0.05);
    const front = st.side * (HW - ALLEY.stallW + 0.05);
    // Counter: a timber table along the stall's front, a crate shelf behind.
    k.box("woodLight", [front - st.side * 0.35, 0.47, st.z], [0.75, 0.94, ALLEY.stallD - 0.2], true);
    k.box("woodDark", [cx + st.side * 0.45, 0.6, st.z], [0.5, 1.2, ALLEY.stallD - 0.3], true);
    goods(k, st.goods, front - st.side * 0.35, st.z, i * 11 + 3);
    // Posts and an awning sloping down toward the alley.
    for (const dz of [-1, 1]) k.box("metal", [front + st.side * 0.02, 1.25, st.z + dz * (ALLEY.stallD / 2 - 0.1)], [0.06, 2.5, 0.06]);
    awning(k, AWNINGS[i % AWNINGS.length], cx - st.side * 0.15, 2.52, st.z, ALLEY.stallW + 0.7, ALLEY.stallD + 0.1, -st.side as -1 | 1, -0.22);
  });
  // The street-food cart: a counter on wheels with a red awning.
  const C = ALLEY.cart;
  k.box("woodLight", [C.x, 0.5, C.z], [C.w, 0.62, C.d], true);
  k.box("steel", [C.x, 0.86, C.z], [C.w + 0.06, 0.06, C.d + 0.06], false);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) k.add("charcoal", "cyl", [C.x + dx * (C.w / 2 - 0.12), 0.16, C.z + dz * (C.d / 2 - 0.3)], [0.32, 0.08, 0.32], [0, 0, Math.PI / 2]);
  // On the counter: golden hotteok on a black griddle…
  k.box("charcoal", [C.x - 0.15, 0.91, C.z - 0.85], [0.75, 0.04, 0.6]);
  for (let i = 0; i < 6; i++) k.add("woodLight", "cyl", [C.x - 0.4 + (i % 3) * 0.25, 0.945, C.z - 1.0 + Math.floor(i / 3) * 0.28], [0.17, 0.03, 0.17]);
  // …a steel pot of broth with skewers of folded fish cake standing in it…
  k.add("steel", "cyl", [C.x - 0.1, 1.0, C.z], [0.5, 0.22, 0.5]);
  k.add("broth", "cyl", [C.x - 0.1, 1.1, C.z], [0.44, 0.02, 0.44]);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const px = C.x - 0.1 + Math.cos(a) * 0.13;
    const pz = C.z + Math.sin(a) * 0.13;
    const lean: [number, number, number] = [Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18];
    k.add("woodLight", "cyl", [px, 1.24, pz], [0.014, 0.44, 0.014], lean);
    k.box("fishcake", [px, 1.17, pz], [0.1, 0.15, 0.035], false, [lean[0], -a, lean[2]]);
  }
  // …and gimbap: three whole rolls with rice at the cut ends, a plate of slices.
  for (let i = 0; i < 3; i++) {
    const z = C.z + 0.66 + i * 0.1;
    k.add("charcoal", "cyl", [C.x - 0.3, 0.925, z], [0.07, 0.26, 0.07], [0, 0, Math.PI / 2]);
    for (const e of [-1, 1]) k.add("flowerWhite", "cyl", [C.x - 0.3 + e * 0.13, 0.925, z], [0.058, 0.006, 0.058], [0, 0, Math.PI / 2]);
  }
  k.add("flowerWhite", "cyl", [C.x + 0.27, 0.9, C.z + 0.78], [0.3, 0.02, 0.3]);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const r = 0.075;
    const sx = C.x + 0.27 + (i === 6 ? 0 : Math.cos(a) * r);
    const sz = C.z + 0.78 + (i === 6 ? 0 : Math.sin(a) * r);
    k.add("charcoal", "cyl", [sx, 0.92, sz], [0.066, 0.02, 0.066]);
    k.add("flowerWhite", "cyl", [sx, 0.921, sz], [0.054, 0.021, 0.054]);
    k.add(i % 2 ? "fruitOrange" : "leaf", "cyl", [sx, 0.922, sz], [0.018, 0.022, 0.018]);
  }
  for (const dz of [-1, 1]) k.box("metal", [C.x + C.w / 2 - 0.05, 1.45, C.z + dz * (C.d / 2 - 0.05)], [0.05, 1.2, 0.05]);
  k.box("clothRed", [C.x, 2.08, C.z], [C.w + 0.5, 0.05, C.d + 0.4], true, [0, 0, -0.12]);

  // The arch over the entrance: two posts and a beam (the board is drawn apart).
  for (const sd of [-1, 1]) k.box("charcoal", [sd * (HW - 0.25), 2.1, ALLEY.archZ], [0.3, 4.2, 0.3], true);
  k.box("charcoal", [0, 4.05, ALLEY.archZ], [HW * 2 - 0.2, 0.22, 0.26], true);

  // The subway exit: stair walls, a glass canopy on posts, a green line-2 post.
  const E = ALLEY.exit;
  for (const sd of [-1, 1]) k.box("stoneWarm", [E.x + sd * (E.w / 2 - 0.1), 0.55, E.z], [0.2, 1.1, E.d], true);
  k.box("stoneWarm", [E.x, 0.55, E.z + E.d / 2 - 0.1], [E.w, 1.1, 0.2], true);
  k.box("charcoal", [E.x, 0.02, E.z], [E.w - 0.4, 0.04, E.d - 0.3]);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) k.box("metal", [E.x + dx * (E.w / 2 - 0.08), 1.5, E.z + dz * (E.d / 2 - 0.08)], [0.08, 3.0, 0.08]);
  k.box("paper", [E.x, 3.02, E.z], [E.w + 0.3, 0.06, E.d + 0.3]);

  // The bench by the café, planters, and flags strung across the alley.
  const B = ALLEY.bench;
  k.box("woodDark", [B.x, 0.44, B.z], [B.w, 0.08, B.d], true);
  for (const sx of [-1, 1]) k.box("metal", [B.x + sx * (B.w / 2 - 0.15), 0.22, B.z], [0.06, 0.44, B.d - 0.08]);
  planter(k, 3.4, -10.2, 1.6, false);
  for (let i = 0; i < 5; i++) {
    const z = -9 + i * 4.4;
    bunting(k, -HW - 0.1, z, HW + 0.1, z + 1.2, 4.6, i);
  }
  return k;
}

let STALLS: Kit | null = null;

/** The café closing the north end: a warm front with big windows and its sign. */
function Cafe() {
  const tex = useMemo(() => {
    try {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#6B4A33";
      ctx.fillRect(0, 0, 512, 256);
      for (const x of [24, 296]) {
        const g = ctx.createLinearGradient(0, 70, 0, 230);
        g.addColorStop(0, "#FBE3B4");
        g.addColorStop(1, "#D99A5B");
        ctx.fillStyle = g;
        ctx.fillRect(x, 70, 192, 160);
        ctx.fillStyle = "rgba(60,40,25,0.45)";
        ctx.fillRect(x + 94, 70, 4, 160);
        // Cups on the sill.
        ctx.fillStyle = "#FFF6E6";
        for (let i = 0; i < 4; i++) ctx.fillRect(x + 20 + i * 44, 206, 18, 22);
      }
      ctx.fillStyle = "#3A2A1E";
      ctx.fillRect(226, 96, 60, 160);
      ctx.fillStyle = "#F4D27A";
      ctx.fillRect(272, 170, 6, 14);
      ctx.fillStyle = "#2E2E2E";
      ctx.fillRect(140, 8, 232, 50);
      ctx.fillStyle = "#FFF6E0";
      ctx.font = `700 36px ${KO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("골목 카페", 256, 34);
      const t = new CanvasTexture(c);
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    } catch {
      return null;
    }
  }, []);
  useEffect(() => () => tex?.dispose(), [tex]);
  const w = ALLEY.cafe.w;
  return (
    <group position={[ALLEY.cafe.x, 0, -HL - 0.05]}>
      <mesh castShadow receiveShadow position={[0, 3.2, -1.5]}>
        <boxGeometry args={[HW * 2 + 3.2, 6.4, 3]} />
        <primitive object={MAT.plaster} attach="material" />
      </mesh>
      <mesh position={[0, 1.55, 0.02]}>
        <planeGeometry args={[w, w / 2]} />
        <meshStandardMaterial map={tex} roughness={0.85} emissive="#FFD9A0" emissiveIntensity={0.18} emissiveMap={tex} />
      </mesh>
      <mesh castShadow position={[0, 3.3, 0.45]} rotation={[0.28, 0, 0]}>
        <boxGeometry args={[w + 0.6, 0.05, 1.1]} />
        <primitive object={MAT.clothSage} attach="material" />
      </mesh>
    </group>
  );
}

export default function SeoulMarket() {
  const paving = useTiledTexture(paintPaving, HW, HL);
  const photo = usePhotoFloor("paving", HW, HL);
  const kit = useMemo(() => (STALLS ??= stallsKit()), []);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HL * 2, ...FLOOR_GRID]} />
        <meshStandardMaterial key={photo ? "photo" : "painted"} map={photo?.map ?? paving} normalMap={photo?.normal ?? null} roughnessMap={photo?.rough ?? null} roughness={photo ? 1 : 0.95} color={photo ? "#E9E3D6" : "#ffffff"} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <Houses />
      <Batch kit={kit} />
      <Cafe />
      {/* Stall names, hung under each awning facing the alley. */}
      {ALLEY.stalls.map((st) => (
        <group key={st.sign} position={[st.side * (HW - ALLEY.stallW - 0.02), 2.05, st.z]} rotation={[0, -st.side * (Math.PI / 2), 0]}>
          <Signboard text={st.sign} w={1.5} h={0.45} aspect={3.3} />
        </group>
      ))}
      {/* The arch's name board, read walking in from the subway. */}
      <group position={[0, 4.42, ALLEY.archZ]}>
        <Signboard text={ALLEY.sign} w={2.4} h={0.6} aspect={4} />
      </group>
      {/* The exit's sign: 출구 and line 2, beside the stairs. */}
      <group position={[ALLEY.exit.x, 3.3, ALLEY.exit.z - ALLEY.exit.d / 2 - 0.2]}>
        <Signboard text="출구 · 2호선" w={1.4} h={0.32} aspect={4.5} />
      </group>
    </group>
  );
}
