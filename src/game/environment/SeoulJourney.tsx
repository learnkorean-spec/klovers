import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, type BufferGeometry, CanvasTexture, DoubleSide, type Group, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MAT, foliage, std } from "../config/materials";
import { SEOUL } from "../config/rooms";
import { REDUCED_MOTION } from "../systems/motion";
import type { PlayerState } from "../systems/state";
import { TAXI, newTaxi, stepTaxi } from "../systems/traffic";
import Batch from "./Batch";
import Instanced, { type Part } from "./Instanced";
import { Kit, awning, flowers, jitter, kitGeometry, planter } from "./kit";
import { GateWall } from "./parts";
import { paintPaving, useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY } from "./textures";
import { FLOOR_GRID } from "../config/world";

/**
 * Seoul Journey, part 1 — canon worlds[5] (course Levels 4–6): "the final
 * real-world city journey". A Seoul street corner on an autumn afternoon:
 * a road with a crosswalk, a line-2 subway entrance and its map, a bus stop,
 * a convenience store, a small restaurant with a table outside, ginkgo trees
 * gone yellow, and city blocks all round.
 *
 * Every stop is in config/interactions ("Seoul Journey"). What the learner
 * learns shows: Namsan Tower, far off on its hill to the north, lights up
 * once 남산타워 is learned (canon: the world changes with real learning).
 *
 * The buildings are boxes with painted façades (one canvas per finish, the
 * windows repeated by their UVs) merged into one mesh per finish, so the
 * whole city costs a handful of draw calls. A taxi drives along the road
 * now and then, and stops for anyone standing in its way.
 */

const HW = SEOUL.halfWidth;
const HD = SEOUL.halfDepth;
const ROAD_N = SEOUL.roadZ - SEOUL.roadW / 2;
const ROAD_S = SEOUL.roadZ + SEOUL.roadW / 2;
/** Traffic keeps right: eastbound (+x) cars use the south lane. */
const LANE_Z = SEOUL.roadZ + SEOUL.roadW / 4;
const CX = SEOUL.cross.x;
const FACE_X = HW + 0.02;
const KO = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", sans-serif';
const LINE2 = "#00A84D";

/* ───────────────────────── Painted boards ───────────────────────── */

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function txt(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, weight = 700, align: CanvasTextAlign = "center", maxW?: number) {
  ctx.font = `${weight} ${size}px ${KO}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  if (maxW) {
    const m = ctx.measureText(s).width;
    if (m > maxW) ctx.font = `${weight} ${(size * maxW) / m}px ${KO}`;
  }
  ctx.fillText(s, x, y);
}

/** A canvas texture painted now and again once the Korean font has loaded. */
function useCanvasTexture(w: number, h: number, paint: Paint, glyphs: string): CanvasTexture {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [w, h]);
  useEffect(() => {
    let live = true;
    const draw = () => {
      const ctx = (tex.image as HTMLCanvasElement).getContext("2d");
      if (!live || !ctx) return;
      ctx.clearRect(0, 0, w, h);
      paint(ctx, w, h);
      tex.needsUpdate = true;
    };
    draw();
    document.fonts?.load(`700 48px "Noto Sans KR"`, glyphs).then(draw).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [tex, paint, w, h, glyphs]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/** The station sign over the subway steps: line 2, City Hall, exit 3. */
const paintStation: Paint = (ctx, w, h) => {
  ctx.fillStyle = "#F6F6F3";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#2B3138";
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillStyle = LINE2;
  ctx.beginPath();
  ctx.arc(100, 88, 62, 0, Math.PI * 2);
  ctx.fill();
  txt(ctx, "2", 100, 92, 92, "#FFFFFF");
  txt(ctx, "시청", 196, 76, 92, "#1F252B", 700, "left");
  txt(ctx, "City Hall", 200, 146, 38, "#5A636C", 500, "left");
  txt(ctx, "출구", 790, 90, 44, "#1F252B", 700, "right");
  ctx.fillStyle = "#F5B41A";
  rrect(ctx, 808, 34, 124, 112, 14);
  ctx.fill();
  txt(ctx, "3", 870, 94, 86, "#1F252B");
};

const STATIONS = [
  { ko: "시청", en: "City Hall", a: -1.85, here: true },
  { ko: "건대입구", en: "Konkuk Univ.", a: -0.45 },
  { ko: "잠실", en: "Jamsil", a: 0.4 },
  { ko: "강남", en: "Gangnam", a: 1.45 },
  { ko: "신도림", en: "Sindorim", a: 2.75 },
  { ko: "홍대입구", en: "Hongik Univ.", a: -2.65 },
] as const;

/** The line 2 map: the green loop and six stations, "you are here" at City Hall. */
const paintLineMap: Paint = (ctx, w, h) => {
  ctx.fillStyle = "#FBFAF6";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#2B3138";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);
  ctx.fillStyle = LINE2;
  ctx.beginPath();
  ctx.arc(56, 54, 30, 0, Math.PI * 2);
  ctx.fill();
  txt(ctx, "2", 56, 57, 42, "#FFFFFF");
  txt(ctx, "2호선", 100, 46, 40, "#1F252B", 700, "left");
  txt(ctx, "Line 2", 102, 82, 22, "#5A636C", 500, "left");
  const cx = w / 2 + 20;
  const cy = h / 2 + 44;
  const rx = 262;
  const ry = 150;
  ctx.strokeStyle = LINE2;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (const s of STATIONS) {
    const ox = Math.cos(s.a);
    const oy = Math.sin(s.a);
    const x = cx + ox * rx;
    const y = cy + oy * ry;
    if ("here" in s) {
      ctx.fillStyle = "#E1242A";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      rrect(ctx, x - 70, y - 78, 140, 40, 10);
      ctx.fill();
      txt(ctx, "현재 위치", x, y - 57, 24, "#FFFFFF");
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#1F252B";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Labels inside the loop, so none runs off the board.
    const align: CanvasTextAlign = ox > 0.35 ? "right" : ox < -0.35 ? "left" : "center";
    const lx = x - ox * 30;
    const ly = y - oy * 36 + (oy < -0.5 ? 6 : oy > 0.5 ? -20 : -8);
    txt(ctx, s.ko, lx, ly, 30, "#1F252B", 700, align);
    txt(ctx, s.en, lx, ly + 28, 18, "#5A636C", 500, align);
  }
};

const ROUTES = [
  ["402", "#3D5BAB", "서울역"],
  ["7016", "#4FA52E", "시청"],
  ["05", "#F2B70A", "남산"],
  ["9401", "#E1242A", "강남"],
] as const;

/** The bus stop's route board: bus numbers in their colours, and where they go. */
const paintRoutes: Paint = (ctx, w, h) => {
  ctx.fillStyle = "#F4F6F8";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1F4E9C";
  ctx.fillRect(0, 0, w, 104);
  txt(ctx, "버스 정류장", w / 2, 44, 40, "#FFFFFF", 700, "center", w - 30);
  txt(ctx, "Bus stop", w / 2, 82, 20, "#CFE0FF", 500);
  ROUTES.forEach(([n, color, to], i) => {
    const y = 132 + i * 92;
    ctx.fillStyle = color;
    rrect(ctx, 18, y, 106, 60, 10);
    ctx.fill();
    txt(ctx, n, 71, y + 32, 34, color === "#F2B70A" ? "#1F252B" : "#FFFFFF");
    txt(ctx, to, 140, y + 32, 34, "#1F252B", 700, "left", w - 150);
  });
};

/** The round sign on the bus stop pole. */
const paintBusSign: Paint = (ctx, w, h) => {
  ctx.fillStyle = "#1F4E9C";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 18, 0, Math.PI * 2);
  ctx.stroke();
  txt(ctx, "버스", w / 2, h / 2 - 10, 84, "#FFFFFF");
  txt(ctx, "BUS", w / 2, h / 2 + 62, 32, "#CFE0FF", 500);
};

const GOODS = ["#E94E3C", "#F4B23A", "#3B8ED8", "#4FB06D", "#FFFFFF", "#F28CB1", "#8D5BD0", "#2C2C2C", "#FF8A3D"];

/** Shelves seen through shop glass: rows of bright packets. */
function shelves(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, rows: number, seed: number) {
  const r = rng(seed);
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#FFFFFB");
  g.addColorStop(1, "#E3E8EA");
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = "#FFFFFF";
  for (let x = x0 + 30; x < x1 - 30; x += 150) ctx.fillRect(x, y0 + 8, 100, 8);
  const step = (y1 - y0 - 30) / rows;
  for (let i = 0; i < rows; i++) {
    const shelf = y0 + 30 + step * (i + 1);
    let x = x0 + 8;
    while (x < x1 - 14) {
      // Runs of the same packet, side by side, as shops stock them.
      const color = GOODS[Math.floor(r() * GOODS.length)];
      const cup = r() < 0.3;
      const pw = cup ? 26 : 22 + r() * 16;
      const ph = cup ? 30 : 26 + r() * Math.min(26, step - 44);
      const run = 2 + Math.floor(r() * 3);
      for (let k = 0; k < run && x < x1 - 14; k++) {
        const w2 = Math.min(pw, x1 - 10 - x);
        ctx.fillStyle = color;
        if (cup) {
          rrect(ctx, x, shelf - ph, w2, ph, 6);
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(x, shelf - ph, w2, 6);
        } else {
          ctx.fillRect(x, shelf - ph, w2, ph);
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.fillRect(x + 3, shelf - ph * 0.62, w2 - 6, ph * 0.24);
        }
        x += pw + 2;
      }
      x += 4;
    }
    ctx.fillStyle = "#B9C0C6";
    ctx.fillRect(x0, shelf, x1 - x0, 9);
    ctx.fillStyle = "#F3C531";
    for (let t = x0 + 20; t < x1 - 20; t += 46) ctx.fillRect(t, shelf + 1, 18, 7);
  }
}

/** The convenience store: its "편의점 · 24시" band over a glass front. */
const paintStore: Paint = (ctx, w) => {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#0E7C86");
  g.addColorStop(1, "#1B4F9C");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, 128);
  ctx.fillStyle = "#F3C531";
  ctx.fillRect(0, 112, w, 16);
  txt(ctx, "편의점", 60, 58, 80, "#FFFFFF", 700, "left");
  ctx.fillStyle = "#FFFFFF";
  rrect(ctx, 790, 20, 196, 76, 16);
  ctx.fill();
  txt(ctx, "24시", 888, 60, 56, "#1B4F9C");
  ctx.fillStyle = "#2B3036";
  ctx.fillRect(0, 128, w, 512);
  shelves(ctx, 24, 150, 640, 618, 4, 11);
  shelves(ctx, 664, 150, 1000, 618, 4, 29);
  // The drinks fridge behind the door: a bright column.
  ctx.fillStyle = "rgba(235,248,255,0.55)";
  ctx.fillRect(820, 160, 160, 450);
  ctx.fillStyle = "#2B3036";
  ctx.fillRect(640, 128, 24, 512);
  ctx.fillStyle = "#C9CED3";
  ctx.fillRect(690, 392, 290, 12);
  ctx.fillStyle = "#FFFFFF";
  rrect(ctx, 760, 430, 150, 46, 8);
  ctx.fill();
  txt(ctx, "미세요", 835, 454, 28, "#2B3036");
  ctx.fillStyle = "#E1242A";
  ctx.beginPath();
  ctx.arc(560, 548, 48, 0, Math.PI * 2);
  ctx.fill();
  txt(ctx, "1+1", 560, 550, 40, "#FFFFFF");
};

/** The restaurant: red "식당" band, warm windows, the door with its "영업중" sign. */
const paintRestaurant: Paint = (ctx, w) => {
  ctx.fillStyle = "#9E2328";
  ctx.fillRect(0, 0, w, 128);
  ctx.fillStyle = "#6B1418";
  ctx.fillRect(0, 116, w, 12);
  txt(ctx, "식당", 300, 60, 92, "#FFFFFF");
  txt(ctx, "김치찌개 · 비빔밥", 720, 60, 40, "#FFD86B");
  ctx.fillStyle = "#5E4130";
  ctx.fillRect(0, 128, w, 512);
  const room = (x0: number, x1: number, seed: number) => {
    const r = rng(seed);
    const g = ctx.createLinearGradient(0, 150, 0, 616);
    g.addColorStop(0, "#F8E1B8");
    g.addColorStop(1, "#D49E62");
    ctx.fillStyle = g;
    ctx.fillRect(x0, 150, x1 - x0, 466);
    for (let x = x0 + 50; x < x1 - 30; x += 120) {
      ctx.strokeStyle = "#5E4130";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 150);
      ctx.lineTo(x, 210);
      ctx.stroke();
      ctx.fillStyle = "#FFF4D6";
      ctx.beginPath();
      ctx.arc(x, 222, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7A4E30";
      ctx.fillRect(x - 46, 470 + r() * 10, 92, 14);
      ctx.fillRect(x - 6, 480, 12, 120);
      ctx.fillStyle = "#4B3022";
      ctx.fillRect(x - 60, 520, 26, 80);
      ctx.fillRect(x + 34, 520, 26, 80);
    }
  };
  room(24, 404, 3);
  room(620, 1000, 7);
  // The sliding door, a little darker, with its "open" sign.
  ctx.fillStyle = "#8A6A4A";
  ctx.fillRect(420, 150, 184, 466);
  ctx.fillStyle = "rgba(255,226,170,0.55)";
  ctx.fillRect(432, 162, 160, 442);
  ctx.fillStyle = "#C9CED3";
  ctx.fillRect(578, 360, 8, 80);
  ctx.fillStyle = "#E1242A";
  rrect(ctx, 442, 230, 140, 54, 8);
  ctx.fill();
  txt(ctx, "영업중", 512, 258, 32, "#FFFFFF");
};

const MENU = [
  ["김치찌개", "8,000원"],
  ["된장찌개", "8,000원"],
  ["비빔밥", "9,000원"],
  ["불고기", "12,000원"],
] as const;

/** The menu board on the restaurant wall: dishes and prices in won. */
const paintMenu: Paint = (ctx, w, h) => {
  ctx.fillStyle = "#5E4130";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#2F4A3A";
  ctx.fillRect(16, 16, w - 32, h - 32);
  txt(ctx, "메뉴", w / 2, 66, 48, "#FFFFFF");
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(40, 104, w - 80, 3);
  MENU.forEach(([dish, price], i) => {
    const y = 150 + i * 72;
    txt(ctx, dish, 36, y, 32, "#FFFFFF", 700, "left");
    txt(ctx, price, w - 36, y, 28, "#FFD86B", 700, "right");
  });
};

/** The "서울" screen on the office tower across the street. */
const paintSeoul: Paint = (ctx, w, h) => {
  ctx.fillStyle = "#18202C";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#3A4A5E";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);
  txt(ctx, SEOUL.sign, w / 2, h * 0.43, 150, "#FFFFFF");
  txt(ctx, "S E O U L", w / 2, h * 0.82, 44, "#8FD3FF", 500);
};

const SHOPS = [
  ["카페", "#6B4A33", "#F4E3C6"],
  ["약국", "#2E7D5B", "#EEF6F1"],
  ["빵집", "#C27A35", "#F8E6C8"],
  ["꽃집", "#B84D74", "#F7E4EA"],
] as const;

/** Ground-floor shops of the city blocks: café, pharmacy, bakery, florist. */
const paintShops: Paint = (ctx, w, h) => {
  const cw = w / SHOPS.length;
  SHOPS.forEach(([name, color, inside], i) => {
    const x0 = i * cw;
    ctx.fillStyle = "#3A3F45";
    ctx.fillRect(x0, 0, cw, h);
    ctx.fillStyle = color;
    ctx.fillRect(x0 + 10, 14, cw - 20, 64);
    txt(ctx, name, x0 + cw / 2, 47, 44, "#FFFFFF");
    const g = ctx.createLinearGradient(0, 92, 0, h);
    g.addColorStop(0, inside);
    g.addColorStop(1, "#B9A58A");
    ctx.fillStyle = g;
    ctx.fillRect(x0 + 14, 92, cw - 28, h - 104);
    ctx.fillStyle = "rgba(40,44,50,0.55)";
    ctx.fillRect(x0 + cw - 92, 100, 70, h - 112);
    ctx.fillStyle = "#3A3F45";
    ctx.fillRect(x0 + cw - 96, 92, 6, h - 104);
  });
};

/** Looking down the subway steps: treads with yellow edges, fading to dark. */
const paintStairs: Paint = (ctx, w, h) => {
  const n = 14;
  for (let i = 0; i < n; i++) {
    const y0 = (i / n) * h;
    const y1 = ((i + 1) / n) * h;
    const t = i / (n - 1);
    const L = Math.round(10 + t ** 1.4 * 150);
    ctx.fillStyle = `rgb(${L},${L},${L - 4})`;
    ctx.fillRect(0, y0, w, y1 - y0);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, y0, w, (y1 - y0) * 0.28);
    ctx.fillStyle = `rgba(242,190,40,${0.15 + 0.7 * t})`;
    ctx.fillRect(0, y1 - 5, w, 4);
  }
  const side = ctx.createLinearGradient(0, 0, w, 0);
  side.addColorStop(0, "rgba(0,0,0,0.45)");
  side.addColorStop(0.15, "rgba(0,0,0,0)");
  side.addColorStop(0.85, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, w, h);
};

/** A walk signal's figure: standing (red) or walking (green). */
function paintFigure(walk: boolean): Paint {
  return (ctx, w, h) => {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = walk ? "#3DFF8A" : "#FF4040";
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineCap = "round";
    ctx.lineWidth = w * 0.12;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.2, w * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    if (walk) {
      ctx.moveTo(w * 0.5, h * 0.34);
      ctx.lineTo(w * 0.46, h * 0.6);
      ctx.moveTo(w * 0.46, h * 0.6);
      ctx.lineTo(w * 0.3, h * 0.86);
      ctx.moveTo(w * 0.46, h * 0.6);
      ctx.lineTo(w * 0.64, h * 0.86);
      ctx.moveTo(w * 0.49, h * 0.4);
      ctx.lineTo(w * 0.3, h * 0.56);
      ctx.moveTo(w * 0.49, h * 0.4);
      ctx.lineTo(w * 0.68, h * 0.52);
    } else {
      ctx.moveTo(w * 0.5, h * 0.34);
      ctx.lineTo(w * 0.5, h * 0.62);
      ctx.moveTo(w * 0.44, h * 0.62);
      ctx.lineTo(w * 0.42, h * 0.88);
      ctx.moveTo(w * 0.56, h * 0.62);
      ctx.lineTo(w * 0.58, h * 0.88);
      ctx.moveTo(w * 0.36, h * 0.38);
      ctx.lineTo(w * 0.34, h * 0.62);
      ctx.moveTo(w * 0.64, h * 0.38);
      ctx.lineTo(w * 0.66, h * 0.62);
    }
    ctx.stroke();
  };
}
const PAINT_STOP = paintFigure(false);
const PAINT_WALK = paintFigure(true);

/* ───────────────────────── City blocks ───────────────────────── */

type Finish = "glass" | "beige" | "brick" | "white";

const FINISH: Record<Finish, { wall: string; band: string; frame: string; top: string; bottom: string; winW: number; winH: number; lit: number; metal: number }> = {
  glass: { wall: "#4F6273", band: "#4F6273", frame: "#394654", top: "#A9C4D8", bottom: "#46627B", winW: 0.94, winH: 1, lit: 0.1, metal: 0.25 },
  beige: { wall: "#D8CBB3", band: "#CBBDA3", frame: "#F1ECE2", top: "#8AA0B2", bottom: "#3F5468", winW: 0.62, winH: 0.62, lit: 0.18, metal: 0.04 },
  brick: { wall: "#A65A44", band: "#94503C", frame: "#EDE6DA", top: "#869AAA", bottom: "#3A4B5A", winW: 0.56, winH: 0.6, lit: 0.2, metal: 0.04 },
  white: { wall: "#E9E5DC", band: "#D7D2C8", frame: "#8E979F", top: "#93ABBD", bottom: "#405A70", winW: 0.72, winH: 0.64, lit: 0.15, metal: 0.04 },
};

/** Storey height and window bay, metres; one façade canvas is 4 × 4 of them. */
const FLOOR = 3.0;
const BAY = 2.2;
/** Ground-floor shops: their height and one shop's width. */
const SHOP_H = 3.4;
const SHOP_W = 3.6;
/** The bottom band of each storey is solid wall (it also colours the roofs). */
const BAND = 28 / 128;

const facadeCache = new Map<Finish, MeshStandardMaterial>();

/** One finish's façade: colour, warm lit windows and glossy glass in three canvases. */
function facadeMaterial(f: Finish): MeshStandardMaterial {
  const hit = facadeCache.get(f);
  if (hit) return hit;
  const S = 512;
  const C = S / 4;
  const make = () => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    return c;
  };
  const cm = make();
  const ce = make();
  const cr = make();
  const m = cm.getContext("2d");
  const e = ce.getContext("2d");
  const r = cr.getContext("2d");
  const st = FINISH[f];
  if (m && e && r) {
    const rand = rng(f.length * 977 + 13);
    m.fillStyle = st.wall;
    m.fillRect(0, 0, S, S);
    if (f === "brick") {
      m.fillStyle = "rgba(60,25,15,0.2)";
      for (let y = 0; y < S; y += 8) {
        m.fillRect(0, y, S, 1);
        for (let x = (y / 8) % 2 ? 0 : 12; x < S; x += 24) m.fillRect(x, y, 1, 8);
      }
    }
    e.fillStyle = "#000000";
    e.fillRect(0, 0, S, S);
    r.fillStyle = "#DADADA";
    r.fillRect(0, 0, S, S);
    const band = Math.round(C * BAND);
    for (let fy = 0; fy < 4; fy++)
      for (let fx = 0; fx < 4; fx++) {
        const x0 = fx * C;
        const y0 = fy * C;
        m.fillStyle = st.band;
        m.fillRect(x0, y0 + C - band, C, band);
        const ww = f === "glass" ? C - 8 : C * st.winW;
        const wh = f === "glass" ? C - band - 6 : (C - band) * st.winH;
        const wx = x0 + (C - ww) / 2;
        const wy = f === "glass" ? y0 + 3 : y0 + (C - band - wh) * 0.55;
        m.fillStyle = st.frame;
        m.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
        const lit = rand() < st.lit;
        const g = m.createLinearGradient(0, wy, 0, wy + wh);
        g.addColorStop(0, lit ? "#F2D7A4" : st.top);
        g.addColorStop(1, lit ? "#C99A5C" : st.bottom);
        m.fillStyle = g;
        m.fillRect(wx, wy, ww, wh);
        // A pale streak of reflected sky, and now and then a blind.
        m.fillStyle = "rgba(255,255,255,0.16)";
        m.beginPath();
        m.moveTo(wx + ww * 0.15, wy + wh);
        m.lineTo(wx + ww * 0.45, wy);
        m.lineTo(wx + ww * 0.6, wy);
        m.lineTo(wx + ww * 0.3, wy + wh);
        m.fill();
        if (!lit && rand() < 0.25) {
          m.fillStyle = "#E8DEC8";
          m.fillRect(wx, wy, ww, wh * (0.3 + rand() * 0.4));
        }
        m.fillStyle = st.frame;
        if (ww > 60) m.fillRect(wx + ww / 2 - 2, wy, 4, wh);
        if (f === "white") {
          m.fillStyle = "rgba(90,100,110,0.8)";
          m.fillRect(x0 + 4, wy + wh + 2, C - 8, 3);
          for (let x = x0 + 8; x < x0 + C - 4; x += 10) m.fillRect(x, wy + wh * 0.7, 2, wh * 0.3 + 4);
        }
        if (lit) {
          e.fillStyle = "#9A7444";
          e.fillRect(wx, wy, ww, wh);
        }
        r.fillStyle = "#262626";
        r.fillRect(wx, wy, ww, wh);
      }
  }
  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new CanvasTexture(c);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = SRGBColorSpace;
    return t;
  };
  const mat = new MeshStandardMaterial({
    map: tex(cm, true),
    emissiveMap: tex(ce, true),
    emissive: "#FFFFFF",
    emissiveIntensity: 1,
    roughnessMap: tex(cr, false),
    roughness: 1,
    metalness: st.metal,
  });
  facadeCache.set(f, mat);
  return mat;
}

/** A box whose side UVs repeat a texture every `uSpan` × `vSpan` metres; its top takes one flat colour. */
function shell(x: number, y0: number, z: number, w: number, h: number, d: number, uSpan: number, vSpan: number, uOff: number, flat: [number, number]): BufferGeometry {
  const g = new BoxGeometry(w, h, d);
  const uv = g.getAttribute("uv");
  for (let f = 0; f < 6; f++)
    for (let i = 0; i < 4; i++) {
      const n = f * 4 + i;
      if (f === 2 || f === 3) {
        uv.setXY(n, flat[0], flat[1]);
        continue;
      }
      const along = f < 2 ? d : w;
      uv.setXY(n, uv.getX(n) * (along / uSpan) + uOff, uv.getY(n) * (h / vSpan));
    }
  g.translate(x, y0 + h / 2, z);
  return g;
}

interface Block {
  /** Centre and size (metres); `floors` above the ground floor. */
  x: number;
  z: number;
  w: number;
  d: number;
  floors: number;
  finish: Finish;
  /** The ground floor: shops, plain wall (behind a custom front), or none. */
  ground: "shops" | "plain" | "none";
}

const b = (x0: number, x1: number, z0: number, z1: number, floors: number, finish: Finish, ground: Block["ground"] = "shops"): Block => ({
  x: (x0 + x1) / 2,
  z: (z0 + z1) / 2,
  w: Math.abs(x1 - x0),
  d: Math.abs(z1 - z0),
  floors,
  finish,
  ground,
});

const NORTH_FRONT = -HD - 0.4;
const BLOCKS: Block[] = [
  // North side, behind the subway; a side street (x 2…7.6) leads off
  // towards the tower between them.
  b(-16.5, -6.4, NORTH_FRONT, NORTH_FRONT - 6, 5, "beige"),
  b(-6.2, 1.6, NORTH_FRONT, NORTH_FRONT - 7, 7, "glass"),
  b(8.0, 16.5, NORTH_FRONT, NORTH_FRONT - 6, 6, "brick"),
  // Further north: towers, with a gap where Namsan Tower shows.
  b(-26, -12, -21, -29, 11, "white", "none"),
  b(-11, 1.5, -21, -29, 13, "glass", "none"),
  b(10, 20, -21, -29, 12, "beige", "none"),
  b(21, 32, -19, -27, 9, "glass", "none"),
  // East: the convenience store's and restaurant's buildings, then the
  // blocks along the road.
  b(HW + 0.05, 15.5, NORTH_FRONT, -3.3, 3, "white", "plain"),
  b(HW + 0.05, 15.5, 1.3, HD + 0.4, 2, "brick", "plain"),
  b(16, 24, -3.3, -9.8, 8, "glass"),
  b(16, 25, 1.3, 8.8, 5, "white"),
  b(24.6, 34, -3.3, -9.8, 6, "beige"),
  b(25.6, 35, 1.3, 8.8, 9, "brick"),
  // West.
  b(-15.5, -HW - 0.05, -3.3, NORTH_FRONT, 6, "white"),
  b(-15.5, -HW - 0.05, 1.3, HD + 0.4, 5, "beige"),
  b(-24, -16, -3.3, -9.8, 4, "brick"),
  b(-25, -16, 1.3, 8.8, 7, "glass"),
  b(-34, -24.6, -3.3, -9.8, 9, "white"),
  b(-35, -25.6, 1.3, 8.8, 6, "beige"),
  // South, behind the wall with the Hub gate.
  b(-10, -2.6, HD + 0.8, HD + 7, 4, "white", "none"),
  b(2.6, 10, HD + 0.8, HD + 7, 3, "brick", "none"),
];

const heightOf = (bl: Block) => (bl.ground === "none" ? 0 : SHOP_H) + bl.floors * FLOOR + BAND * FLOOR;

/** The city: one merged geometry per façade finish, one for all the shop fronts. */
function cityGeometry() {
  const byFinish = new Map<Finish, BufferGeometry[]>();
  const shops: BufferGeometry[] = [];
  BLOCKS.forEach((bl, i) => {
    const base = bl.ground === "none" ? 0 : SHOP_H;
    const h = heightOf(bl) - base;
    const list = byFinish.get(bl.finish) ?? [];
    list.push(shell(bl.x, base, bl.z, bl.w, h, bl.d, BAY * 4, FLOOR * 4, (i % 4) * 0.25, [0.37, 0.01]));
    byFinish.set(bl.finish, list);
    if (bl.ground === "shops") shops.push(shell(bl.x, 0, bl.z, bl.w + 0.1, SHOP_H, bl.d + 0.1, SHOP_W * 4, SHOP_H, (i % 4) * 0.25, [0.01, 0.99]));
  });
  const merged = [...byFinish.entries()].map(([f, gs]) => ({ f, geo: mergeGeometries(gs) }));
  return { merged, shops: shops.length ? mergeGeometries(shops) : null };
}

/* ───────────────────────── Ginkgo trees ───────────────────────── */

interface Limb extends Part {
  cast: boolean;
}

/**
 * A street ginkgo (은행나무) in autumn: a straight leader with whorls of
 * branches climbing it at a steep angle, the lower ones longer, each ending
 * in a few small clusters of yellow fans. The crown is a loose, tall oval —
 * the trunk, limbs and sky show between the clusters, so it reads as a tree
 * rather than a stack of yellow balls. Limbs go into the street kit, the
 * clusters into three instanced lists (one per shade).
 */
const GINKGO = SEOUL.trees.map((tr, i) => {
  const limbs: Limb[] = [];
  const clusters: Part[] = [];
  const s = 1 + jitter(i * 3, 0.1);
  const r = rng(i * 53 + 11);
  // Cylinder from a to b (unit cyl along y), thickness w.
  const rod = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, w: number, cast: boolean) => {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.hypot(dx, dy, dz);
    const t = Math.acos(dy / len);
    const a = Math.atan2(dz, dx);
    limbs.push({ p: [(ax + bx) / 2, (ay + by) / 2, (az + bz) / 2], s: [w, len, w], r: [0, -a, -t], cast });
  };
  const lx = jitter(i, 0.12);
  const lz = jitter(i + 7, 0.12);
  const top = 6.1 * s;
  // The leader, tapering in two pieces and leaning a touch.
  rod(tr.x, 0, tr.z, tr.x + lx * 0.5, 3.3 * s, tr.z + lz * 0.5, 0.19, true);
  rod(tr.x + lx * 0.5, 3.3 * s, tr.z + lz * 0.5, tr.x + lx, top, tr.z + lz, 0.1, true);
  const at = (y: number): [number, number] => [tr.x + (lx * y) / top, tr.z + (lz * y) / top];
  const add = (x: number, yy: number, z: number, sz: number) => {
    const q = sz * (0.88 + r() * 0.24);
    clusters.push({ p: [x, yy, z], s: [q, q * 0.78, q], r: [(r() - 0.5) * 0.5, r() * 6.28, 0] });
  };
  const WHORLS = 4;
  for (let w = 0; w < WHORLS; w++) {
    const f = w / (WHORLS - 1);
    const y = (2.55 + f * 2.6) * s;
    const n = w === WHORLS - 1 ? 2 : 3;
    for (let j = 0; j < n; j++) {
      const a = i * 1.3 + w * 2.4 + (j / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
      const tilt = (0.82 - f * 0.32) + (r() - 0.5) * 0.12;
      const len = (1.55 - f * 0.75) * s * (0.9 + r() * 0.2);
      const [bx, bz] = at(y);
      const ex = bx + Math.cos(a) * Math.sin(tilt) * len;
      const ey = y + Math.cos(tilt) * len;
      const ez = bz + Math.sin(a) * Math.sin(tilt) * len;
      rod(bx, y, bz, ex, ey, ez, 0.075 - f * 0.03, w < 2);
      // Clusters: one over the tip, one part-way along on the outer side,
      // and on the longer limbs one hanging a little below.
      const cs = (1.08 - f * 0.3) * s;
      add(ex + Math.cos(a) * 0.1, ey + 0.12, ez + Math.sin(a) * 0.1, cs);
      add(bx + (ex - bx) * 0.55 + Math.cos(a + 0.9) * 0.18, y + (ey - y) * 0.55 + 0.05, bz + (ez - bz) * 0.55 + Math.sin(a + 0.9) * 0.18, cs * 0.78);
      if (w < 2) add(bx + (ex - bx) * 0.85 + Math.cos(a - 0.7) * 0.25, ey - 0.3, bz + (ez - bz) * 0.85 + Math.sin(a - 0.7) * 0.25, cs * 0.7);
    }
    // Inside the whorl, round the leader: fills the crown's heart so it reads
    // as one tree, while its edge stays open.
    const [hx, hz] = at(y + 0.5);
    add(hx + Math.cos(i + w * 2) * 0.25, y + 0.55, hz + Math.sin(i + w * 2) * 0.25, (0.95 - f * 0.25) * s);
  }
  // The leader's top.
  const [tx, tz] = at(top);
  clusters.push({ p: [tx, top + 0.1, tz], s: [0.62 * s, 0.7 * s, 0.62 * s], r: [0, i, 0] });
  clusters.push({ p: [tx + 0.2, top - 0.45, tz - 0.15], s: [0.58 * s, 0.5 * s, 0.58 * s], r: [0, i + 2, 0] });
  return { limbs, clusters };
});

/**
 * Real depth for the painted windows: a stone sill under each one and a thin
 * head over it, placed from the same layout the façade canvas paints (cell
 * by cell, through the shell's own UVs), so they line up with the glass.
 * Curtain-wall (glass) blocks and faces turned away from the street get none. Box instances in the street kit: no
 * new draw calls.
 */
function windowTrim(k: Kit) {
  const C = 128;
  const band = Math.round(C * BAND);
  BLOCKS.forEach((bl, i) => {
    if (bl.finish === "glass") return;
    const st = FINISH[bl.finish];
    const ww = ((C * st.winW) / C) * BAY;
    const whPx = (C - band) * st.winH;
    const wh = (whPx / C) * FLOOR;
    const bottom = ((band + 0.45 * (C - band - whPx)) / C) * FLOOR;
    const base = bl.ground === "none" ? 0 : SHOP_H;
    const h = heightOf(bl) - base;
    const g = shell(bl.x, base, bl.z, bl.w, h, bl.d, BAY * 4, FLOOR * 4, (i % 4) * 0.25, [0.37, 0.01]);
    const pos = g.getAttribute("position");
    const uv = g.getAttribute("uv");
    for (const f of [0, 1, 4, 5]) {
      const n0 = f * 4;
      const n1 = f * 4 + 1;
      const u0 = uv.getX(n0);
      const u1 = uv.getX(n1);
      const ax = pos.getX(n0);
      const az = pos.getZ(n0);
      const dx = (pos.getX(n1) - ax) / (u1 - u0);
      const dz = (pos.getZ(n1) - az) / (u1 - u0);
      const len = Math.hypot(pos.getX(n1) - ax, pos.getZ(n1) - az);
      // Outward normal of this face (BoxGeometry order: +x, −x, +y, −y, +z, −z).
      const nx = f === 0 ? 1 : f === 1 ? -1 : 0;
      const nz = f === 4 ? 1 : f === 5 ? -1 : 0;
      // Only the faces turned towards the street are ever seen.
      const fx = bl.x + (nx * bl.w) / 2;
      const fz = bl.z + (nz * bl.d) / 2;
      if (nx * -fx + nz * (SEOUL.roadZ - fz) <= 0) continue;
      const lo = Math.min(u0, u1);
      const hi = Math.max(u0, u1);
      // Window centres: texture u = (cell + 0.5) / 4, repeating.
      for (let c = Math.ceil(lo * 4 - 0.5); c + 0.5 <= hi * 4; c++) {
        const u = (c + 0.5) / 4;
        const along = Math.abs((u - u0) / (u1 - u0)) * len;
        if (along < ww / 2 + 0.15 || along > len - ww / 2 - 0.15) continue;
        const x = ax + dx * (u - u0);
        const z = az + dz * (u - u0);
        const sx = nx !== 0 ? 0.16 : ww + 0.14;
        const sz = nx !== 0 ? ww + 0.14 : 0.16;
        for (let fl = 0; fl < bl.floors; fl++) {
          const y = base + fl * FLOOR + bottom;
          k.box("plaster", [x + nx * 0.06, y - 0.05, z + nz * 0.06], [sx, 0.08, sz]);
          k.box("plaster", [x + nx * 0.03, y + wh + 0.05, z + nz * 0.03], [nx !== 0 ? 0.08 : ww + 0.08, 0.07, nx !== 0 ? ww + 0.08 : 0.08]);
        }
      }
    }
    g.dispose();
  });
}

/* ───────────────────────── The street kit ───────────────────────── */

const STREET_KIT: Kit = (() => {
  const k = new Kit();
  // Kerbs along the road.
  for (const z of [ROAD_N - 0.1, ROAD_S + 0.1]) k.box("stoneWarm", [0, 0.04, z], [180, 0.08, 0.2], false);

  // The subway entrance: low granite walls round the stair well, a steel
  // and glass canopy, rails going down.
  const s = SEOUL.subway;
  k.box("stoneWarm", [s.x - s.w / 2 + 0.12, 0.5, s.z], [0.24, 1.0, s.d], true);
  k.box("stoneWarm", [s.x + s.w / 2 - 0.12, 0.5, s.z], [0.24, 1.0, s.d], true);
  k.box("stoneWarm", [s.x, 0.5, s.z - s.d / 2 + 0.12], [s.w, 1.0, 0.24], true);
  k.box("charcoal", [s.x - s.w / 2 + 0.12, 1.03, s.z], [0.3, 0.06, s.d + 0.04]);
  k.box("charcoal", [s.x + s.w / 2 - 0.12, 1.03, s.z], [0.3, 0.06, s.d + 0.04]);
  k.box("charcoal", [s.x, 1.03, s.z - s.d / 2 + 0.12], [s.w + 0.04, 0.06, 0.3]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.add("metal", "cyl", [s.x + sx * (s.w / 2 - 0.12), 1.38, s.z + sz * (s.d / 2 - 0.12)], [0.12, 2.76, 0.12], undefined, true);
  for (const sz of [-1, 1]) k.box("metal", [s.x, 2.76, s.z + sz * (s.d / 2 + 0.05)], [s.w + 0.3, 0.14, 0.12], true);
  for (const sx of [-1, 1]) k.box("metal", [s.x + sx * (s.w / 2 + 0.05), 2.76, s.z], [0.12, 0.14, s.d + 0.3], true);
  const railLen = s.d - 0.5;
  for (const sx of [-1, 1]) k.box("metal", [s.x + sx * (s.w / 2 - 0.4), 0.66, s.z + 0.1], [0.06, 0.06, railLen], false, [-Math.atan(0.6 / railLen), 0, 0]);

  // The line map board: two posts, a frame and a little roof.
  const lm = SEOUL.lineMap;
  for (const sx of [-1, 1]) k.add("metal", "cyl", [lm.x + sx * 0.88, 1.05, lm.z], [0.08, 2.1, 0.08]);
  k.box("charcoal", [lm.x, 1.45, lm.z], [1.88, 1.26, 0.06], true);
  k.box("metal", [lm.x, 2.12, lm.z], [2.0, 0.06, 0.24]);

  // The bus shelter: posts at the back, a roof, a bench, the stop's pole.
  const bus = SEOUL.bus;
  const back = bus.x - bus.w / 2 + 0.05;
  for (const z of [bus.z - 1.45, bus.z + 1.45]) k.add("metal", "cyl", [back, 1.26, z], [0.1, 2.52, 0.1], undefined, true);
  k.box("charcoal", [bus.x, 2.56, bus.z], [1.55, 0.1, 3.3], true, [0, 0, -0.06]);
  k.box("woodLight", [-8.95, 0.44, bus.z], [0.5, 0.06, 1.9], true);
  for (const z of [bus.z - 0.8, bus.z + 0.8]) k.box("metal", [-8.95, 0.21, z], [0.4, 0.42, 0.05]);
  k.add("metal", "cyl", [-8.45, 1.4, bus.z - bus.d / 2 + 0.15], [0.08, 2.8, 0.08], undefined, true);

  // The restaurant's striped awning and its table outside: red plastic stools.
  const rz = SEOUL.restaurant.z;
  awning(k, "clothRed", HW - 0.48, 2.7, rz, 1.0, 4.0, -1, 0.25);
  const t = SEOUL.table;
  k.add("metal", "cyl", [t.x, 0.72, t.z], [t.r * 2, 0.04, t.r * 2], undefined, true);
  k.add("metal", "cyl", [t.x, 0.36, t.z], [0.08, 0.72, 0.08]);
  for (const sx of [-1, 1]) k.add("fruitRed", "cyl", [t.x + sx * 0.85, 0.22, t.z], [0.36, 0.44, 0.36], undefined, true);

  // Bollards across the side street (the room ends here).
  for (let x = 2.4; x <= 7.4; x += 1.0) k.add("metal", "cyl", [x, 0.4, -HD - 0.05], [0.14, 0.8, 0.14], undefined, true);

  // Street lamps: tall steel poles, an arm out over the kerb.
  for (const l of SEOUL.lamps) {
    const toRoad = l.z > SEOUL.roadZ ? -1 : 1;
    k.add("metal", "cyl", [l.x, 2.2, l.z], [0.13, 4.4, 0.13], undefined, true);
    k.add("charcoal", "cyl", [l.x, 0.12, l.z], [0.26, 0.24, 0.26]);
    k.box("metal", [l.x, 4.36, l.z + toRoad * 0.5], [0.07, 0.07, 1.0]);
    k.box("charcoal", [l.x, 4.3, l.z + toRoad * 1.0], [0.26, 0.1, 0.56], true);
  }
  // Walk signal poles at the two ends of the crosswalk.
  for (const p of SEOUL.signals) k.add("metal", "cyl", [p.x, 1.25, p.z], [0.1, 2.5, 0.1], undefined, true);

  // Ginkgo trunks in their grates.
  SEOUL.trees.forEach((tr, i) => {
    k.box("metal", [tr.x, 0.012, tr.z], [1.1, 0.02, 1.1]);
    const g = GINKGO[i];
    k.add("woodDark", "cyl", [tr.x, 0.1, tr.z], [0.3, 0.2, 0.3]);
    for (const l of g.limbs) k.add("woodDark", "cyl", l.p, l.s, l.r, l.cast);
  });
  // Planters by the gate back to the Hub.
  SEOUL.planters.forEach((p, i) => {
    planter(k, p.x, p.z, p.len, true);
    flowers(k, p.x, p.z + 0.02, 0.5, i + 4, 0.38);
  });

  // The store and restaurant buildings' plain ground floors (their fronts are painted).
  k.box("plaster", [HW + 2.8, SHOP_H / 2, (NORTH_FRONT - 3.3) / 2], [5.5, SHOP_H, Math.abs(NORTH_FRONT + 3.3)], true);
  k.box("plaster", [HW + 2.8, SHOP_H / 2, (1.3 + HD + 0.4) / 2], [5.5, SHOP_H, HD + 0.4 - 1.3], true);

  windowTrim(k);

  // Rooftops: a parapet round each block, water tanks, air-conditioners.
  BLOCKS.forEach((bl, i) => {
    const H = heightOf(bl);
    const mat = bl.finish === "glass" ? "charcoal" : "plaster";
    k.box(mat, [bl.x, H + 0.2, bl.z - bl.d / 2 + 0.1], [bl.w, 0.4, 0.2]);
    k.box(mat, [bl.x, H + 0.2, bl.z + bl.d / 2 - 0.1], [bl.w, 0.4, 0.2]);
    k.box(mat, [bl.x - bl.w / 2 + 0.1, H + 0.2, bl.z], [0.2, 0.4, bl.d]);
    k.box(mat, [bl.x + bl.w / 2 - 0.1, H + 0.2, bl.z], [0.2, 0.4, bl.d]);
    if (bl.floors >= 4) {
      k.add("plaster", "cyl", [bl.x + bl.w * 0.22, H + 0.7, bl.z - bl.d * 0.18], [1.3, 1.4, 1.3]);
      k.box("metal", [bl.x - bl.w * 0.2, H + 0.35, bl.z + bl.d * 0.15 * (i % 2 ? 1 : -1)], [1.3, 0.7, 0.8]);
    }
  });
  return k;
})();

/* ───────────────────────── Moving and lit things ───────────────────────── */

const roadMat = std("#3C3F45", 0.93);
const whitePaint = std("#F2F0EA", 0.75);
const yellowPaint = std("#E8B21E", 0.7);

const MARK = 0.004;
const markings = (() => {
  const white: Part[] = [];
  const yellow: Part[] = [];
  const seg = (x0: number, x1: number, z: number, list: Part[], wdt = 0.1) => list.push({ p: [(x0 + x1) / 2, 0.014, z], s: [x1 - x0, MARK, wdt] });
  for (const [x0, x1] of [[-90, CX - 2.2], [CX + 2.2, 90]] as const) {
    seg(x0, x1, SEOUL.roadZ - 0.08, yellow);
    seg(x0, x1, SEOUL.roadZ + 0.08, yellow);
    seg(x0, x1, ROAD_N + 0.18, white);
    seg(x0, x1, ROAD_S - 0.18, white);
  }
  // Stop lines before the crosswalk, one per lane.
  white.push({ p: [CX - 2.5, 0.014, (SEOUL.roadZ + ROAD_S) / 2], s: [0.3, MARK, SEOUL.roadW / 2 - 0.25] });
  white.push({ p: [CX + 2.5, 0.014, (SEOUL.roadZ + ROAD_N) / 2], s: [0.3, MARK, SEOUL.roadW / 2 - 0.25] });
  for (let i = -2; i <= 2; i++) white.push({ p: [CX + i * 0.8, 0.014, SEOUL.roadZ], s: [0.45, MARK, SEOUL.roadW - 0.4] });
  return { white, yellow };
})();

const ginkgo = foliage("#EBC03A", 0.85, true);
const ginkgoDeep = foliage("#D6A42C", 0.85, true);
const ginkgoLight = foliage("#F6D85E", 0.85, true);
const leafMat = std("#E0AE34", 0.8);

const canopies = (() => {
  const a: Part[] = [];
  const c: Part[] = [];
  const l: Part[] = [];
  const leaves: Part[] = [];
  SEOUL.trees.forEach((tr, i) => {
    // Shades alternate cluster by cluster: deep inside/low, light on top.
    GINKGO[i].clusters.forEach((part, k) => {
      const hi = part.p[1] > 5.0;
      (hi ? (k % 2 ? l : a) : k % 3 === 0 ? c : k % 3 === 1 ? a : l).push(part);
    });
    // Fallen leaves on the pavement round the grate (never on the road).
    const r = rng(i * 31 + 5);
    for (let n = 0; n < 18; n++) {
      const a2 = r() * Math.PI * 2;
      const d = 0.6 + r() * 1.3;
      const x = tr.x + Math.cos(a2) * d;
      const z = tr.z + Math.sin(a2) * d;
      if (z > ROAD_N - 0.25 && z < ROAD_S + 0.25) continue;
      leaves.push({ p: [x, 0.006, z], s: [0.09, 0.005, 0.07], r: [0, r() * 3, 0] });
    }
  });
  return { a, c, l, leaves };
})();

const glassMat = new MeshStandardMaterial({ color: "#BFDCE8", roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.32, depthWrite: false, side: DoubleSide });
const lampLight = new MeshBasicMaterial({ color: "#FFF1D2", toneMapped: false });
const LAMP_LIGHTS: Part[] = SEOUL.lamps.map((l) => ({ p: [l.x, 4.245, l.z + (l.z > SEOUL.roadZ ? -1 : 1) * 1.0], s: [0.2, 0.01, 0.48] }));

/** Shared between the taxi and the walk signals: green to walk while the road is clear. */
interface Traffic {
  driving: boolean;
}

const taxiPaint = std("#E2742A", 0.32, { metalness: 0.25 });
const taxiGlass = std("#1E2A35", 0.08, { metalness: 0.6 });
const tyre = std("#1C1C1E", 0.8);
const headlight = new MeshBasicMaterial({ color: "#FFF6E0", toneMapped: false });
const taillight = new MeshBasicMaterial({ color: "#FF3B30", toneMapped: false });
const taxiTop = std("#F7F1E1", 0.5, { emissive: "#FFE7A8", emissiveIntensity: 0.6 });

/**
 * An orange Seoul taxi that drives east along the road every so often and
 * waits, politely, for anyone standing in its lane.
 */
function Taxi({ player, traffic }: { player: MutableRefObject<PlayerState>; traffic: MutableRefObject<Traffic> }) {
  const root = useRef<Group>(null);
  const wheels = useRef<(Group | null)[]>([]);
  const st = useRef(newTaxi());
  const spin = useRef(0);
  useFrame((_, raw) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(raw, 0.05);
    if (REDUCED_MOTION) {
      g.position.x = HW + 4;
      traffic.current.driving = false;
      return;
    }
    const p = player.current.position;
    const s = (st.current = stepTaxi(st.current, dt, Math.abs(p.z - LANE_Z) < 1.5, p.x));
    g.visible = s.wait <= 0;
    traffic.current.driving = s.wait <= 0;
    spin.current -= (s.v * dt) / 0.34;
    g.position.x = s.x;
    for (const w of wheels.current) if (w) w.rotation.z = spin.current;
  });
  const wheelSpots: [number, number][] = [
    [1.38, 0.8],
    [1.38, -0.8],
    [-1.38, 0.8],
    [-1.38, -0.8],
  ];
  return (
    <group ref={root} name="seoul-taxi" position={[-TAXI.end, 0, LANE_Z]} visible={false}>
      <mesh castShadow position={[0, 0.56, 0]}>
        <boxGeometry args={[4.4, 0.62, 1.74]} />
        <primitive object={taxiPaint} attach="material" />
      </mesh>
      <mesh castShadow position={[-0.25, 1.1, 0]}>
        <boxGeometry args={[2.35, 0.5, 1.56]} />
        <primitive object={taxiGlass} attach="material" />
      </mesh>
      <mesh castShadow position={[-0.25, 1.37, 0]}>
        <boxGeometry args={[2.05, 0.06, 1.52]} />
        <primitive object={taxiPaint} attach="material" />
      </mesh>
      <mesh position={[-0.2, 1.5, 0]}>
        <boxGeometry args={[0.24, 0.2, 0.55]} />
        <primitive object={taxiTop} attach="material" />
      </mesh>
      {[-1, 1].map((sz) => (
        <group key={sz}>
          <mesh position={[2.205, 0.64, sz * 0.62]}>
            <boxGeometry args={[0.02, 0.12, 0.36]} />
            <primitive object={headlight} attach="material" />
          </mesh>
          <mesh position={[-2.205, 0.68, sz * 0.66]}>
            <boxGeometry args={[0.02, 0.12, 0.3]} />
            <primitive object={taillight} attach="material" />
          </mesh>
        </group>
      ))}
      {[2.22, -2.22].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]}>
          <boxGeometry args={[0.08, 0.16, 1.7]} />
          <primitive object={MAT.charcoal} attach="material" />
        </mesh>
      ))}
      {wheelSpots.map(([x, z], i) => (
        <group
          key={i}
          position={[x, 0.34, z]}
          ref={(el) => {
            wheels.current[i] = el;
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.24, 18]} />
            <primitive object={tyre} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The two walk signals: a red standing figure while the taxi drives, green when the road is clear. */
function WalkSignals({ traffic }: { traffic: MutableRefObject<Traffic> }) {
  const stopTex = useCanvasTexture(64, 64, PAINT_STOP, "");
  const walkTex = useCanvasTexture(64, 64, PAINT_WALK, "");
  const mats = useMemo(
    () => ({
      stop: new MeshBasicMaterial({ map: stopTex, toneMapped: false }),
      walk: new MeshBasicMaterial({ map: walkTex, toneMapped: false }),
    }),
    [stopTex, walkTex],
  );
  useEffect(() => () => {
    mats.stop.dispose();
    mats.walk.dispose();
  }, [mats]);
  useFrame(() => {
    const go = !traffic.current.driving;
    mats.walk.color.setScalar(go ? 1 : 0.12);
    mats.stop.color.setScalar(go ? 0.12 : 1);
  });
  return (
    <>
      {SEOUL.signals.map((p) => {
        // Each faces the far kerb: the people about to cross look at it.
        const face = p.z < SEOUL.roadZ ? 0 : Math.PI;
        return (
          <group key={`${p.x}`} position={[p.x, 2.35, p.z]} rotation={[0, face, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.32, 0.62, 0.16]} />
              <primitive object={MAT.charcoal} attach="material" />
            </mesh>
            <mesh position={[0, 0.15, 0.081]}>
              <planeGeometry args={[0.24, 0.24]} />
              <primitive object={mats.stop} attach="material" />
            </mesh>
            <mesh position={[0, -0.15, 0.081]}>
              <planeGeometry args={[0.24, 0.24]} />
              <primitive object={mats.walk} attach="material" />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

const towerWhite = std("#ECE9E2", 0.55);
const towerGrey = std("#9AA3AA", 0.5, { metalness: 0.3 });
const towerRed = std("#D23A3A", 0.6);
const hillMat = foliage("#587A4E", 0.95);
const hillFar = foliage("#6C8A62", 0.95);
const HILL: Part[] = [
  { p: [0, -5, 0], s: [52, 28, 36] },
  { p: [-22, -6, 6], s: [36, 20, 26], r: [0, 1.1, 0] },
  { p: [24, -6, 4], s: [40, 22, 28], r: [0, 2.3, 0] },
];
const HILL_BACK: Part[] = [
  { p: [-6, -6, -16], s: [44, 24, 30], r: [0, 0.6, 0] },
  { p: [30, -7, -10], s: [34, 18, 24], r: [0, 1.7, 0] },
];
const deckOn = std("#9ED8FF", 0.3, { emissive: "#7FD4FF", emissiveIntensity: 1.6 });
const antennaOn = std("#FF8FA3", 0.4, { emissive: "#FF4D6D", emissiveIntensity: 1.5 });

/** Namsan Tower on its wooded hill, far to the north; lit once its name is learned. */
function NamsanTower({ lit }: { lit: boolean }) {
  const { x, z } = SEOUL.tower;
  return (
    <group position={[x, 0, z]}>
      <Instanced parts={HILL} material={hillMat} geometry={kitGeometry("ball")} />
      <Instanced parts={HILL_BACK} material={hillFar} geometry={kitGeometry("ballLow")} />
      <mesh position={[0, 14, 0]}>
        <cylinderGeometry args={[0.42, 0.72, 11, 16]} />
        <primitive object={towerWhite} attach="material" />
      </mesh>
      <mesh position={[0, 20.1, 0]}>
        <cylinderGeometry args={[1.55, 1.1, 1.1, 24]} />
        <primitive object={towerWhite} attach="material" />
      </mesh>
      <mesh position={[0, 20.95, 0]}>
        <cylinderGeometry args={[1.75, 1.62, 0.7, 24]} />
        <primitive object={lit ? deckOn : towerGrey} attach="material" />
      </mesh>
      <mesh position={[0, 21.55, 0]}>
        <cylinderGeometry args={[1.15, 1.62, 0.55, 24]} />
        <primitive object={towerWhite} attach="material" />
      </mesh>
      <mesh position={[0, 25.1, 0]}>
        <cylinderGeometry args={[0.09, 0.23, 6.6, 10]} />
        <primitive object={lit ? antennaOn : towerWhite} attach="material" />
      </mesh>
      {[23.5, 25.9].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.55, 10]} />
          <primitive object={lit ? antennaOn : towerRed} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

const viewerPaint = std("#2F7C80", 0.4, { metalness: 0.35 });

/** The coin binoculars at the north kerb, turned towards the tower. */
function TowerViewer() {
  const v = SEOUL.viewer;
  const yaw = Math.atan2(-(SEOUL.tower.x - v.x), -(SEOUL.tower.z - v.z));
  return (
    <group position={[v.x, 0, v.z]}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.07, 0.12, 1.1, 14]} />
        <primitive object={viewerPaint} attach="material" />
      </mesh>
      <group position={[0, 1.22, 0]} rotation={[0, -yaw, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.26, 0.3]} />
          <primitive object={viewerPaint} attach="material" />
        </mesh>
        {[-0.09, 0.09].map((dx) => (
          <mesh key={dx} position={[dx, 0.03, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.085, 0.18, 14]} />
            <primitive object={MAT.charcoal} attach="material" />
          </mesh>
        ))}
        {[-0.07, 0.07].map((dx) => (
          <mesh key={dx} position={[dx, 0.04, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
            <primitive object={MAT.charcoal} attach="material" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A flat painted board: front only, unlit or lit by the scene. */
function Board({ tex, w, h, position, rotY = 0, glow = 0 }: { tex: CanvasTexture; w: number; h: number; position: [number, number, number]; rotY?: number; glow?: number }) {
  const mat = useMemo(
    () => (glow ? new MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: "#FFFFFF", emissiveIntensity: glow, roughness: 0.5 }) : new MeshStandardMaterial({ map: tex, roughness: 0.6 })),
    [tex, glow],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh position={position} rotation={[0, rotY, 0]}>
      <planeGeometry args={[w, h]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

export default function SeoulJourney({ words = [], player }: { words?: string[]; player: MutableRefObject<PlayerState> }) {
  const paving = useTiledTexture(paintPaving, 60, 40);
  const photo = usePhotoFloor("paving", 60, 40);
  const lit = words.includes("남산타워");
  const traffic = useRef<Traffic>({ driving: false });

  const station = useCanvasTexture(1024, 192, paintStation, "시청출구");
  const lineMap = useCanvasTexture(768, 512, paintLineMap, "호선시청건대입구잠실강남신도림홍대현재위치");
  const routes = useCanvasTexture(256, 512, paintRoutes, "버스정류장서울역시청남산강남");
  const busSign = useCanvasTexture(256, 256, paintBusSign, "버스");
  const store = useCanvasTexture(1024, 640, paintStore, "편의점시미세요");
  const restaurant = useCanvasTexture(1024, 640, paintRestaurant, "식당김치찌개비빔밥영업중");
  const menu = useCanvasTexture(320, 448, paintMenu, "메뉴김치찌개된장비빔밥불고기원");
  const seoulSign = useCanvasTexture(768, 256, paintSeoul, SEOUL.sign);
  const shopsTex = useCanvasTexture(1024, 256, paintShops, "카페약국빵집꽃집");
  const stairs = useCanvasTexture(256, 512, paintStairs, "");

  const city = useMemo(() => cityGeometry(), []);
  const shopMat = useMemo(() => {
    shopsTex.wrapS = RepeatWrapping;
    return new MeshStandardMaterial({ map: shopsTex, emissiveMap: shopsTex, emissive: "#FFFFFF", emissiveIntensity: 0.3, roughness: 0.6 });
  }, [shopsTex]);
  const stairMat = useMemo(() => new MeshBasicMaterial({ map: stairs }), [stairs]);
  useEffect(
    () => () => {
      city.merged.forEach((m) => m.geo.dispose());
      city.shops?.dispose();
      shopMat.dispose();
      stairMat.dispose();
    },
    [city, shopMat, stairMat],
  );

  const s = SEOUL.subway;
  const lm = SEOUL.lineMap;
  const bus = SEOUL.bus;
  return (
    <group>
      {/* Pavements everywhere, the road across them, a side street north. */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <planeGeometry args={[120, 80, ...FLOOR_GRID]} />
        <meshStandardMaterial key={photo ? "photo" : "painted"} map={photo?.map ?? paving} normalMap={photo?.normal ?? null} roughnessMap={photo?.rough ?? null} roughness={photo ? 1 : 0.95} color={photo ? "#E6E2DA" : "#ffffff"} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, SEOUL.roadZ]}>
        <planeGeometry args={[180, SEOUL.roadW, ...FLOOR_GRID]} />
        <primitive object={roadMat} attach="material" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[4.8, 0.008, -HD - 20.4]}>
        <planeGeometry args={[4.6, 40]} />
        <primitive object={roadMat} attach="material" />
      </mesh>
      <Instanced parts={markings.white} material={whitePaint} receiveShadow />
      <Instanced parts={markings.yellow} material={yellowPaint} receiveShadow />

      {/* The city blocks. */}
      {city.merged.map(({ f, geo }) => (
        <mesh key={f} geometry={geo} material={facadeMaterial(f)} castShadow receiveShadow />
      ))}
      {city.shops && <mesh geometry={city.shops} material={shopMat} castShadow receiveShadow />}
      <Batch kit={STREET_KIT} />

      {/* Subway: the steps going down, the glass canopy, the station sign. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s.x, 0.016, s.z + 0.12]}>
        <planeGeometry args={[s.w - 0.48, s.d - 0.24]} />
        <primitive object={stairMat} attach="material" />
      </mesh>
      <mesh position={[s.x, 2.85, s.z]}>
        <boxGeometry args={[s.w + 0.2, 0.04, s.d + 0.2]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      <Board tex={station} w={2.9} h={0.54} position={[s.x, 2.4, s.z + s.d / 2 + 0.12]} glow={0.25} />
      <Board tex={lineMap} w={1.8} h={1.2} position={[lm.x, 1.45, lm.z + 0.035]} />

      {/* Bus stop: glass back, the route board, the round sign on the pole. */}
      <mesh position={[bus.x - bus.w / 2 + 0.05, 1.32, bus.z - 0.35]}>
        <boxGeometry args={[0.03, 1.9, 2.1]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      <mesh castShadow position={[bus.x - bus.w / 2 + 0.03, 1.32, bus.z + 1.05]}>
        <boxGeometry args={[0.1, 1.9, 0.8]} />
        <primitive object={MAT.charcoal} attach="material" />
      </mesh>
      <Board tex={routes} w={0.7} h={1.4} position={[bus.x - bus.w / 2 + 0.09, 1.3, bus.z + 1.05]} rotY={Math.PI / 2} glow={0.35} />
      {[Math.PI / 2, -Math.PI / 2].map((ry) => (
        <Board key={ry} tex={busSign} w={0.62} h={0.62} position={[-8.45 + (ry > 0 ? 0.03 : -0.03), 2.6, bus.z - bus.d / 2 + 0.15]} rotY={ry} />
      ))}

      {/* The convenience store and the restaurant on the east side. */}
      <Board tex={store} w={3.8} h={3.4} position={[FACE_X, 1.7, SEOUL.store.z]} rotY={-Math.PI / 2} glow={0.45} />
      <Board tex={restaurant} w={3.6} h={3.4} position={[FACE_X, 1.7, SEOUL.restaurant.z]} rotY={-Math.PI / 2} glow={0.35} />
      <Board tex={menu} w={0.8} h={1.12} position={[FACE_X, 1.45, SEOUL.restaurant.z - 2.45]} rotY={-Math.PI / 2} />
      <TableSetting />

      {/* The office tower's "서울" screen. */}
      <mesh position={[-2.3, 7.6, NORTH_FRONT + 0.04]}>
        <boxGeometry args={[3.8, 1.36, 0.08]} />
        <primitive object={MAT.charcoal} attach="material" />
      </mesh>
      <Board tex={seoulSign} w={3.6} h={1.2} position={[-2.3, 7.6, NORTH_FRONT + 0.09]} glow={0.8} />

      {/* Ginkgos and their leaves, the lamps' lights. */}
      <Instanced parts={canopies.a} material={ginkgo} geometry={kitGeometry("leafy")} castShadow />
      <Instanced parts={canopies.c} material={ginkgoDeep} geometry={kitGeometry("leafy")} castShadow />
      <Instanced parts={canopies.l} material={ginkgoLight} geometry={kitGeometry("leafy")} castShadow />
      <Instanced parts={canopies.leaves} material={leafMat} receiveShadow />
      <Instanced parts={LAMP_LIGHTS} material={lampLight} />

      <WalkSignals traffic={traffic} />
      <Taxi player={player} traffic={traffic} />
      <TowerViewer />
      <NamsanTower lit={lit} />

      {/* South: back to the Hub. */}
      <GateWall z={HD + 0.2} facing={-1} open accent={false} halfWidth={HW} />
    </group>
  );
}

const bowl = std("#C9CDD2", 0.25, { metalness: 0.8 });
const billMat = std("#F7F4EC", 0.8);

/** The outdoor table: two steel rice bowls and the bill in its holder. */
function TableSetting() {
  const t = SEOUL.table;
  return (
    <group position={[t.x, 0.745, t.z]}>
      {[-0.18, 0.18].map((dx) => (
        <mesh key={dx} castShadow position={[dx, 0.04, 0.05]}>
          <cylinderGeometry args={[0.07, 0.05, 0.08, 20]} />
          <primitive object={bowl} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.07, -0.22]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.16, 0.14, 0.01]} />
        <primitive object={billMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.005, -0.2]}>
        <boxGeometry args={[0.18, 0.01, 0.08]} />
        <primitive object={MAT.charcoal} attach="material" />
      </mesh>
    </group>
  );
}
