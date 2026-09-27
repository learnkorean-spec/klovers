/**
 * Per-frame story state shared by the egg, Cluby and the scene director.
 * Lives in a ref (outside React), like the player state.
 *
 * Canon guard: the egg only goes past "dormant" when the learner's own
 * progress has already hatched Cluby (the dashboard's real egg stage, see
 * lib/clubyAwake.ts) — or for an admin preview. Walking up to it never
 * hatches anything by itself.
 */
export type EggPhase = "dormant" | "stirring" | "hatching" | "open";
export type ClubyMode = "hidden" | "emerge" | "follow";

export interface StoryState {
  egg: EggPhase;
  /** performance.now() when the hatch started. */
  eggT0: number;
  /** Inspected: the warm light round the egg brightens until then (the egg itself stays still). */
  eggPulseUntil: number;
  cluby: {
    mode: ClubyMode;
    x: number;
    y: number;
    z: number;
    yaw: number;
    /** performance.now() when he emerged. */
    t0: number;
    /** Look (and lean) toward this point for a moment — "this way". */
    look: { x: number; z: number } | null;
    /** A happy hop plays until this time (performance.now()). */
    hopUntil: number;
    /** Spoken to: turns to the learner until this time. */
    ackUntil: number;
  };
}

export function createStoryState(hatched: boolean): StoryState {
  return {
    egg: hatched ? "open" : "dormant",
    eggT0: 0,
    eggPulseUntil: 0,
    cluby: { mode: hatched ? "follow" : "hidden", x: 0, y: 0, z: 0, yaw: 0, t0: 0, look: null, hopUntil: 0, ackUntil: 0 },
  };
}

/** Hatch timeline, ms from the start (whole sequence ≈ 8 s). */
export const HATCH = {
  crackAt: 2300,
  emergeAt: 2900,
  helloAt: 3300,
  foundAt: 5000,
  followAt: 6500,
  endAt: 8200,
  /** Fail-safe: control always returns by this point, whatever happens. */
  failSafeAt: 10000,
} as const;
