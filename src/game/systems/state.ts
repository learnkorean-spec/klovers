import { Vector3 } from "three";
import { CAMERA, PLAYER } from "../config/world";
import type { AnimationState } from "../player/animation";

/**
 * Per-frame mutable state shared by the player and the camera. Lives in a
 * ref, outside React, so the 60 fps loop never triggers a re-render.
 */
export interface PlayerState {
  position: Vector3;
  velocity: { x: number; z: number };
  yaw: number;
  animation: AnimationState;
  /** True during a room change: input is ignored and the body stands still. */
  frozen: boolean;
}

export interface CameraState {
  yaw: number;
  pitch: number;
  /** Zoom distance the player chose (wheel). */
  distance: number;
  /** Distance actually used this frame after wall checks. */
  currentDistance: number;
  /** Set after a teleport: the camera jumps behind the player next frame. */
  snap: boolean;
}

export function createPlayerState(): PlayerState {
  return {
    position: new Vector3(PLAYER.spawn.x, 0, PLAYER.spawn.z),
    velocity: { x: 0, z: 0 },
    yaw: PLAYER.spawnYaw,
    animation: "idle",
    frozen: false,
  };
}

export function createCameraState(): CameraState {
  return {
    // Behind the player: player faces −z, so the camera sits on +z (yaw 0).
    yaw: PLAYER.spawnYaw - Math.PI,
    pitch: CAMERA.startPitch,
    distance: CAMERA.distance,
    currentDistance: CAMERA.distance,
    snap: false,
  };
}
