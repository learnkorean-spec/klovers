import { FRIEND_SPOT, MINSU_SPOT } from "./npcs";
import { INTERACTABLES } from "./interactions";
import { ROOM } from "./world";
import { HUB, VILLAGE, type RoomId } from "./rooms";

/**
 * A small objective list for a learner's first visit — what to do next,
 * with one gentle ground marker when the target is in the current room.
 * Simple on purpose: an ordered list, what is done, and where it points.
 * Guidance only — never learning progress: finishing one writes nothing but
 * this browser's world state. A learner whose level opens the market gets
 * one more: put the baker's sign back.
 */
export type ObjectiveId = "meetCharacters" | "readSign" | "findHub" | "helpBaker";
export const OBJECTIVE_ORDER: ObjectiveId[] = ["meetCharacters", "readSign", "findHub"];
const MARKET_ORDER: ObjectiveId[] = [...OBJECTIVE_ORDER, "helpBaker"];

export interface ObjectiveProgress {
  /** Characters met ("friend", "minsu"). */
  met: string[];
  done: ObjectiveId[];
}

export function currentObjective(p: ObjectiveProgress, marketOpen = false): ObjectiveId | null {
  return (marketOpen ? MARKET_ORDER : OBJECTIVE_ORDER).find((o) => !p.done.includes(o)) ?? null;
}

const COURTYARD_GATE = { x: 0, z: -ROOM.halfDepth + 1.2 };
const LETTER = INTERACTABLES.find((i) => i.id === "letter-giyeok")!;
const HUB_LANE = { x: VILLAGE.halfWidth - 1.0, z: VILLAGE.hubLaneZ };
const BREAD = INTERACTABLES.find((i) => i.id === "word-bread")!;
const HUB_MARKET_GATE = { x: HUB.southGates.market, z: HUB.half - 1.4 };

/** Where the marker sits for this objective in this room, if anywhere. */
export function objectiveTarget(o: ObjectiveId | null, room: RoomId, p: ObjectiveProgress): { x: number; z: number } | null {
  if (!o) return null;
  if (o === "meetCharacters") {
    if (room === "courtyard") return p.met.includes("friend") ? COURTYARD_GATE : FRIEND_SPOT;
    if (room === "hangul-village" && !p.met.includes("minsu")) return MINSU_SPOT;
    return null;
  }
  if (o === "readSign") {
    if (room === "courtyard") return COURTYARD_GATE;
    if (room === "hangul-village") return { x: LETTER.x, z: LETTER.z };
    return null;
  }
  if (o === "helpBaker") {
    if (room === "vocabulary-market") return { x: BREAD.x, z: BREAD.z };
    if (room === "hub") return HUB_MARKET_GATE;
    if (room === "hangul-village") return { x: 0, z: -VILLAGE.halfLength + 1.4 };
    if (room === "courtyard") return COURTYARD_GATE;
    return null;
  }
  if (room === "courtyard") return COURTYARD_GATE;
  if (room === "hangul-village") return HUB_LANE;
  return null;
}
