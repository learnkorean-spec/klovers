import { FRIEND_SPOT, MINSU_SPOT } from "./npcs";
import { INTERACTABLES } from "./interactions";
import { ROOM } from "./world";
import { VILLAGE, type RoomId } from "./rooms";

/**
 * A small objective list for a learner's first visit — what to do next,
 * with one gentle ground marker when the target is in the current room.
 * Simple on purpose: an ordered list, what is done, and where it points.
 * Later objectives ("Visit the Vocabulary Market", "Find 3 Korean words")
 * slot into the same list.
 */
export type ObjectiveId = "meetCharacters" | "readSign" | "findHub";
export const OBJECTIVE_ORDER: ObjectiveId[] = ["meetCharacters", "readSign", "findHub"];

export interface ObjectiveProgress {
  /** Characters met ("friend", "minsu"). */
  met: string[];
  done: ObjectiveId[];
}

export function currentObjective(p: ObjectiveProgress): ObjectiveId | null {
  return OBJECTIVE_ORDER.find((o) => !p.done.includes(o)) ?? null;
}

const COURTYARD_GATE = { x: 0, z: -ROOM.halfDepth + 1.2 };
const LETTER = INTERACTABLES.find((i) => i.id === "letter-giyeok")!;
const HUB_LANE = { x: VILLAGE.halfWidth - 1.0, z: VILLAGE.hubLaneZ };

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
  if (room === "courtyard") return COURTYARD_GATE;
  if (room === "hangul-village") return HUB_LANE;
  return null;
}
