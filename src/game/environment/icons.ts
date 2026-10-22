import { PALETTE } from "../config/world";

/**
 * The world's small line drawings (a charcoal picture in a yellow disc),
 * painted on canvas: the tour boards, the Klovers House boards and their
 * cards use the same set, so a thing always has the same picture.
 */
export type WorldIcon = "live" | "talk" | "group" | "medal" | "book" | "pencil" | "repeat" | "teacher" | "card" | "test" | "globe" | "clover" | "cart" | "game" | "pen" | "cap";

const INK = PALETTE.charcoal;

/** Rounded rectangle path. */
export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A small line drawing in a yellow disc, centred at (cx, cy), radius r. */
export function drawIcon(ctx: CanvasRenderingContext2D, icon: WorldIcon, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.fillStyle = PALETTE.yellow;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = "rgba(46,46,46,0.25)";
  ctx.stroke();
  ctx.translate(cx, cy);
  const u = r / 10; // drawing units: the disc is 20 × 20
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = u * 1.1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const head = (x: number, y: number, rad: number) => {
    ctx.beginPath();
    ctx.arc(x * u, y * u, rad * u, 0, Math.PI * 2);
    ctx.fill();
  };
  const body = (x: number, y: number, w: number) => {
    ctx.beginPath();
    ctx.arc(x * u, (y + w) * u, w * u, Math.PI, 0);
    ctx.fill();
  };
  switch (icon) {
    case "live": // a video camera with a red "on air" dot
      rr(ctx, -6 * u, -3.5 * u, 8.5 * u, 7 * u, 1.4 * u);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2.5 * u, -1 * u);
      ctx.lineTo(6 * u, -3 * u);
      ctx.lineTo(6 * u, 3 * u);
      ctx.lineTo(2.5 * u, 1 * u);
      ctx.stroke();
      ctx.fillStyle = "#D7263D";
      head(-3.6, -1.2, 1.1);
      break;
    case "talk": // two speech bubbles
      rr(ctx, -6.5 * u, -5 * u, 8 * u, 5.5 * u, 2 * u);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4 * u, 0.5 * u);
      ctx.lineTo(-5 * u, 2.6 * u);
      ctx.lineTo(-2 * u, 0.5 * u);
      ctx.stroke();
      rr(ctx, -1 * u, -0.5 * u, 7.5 * u, 5 * u, 2 * u);
      ctx.fill();
      break;
    case "group": // three people
      head(-4.5, -2, 1.6);
      body(-4.5, 0.3, 3);
      head(4.5, -2, 1.6);
      body(4.5, 0.3, 3);
      ctx.fillStyle = PALETTE.yellow;
      ctx.beginPath();
      ctx.arc(0, -2.2 * u, 2.5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      head(0, -2.8, 2);
      body(0, 0.5, 3.6);
      break;
    case "medal": // a medal on a ribbon
      ctx.beginPath();
      ctx.moveTo(-3.5 * u, -6.5 * u);
      ctx.lineTo(-1 * u, -1 * u);
      ctx.moveTo(3.5 * u, -6.5 * u);
      ctx.lineTo(1 * u, -1 * u);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 2.3 * u, 3.8 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.yellow;
      ctx.font = `800 ${4.6 * u}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("1", 0, 2.5 * u);
      break;
    case "book":
      ctx.beginPath();
      ctx.moveTo(0, -3.5 * u);
      ctx.quadraticCurveTo(-3.5 * u, -5.5 * u, -6.5 * u, -4 * u);
      ctx.lineTo(-6.5 * u, 4.5 * u);
      ctx.quadraticCurveTo(-3.5 * u, 3 * u, 0, 5 * u);
      ctx.quadraticCurveTo(3.5 * u, 3 * u, 6.5 * u, 4.5 * u);
      ctx.lineTo(6.5 * u, -4 * u);
      ctx.quadraticCurveTo(3.5 * u, -5.5 * u, 0, -3.5 * u);
      ctx.lineTo(0, 5 * u);
      ctx.stroke();
      break;
    case "pencil": // a pencil over a lined page
      rr(ctx, -6 * u, -5.5 * u, 8.5 * u, 11 * u, 1 * u);
      ctx.stroke();
      for (const y of [-2.5, 0, 2.5]) {
        ctx.beginPath();
        ctx.moveTo(-4 * u, y * u);
        ctx.lineTo(0.5 * u, y * u);
        ctx.stroke();
      }
      ctx.save();
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-0.6 * u, -7.5 * u, 3 * u, 9 * u);
      ctx.beginPath();
      ctx.moveTo(-0.6 * u, 1.5 * u);
      ctx.lineTo(0.9 * u, 4 * u);
      ctx.lineTo(2.4 * u, 1.5 * u);
      ctx.fill();
      ctx.restore();
      break;
    case "repeat": // a circle of two arrows
      for (const a0 of [0, Math.PI]) {
        ctx.beginPath();
        ctx.arc(0, 0, 5 * u, a0 + 0.35, a0 + Math.PI - 0.35);
        ctx.stroke();
        const ax = Math.cos(a0 + Math.PI - 0.35) * 5 * u;
        const ay = Math.sin(a0 + Math.PI - 0.35) * 5 * u;
        const dir = a0 === 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(ax - 2 * u * dir, ay - 0.6 * u * dir);
        ctx.lineTo(ax, ay);
        ctx.lineTo(ax + 0.4 * u * dir, ay - 2.2 * u * dir);
        ctx.stroke();
      }
      break;
    case "teacher": // a person at a board with 한
      rr(ctx, -1 * u, -6 * u, 7.5 * u, 6 * u, 0.8 * u);
      ctx.stroke();
      ctx.font = `700 ${3.6 * u}px "Noto Sans KR", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("한", 2.75 * u, -2.9 * u);
      head(-4, -1.5, 1.8);
      body(-4, 1.2, 3.2);
      ctx.beginPath();
      ctx.moveTo(-2 * u, 2 * u);
      ctx.lineTo(-0.5 * u, -0.5 * u);
      ctx.stroke();
      break;
    case "card": // a bank card, crossed out
      rr(ctx, -6.5 * u, -4 * u, 13 * u, 8.5 * u, 1.4 * u);
      ctx.stroke();
      ctx.fillRect(-6.5 * u, -1.5 * u, 13 * u, 1.8 * u);
      ctx.strokeStyle = "#D7263D";
      ctx.lineWidth = u * 1.4;
      ctx.beginPath();
      ctx.moveTo(-7 * u, 6 * u);
      ctx.lineTo(7 * u, -6 * u);
      ctx.stroke();
      break;
    case "test": // a checklist
      rr(ctx, -5 * u, -6 * u, 10 * u, 12 * u, 1.2 * u);
      ctx.stroke();
      for (const y of [-2.5, 1.5]) {
        ctx.beginPath();
        ctx.moveTo(-3 * u, y * u);
        ctx.lineTo(-2 * u, (y + 1) * u);
        ctx.lineTo(-0.3 * u, (y - 1.2) * u);
        ctx.moveTo(1 * u, y * u);
        ctx.lineTo(3 * u, y * u);
        ctx.stroke();
      }
      break;
    case "clover": // a four-leaf clover: four heart-shaped leaves with a gap between
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.translate(0, -1 * u);
        ctx.rotate((k * Math.PI) / 2);
        ctx.beginPath();
        // One heart leaf, pointing at the middle.
        ctx.moveTo(0, -0.6 * u);
        ctx.bezierCurveTo(-1 * u, -3 * u, -5 * u, -3.4 * u, -4 * u, -6 * u);
        ctx.bezierCurveTo(-3.2 * u, -7.6 * u, -1 * u, -7.4 * u, -0.1 * u, -5.8 * u);
        ctx.lineTo(0.1 * u, -5.8 * u);
        ctx.bezierCurveTo(1 * u, -7.4 * u, 3.2 * u, -7.6 * u, 4 * u, -6 * u);
        ctx.bezierCurveTo(5 * u, -3.4 * u, 1 * u, -3 * u, 0, -0.6 * u);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(1.5 * u, 4 * u, 4 * u, 7 * u);
      ctx.stroke();
      break;
    case "cart": // a shopping bag
      rr(ctx, -5.5 * u, -2.5 * u, 11 * u, 9 * u, 1.2 * u);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -2.5 * u, 3 * u, Math.PI, 0);
      ctx.stroke();
      break;
    case "game": // a game controller
      rr(ctx, -7 * u, -3.5 * u, 14 * u, 8 * u, 3.5 * u);
      ctx.fill();
      ctx.strokeStyle = PALETTE.yellow;
      ctx.beginPath();
      ctx.moveTo(-4.5 * u, 0.5 * u);
      ctx.lineTo(-1.5 * u, 0.5 * u);
      ctx.moveTo(-3 * u, -1 * u);
      ctx.lineTo(-3 * u, 2 * u);
      ctx.stroke();
      ctx.fillStyle = PALETTE.yellow;
      for (const [x, y] of [
        [3, -0.6],
        [4.8, 1.2],
      ]) {
        ctx.beginPath();
        ctx.arc(x * u, y * u, 1 * u, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case "pen": // a page of writing with a pen
      rr(ctx, -5.5 * u, -6 * u, 9 * u, 12 * u, 1 * u);
      ctx.stroke();
      ctx.fillRect(-3.5 * u, -3.5 * u, 5 * u, 2 * u);
      for (const y of [0.5, 3]) {
        ctx.beginPath();
        ctx.moveTo(-3.5 * u, y * u);
        ctx.lineTo(1.5 * u, y * u);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(4.5 * u, 1 * u);
      ctx.rotate(0.5);
      ctx.fillRect(-0.9 * u, -6 * u, 1.8 * u, 8 * u);
      ctx.beginPath();
      ctx.moveTo(-0.9 * u, 2 * u);
      ctx.lineTo(0, 4 * u);
      ctx.lineTo(0.9 * u, 2 * u);
      ctx.fill();
      ctx.restore();
      break;
    case "cap": // a graduation cap
      ctx.beginPath();
      ctx.moveTo(0, -5 * u);
      ctx.lineTo(8 * u, -1.5 * u);
      ctx.lineTo(0, 2 * u);
      ctx.lineTo(-8 * u, -1.5 * u);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4.5 * u, 0.5 * u);
      ctx.lineTo(-4.5 * u, 3.5 * u);
      ctx.quadraticCurveTo(0, 6.5 * u, 4.5 * u, 3.5 * u);
      ctx.lineTo(4.5 * u, 0.5 * u);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6.5 * u, -1 * u);
      ctx.lineTo(6.5 * u, 4 * u);
      ctx.stroke();
      break;
    case "globe":
      ctx.beginPath();
      ctx.arc(0, 0, 6 * u, 0, Math.PI * 2);
      ctx.moveTo(-6 * u, 0);
      ctx.lineTo(6 * u, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.6 * u, 6 * u, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }
  ctx.restore();
}
