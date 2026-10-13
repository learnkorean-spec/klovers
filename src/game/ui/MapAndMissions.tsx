import { useEffect, useRef } from "react";
import { WORLD_COPY, type WorldLang } from "../config/copy";
import { INTERACTABLES } from "../config/interactions";
import { MISSIONS, missionRooms, missionSteps, type Mission, type MissionId } from "../config/missions";
import { ROOMS, type RoomId } from "../config/rooms";

/**
 * The walking map and the missions, all DOM / 2D canvas (no 3D cost):
 *   MiniMap      — a round map in the corner that turns with the view (the
 *                  way ahead is always up), like an open-world game's radar.
 *                  Click / tap (or M) opens the full map.
 *   FullMap      — this place, north up, with every gate and thing to use,
 *                  and the list of places (where you are, what is locked).
 *   MissionsCard — the list of missions to choose from.
 *   MissionChip  — the mission being played: progress and, for a race, time.
 */

export type Pose = { room: RoomId; x: number; z: number; yaw: number; camYaw: number };

const C = {
  outside: "#3A3530",
  floor: "#EFE5D0",
  block: "#7A5C43",
  gateOpen: "#FFFF00",
  gateShut: "#9C958C",
  dot: "#FFF9EC",
  ink: "#2E2E2E",
  yellow: "#FFFF00",
};

interface DrawOpts {
  pose: Pose;
  /** Centre of the drawing in world metres, and pixels per metre. */
  cx: number;
  cz: number;
  scale: number;
  /** Rotation of the map (the camera yaw on the minimap; 0 = north up). */
  rot: number;
  w: number;
  h: number;
  isOpen: (r: RoomId) => boolean;
  steps: Set<string>;
  target: { x: number; z: number } | null;
  /** Round radar: the target clamps to this radius (px) when far. */
  clampR?: number;
}

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
  for (const p of room.portals) {
    const open = !p.lockedNotice || o.isOpen(p.to);
    ctx.fillStyle = open ? C.gateOpen : C.gateShut;
    const z = p.zone;
    ctx.fillRect(z.minX, z.minZ, z.maxX - z.minX, z.maxZ - z.minZ);
  }
  const px = 1 / scale;
  for (const it of INTERACTABLES) {
    if (it.room !== o.pose.room) continue;
    const step = o.steps.has(it.id);
    ctx.beginPath();
    ctx.arc(it.x, it.z, (step ? 4.2 : 2.4) * px, 0, Math.PI * 2);
    ctx.fillStyle = step ? C.yellow : C.dot;
    ctx.fill();
    ctx.lineWidth = 1.2 * px;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
  }
  // The learner: an arrow the way the body faces.
  ctx.save();
  ctx.translate(o.pose.x, o.pose.z);
  ctx.rotate(-o.pose.yaw);
  ctx.beginPath();
  ctx.moveTo(0, 7 * px);
  ctx.lineTo(4.6 * px, -4.6 * px);
  ctx.lineTo(0, -2.4 * px);
  ctx.lineTo(-4.6 * px, -4.6 * px);
  ctx.closePath();
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.lineWidth = 1.6 * px;
  ctx.strokeStyle = C.yellow;
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // The way to go: a yellow diamond, held at the rim when it is far.
  if (o.target) {
    const dx = o.target.x - o.cx;
    const dz = o.target.z - o.cz;
    let sx = (dx * Math.cos(o.rot) - dz * Math.sin(o.rot)) * scale;
    let sy = (dx * Math.sin(o.rot) + dz * Math.cos(o.rot)) * scale;
    const r = Math.hypot(sx, sy);
    if (o.clampR && r > o.clampR) {
      sx *= o.clampR / r;
      sy *= o.clampR / r;
    }
    ctx.save();
    ctx.translate(w / 2 + sx, h / 2 + sy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = C.yellow;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.fillRect(-5.5, -5.5, 11, 11);
    ctx.strokeRect(-5.5, -5.5, 11, 11);
    ctx.restore();
  }
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
  const c = WORLD_COPY[lang].map;
  useCanvasLoop(ref, { w: size, h: size }, (ctx, w, h) => {
    const p = pose();
    if (!p) return;
    draw(ctx, { pose: p, cx: p.x, cz: p.z, scale: w / 2 / 15, rot: p.camYaw, w, h, isOpen, steps, target: target(), clampR: w / 2 - 9 });
  });
  return (
    <button
      type="button"
      aria-label={`${c.button} (${c.key})`}
      onClick={(e) => {
        e.currentTarget.blur();
        onOpen();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto relative shrink-0 overflow-hidden rounded-full border-[3px] border-charcoal bg-charcoal shadow-lg ring-2 ring-klovers-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-klovers-yellow"
      style={{ width: size, height: size }}
    >
      <canvas ref={ref} style={{ width: size, height: size, display: "block" }} />
      <span className="absolute inset-x-0 bottom-1 mx-auto w-fit rounded-full bg-charcoal/80 px-2 text-[10px] font-bold leading-4 text-ivory">
        {c.button}
        {showKey && <kbd className="ms-1 font-display">{c.key}</kbd>}
      </span>
    </button>
  );
}

const ROOM_ORDER: RoomId[] = ["courtyard", "hangul-village", "hub", "klovers-house", "vocabulary-market", "conversation-cafe"];

export function FullMap({ lang, pose, isOpen, steps, target, onClose }: MapProps & { onClose: () => void }) {
  const copy = WORLD_COPY[lang];
  const c = copy.map;
  const ref = useRef<HTMLCanvasElement>(null);
  const side = Math.min(520, Math.round(Math.min(window.innerWidth * 0.62, window.innerHeight * 0.68)));
  const here = pose()?.room ?? "courtyard";
  useCanvasLoop(ref, { w: side, h: side }, (ctx, w, h) => {
    const p = pose();
    if (!p) return;
    const b = ROOMS[p.room].bounds;
    const span = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) + 3;
    draw(ctx, { pose: p, cx: (b.minX + b.maxX) / 2, cz: (b.minZ + b.maxZ) / 2, scale: w / span, rot: 0, w, h, isOpen, steps, target: target() });
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "KeyM") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-charcoal/55 p-4" onPointerDown={(e) => e.stopPropagation()}>
      <div role="dialog" aria-modal="true" aria-label={c.title} className="flex max-h-full flex-wrap items-start justify-center gap-4 rounded-3xl bg-ivory p-4 text-charcoal shadow-2xl">
        <div className="flex flex-col items-center gap-2">
          <p className="font-display text-lg font-bold">
            {c.title} · {copy.rooms[here].name}
          </p>
          <canvas ref={ref} className="rounded-2xl" style={{ width: side, height: side }} />
        </div>
        <div className="flex min-w-[11rem] flex-col gap-2">
          <ul className="flex flex-col gap-1.5">
            {ROOM_ORDER.map((r) => (
              <li
                key={r}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-1.5 text-sm ${r === here ? "bg-charcoal text-ivory" : "bg-white"} ${isOpen(r) ? "" : "opacity-55"}`}
              >
                <span className="font-semibold">{copy.rooms[r].name}</span>
                <span className="text-[11px] font-bold">{r === here ? c.here : isOpen(r) ? "" : c.locked}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 min-h-10 rounded-full border-2 border-charcoal bg-klovers-yellow px-5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
          >
            {c.close}
          </button>
        </div>
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
