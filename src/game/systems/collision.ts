import type { Box2 } from "../config/world";

/**
 * Circle-vs-box collision on the floor plane (x/z).
 *
 * The player is a vertical capsule, so a circle on the ground is an exact
 * enough footprint for walls and furniture. No physics engine: the lobby is
 * static, and this runs in well under a millisecond per frame.
 */

export interface Vec2 {
  x: number;
  z: number;
}

/** Pushes a circle out of one box. Returns true if it moved the circle. */
export function pushOutOfBox(p: Vec2, radius: number, b: Box2): boolean {
  const cx = Math.min(Math.max(p.x, b.minX), b.maxX);
  const cz = Math.min(Math.max(p.z, b.minZ), b.maxZ);
  const dx = p.x - cx;
  const dz = p.z - cz;
  const distSq = dx * dx + dz * dz;

  if (distSq >= radius * radius) return false;

  if (distSq > 1e-12) {
    // Centre is outside the box: push along the closest-point normal.
    const dist = Math.sqrt(distSq);
    const push = radius - dist;
    p.x += (dx / dist) * push;
    p.z += (dz / dist) * push;
    return true;
  }

  // Centre is inside the box (only after a very large step): leave by the
  // nearest face.
  const exits = [
    { d: p.x - b.minX + radius, x: b.minX - radius, z: p.z },
    { d: b.maxX - p.x + radius, x: b.maxX + radius, z: p.z },
    { d: p.z - b.minZ + radius, x: p.x, z: b.minZ - radius },
    { d: b.maxZ - p.z + radius, x: p.x, z: b.maxZ + radius },
  ];
  exits.sort((a, c) => a.d - c.d);
  p.x = exits[0].x;
  p.z = exits[0].z;
  return true;
}

/** Keeps a circle fully inside the room bounds. */
export function clampToBounds(p: Vec2, radius: number, bounds: Box2): void {
  p.x = Math.min(Math.max(p.x, bounds.minX + radius), bounds.maxX - radius);
  p.z = Math.min(Math.max(p.z, bounds.minZ + radius), bounds.maxZ - radius);
}

/**
 * Resolves a proposed position against every collider and the room bounds.
 * Mutates and returns `p`. A few passes settle corners where two boxes meet.
 */
export function resolveCollisions(p: Vec2, radius: number, colliders: Box2[], bounds: Box2): Vec2 {
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const b of colliders) {
      if (pushOutOfBox(p, radius, b)) moved = true;
    }
    clampToBounds(p, radius, bounds);
    if (!moved) break;
  }
  return p;
}

/** True if a point lies inside any box or outside the bounds (camera check). */
export function isBlocked(x: number, z: number, pad: number, colliders: Box2[], bounds: Box2): boolean {
  if (x < bounds.minX + pad || x > bounds.maxX - pad || z < bounds.minZ + pad || z > bounds.maxZ - pad) {
    return true;
  }
  for (const b of colliders) {
    if (x > b.minX - pad && x < b.maxX + pad && z > b.minZ - pad && z < b.maxZ + pad) return true;
  }
  return false;
}
