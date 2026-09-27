import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { RoomLayout } from "../config/rooms";
import { MAX_DT, PLAYER } from "../config/world";
import { resolveCollisions } from "../systems/collision";
import { NO_INPUT, stepVelocity, stepYaw, stickDirection, wishDirection, yawFromDirection, type MoveInput } from "../systems/movement";
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
}

/**
 * Moves the player each frame: camera-relative input → smoothed velocity →
 * collision → position, then turns the body toward the travel direction.
 *
 * Runs before the camera (priority −2 vs −1) so the camera always follows
 * this frame's position. Negative priorities keep R3F's automatic rendering.
 */
export default function Player({ input, player, camera, layout, avatar }: PlayerProps) {
  const root = useRef<Group>(null);

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

    if (root.current) {
      root.current.position.set(p.position.x, 0, p.position.z);
      root.current.rotation.y = p.yaw;
    }
  }, -2);

  return (
    <group ref={root}>
      {/* Built from primitives to the canon look of Adam or Lina. Swap for a
          rigged GLB with the same props later (see player/animation.ts). */}
      <LearnerAvatar player={player} avatar={avatar} />
      <ShadowBlob size={0.95} />
    </group>
  );
}
