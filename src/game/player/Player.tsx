import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { RoomLayout } from "../config/rooms";
import { MAX_DT, PLAYER } from "../config/world";
import { resolveCollisions } from "../systems/collision";
import { angleDelta, damp, NO_INPUT, stepVelocity, stepYaw, stickDirection, wishDirection, yawFromDirection, type MoveInput } from "../systems/movement";
import { touchStick } from "../systems/touchInput";
import type { CameraState, PlayerState } from "../systems/state";
import { resolveAnimation } from "./animation";
import ShadowBlob from "../npc/ShadowBlob";
import LearnerAvatar from "./LearnerAvatar";
import type { AvatarId } from "./characters";

interface PlayerProps {
  input: MutableRefObject<MoveInput>;
  player: MutableRefObject<PlayerState>;
  camera: MutableRefObject<CameraState>;
  layout: RoomLayout;
  avatar: AvatarId;
  /** Tap-to-go reached its sign (the page then uses it). */
  onArrive?: (id: string) => void;
}

/**
 * Moves the player each frame: camera-relative input → smoothed velocity →
 * collision → position, then turns the body toward the travel direction.
 *
 * Runs before the camera (priority −2 vs −1) so the camera always follows
 * this frame's position. Negative priorities keep R3F's automatic rendering.
 */
export default function Player({ input, player, camera, layout, avatar, onArrive }: PlayerProps) {
  const root = useRef<Group>(null);
  const arrive = useRef(onArrive);
  arrive.current = onArrive;
  /** Tap-to-go: progress check, so a walk blocked by a wall gives up. */
  /** Hop: height above the floor and upward speed. */
  const hop = useRef({ y: 0, vy: 0 });
  const auto = useRef<{ goal: object | null; t: number; best: number; detour: number; side: number; tries: number }>({ goal: null, t: 0, best: Infinity, detour: 0, side: 1, tries: 0 });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, MAX_DT);
    const p = player.current;
    // Frozen (a room change or a story moment): the learner is placed, not
    // moved. No collision pass either — during a room swap the new position
    // can meet the previous room's walls for a frame, and resolving that
    // would fling the learner across the new room on arrival.
    if (p.frozen) {
      p.velocity = { x: 0, z: 0 };
      p.animation = "idle";
      if (root.current) {
        root.current.position.set(p.position.x, 0, p.position.z);
        root.current.rotation.y = p.yaw;
        const c = camera.current;
        root.current.visible = !(c.pov && !c.focus && c.yawTarget === null);
      }
      return;
    }
    const still = p.paused;
    const keys = still ? NO_INPUT : input.current;

    let wish = wishDirection(keys, camera.current.yaw);
    let targetSpeed: number = keys.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    if (wish.x === 0 && wish.z === 0 && !still) {
      // Touch joystick: a light push walks, a full push runs.
      const st = stickDirection(touchStick.x, touchStick.y, camera.current.yaw);
      if (st.strength > 0) {
        wish = { x: st.x, z: st.z };
        targetSpeed = st.strength > 0.92 ? PLAYER.runSpeed : PLAYER.walkSpeed * Math.max(0.45, st.strength);
      }
    }
    // Tap-to-go: any input of the learner's own takes over at once.
    const goal = p.autoTarget;
    if (goal && (wish.x !== 0 || wish.z !== 0 || still)) p.autoTarget = null;
    else if (goal) {
      const dx = goal.x - p.position.x;
      const dz = goal.z - p.position.z;
      const d = Math.hypot(dx, dz);
      const a = auto.current;
      if (a.goal !== goal) {
        a.goal = goal;
        a.best = Infinity;
        a.t = 0;
        a.detour = 0;
        a.tries = 0;
      }
      if (d < a.best - 0.15) {
        a.best = d;
        a.t = 0;
      } else a.t += dt;
      // Blocked (a table, a dais): step round it sideways for a moment, the
      // other way the next time; give up after a few tries.
      if (a.t > 0.45 && a.detour <= 0) {
        a.tries += 1;
        if (a.tries % 2 === 0) a.side = -a.side;
        a.detour = 0.8;
        a.t = 0;
      }
      if (d <= goal.stop || a.tries > 4) {
        // There (or truly stuck): face it and hand over.
        p.autoTarget = null;
        if (d > 0.05) p.yaw = yawFromDirection(dx, dz);
        if (d <= goal.stop + 0.8) arrive.current?.(goal.id);
      } else if (a.detour > 0) {
        a.detour -= dt;
        if (a.detour <= 0) {
          a.t = 0;
          a.best = d;
        }
        const sx = (-dz / d) * a.side * 0.9 + (dx / d) * 0.35;
        const sz = (dx / d) * a.side * 0.9 + (dz / d) * 0.35;
        const m = Math.hypot(sx, sz);
        wish = { x: sx / m, z: sz / m };
        targetSpeed = PLAYER.walkSpeed;
      } else {
        wish = { x: dx / d, z: dz / d };
        targetSpeed = PLAYER.walkSpeed;
      }
    }
    p.velocity = stepVelocity(p.velocity, wish, targetSpeed, PLAYER.acceleration, PLAYER.deceleration, dt);

    const next = { x: p.position.x + p.velocity.x * dt, z: p.position.z + p.velocity.z * dt };
    resolveCollisions(next, PLAYER.radius, layout.colliders, layout.bounds);

    // Velocity follows what actually happened, so sliding along a wall does
    // not keep "pushing" into it and the walk cycle matches real motion.
    // A collision may only take speed away, never add it.
    if (dt > 0) {
      const vx = (next.x - p.position.x) / dt;
      const vz = (next.z - p.position.z) / dt;
      const cap = Math.hypot(p.velocity.x, p.velocity.z);
      const m = Math.hypot(vx, vz);
      const k = m > cap && m > 0 ? cap / m : 1;
      p.velocity.x = vx * k;
      p.velocity.z = vz * k;
    }
    p.position.x = next.x;
    p.position.z = next.z;

    const speed = Math.hypot(p.velocity.x, p.velocity.z);
    if (wish.x !== 0 || wish.z !== 0) {
      p.yaw = stepYaw(p.yaw, yawFromDirection(wish.x, wish.z), PLAYER.turnRate, dt);
    }
    p.animation = resolveAnimation(speed, PLAYER.walkSpeed);
    // Space: a small hop; the camera rides along (position.y).
    const hp = hop.current;
    if (keys.jump && hp.y <= 0 && hp.vy <= 0) hp.vy = 4.4;
    if (hp.y > 0 || hp.vy > 0) {
      hp.vy -= 15 * dt;
      hp.y = Math.max(0, hp.y + hp.vy * dt);
      if (hp.y === 0) hp.vy = 0;
    }
    p.position.y = hp.y;
    // Walking by itself to a tapped sign: the view turns with the walk, so
    // the learner sees where they are going (most of all in first person).
    if (p.autoTarget && speed > 0.3) {
      const c = camera.current;
      c.yaw += angleDelta(c.yaw, p.yaw + Math.PI) * damp(3, dt);
    }

    if (root.current) {
      root.current.position.set(p.position.x, hp.y, p.position.z);
      root.current.rotation.y = p.yaw;
      // First person: the learner is the camera, so their own body is hidden.
      const c = camera.current;
      root.current.visible = !(c.pov && !c.focus && c.yawTarget === null);
    }
  }, -2);

  return (
    <group ref={root} userData={{ character: true }}>
      {/* Built from primitives to the canon look of Adam or Lina. Swap for a
          rigged GLB with the same props later (see player/animation.ts). */}
      <LearnerAvatar player={player} avatar={avatar} />
      <ShadowBlob size={0.95} />
    </group>
  );
}
