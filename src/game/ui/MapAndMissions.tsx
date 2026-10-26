import { useEffect, useRef } from "react";
import { WORLD_COPY, type WorldLang } from "../config/copy";
import { INTERACTABLES } from "../config/interactions";
import { MISSIONS, missionRooms, missionSteps, type Mission, type MissionId } from "../config/missions";
import { ROOMS, type RoomId } from "../config/rooms";

/**
 * The walking map and the missions, all DOM / 2D canvas (no 3D cost):
 *   MiniMap      — a square map in the corner, north always up (it never
 *                  spins), the whole room in view, doors named, a cone
 *                  showing where the camera looks. Click / tap (or M)
 *                  opens the road map.
 *   FullMap      — this place, north up, with every gate and thing to use,
 *                  and the list of places (where you are, what is locked).
 *   MissionsCard — the list of missions to choose from.
 *   MissionChip  — the mission being played: progress and, for a race, time.
 */

export type Pose = { room: RoomId; x: number; z: number; yaw: number; camYaw: number };

const C = {
  outside: "#E6DDCB",
  floor: "#FFFBF2",
  block: "#D2C3A8",
  gateOpen: "#FFFF00",
  gateShut: "#B9B2A6",
  ink: "#2E2E2E",
  yellow: "#FFFF00",
};

interface DrawOpts {
  pose: Pose;
  /** Centre of the drawing in world metres, and pixels per metre. */
  cx: number;
  cz: number;
  scale: number;
  /** Rotation of the map (the camera yaw: the way ahead is always up). */
  rot: number;
  w: number;
  h: number;
  isOpen: (r: RoomId) => boolean;
  steps: Set<string>;
  target: { x: number; z: number } | null;
  /** The pin is held this far (px) inside the edge when its target is out of view. */
  clampM?: number;
  /** Destination names at the open gates. */
  gateName?: (r: RoomId) => string;
  /** At most this many names (those of the doors nearest the learner); all when unset. */
  maxNames?: number;
  t: number;
}

/** World point → screen point under the map's turn and zoom. */
function toScreen(o: DrawOpts, x: number, z: number): [number, number] {
  const dx = x - o.cx;
  const dz = z - o.cz;
  return [o.w / 2 + (dx * Math.cos(o.rot) - dz * Math.sin(o.rot)) * o.scale, o.h / 2 + (dx * Math.sin(o.rot) + dz * Math.cos(o.rot)) * o.scale];
}

/**
 * Deliberately plain: light ground, soft buildings, yellow doorways, the
 * learner as a big yellow dot with a pointer, and one pin for where to go.
 * No other marks — the map answers "where am I, where do I go".
 */
function draw(ctx: CanvasRenderingContext2D, o: DrawOpts) {
  const room = ROOMS[o.pose.room];
  const { w, h, scale } = o;
  ctx.save();
  ctx.fillStyle = C.outside;
  ctx.fillRect(0, 0, w, h);
  ctx.translate(w / 2, h / 2);
  ctx.rotate(o.rot);
  ctx.scale(scale, scale);
  ctx.translate(-o.cx, -o.cz);
  const b = room.bounds;
  ctx.fillStyle = C.floor;
  ctx.fillRect(b.minX, b.minZ, b.maxX - b.minX, b.maxZ - b.minZ);
  ctx.fillStyle = C.block;
  for (const c of room.colliders) ctx.fillRect(c.minX, c.minZ, c.maxX - c.minX, c.maxZ - c.minZ);
  const px = 1 / scale;
  for (const p of room.portals) {
    const open = !p.lockedNotice || o.isOpen(p.to);
    const z = p.zone;
    ctx.fillStyle = open ? C.gateOpen : C.gateShut;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5 * px;
    ctx.fillRect(z.minX, z.minZ, z.maxX - z.minX, z.maxZ - z.minZ);
    ctx.strokeRect(z.minX, z.minZ, z.maxX - z.minX, z.maxZ - z.minZ);
  }
  // Only the things the current mission needs, as yellow dots.
  for (const it of INTERACTABLES) {
    if (it.room !== o.pose.room || !o.steps.has(it.id)) continue;
    ctx.beginPath();
    ctx.arc(it.x, it.z, 4.5 * px, 0, Math.PI * 2);
    ctx.fillStyle = C.yellow;
    ctx.fill();
    ctx.lineWidth = 1.6 * px;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
  }
  ctx.restore();

  // Destination names beside open doorways (upright, whatever the turn).
  if (o.gateName) {
    let named = room.portals.filter((p) => !p.lockedNotice || o.isOpen(p.to));
    // A small map with many doors (the Hub has seven) was all names and no
    // map: only the doors nearest the learner keep theirs (the full map
    // names every one), and they change as the learner walks.
    if (o.maxNames !== undefined && named.length > o.maxNames) {
      const d = (p: (typeof named)[number]) => Math.hypot((p.zone.minX + p.zone.maxX) / 2 - o.pose.x, (p.zone.minZ + p.zone.maxZ) / 2 - o.pose.z);
      const near = new Set([...named].sort((a, b) => d(a) - d(b)).slice(0, o.maxNames));
      named = named.filter((p) => near.has(p));
    }
    // Busy rooms need the smaller size to keep the map readable under the names.
    const busy = named.length > 3;
    ctx.font = busy ? "700 9px Cairo, Inter, sans-serif" : "700 10px Cairo, Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Doors that sit side by side (the Hub's south wall has three) would
    // print their names on top of each other; each label takes the first
    // free slot — on the door, then stepped inward — and never overlaps one
    // already placed. A name wider than the map is shortened with "…".
    // The learner's dot (and its pointer) is a placed box too: the learner
    // usually stands right at the door they came through, and its name was
    // printed straight through the dot ("The KLC●RS Hub").
    const [px0, py0] = toScreen(o, o.pose.x, o.pose.z);
    const placed: { x0: number; y0: number; x1: number; y1: number }[] = [{ x0: px0 - 14, y0: py0 - 14, x1: px0 + 14, y1: py0 + 14 }];
    const LH = busy ? 13 : 16;
    const half = LH / 2;
    const maxW = w - 4;
    for (const p of named) {
      const [gx, gy] = toScreen(o, (p.zone.minX + p.zone.maxX) / 2, (p.zone.minZ + p.zone.maxZ) / 2);
      let label = o.gateName(p.to);
      while (label.length > 3 && ctx.measureText(label).width + 8 > maxW) label = label.slice(0, -2) + "…";
      const tw = Math.min(maxW, ctx.measureText(label).width + 8);
      // Kept inside the frame: a door on the very edge still shows its name.
      const sx = Math.min(w - tw / 2 - 2, Math.max(tw / 2 + 2, gx));
      const sy0 = Math.min(h - half - 2, Math.max(half + 2, gy));
      // Step toward the middle of the map, so a shifted name stays in view.
      const inward = sy0 > h / 2 ? -1 : 1;
      let sy = sy0;
      // Try the door first, then step inward and outward in turn.
      for (let k = 0; k < 12; k++) {
        const step = k % 2 ? (k + 1) / 2 : -k / 2;
        const cy = Math.min(h - half - 2, Math.max(half + 2, sy0 + inward * step * (LH + 1)));
        const r = { x0: sx - tw / 2, y0: cy - half, x1: sx + tw / 2, y1: cy + half };
        if (!placed.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0)) {
          sy = cy;
          break;
        }
        sy = cy;
      }
      placed.push({ x0: sx - tw / 2, y0: sy - half, x1: sx + tw / 2, y1: sy + half });
      // A name moved off its door keeps a thin line back to it.
      if (Math.abs(sy - sy0) > 1) {
        const dx = Math.min(w - 2, Math.max(2, gx));
        const dy = Math.min(h - 2, Math.max(2, gy));
        ctx.strokeStyle = "rgba(46,46,46,0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.min(sx + tw / 2, Math.max(sx - tw / 2, dx)), sy + (dy > sy ? half : -half));
        ctx.lineTo(dx, dy);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(46,46,46,0.8)";
      ctx.fillRect(sx - tw / 2, sy - half, tw, LH);
      ctx.fillStyle = "#FFF9EC";
      ctx.fillText(label, sx, sy + 0.5);
    }
  }

  // Where to go: a yellow pin with a soft pulse, held at the rim when far.
  if (o.target) {
    let [sx, sy] = toScreen(o, o.target.x, o.target.z);
    const ox = sx - w / 2;
    const oy = sy - h / 2;
    const m = o.clampM ?? 12;
    const k = Math.min(ox ? (w / 2 - m) / Math.abs(ox) : Infinity, oy ? (h / 2 - m) / Math.abs(oy) : Infinity);
    if (k < 1) {
      sx = w / 2 + ox * k;
      sy = h / 2 + oy * k;
    }
    const pulse = 0.5 + 0.5 * Math.sin(o.t * 4);
    ctx.beginPath();
    ctx.arc(sx, sy, 9 + pulse * 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,0,${0.35 - pulse * 0.2})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fillStyle = C.yellow;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = C.ink;
    ctx.fill();
  }

  // The learner: a big yellow dot, pointing the way the body faces.
  const [lx, ly] = toScreen(o, o.pose.x, o.pose.z);
  // Where the camera looks: a soft wedge, so the map and the picture line up.
  {
    const a = Math.atan2(-Math.cos(o.pose.camYaw), -Math.sin(o.pose.camYaw)) + o.rot;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.arc(lx, ly, 34, a - 0.55, a + 0.55);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,0,0.38)";
    ctx.fill();
  }
  const fx = Math.sin(o.pose.yaw);
  const fz = Math.cos(o.pose.yaw);
  const ax = fx * Math.cos(o.rot) - fz * Math.sin(o.rot);
  const ay = fx * Math.sin(o.rot) + fz * Math.cos(o.rot);
  ctx.beginPath();
  ctx.moveTo(lx + ax * 15, ly + ay * 15);
  ctx.lineTo(lx - ay * 6, ly + ax * 6);
  ctx.lineTo(lx + ay * 6, ly - ax * 6);
  ctx.closePath();
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lx, ly, 7.5, 0, Math.PI * 2);
  ctx.fillStyle = C.yellow;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
}

function useCanvasLoop(
  ref: React.RefObject<HTMLCanvasElement>,
  size: { w: number; h: number },
  frame: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const f = useRef(frame);
  f.current = frame;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = Math.round(size.w * dpr);
    el.height = Math.round(size.h * dpr);
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 66) return; // ~15 fps is plenty for a map
      last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      f.current(ctx, size.w, size.h);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, size.w, size.h]);
}

interface MapProps {
  lang: WorldLang;
  pose: () => Pose | null;
  isOpen: (r: RoomId) => boolean;
  /** Steps of the mission being played that are still to do (ids). */
  steps: Set<string>;
  target: () => { x: number; z: number } | null;
}

export function MiniMap({ lang, pose, isOpen, steps, target, size, onOpen, showKey = true }: MapProps & { size: number; onOpen: () => void; showKey?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const copy = WORLD_COPY[lang];
  const c = copy.map;
  useCanvasLoop(ref, { w: size, h: size }, (ctx, w, h) => {
    const p = pose();
    if (!p) return;
    const tg = target();
    // North always up; the whole room fits the frame, with a little margin.
    const b = ROOMS[p.room].bounds;
    const scale = (w - 14) / Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    draw(ctx, {
      pose: p, cx: (b.minX + b.maxX) / 2, cz: (b.minZ + b.maxZ) / 2, scale, rot: 0, w, h, isOpen, steps, target: tg, clampM: 14,
      gateName: (r) => copy.rooms[r].name, maxNames: size < 140 ? 2 : 3, t: performance.now() / 1000,
    });
    // How far the pin is, in metres (written straight to the DOM, no re-render).
    const el = distRef.current;
    if (el) {
      const d = tg ? Math.round(Math.hypot(tg.x - p.x, tg.z - p.z)) : null;
      el.textContent = d !== null && d > 1 ? `${lang === "ar" ? toArabic(d) : d} ${c.metres}` : "";
      el.style.display = el.textContent ? "" : "none";
    }
  });
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        aria-label={`${c.button} (${c.key})`}
        onClick={(e) => {
          e.currentTarget.blur();
          onOpen();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="pointer-events-auto relative shrink-0 overflow-hidden rounded-2xl border-[3px] border-charcoal bg-ivory shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-klovers-yellow"
        style={{ width: size, height: size }}
      >
        <canvas ref={ref} style={{ width: size, height: size, display: "block" }} />
      </button>
      <span data-hud className="flex items-center gap-1.5 rounded-full bg-charcoal/85 px-2.5 py-0.5 text-[11px] font-bold text-ivory">
        <span ref={distRef} className="rounded-full bg-klovers-yellow px-1.5 text-charcoal" style={{ display: "none" }} />
        <span>{c.button}</span>
        {showKey && <kbd className="font-display text-ivory/70">{c.key}</kbd>}
      </span>
    </div>
  );
}

const toArabic = (n: number) => String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

/**
 * The map as one long road: the learner's journey from the courtyard to
 * Seoul, bottom to top, in the order the course opens each place. Built
 * places are stops on the road; what is not built yet (the rest of Seoul,
 * Levels 5–6) sits at the far end, dashed; places beside the road (Klovers House, Cluby's
 * Memory Garden) hang off the Hub, where their gates are.
 */
type Stop = { id: RoomId | "seoul"; level?: string };
const ROAD: Stop[] = [
  { id: "courtyard" },
  { id: "hangul-village" },
  { id: "vocabulary-market" },
  { id: "hub" },
  { id: "conversation-cafe" },
  { id: "culture-street" },
  { id: "seoul-journey" },
  { id: "seoul-market" },
  { id: "seoul-namsan" },
];
const STEP = 118;
const ROAD_W = 360;
const ROAD_H = ROAD.length * STEP + 70;
const stopAt = (i: number) => ({ x: i % 2 === 0 ? 92 : 268, y: ROAD_H - 52 - i * STEP });

export function FullMap({ lang, pose, isOpen, onClose, missionRoom }: Omit<MapProps, "steps" | "target"> & { onClose: () => void; missionRoom?: RoomId | null }) {
  const copy = WORLD_COPY[lang];
  const c = copy.map;
  const rtl = lang === "ar";
  const here = pose()?.room ?? "courtyard";
  const scroller = useRef<HTMLDivElement>(null);
  const hereRef = useRef<SVGGElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "KeyM") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  // Open on where the learner is.
  useEffect(() => {
    const box = scroller.current;
    const el = hereRef.current;
    if (!box || !el) return;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    box.scrollTop += r.top - b.top - b.height / 2 + r.height / 2;
  }, []);
  // Klovers House and the Memory Garden stand beside the road at the Hub.
  const roomHere = here === "klovers-house" || here === "memory-garden" ? "hub" : here;
  const segment = (i: number) => {
    const a = stopAt(i);
    const b = stopAt(i + 1);
    return `M${a.x} ${a.y} C${a.x} ${a.y - STEP * 0.62}, ${b.x} ${b.y + STEP * 0.62}, ${b.x} ${b.y}`;
  };
  const name = (st: Stop) => (st.id === "seoul" ? c.later : copy.rooms[st.id].name);
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-charcoal/55 p-4" onPointerDown={(e) => e.stopPropagation()}>
      <div role="dialog" aria-modal="true" aria-label={c.title} className="flex max-h-full w-full max-w-md flex-col items-center gap-2 rounded-3xl bg-ivory p-4 text-charcoal shadow-2xl">
        <p className="font-display text-lg font-bold">{c.road}</p>
        <div ref={scroller} className="w-full overflow-y-auto overscroll-contain rounded-2xl bg-[#EFE6D2]" style={{ maxHeight: "68vh" }}>
          <svg viewBox={`0 0 ${ROAD_W} ${ROAD_H}`} className="block w-full" style={{ direction: "ltr" }} role="img" aria-label={`${c.here}: ${copy.rooms[here].name}`}>
            {/* Fields either side of the road. */}
            {Array.from({ length: 14 }, (_, k) => (
              <circle key={k} cx={k % 2 ? 330 - (k * 37) % 60 : 30 + (k * 53) % 70} cy={ROAD_H - 30 - k * (ROAD_H / 14)} r={10 + (k % 3) * 5} fill="#D9E3C2" opacity={0.7} />
            ))}
            {/* The road: verge, asphalt-free path, and a yellow centre line. */}
            {ROAD.slice(0, -1).map((st, i) => {
              const future = ROAD[i + 1].id === "seoul";
              const open = !future && isOpen(ROAD[i + 1].id as RoomId);
              return (
                <g key={`r${i}`}>
                  <path d={segment(i)} fill="none" stroke="#CBBE9F" strokeWidth={34} strokeLinecap="round" />
                  <path d={segment(i)} fill="none" stroke={future ? "#E4DACA" : "#F7F1E3"} strokeWidth={26} strokeLinecap="round" strokeDasharray={future ? "14 10" : undefined} />
                  <path d={segment(i)} fill="none" stroke={open ? "#E8D400" : "#C9C0AE"} strokeWidth={3} strokeDasharray="10 9" strokeLinecap="round" />
                </g>
              );
            })}
            {ROAD.map((st, i) => {
              const p = stopAt(i);
              const isSeoul = st.id === "seoul";
              const room = st.id as RoomId;
              const open = !isSeoul && isOpen(room);
              const isHere = !isSeoul && room === roomHere;
              const isGoal = !isSeoul && missionRoom === room && !isHere;
              const labelLeft = p.x > ROAD_W / 2;
              const lx = labelLeft ? p.x - 34 : p.x + 34;
              const anchor = labelLeft ? "end" : "start";
              const status = isHere ? c.here : isSeoul ? c.soon : !open ? c.opensAt[room] ?? c.locked : isGoal ? c.goal : i === 0 ? c.start : c.open;
              const chipFill = isHere ? "#FFFF00" : isSeoul || !open ? "#D8CFBE" : isGoal ? "#2E2E2E" : "#FFFFFF";
              const chipText = isGoal ? "#FFFFFF" : "#2E2E2E";
              const chipW = Math.max(54, status.length * (rtl ? 6.2 : 6.6) + 18);
              return (
                <g key={st.id} ref={isHere ? hereRef : undefined}>
                  {isHere && <circle cx={p.x} cy={p.y} r={34} fill="#FFFF00" opacity={0.35} />}
                  <circle cx={p.x} cy={p.y} r={22} fill={isSeoul ? "#EFE6D2" : open ? "#FFFFFF" : "#E2D9C7"} stroke="#2E2E2E" strokeWidth={isHere ? 4 : 2.5} strokeDasharray={isSeoul ? "5 4" : undefined} />
                  <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="17" fontWeight="800" fill="#2E2E2E">
                    {rtl ? toArabic(i + 1) : i + 1}
                  </text>
                  {!open && !isSeoul && (
                    // A small padlock on locked stops.
                    <g transform={`translate(${p.x + 13} ${p.y - 25})`}>
                      <rect x={-6} y={0} width={12} height={9} rx={2} fill="#2E2E2E" />
                      <path d="M-3.5 0v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#2E2E2E" strokeWidth={2} />
                    </g>
                  )}
                  <text x={lx} y={p.y - 8} textAnchor={anchor} fontSize="15" fontWeight="800" fill={open || isSeoul ? "#2E2E2E" : "#6B6458"}>
                    {name(st)}
                  </text>
                  <text x={lx} y={p.y + 9} textAnchor={anchor} fontSize="11.5" fill="#6B6458">
                    {c.what[isSeoul ? "seoul" : room]}
                  </text>
                  <g transform={`translate(${labelLeft ? lx - chipW : lx} ${p.y + 16})`}>
                    <rect width={chipW} height={18} rx={9} fill={chipFill} stroke="#2E2E2E" strokeWidth={isHere || isGoal ? 0 : 1} />
                    <text x={chipW / 2} y={13} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={chipText}>
                      {status}
                    </text>
                  </g>
                  {st.id === "hub" && (
                    // Beside the road, at the Hub: the information house and the garden.
                    <g transform={`translate(${labelLeft ? lx - 196 : lx} ${p.y + 50})`}>
                      <rect x={-6} y={-13} width={208} height={45} rx={12} fill="#FFF9EC" stroke="#CBBE9F" strokeWidth={1.5} />
                      <text x={labelLeft ? 196 : 0} y={1} textAnchor={anchor} fontSize="10.5" fontWeight="700" fill="#6B6458">
                        {c.side}
                      </text>
                      <g transform="translate(0 7)">
                        <rect width={96} height={20} rx={10} fill={here === "klovers-house" ? "#FFFF00" : "#FFFFFF"} stroke="#2E2E2E" strokeWidth={1} />
                        <text x={48} y={14} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#2E2E2E">
                          {copy.rooms["klovers-house"].name}
                        </text>
                        {/* Cluby's Memory Garden: open with real review data (systems/access.ts). */}
                        <rect x={100} width={96} height={20} rx={10} fill={here === "memory-garden" ? "#FFFF00" : isOpen("memory-garden") ? "#FFFFFF" : "#E2D9C7"} stroke="#2E2E2E" strokeWidth={1} strokeDasharray={isOpen("memory-garden") ? undefined : "4 3"} />
                        <text x={148} y={14} textAnchor="middle" fontSize="10" fontWeight="700" fill={isOpen("memory-garden") ? "#2E2E2E" : "#6B6458"}>
                          {c.garden}
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-10 rounded-full border-2 border-charcoal bg-klovers-yellow px-6 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          {c.close}
        </button>
      </div>
    </div>
  );
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, "0")}`;

export function MissionsCard({
  lang,
  isOpen,
  active,
  done,
  best,
  onStart,
  onStop,
  onClose,
}: {
  lang: WorldLang;
  isOpen: (r: RoomId) => boolean;
  active: MissionId | null;
  done: readonly string[];
  best: Record<string, number>;
  onStart: (id: MissionId) => void;
  onStop: () => void;
  onClose: () => void;
}) {
  const copy = WORLD_COPY[lang];
  const u = copy.missionUi;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-charcoal/55 p-4 sm:items-center" onPointerDown={(e) => e.stopPropagation()}>
      <div role="dialog" aria-modal="true" aria-labelledby="world-missions-title" className="flex w-full max-w-lg flex-col gap-3 rounded-3xl bg-ivory p-5 text-charcoal shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 id="world-missions-title" className="font-display text-xl font-bold">
            {u.title}
          </h2>
          <button type="button" onClick={onClose} className="min-h-9 rounded-full border-2 border-charcoal/30 px-4 text-xs font-bold">
            {u.close}
          </button>
        </div>
        <p className="text-sm text-charcoal/75">{u.intro}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MISSIONS.map((m: Mission) => {
            const t = copy.missions[m.id];
            const open = missionRooms(m).every(isOpen);
            const isActive = active === m.id;
            const finished = done.includes(m.id);
            return (
              <li key={m.id} className={`flex flex-col gap-1.5 rounded-2xl border-2 p-3 ${isActive ? "border-klovers-yellow bg-charcoal text-ivory" : "border-charcoal/10 bg-white"} ${open ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-base font-bold leading-tight">{t.title}</p>
                  <span className="shrink-0 rounded-full bg-charcoal/10 px-2 py-0.5 text-[10px] font-bold" dir="ltr">
                    {missionSteps(m).length}
                  </span>
                </div>
                <p className={`text-xs ${isActive ? "text-ivory/80" : "text-charcoal/70"}`}>{t.line}</p>
                <p className={`text-[11px] font-semibold ${isActive ? "text-ivory/70" : "text-charcoal/55"}`}>
                  {copy.rooms[m.room].name}
                  {m.seconds ? ` · ${u.timed} ${mmss(m.seconds)}` : ""}
                  {best[m.id] ? ` · ${u.best} ${mmss(best[m.id])}` : ""}
                  {finished ? ` · ${u.done}` : ""}
                </p>
                {!open ? (
                  <p className="text-[11px] font-bold">{u.locked}</p>
                ) : isActive ? (
                  <button type="button" onClick={onStop} className="min-h-9 self-start rounded-full border-2 border-ivory/40 px-4 text-xs font-bold">
                    {u.stop}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStart(m.id)}
                    className="min-h-9 self-start rounded-full border-2 border-charcoal bg-klovers-yellow px-5 text-xs font-bold text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
                  >
                    {finished ? u.again : u.start}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function MissionChip({ lang, id, count, total, timeLeft, onOpen }: { lang: WorldLang; id: MissionId; count: number; total: number; timeLeft: number | null; onOpen: () => void }) {
  const copy = WORLD_COPY[lang];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.currentTarget.blur();
        onOpen();
      }}
      className="pointer-events-auto flex max-w-[16rem] items-center gap-2 rounded-2xl bg-charcoal/85 px-3 py-2 text-start text-ivory ring-2 ring-klovers-yellow/80"
    >
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-klovers-yellow" />
      <span className="flex flex-col">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ivory/60">
          {copy.missionUi.active}
          <span className="rounded-full bg-ivory/15 px-1.5 py-px tracking-normal text-ivory/85" dir="ltr">
            {count}/{total}
          </span>
          {timeLeft !== null && (
            <span className={`rounded-full px-1.5 py-px tracking-normal ${timeLeft < 20 ? "bg-klovers-yellow text-charcoal" : "bg-ivory/15 text-ivory/85"}`} dir="ltr">
              {mmss(timeLeft)}
            </span>
          )}
        </span>
        <span className="text-sm font-semibold leading-snug">{copy.missions[id].title}</span>
      </span>
    </button>
  );
}

export function MissionsButton({ lang, onClick }: { lang: WorldLang; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick();
        e.currentTarget.blur();
      }}
      className="pointer-events-auto min-h-9 rounded-full border-2 border-klovers-yellow bg-charcoal/85 px-4 text-xs font-bold text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-klovers-yellow"
    >
      {WORLD_COPY[lang].missionUi.button}
    </button>
  );
}
