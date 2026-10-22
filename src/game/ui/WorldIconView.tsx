import { useEffect, useRef } from "react";
import { drawIcon, type WorldIcon } from "../environment/icons";

/** A world icon (environment/icons) as a crisp little picture in the web UI. */
export default function WorldIconView({ icon, size = 56 }: { icon: WorldIcon; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
    ctx.clearRect(0, 0, c.width, c.height);
    drawIcon(ctx, icon, c.width / 2, c.height / 2, c.width / 2 - 2 * dpr);
  }, [icon, size]);
  return <canvas ref={ref} aria-hidden="true" style={{ width: size, height: size }} />;
}
