import type { CastId } from "../npc/cast";
import type { Pose } from "../npc/people";
import type { RoomId } from "./rooms";

/**
 * Who stands where. Small human scenes, not scattered extras: two people
 * talking, a reader on a bench, a vendor at a cart, someone watering a pine,
 * someone walking between two places. Pure data (no three.js), so the room
 * colliders can include the people who never move.
 *
 * yaw: facing, as three.js rotation.y (0 looks toward +z, π/2 toward +x).
 */
export interface NpcPlacement {
  id: string;
  room: RoomId;
  cast: CastId;
  pose: Pose;
  x: number;
  z: number;
  yaw: number;
  /** Walkers pace between these two points. */
  path?: [[number, number], [number, number]];
  /** Phase offset so neighbours do not move in step. */
  phase?: number;
  /** Characters with a name and a line (E / talk). */
  important?: boolean;
}

const face = (fromX: number, fromZ: number, toX: number, toZ: number) => Math.atan2(toX - fromX, toZ - fromZ);

export const MINSU_SPOT = { x: -2.8, z: 9.2 };
/** The other learner waits by the egg, where the two friends found it. */
export const FRIEND_SPOT = { x: 2.9, z: 0.5 };

export const NPCS: NpcPlacement[] = [
  // Courtyard: a gardener by the pine, two students on the platform.
  { id: "c-gardener", room: "courtyard", cast: "gardener", pose: "water", x: 8.3, z: 6.3, yaw: face(8.3, 6.3, 9.4, 6.9), phase: 0.4 },
  { id: "c-bench-1", room: "courtyard", cast: "readerA", pose: "sitRead", x: -7.9, z: -4.0, yaw: 0, phase: 1.1 },
  { id: "c-bench-2", room: "courtyard", cast: "student2", pose: "sit", x: -6.9, z: -4.0, yaw: 0.25, phase: 2.2 },
  { id: "c-board", room: "courtyard", cast: "readerB", pose: "browse", x: 8.5, z: 1.8, yaw: Math.PI / 2, phase: 0.7 },

  // Hangul Village: Minsu near the first letter, two neighbours at the well,
  // a vendor by his cart, a passer-by, someone reading the ㄷ sign, a reader
  // on the bench.
  { id: "v-minsu", room: "hangul-village", cast: "minsu", pose: "talk", x: MINSU_SPOT.x, z: MINSU_SPOT.z, yaw: face(MINSU_SPOT.x, MINSU_SPOT.z, 0, 12.8), important: true },
  { id: "v-well-1", room: "hangul-village", cast: "auntie", pose: "talk", x: 1.5, z: 1.4, yaw: face(1.5, 1.4, 2.3, 2.1), phase: 0.3 },
  { id: "v-well-2", room: "hangul-village", cast: "elder", pose: "stand", x: 2.3, z: 2.1, yaw: face(2.3, 2.1, 1.5, 1.4), phase: 1.9 },
  { id: "v-vendor", room: "hangul-village", cast: "vendor", pose: "stand", x: 3.7, z: -5.2, yaw: -Math.PI / 2, phase: 0.8 },
  { id: "v-walker", room: "hangul-village", cast: "walker", pose: "walk", x: -2.3, z: 7.4, yaw: Math.PI, path: [[-2.3, 7.4], [-2.3, -9]] },
  { id: "v-sign", room: "hangul-village", cast: "student1", pose: "browse", x: -3.7, z: 1.8, yaw: face(-3.7, 1.8, -4.7, 0.9), phase: 2.6 },
  { id: "v-bench", room: "hangul-village", cast: "readerB", pose: "sitRead", x: 3.95, z: 7.1, yaw: -Math.PI / 2, phase: 1.4 },

  // KLOVERS Hub: friends chatting at the pillar, two on a bench, someone
  // crossing the square, someone at the notice board.
  { id: "h-talk-1", room: "hub", cast: "friendA", pose: "drink", x: 2.4, z: 3.3, yaw: face(2.4, 3.3, 3.2, 2.6), phase: 0.5 },
  { id: "h-talk-2", room: "hub", cast: "friendB", pose: "talk", x: 3.2, z: 2.6, yaw: face(3.2, 2.6, 2.4, 3.3), phase: 1.7 },
  { id: "h-bench-1", room: "hub", cast: "student1", pose: "sitRead", x: -8.1, z: 7.25, yaw: Math.PI, phase: 0.9 },
  { id: "h-bench-2", room: "hub", cast: "readerA", pose: "sit", x: -7.1, z: 7.25, yaw: Math.PI - 0.3, phase: 2.4 },
  { id: "h-walker", room: "hub", cast: "shopper", pose: "walk", x: -6, z: -4.6, yaw: Math.PI / 2, path: [[-6, -4.6], [6, -4.6]], phase: 3 },

  // Vocabulary Market: two stall keepers, a shopper at the rice stall, a
  // porter with a crate.
  { id: "m-keeper-1", room: "vocabulary-market", cast: "auntie", pose: "stand", x: -8.15, z: 4.5, yaw: Math.PI / 2, phase: 0.2 },
  { id: "m-keeper-2", room: "vocabulary-market", cast: "vendor", pose: "talk", x: 8.15, z: 0, yaw: -Math.PI / 2, phase: 1.3 },
  { id: "m-shopper", room: "vocabulary-market", cast: "shopper", pose: "browse", x: -5.35, z: -0.2, yaw: -Math.PI / 2, phase: 2.1 },
  { id: "m-porter", room: "vocabulary-market", cast: "porter", pose: "carry", x: 2.6, z: 6, yaw: Math.PI, path: [[2.6, 6], [2.6, -5.6]] },

  // Conversation Café: a barista, two friends at a table.
  { id: "k-barista", room: "conversation-cafe", cast: "barista", pose: "talk", x: 0.9, z: -5.55, yaw: 0, phase: 0.6 },
  { id: "k-table-1", room: "conversation-cafe", cast: "friendA", pose: "sit", x: -4.02, z: 2.8, yaw: Math.PI / 2, phase: 1.2 },
  { id: "k-table-2", room: "conversation-cafe", cast: "friendB", pose: "sit", x: -2.38, z: 2.8, yaw: -Math.PI / 2, phase: 2.3 },
];

/** Colliders for people who never move (walkers are left to pass). */
export function npcColliderSpots(room: RoomId): { x: number; z: number }[] {
  return NPCS.filter((n) => n.room === room && !n.path && n.pose !== "sit" && n.pose !== "sitRead").map((n) => ({ x: n.x, z: n.z }));
}
