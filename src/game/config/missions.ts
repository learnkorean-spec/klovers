import { INTERACTABLES, type Interactable } from "./interactions";
import { ROOMS, type RoomId } from "./rooms";

/**
 * Missions — small jobs a learner chooses from a list (the "missions" card),
 * like side quests in an open-world game: each is a handful of things to
 * walk up to and use, in any order, and a few race the clock.
 *
 * Exploration only, like everything the world keeps: finishing one writes
 * this browser's world state and nothing else — never learning progress,
 * never a level, never a world unlocked (canon: progression comes from real
 * learning data only). A mission inside a world the learner's real level has
 * not opened yet is shown, locked, with what opens it.
 */
export type MissionId = "hello" | "consonants" | "vowels" | "letterRace" | "hubWalk" | "shopping" | "tour";

export interface Mission {
  id: MissionId;
  /** Where it happens (where its first step is). */
  room: RoomId;
  /** Interactable ids to use, in any order. */
  steps: string[];
  /** A race: seconds on the clock, counted only while in `room`. */
  seconds?: number;
}

export const MISSIONS: Mission[] = [
  { id: "hello", room: "courtyard", steps: ["talk-friend", "talk-minsu", "say-auntie", "say-vendor"] },
  { id: "consonants", room: "hangul-village", steps: ["letter-giyeok", "learn-nieun", "learn-digeut", "quiz-rieul", "learn-mieum"] },
  { id: "vowels", room: "hangul-village", steps: ["quiz-a", "quiz-eo", "learn-o", "quiz-u"] },
  { id: "letterRace", room: "hangul-village", steps: ["learn-nieun", "learn-digeut", "learn-o", "learn-mieum", "learn-well"], seconds: 120 },
  { id: "hubWalk", room: "hub", steps: ["learn-map", "learn-board", "quiz-sijang", "say-hub-friend"] },
  { id: "shopping", room: "vocabulary-market", steps: ["learn-mul", "learn-bap", "learn-chaek", "learn-kkot", "learn-sagwa"] },
  { id: "tour", room: "klovers-house", steps: ["info-about", "info-courses", "info-trial", "info-placement", "info-games"] },
];

const BY_ID = new Map(INTERACTABLES.map((i) => [i.id, i]));

/** The interactables of a mission (unknown ids are dropped, never thrown). */
export function missionSteps(m: Mission): Interactable[] {
  return m.steps.map((id) => BY_ID.get(id)).filter((i): i is Interactable => !!i);
}

/** Every room a mission needs: it can be played only once all are open. */
export function missionRooms(m: Mission): RoomId[] {
  return [...new Set(missionSteps(m).map((i) => i.room))];
}

/**
 * The way to `to` from `from`: the first gate to walk through (its centre),
 * by the shortest chain of open gates. Null when already there or no way.
 */
export function routeStep(from: RoomId, to: RoomId, isOpen: (r: RoomId) => boolean): { x: number; z: number; via: RoomId } | null {
  if (from === to) return null;
  const prev = new Map<RoomId, { room: RoomId; x: number; z: number }>();
  const queue: RoomId[] = [from];
  const seen = new Set<RoomId>([from]);
  while (queue.length) {
    const r = queue.shift()!;
    for (const p of ROOMS[r].portals) {
      if (seen.has(p.to) || !isOpen(p.to)) continue;
      seen.add(p.to);
      prev.set(p.to, { room: r, x: (p.zone.minX + p.zone.maxX) / 2, z: (p.zone.minZ + p.zone.maxZ) / 2 });
      if (p.to === to) {
        // Walk back to the first gate out of `from`.
        let cur: RoomId = to;
        let step = prev.get(cur)!;
        while (step.room !== from) {
          cur = step.room;
          step = prev.get(cur)!;
        }
        return { x: step.x, z: step.z, via: cur };
      }
      queue.push(p.to);
    }
  }
  return null;
}

/**
 * Where the mission marker points now: the nearest unfinished step in this
 * room, else the gate toward the room of the next unfinished one.
 */
export function missionTarget(
  m: Mission,
  done: readonly string[],
  room: RoomId,
  x: number,
  z: number,
  isOpen: (r: RoomId) => boolean,
): { x: number; z: number; id?: string } | null {
  const left = missionSteps(m).filter((i) => !done.includes(i.id));
  if (!left.length) return null;
  const here = left.filter((i) => i.room === room);
  if (here.length) {
    const best = here.reduce((a, b) => (Math.hypot(a.x - x, a.z - z) <= Math.hypot(b.x - x, b.z - z) ? a : b));
    return { x: best.x, z: best.z, id: best.id };
  }
  for (const i of left) {
    const r = routeStep(room, i.room, isOpen);
    if (r) return { x: r.x, z: r.z };
  }
  return null;
}
