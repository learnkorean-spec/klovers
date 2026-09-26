import { describe, expect, it } from "vitest";
import { BOUNDS, COLLIDERS, PLAYER, POSTS } from "../../config/world";
import { isBlocked, resolveCollisions } from "../collision";
import { angleDelta, NO_INPUT, stepVelocity, stepYaw, wishDirection } from "../movement";
import { resolveAnimation } from "../../player/animation";

const simulate = (seconds: number, fps: number, run: boolean) => {
  let v = { x: 0, z: 0 };
  const dt = 1 / fps;
  for (let t = 0; t < seconds; t += dt) {
    v = stepVelocity(v, { x: 0, z: -1 }, run ? PLAYER.runSpeed : PLAYER.walkSpeed, PLAYER.acceleration, PLAYER.deceleration, dt);
  }
  return v;
};

describe("movement", () => {
  it("forward is away from the camera for any yaw", () => {
    const d0 = wishDirection({ ...NO_INPUT, forward: true }, 0);
    expect(d0.x).toBeCloseTo(0);
    expect(d0.z).toBeCloseTo(-1);
    const d90 = wishDirection({ ...NO_INPUT, forward: true }, Math.PI / 2);
    expect(d90.x).toBeCloseTo(-1);
    expect(d90.z).toBeCloseTo(0);
    const right = wishDirection({ ...NO_INPUT, right: true }, 0);
    expect(right.x).toBeCloseTo(1);
  });

  it("diagonals are not faster than straight lines", () => {
    const d = wishDirection({ ...NO_INPUT, forward: true, right: true }, 0.7);
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1);
  });

  it("accelerates smoothly and reaches the same speed at 30 and 144 fps", () => {
    const early = simulate(0.05, 60, false);
    expect(Math.abs(early.z)).toBeGreaterThan(0);
    expect(Math.abs(early.z)).toBeLessThan(PLAYER.walkSpeed * 0.6);
    expect(simulate(0.6, 30, true).z).toBeCloseTo(simulate(0.6, 144, true).z, 1);
    expect(Math.abs(simulate(1, 60, true).z)).toBeGreaterThan(PLAYER.walkSpeed);
  });

  it("decelerates to a full stop", () => {
    let v = { x: 0, z: -PLAYER.runSpeed };
    for (let i = 0; i < 60; i++) v = stepVelocity(v, { x: 0, z: 0 }, 0, PLAYER.acceleration, PLAYER.deceleration, 1 / 60);
    expect(v).toEqual({ x: 0, z: 0 });
  });

  it("turns along the shortest arc", () => {
    expect(angleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    const y = stepYaw(3, -3, PLAYER.turnRate, 1 / 60);
    expect(y).toBeGreaterThan(3);
  });

  it("maps speed to animation states", () => {
    expect(resolveAnimation(0, PLAYER.walkSpeed)).toBe("idle");
    expect(resolveAnimation(PLAYER.walkSpeed, PLAYER.walkSpeed)).toBe("walk");
    expect(resolveAnimation(PLAYER.runSpeed, PLAYER.walkSpeed)).toBe("run");
    expect(resolveAnimation(PLAYER.runSpeed, PLAYER.walkSpeed, true)).toBe("talk");
  });
});

describe("collision", () => {
  it("never lets the player leave the courtyard", () => {
    const p = resolveCollisions({ x: 50, z: -50 }, PLAYER.radius, COLLIDERS, BOUNDS);
    expect(p.x).toBeLessThanOrEqual(BOUNDS.maxX - PLAYER.radius);
    expect(p.z).toBeGreaterThanOrEqual(BOUNDS.minZ + PLAYER.radius);
  });

  it("stops the player at the egg plinth instead of passing through", () => {
    // Walk straight at the plinth from the spawn point in small steps.
    const p = { x: 0, z: PLAYER.spawn.z };
    for (let i = 0; i < 400; i++) {
      p.z -= 0.05;
      resolveCollisions(p, PLAYER.radius, COLLIDERS, BOUNDS);
    }
    expect(p.z).toBeGreaterThan(1.1 + PLAYER.radius - 1e-6);
  });

  it("pushes a player that starts inside a box back out", () => {
    const p = resolveCollisions({ x: 0.1, z: 0.2 }, PLAYER.radius, COLLIDERS, BOUNDS);
    expect(isBlocked(p.x, p.z, PLAYER.radius - 1e-3, COLLIDERS, BOUNDS)).toBe(false);
  });

  it("spawn point is free and every column is a collider", () => {
    expect(isBlocked(PLAYER.spawn.x, PLAYER.spawn.z, PLAYER.radius, COLLIDERS, BOUNDS)).toBe(false);
    expect(POSTS.length).toBeGreaterThan(0);
    for (const post of POSTS) {
      expect(COLLIDERS.some((b) => post.x > b.minX && post.x < b.maxX && post.z > b.minZ && post.z < b.maxZ)).toBe(true);
    }
  });
});
