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
/**
 * The other learner leads the café and Culture Street with the learner
 * (canon leadCharacters): waiting by the counter to order together, and at
 * the start of the street, ready to walk it together.
 */
export const CAFE_FRIEND = { x: 3.7, z: -3.1, yaw: -0.5 };
export const CULTURE_FRIEND = { x: 1.9, z: 9.6, yaw: 0.3 };
/** Seoul Journey's leads are both learners and Cluby (canon): the friend waits at the corner. */
export const SEOUL_FRIEND = { x: -2.0, z: 6.4, yaw: 0.5 };
/** In the market alley (Seoul part 2) the friend waits under the entrance arch. */
export const ALLEY_FRIEND = { x: 1.5, z: 8.4, yaw: -2.5 };

export const NPCS: NpcPlacement[] = [
  // Seoul Journey part 2, the market alley: a keeper in each stall, the cook
  // at the cart, an elder on the bench by the café, the barista, shoppers.
  { id: "a-fruit", room: "seoul-market", cast: "auntie", pose: "stand", x: -4.0, z: 6.5, yaw: Math.PI / 2, phase: 0.2, important: true },
  { id: "a-banchan", room: "seoul-market", cast: "elder", pose: "talk", x: 4.0, z: 6.2, yaw: -Math.PI / 2, phase: 1.1, important: true },
  { id: "a-eomuk", room: "seoul-market", cast: "porter", pose: "stand", x: 4.0, z: -5.5, yaw: -Math.PI / 2, phase: 1.6 },
  { id: "a-flowers", room: "seoul-market", cast: "readerA", pose: "stand", x: -4.0, z: -5.5, yaw: Math.PI / 2, phase: 2.2 },
  { id: "a-cook", room: "seoul-market", cast: "vendor", pose: "talk", x: 1.75, z: 0.6, yaw: -Math.PI / 2, phase: 0.4, important: true },
  { id: "a-grandpa", room: "seoul-market", cast: "elder", pose: "sit", x: -2.6, z: -10.45, yaw: 0, phase: 0.9, important: true },
  { id: "a-barista", room: "seoul-market", cast: "barista", pose: "stand", x: 1.6, z: -12.2, yaw: 0.2, phase: 1.3, important: true },
  { id: "a-walker", room: "seoul-market", cast: "walker", pose: "walk", x: -1.6, z: 7.5, yaw: Math.PI, path: [[-1.6, 7.5], [-1.6, -8.5]], phase: 0.6 },
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
  // Walks the middle of the street, clear of the tour boards' reading spots.
  { id: "v-walker", room: "hangul-village", cast: "walker", pose: "walk", x: -1.25, z: 7.4, yaw: Math.PI, path: [[-1.25, 7.4], [-1.25, -9]] },
  { id: "v-sign", room: "hangul-village", cast: "student1", pose: "browse", x: -3.7, z: 1.8, yaw: face(-3.7, 1.8, -4.7, 0.9), phase: 2.6 },
  { id: "v-bench", room: "hangul-village", cast: "readerB", pose: "sitRead", x: 3.95, z: 7.1, yaw: -Math.PI / 2, phase: 1.4 },

  // KLOVERS Hub: friends chatting at the pillar, two on a bench, someone
  // crossing the square, someone at the notice board.
  { id: "h-talk-1", room: "hub", cast: "friendA", pose: "drink", x: 2.4, z: 3.3, yaw: face(2.4, 3.3, 3.2, 2.6), phase: 0.5 },
  { id: "h-talk-2", room: "hub", cast: "friendB", pose: "talk", x: 3.2, z: 2.6, yaw: face(3.2, 2.6, 2.4, 3.3), phase: 1.7 },
  { id: "h-bench-1", room: "hub", cast: "student1", pose: "sitRead", x: -9.75, z: -0.25, yaw: Math.PI / 2, phase: 0.9 },
  { id: "h-bench-2", room: "hub", cast: "readerA", pose: "sit", x: -9.75, z: 0.8, yaw: Math.PI / 2 - 0.35, phase: 2.4 },
  { id: "h-walker", room: "hub", cast: "shopper", pose: "walk", x: -6, z: -4.6, yaw: Math.PI / 2, path: [[-6, -4.6], [6, -4.6]], phase: 3 },

  // Vocabulary Market: two stall keepers, a shopper at the rice stall, a
  // porter with a crate.
  // The baker keeps the bread stall, whose sign has fallen; the clothes
  // seller greets whoever stops at his counter.
  { id: "m-keeper-1", room: "vocabulary-market", cast: "auntie", pose: "stand", x: -8.15, z: -4.5, yaw: Math.PI / 2, phase: 0.2 },
  { id: "m-keeper-2", room: "vocabulary-market", cast: "vendor", pose: "talk", x: 8.15, z: 0.9, yaw: -Math.PI / 2, phase: 1.3 },
  { id: "m-shopper", room: "vocabulary-market", cast: "shopper", pose: "browse", x: -5.35, z: -0.2, yaw: -Math.PI / 2, phase: 2.1 },
  { id: "m-porter", room: "vocabulary-market", cast: "porter", pose: "carry", x: -4.4, z: -3.4, yaw: Math.PI / 2, path: [[-4.4, -3.4], [2.8, -3.4]] },

  // Culture Street: an elder in a doorway, a cook at the food stall, a
  // diner at the table, the hanbok seller, a neighbour dressed for 설날.
  { id: "c-elder", room: "culture-street", cast: "elder", pose: "stand", x: -3.9, z: 7.4, yaw: Math.PI / 2, phase: 0.4 },
  { id: "c-cook", room: "culture-street", cast: "auntie", pose: "stand", x: -4.65, z: -0.6, yaw: Math.PI / 2, phase: 1.1 },
  { id: "c-diner", room: "culture-street", cast: "student1", pose: "sit", x: 3.85, z: -2.6, yaw: -Math.PI / 2, phase: 2.2 },
  { id: "c-seller", room: "culture-street", cast: "vendor", pose: "talk", x: 4.55, z: -5.6, yaw: -Math.PI / 2, phase: 0.8 },
  { id: "c-neighbour", room: "culture-street", cast: "friendB", pose: "talk", x: 1.4, z: -10.3, yaw: 0, phase: 1.9 },

  // Seoul Journey: a station attendant by the subway steps, a man asking
  // the way, someone waiting at the bus stop, the restaurant owner, and a
  // commuter walking along the pavement.
  { id: "s-attendant", room: "seoul-journey", cast: "vendor", pose: "stand", x: -4.4, z: -4.0, yaw: 0.6, phase: 0.3 },
  { id: "s-asker", room: "seoul-journey", cast: "student2", pose: "browse", x: 3.2, z: 3.6, yaw: -Math.PI / 2, phase: 1.4 },
  { id: "s-busstop", room: "seoul-journey", cast: "readerB", pose: "sitRead", x: -8.75, z: 4.2, yaw: Math.PI / 2, phase: 2.0 },
  { id: "s-owner", room: "seoul-journey", cast: "auntie", pose: "talk", x: 9.0, z: 6.0, yaw: -Math.PI / 2, phase: 0.9 },
  // Along the north pavement, never across the road (the taxi uses it).
  { id: "s-commuter", room: "seoul-journey", cast: "walker", pose: "walk", x: -2.3, z: -4.45, yaw: Math.PI / 2, path: [[-2.3, -4.45], [5.4, -4.45]], phase: 1.7 },

  // Conversation Café: a barista, two friends at a table.
  { id: "k-barista", room: "conversation-cafe", cast: "barista", pose: "talk", x: 0.9, z: -5.55, yaw: 0, phase: 0.6 },
  { id: "k-table-1", room: "conversation-cafe", cast: "friendA", pose: "sit", x: -4.02, z: 2.8, yaw: Math.PI / 2, phase: 1.2 },
  { id: "k-table-2", room: "conversation-cafe", cast: "friendB", pose: "sit", x: -2.38, z: 2.8, yaw: -Math.PI / 2, phase: 2.3 },
];

/** Colliders for people who never move (walkers are left to pass). */
export function npcColliderSpots(room: RoomId): { x: number; z: number }[] {
  return NPCS.filter((n) => n.room === room && !n.path && n.pose !== "sit" && n.pose !== "sitRead").map((n) => ({ x: n.x, z: n.z }));
}
