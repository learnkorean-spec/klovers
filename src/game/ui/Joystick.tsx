import { useEffect, useRef, useState } from "react";
import { resetTouchStick, touchStick } from "../systems/touchInput";

/**
 * Floating thumb-stick for touch screens. The whole lower-left half of the
 * screen is the stick's zone: the ring appears wherever the thumb lands, so
 * there is no small fixed target to find, and it follows the thumb if it
 * slides past the ring, so it never runs out of room. Lift the thumb → stops.
 *
 * Writes into the shared touchStick the player reads every frame. Kept on the
 * physical left in both languages: the 3D world is never mirrored. The right
 * half stays free to drag the camera.
 */
export default function Joystick({ label, pulse = false }: { label: string; pulse?: boolean }) {
  const zone = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  /** Ring centre, in px from the zone's bottom-left corner. */
  const origin = useRef({ x: 0, y: 0 });
  const [ring, setRing] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const R = 52;
  /** Half the ring's size: the ring is kept inside the zone. */
  const HALF = 64;

  useEffect(() => resetTouchStick, []);

  const move = (clientX: number, clientY: number) => {
    const el = zone.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = clientX - r.left;
    const py = r.bottom - clientY; // up is +
    let dx = px - origin.current.x;
    let dy = py - origin.current.y;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      // Dragged past the ring: pull the ring along, so the thumb stays at its edge.
      const over = d - R;
      origin.current.x += (dx / d) * over;
      origin.current.y += (dy / d) * over;
      dx = (dx / d) * R;
      dy = (dy / d) * R;
      setRing({ ...origin.current });
    }
    setKnob({ x: dx, y: -dy });
    touchStick.x = dx / R;
    touchStick.y = dy / R;
  };
  const end = () => {
    active.current = null;
    setRing(null);
    setKnob({ x: 0, y: 0 });
    resetTouchStick();
  };

  return (
    <div
      ref={zone}
      role="application"
      aria-label={label}
      data-stick-zone=""
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      className="pointer-events-auto absolute bottom-0 left-0 h-[58%] w-1/2 touch-none select-none"
      onPointerDown={(e) => {
        if (active.current !== null) return;
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        // The ring is centred on the thumb, kept fully inside the zone.
        origin.current = {
          x: Math.min(Math.max(e.clientX - r.left, HALF + 8), r.width - HALF),
          y: Math.min(Math.max(r.bottom - e.clientY, HALF + 8), r.height - HALF),
        };
        setRing({ ...origin.current });
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) move(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (active.current === e.pointerId) end();
      }}
      onPointerCancel={(e) => {
        if (active.current === e.pointerId) end();
      }}
    >
      {/* Resting: a faint ring in the corner shows where to put the thumb. */}
      <div
        aria-hidden="true"
        data-hud=""
        style={ring ? { left: ring.x - HALF, bottom: ring.y - HALF } : { left: "calc(1.5rem + env(safe-area-inset-left))", bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        className={`pointer-events-none absolute h-32 w-32 rounded-full border-2 border-ivory/50 bg-charcoal/25 ${
          pulse && !ring ? "motion-safe:animate-pulse" : ""
        } ${ring ? "bg-charcoal/30" : ""}`}
      >
        <span
          className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border-2 border-ivory/70 bg-ivory/40"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
    </div>
  );
}
