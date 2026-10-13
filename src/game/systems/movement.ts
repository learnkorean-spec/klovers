/**
 * Frame-rate independent movement maths. Pure functions, unit-tested in
 * __tests__/movement.test.ts, so the feel is identical at 30, 60 or 144 fps.
 */

export interface MoveInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  /** Space: a small hop (no gameplay, just the feel of a body in the world). */
  jump?: boolean;
}

export const NO_INPUT: MoveInput = { forward: false, back: false, left: false, right: false, run: false };

/** Exponential smoothing factor for a rate (1/s) over dt seconds. */
export const damp = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);

/**
 * World-space wish direction (unit length, or zero) from keys and camera yaw.
 * Camera yaw 0 looks toward −z; "forward" always means away from the camera.
 */
export function wishDirection(input: MoveInput, cameraYaw: number): { x: number; z: number } {
  const f = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
  const s = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (f === 0 && s === 0) return { x: 0, z: 0 };

  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);
  // forward vector (−sin, −cos), right vector (cos, −sin)
  let x = -sin * f + cos * s;
  let z = -cos * f - sin * s;
  const len = Math.hypot(x, z);
  x /= len;
  z /= len;
  return { x, z };
}

/** Moves velocity toward the target with separate acceleration / braking. */
export function stepVelocity(
  vel: { x: number; z: number },
  wish: { x: number; z: number },
  targetSpeed: number,
  acceleration: number,
  deceleration: number,
  dt: number,
): { x: number; z: number } {
  const moving = wish.x !== 0 || wish.z !== 0;
  const k = damp(moving ? acceleration : deceleration, dt);
  const tx = wish.x * targetSpeed;
  const tz = wish.z * targetSpeed;
  let x = vel.x + (tx - vel.x) * k;
  let z = vel.z + (tz - vel.z) * k;
  // Snap tiny residual drift to rest so idle is truly idle.
  if (!moving && Math.hypot(x, z) < 0.02) {
    x = 0;
    z = 0;
  }
  return { x, z };
}

/** Shortest signed difference between two angles, in (−π, π]. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/** Turns `current` toward `target` along the shortest arc. */
export function stepYaw(current: number, target: number, turnRate: number, dt: number): number {
  return current + angleDelta(current, target) * damp(turnRate, dt);
}

/** Facing yaw for a travel direction (matches three.js rotation.y). */
export const yawFromDirection = (x: number, z: number): number => Math.atan2(x, z);

/**
 * World-space direction and strength (0…1) from the touch joystick.
 * y is "push forward" (away from the camera), x is right. A small dead zone
 * keeps a resting thumb from drifting.
 */
export function stickDirection(sx: number, sy: number, cameraYaw: number, deadZone = 0.15): { x: number; z: number; strength: number } {
  const mag = Math.min(Math.hypot(sx, sy), 1);
  if (mag < deadZone) return { x: 0, z: 0, strength: 0 };
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);
  let x = -sin * sy + cos * sx;
  let z = -cos * sy - sin * sx;
  const len = Math.hypot(x, z);
  x /= len;
  z /= len;
  return { x, z, strength: (mag - deadZone) / (1 - deadZone) };
}
