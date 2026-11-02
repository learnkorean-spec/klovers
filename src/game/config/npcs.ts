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
/** On Namsan the friend waits halfway to the tower, turned back toward the bus stop. */
export const NAMSAN_FRIEND = { x: 3.4, z: 2.6, yaw: 2.4 };

export const NPCS: NpcPlacement[] = [
  // ── Busier places (Re, 25 Oct 2026: "at least 10 people around, all different").
  // Placed by a script against each room's real layout: standing people only on free
  // floor clear of walls, doors, arrival spots and every interactive spot; walkers only
  // on straight lanes clear end to end. Each person's look comes from their id (realCast.ts).
  // courtyard
  { id: "c-x1", room: "courtyard", cast: "student1", pose: "browse", x: -9.4, z: 8.1, yaw: 3.14, phase: 1.81 },
  { id: "c-x2", room: "courtyard", cast: "readerB", pose: "talk", x: 3.85, z: -7.9, yaw: -1.75, phase: 2.71 },
  { id: "c-x3", room: "courtyard", cast: "walker", pose: "talk", x: 2.92, z: -8.07, yaw: 1.39, phase: 0.98 },
  { id: "c-x4", room: "courtyard", cast: "elder", pose: "walk", x: -3.76, z: 7.18, yaw: -1.31, path: [[-3.76, 7.18], [-8.42, 8.43]], phase: 0.76 },
  { id: "c-x5", room: "courtyard", cast: "auntie", pose: "browse", x: 10.35, z: -6.9, yaw: -1.63, phase: 2.84 },
  { id: "c-x6", room: "courtyard", cast: "porter", pose: "walk", x: -6.4, z: 2.35, yaw: 2.69, path: [[-6.4, 2.35], [-3.7, -3.15]], phase: 1.35 },
  // hangul-village
  { id: "hv-x1", room: "hangul-village", cast: "shopper", pose: "browse", x: -4.15, z: -14.15, yaw: -0.37, phase: 2.51 },
  { id: "hv-x2", room: "hangul-village", cast: "readerB", pose: "talk", x: 3.6, z: -13.9, yaw: -1.22, phase: 2.42 },
  { id: "hv-x3", room: "hangul-village", cast: "walker", pose: "talk", x: 2.71, z: -13.57, yaw: 1.93, phase: 1.66 },
  // vocabulary-market
  { id: "vm-x1", room: "vocabulary-market", cast: "readerA", pose: "browse", x: 4.6, z: -7.15, yaw: -1.57, phase: 2.67 },
  { id: "vm-x2", room: "vocabulary-market", cast: "student2", pose: "talk", x: 0.85, z: 5.6, yaw: -2.36, phase: 1.1 },
  { id: "vm-x3", room: "vocabulary-market", cast: "auntie", pose: "talk", x: 0.18, z: 4.92, yaw: 0.78, phase: 2.58 },
  { id: "vm-x4", room: "vocabulary-market", cast: "readerB", pose: "walk", x: 7.1, z: 7.1, yaw: -1.54, path: [[7.1, 7.1], [2.96, 7.24]], phase: 2.4 },
  { id: "vm-x5", room: "vocabulary-market", cast: "walker", pose: "browse", x: -7.4, z: 7.35, yaw: 1.74, phase: 0.73 },
  { id: "vm-x6", room: "vocabulary-market", cast: "student2", pose: "walk", x: 1.85, z: -0.65, yaw: 0.69, path: [[1.85, -0.65], [4.04, 1.99]], phase: 1.06 },
  // hub
  { id: "h-x1", room: "hub", cast: "readerA", pose: "browse", x: 10.35, z: -8.65, yaw: -2.99, phase: 1.8 },
  { id: "h-x2", room: "hub", cast: "porter", pose: "talk", x: 2.1, z: -6.65, yaw: -2.67, phase: 2.13 },
  { id: "h-x3", room: "hub", cast: "readerA", pose: "talk", x: 1.67, z: -7.5, yaw: 0.47, phase: 2.96 },
  { id: "h-x4", room: "hub", cast: "vendor", pose: "walk", x: -7.9, z: 9.35, yaw: 3.03, path: [[-7.9, 9.35], [-7.22, 3.23]], phase: 0.14 },
  { id: "h-x5", room: "hub", cast: "student1", pose: "browse", x: 8.35, z: 8.6, yaw: 0, phase: 0.26 },
  // klovers-house
  { id: "kh-x1", room: "klovers-house", cast: "student1", pose: "browse", x: -2.15, z: 1.85, yaw: 1.75, phase: 0.06 },
  { id: "kh-x2", room: "klovers-house", cast: "friendA", pose: "talk", x: 2.35, z: -4.65, yaw: 0.07, phase: 0.76 },
  { id: "kh-x3", room: "klovers-house", cast: "shopper", pose: "talk", x: 2.42, z: -3.7, yaw: 3.22, phase: 1.05 },
  { id: "kh-x4", room: "klovers-house", cast: "readerB", pose: "walk", x: 4.1, z: 5.1, yaw: -2.77, path: [[4.1, 5.1], [1.91, -0.44]], phase: 1.36 },
  { id: "kh-x5", room: "klovers-house", cast: "readerA", pose: "browse", x: -6.15, z: -5.15, yaw: 1.77, phase: 1.38 },
  { id: "kh-x6", room: "klovers-house", cast: "elder", pose: "talk", x: 2.35, z: 0.85, yaw: 2.5, phase: 0.78 },
  { id: "kh-x7", room: "klovers-house", cast: "readerA", pose: "talk", x: 2.92, z: 0.09, yaw: 5.64, phase: 1.57 },
  { id: "kh-x8", room: "klovers-house", cast: "student2", pose: "walk", x: -2.15, z: -2.9, yaw: -0.03, path: [[-2.15, -2.9], [-2.26, 0.27]], phase: 1.18 },
  { id: "kh-x9", room: "klovers-house", cast: "shopper", pose: "browse", x: 6.35, z: -5.15, yaw: -1.73, phase: 0.91 },
  { id: "kh-x10", room: "klovers-house", cast: "elder", pose: "walk", x: 0.35, z: -1.9, yaw: 1.34, path: [[0.35, -1.9], [3.64, -1.14]], phase: 1.1 },
  // culture-street
  { id: "cs-x1", room: "culture-street", cast: "walker", pose: "browse", x: 4.35, z: 11.6, yaw: 3.04, phase: 2.97 },
  { id: "cs-x2", room: "culture-street", cast: "vendor", pose: "talk", x: 2.35, z: 5.6, yaw: 0.95, phase: 1.06 },
  { id: "cs-x3", room: "culture-street", cast: "student1", pose: "talk", x: 3.12, z: 6.15, yaw: 4.09, phase: 0.31 },
  { id: "cs-x4", room: "culture-street", cast: "student2", pose: "walk", x: -4.15, z: -7.4, yaw: 0.44, path: [[-4.15, -7.4], [-1.85, -2.47]], phase: 1.21 },
  { id: "cs-x5", room: "culture-street", cast: "readerA", pose: "browse", x: -3.4, z: -12.15, yaw: -0.82, phase: 2.68 },
  // seoul-journey
  { id: "sj-x1", room: "seoul-journey", cast: "walker", pose: "browse", x: 6.6, z: -4.9, yaw: -0.29, phase: 2.34 },
  { id: "sj-x2", room: "seoul-journey", cast: "student2", pose: "talk", x: -2.65, z: 3.35, yaw: 2.57, phase: 0.96 },
  { id: "sj-x3", room: "seoul-journey", cast: "walker", pose: "talk", x: -2.13, z: 2.55, yaw: 5.71, phase: 2.64 },
  { id: "sj-x4", room: "seoul-journey", cast: "readerB", pose: "walk", x: 2.1, z: -7.9, yaw: -1.2, path: [[2.1, -7.9], [-2.96, -5.93]], phase: 0.93 },
  { id: "sj-x5", room: "seoul-journey", cast: "auntie", pose: "browse", x: -9.15, z: -8.15, yaw: 1.28, phase: 0.52 },
  // seoul-market
  { id: "sm-x1", room: "seoul-market", cast: "readerA", pose: "browse", x: 0.6, z: 12.35, yaw: 1.57, phase: 2.22 },
  { id: "sm-x2", room: "seoul-market", cast: "elder", pose: "walk", x: -2.15, z: -1.4, yaw: 1.71, path: [[-2.15, -1.4], [3.34, -2.18]], phase: 0.12 },
  // seoul-namsan
  { id: "sn-x1", room: "seoul-namsan", cast: "friendB", pose: "browse", x: 9.35, z: 5.85, yaw: -0.39, phase: 0.81 },
  { id: "sn-x2", room: "seoul-namsan", cast: "elder", pose: "talk", x: -7.9, z: 6.85, yaw: 1.51, phase: 1.51 },
  { id: "sn-x3", room: "seoul-namsan", cast: "walker", pose: "talk", x: -6.95, z: 6.91, yaw: 4.65, phase: 2.06 },
  // conversation-cafe: customers at the empty seats, and one queueing at the counter.
  { id: "k-x1", room: "conversation-cafe", cast: "student2", pose: "sit", x: -4.82, z: -0.8, yaw: Math.PI / 2, phase: 0.4 },
  { id: "k-x2", room: "conversation-cafe", cast: "readerA", pose: "sit", x: -3.18, z: -0.8, yaw: -Math.PI / 2, phase: 1.7 },
  { id: "k-x3", room: "conversation-cafe", cast: "auntie", pose: "sit", x: 3.18, z: -0.8, yaw: Math.PI / 2, phase: 2.6 },
  { id: "k-x4", room: "conversation-cafe", cast: "elder", pose: "sit", x: 4.82, z: -0.8, yaw: -Math.PI / 2, phase: 0.9 },
  { id: "k-x5", room: "conversation-cafe", cast: "student1", pose: "sit", x: 2.38, z: 2.8, yaw: Math.PI / 2, phase: 2.1 },
  { id: "k-x6", room: "conversation-cafe", cast: "friendA", pose: "sit", x: 4.02, z: 2.8, yaw: -Math.PI / 2, phase: 1.2 },
  { id: "k-x7", room: "conversation-cafe", cast: "shopper", pose: "stand", x: -2.0, z: -3.4, yaw: Math.PI, phase: 0.6 },
  // Seoul Journey part 3, Namsan: the ticket seller, visitors at the locks and
  // the rail, someone asking the way, a grandmother on the bench.
  { id: "n-ticket", room: "seoul-namsan", cast: "barista", pose: "stand", x: -4.6, z: -7.35, yaw: 0, phase: 0.5, important: true },
  { id: "n-tourist", room: "seoul-namsan", cast: "friendB", pose: "talk", x: 6.4, z: -2.6, yaw: -2.0, phase: 1.2, important: true },
  { id: "n-tourist2", room: "seoul-namsan", cast: "friendA", pose: "stand", x: 7.2, z: -3.4, yaw: -1.6, phase: 0.3 },
  { id: "n-asker", room: "seoul-namsan", cast: "readerB", pose: "browse", x: -2.2, z: 1.6, yaw: 1.2, phase: 1.9, important: true },
  { id: "n-grandma", room: "seoul-namsan", cast: "auntie", pose: "sit", x: -8.55, z: 0.2, yaw: Math.PI / 2, phase: 0.8, important: true },
  { id: "n-viewer", room: "seoul-namsan", cast: "shopper", pose: "browse", x: 0.4, z: 6.9, yaw: 0, phase: 2.4 },
  { id: "n-walker", room: "seoul-namsan", cast: "walker", pose: "walk", x: -6.5, z: -4.2, yaw: Math.PI / 2, path: [[-6.5, -4.2], [5.5, -4.2]], phase: 1.0 },
  // Seoul Journey part 2, the market alley: a keeper in each stall, the cook
  // at the cart, an elder on the bench by the café, the barista, shoppers.
  { id: "a-fruit", room: "seoul-market", cast: "auntie", pose: "stand", x: -4.0, z: 6.5, yaw: Math.PI / 2, phase: 0.2, important: true },
  { id: "a-banchan", room: "seoul-market", cast: "elder", pose: "talk", x: 4.0, z: 6.2, yaw: -Math.PI / 2, phase: 1.1, important: true },
  { id: "a-eomuk", room: "seoul-market", cast: "porter", pose: "stand", x: 4.0, z: -5.5, yaw: -Math.PI / 2, phase: 1.6 },
  { id: "a-flowers", room: "seoul-market", cast: "readerA", pose: "stand", x: -4.0, z: -5.5, yaw: Math.PI / 2, phase: 2.2 },
  { id: "a-cook", room: "seoul-market", cast: "vendor", pose: "talk", x: 1.75, z: 0.6, yaw: -Math.PI / 2, phase: 0.4, important: true },
  { id: "a-grandpa", room: "seoul-market", cast: "elder", pose: "sit", x: -2.6, z: -10.45, yaw: 0, phase: 0.9, important: true },
  { id: "a-barista", room: "seoul-market", cast: "barista", pose: "stand", x: 1.6, z: -12.2, yaw: 0.2, phase: 1.3, important: true },
  { id: "a-walker", room: "seoul-market", cast: "walker", pose: "walk", x: -1.6, z: 5.0, yaw: Math.PI, path: [[-1.6, 5.0], [-1.6, -8.5]], phase: 0.6 },
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
