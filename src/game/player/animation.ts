/**
 * Animation states for the player avatar.
 *
 * The placeholder avatar reads these to bob and lean; a future rigged GLB
 * avatar maps each state to a clip of the same name (see AVATAR_CLIPS) and
 * cross-fades between them. "talk" is reserved for NPC conversation in a later
 * stage — nothing sets it yet.
 */
export type AnimationState = "idle" | "walk" | "run" | "talk";

/** Clip names a rigged GLB/GLTF avatar is expected to export. */
export const AVATAR_CLIPS: Record<AnimationState, string> = {
  idle: "Idle",
  walk: "Walk",
  run: "Run",
  talk: "Talk",
};

export function resolveAnimation(speed: number, walkSpeed: number, talking = false): AnimationState {
  if (talking) return "talk";
  if (speed < 0.15) return "idle";
  // Past the midpoint between walk and run speed reads as running.
  return speed > walkSpeed * 1.35 ? "run" : "walk";
}
