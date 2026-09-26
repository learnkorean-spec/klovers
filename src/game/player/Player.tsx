import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { RoomLayout } from "../config/rooms";
import { MAX_DT, PLAYER } from "../config/world";
import { resolveCollisions } from "../systems/collision";
import { NO_INPUT, stepVelocity, stepYaw, wishDirection, yawFromDirection, type MoveInput } from "../systems/movement";
import type { CameraState, PlayerState } from "../systems/state";
import { resolveAnimation } from "./animation";
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
    const keys = p.frozen ? NO_INPUT : input.current;

    const wish = wishDirection(keys, camera.current.yaw);
    const targetSpeed = keys.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    p.velocity = stepVelocity(p.velocity, wish, targetSpeed, PLAYER.acceleration, PLAYER.deceleration, dt);

    const next = { x: p.position.x + p.velocity.x * dt, z: p.position.z + p.velocity.z * dt };
    resolveCollisions(next, PLAYER.radius, layout.colliders, layout.bounds);

    // Velocity follows what actually happened, so sliding along a wall does
    // not keep "pushing" into it and the walk cycle matches real motion.
    if (dt > 0) {
      p.velocity.x = (next.x - p.position.x) / dt;
      p.velocity.z = (next.z - p.position.z) / dt;
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
    </group>
  );
}
