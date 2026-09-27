import { useEffect, useRef, useState } from "react";
import { resetTouchStick, touchStick } from "../systems/touchInput";

/**
 * Transparent thumb-stick for touch screens, bottom-left. Writes into the
 * shared touchStick the player reads every frame; lets go → stops. Kept on
 * the physical left in both languages: the 3D world is never mirrored.
 */
export default function Joystick({ label }: { label: string }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);
  const R = 48;

  useEffect(() => resetTouchStick, []);

  const move = (clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    touchStick.x = dx / R;
    touchStick.y = -dy / R;
  };
  const end = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    resetTouchStick();
  };

  return (
    <div
      ref={base}
      role="application"
      aria-label={label}
      className="pointer-events-auto absolute bottom-6 left-6 h-32 w-32 touch-none select-none rounded-full border-2 border-ivory/50 bg-charcoal/25"
      onPointerDown={(e) => {
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) move(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border-2 border-ivory/70 bg-ivory/40"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
