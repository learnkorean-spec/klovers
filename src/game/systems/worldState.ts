/**
 * What the learner has already seen in KLOVERS World, kept per browser —
 * the same approach as the dashboard's Cluby flag (lib/clubyAwake.ts), so
 * there is no second progress system and nothing here is ever counted as
 * learning progress. Blocked storage simply means the world starts fresh.
 */
import type { RoomId } from "../config/rooms";
import type { ObjectiveId } from "../config/objectives";
import type { DiscoveryKey } from "../config/discoveries";

export interface WorldState {
  /** The hatch sequence has played once in the world. */
  hatchSeen: boolean;
  /** Rooms whose first-visit Cluby line has been said. */
  greeted: RoomId[];
  /** The market's bread sign, put back by naming the loaves correctly. */
  breadSign: boolean;
  /** The controls tutorial has been completed (moved and looked around). */
  tutorialDone: boolean;
  /** The welcome card has been seen. */
  welcomed: boolean;
  /** Characters greeted in the world ("friend", "minsu"). */
  met: string[];
  /** First-visit objectives finished. Orientation only, never learning progress. */
  objectivesDone: ObjectiveId[];
  /** One-time discovery notes already shown. */
  discovered: DiscoveryKey[];
  /** Room to reopen in after a trip to the site's lessons or games. */
  lastRoom: RoomId | null;
  /**
   * Korean met while exploring: market words (their stall signs go up) and
   * the village's discoverable letters. Exploration feedback only — never
   * counted as learning progress anywhere.
   */
  words: string[];
  letters: string[];
  /** Missions finished (config/missions.ts), and best race times in seconds. Exploration only. */
  missionsDone: string[];
  bestTimes: Record<string, number>;
  /** The mission being played, and the steps used so far in it. */
  mission: { id: string; done: string[] } | null;
}

const KEY = "klovers-world-state";
const EMPTY: WorldState = { hatchSeen: false, greeted: [], breadSign: false, tutorialDone: false, welcomed: false, met: [], objectivesDone: [], discovered: [], lastRoom: null, words: [], letters: [], missionsDone: [], bestTimes: {}, mission: null };

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function times(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === "object") for (const [k, n] of Object.entries(v)) if (typeof n === "number" && n > 0) out[k] = n;
  return out;
}

export function loadWorldState(): WorldState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const v = JSON.parse(raw) as Partial<WorldState>;
    return {
      hatchSeen: v.hatchSeen === true,
      greeted: Array.isArray(v.greeted) ? (v.greeted.filter((r) => typeof r === "string") as RoomId[]) : [],
      breadSign: v.breadSign === true,
      tutorialDone: v.tutorialDone === true,
      welcomed: v.welcomed === true,
      met: strings(v.met),
      objectivesDone: strings(v.objectivesDone) as ObjectiveId[],
      discovered: strings(v.discovered) as DiscoveryKey[],
      lastRoom: typeof v.lastRoom === "string" ? (v.lastRoom as RoomId) : null,
      words: strings(v.words),
      letters: strings(v.letters),
      missionsDone: strings(v.missionsDone),
      bestTimes: times(v.bestTimes),
      mission: v.mission && typeof v.mission === "object" && typeof (v.mission as { id?: unknown }).id === "string"
        ? { id: (v.mission as { id: string }).id, done: strings((v.mission as { done?: unknown }).done) }
        : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveWorldState(s: WorldState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode: this visit only */
  }
}
