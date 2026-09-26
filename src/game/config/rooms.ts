import { BOUNDS, box, CAMERA_COLLIDERS, COLLIDERS, PLAYER, ROOM, type Box2 } from "./world";

/**
 * KLOVERS World — rooms and the doors between them.
 *
 * Each room is a small walkable area with its own bounds, colliders and
 * spawn points. Portals are floor zones: walking into an open one moves the
 * learner to the linked room; a closed one only shows a notice.
 *
 * Story placement (src/config/klovers-world.ts):
 * - courtyard      → originStory.discovery (the egg sleeps here)
 * - hangul-village → worlds[0] "hangul-village", unlockRule
 *                    "initial_learning_world": open to every learner.
 * The next world, Vocabulary Market, unlocks only on a real milestone
 * ("core_hangul_milestone_completed"), so its gate stays shut until that
 * world is built AND wired to real learner data. Never open it for free.
 */

export type RoomId = "courtyard" | "hangul-village";

export interface Spawn {
  x: number;
  z: number;
  /** Facing (three.js rotation.y): π looks toward −z, 0 toward +z. */
  yaw: number;
}

export type Portal =
  | { id: string; kind: "door"; zone: Box2; to: RoomId; arrive: string }
  | { id: string; kind: "closed"; zone: Box2; notice: "marketClosed" };

export interface RoomLayout {
  id: RoomId;
  /** Matching world id in KLOVERS_WORLD.worlds, if the room is a canon world. */
  canonWorldId?: string;
  bounds: Box2;
  colliders: Box2[];
  /** Tall colliders only — the camera may pass over low furniture. */
  cameraColliders: Box2[];
  spawns: Record<string, Spawn>;
  portals: Portal[];
  /** Half-size of the sun's shadow box, metres. */
  shadowExtent: number;
}

/* ─────────────────────────── Courtyard ─────────────────────────── */

const COURTYARD: RoomLayout = {
  id: "courtyard",
  bounds: BOUNDS,
  colliders: COLLIDERS,
  cameraColliders: CAMERA_COLLIDERS,
  spawns: {
    start: { x: PLAYER.spawn.x, z: PLAYER.spawn.z, yaw: PLAYER.spawnYaw },
    // Just inside the north gate, facing back into the courtyard (+z).
    fromVillage: { x: 0, z: -ROOM.halfDepth + 1.9, yaw: 0 },
  },
  portals: [
    {
      id: "courtyard-gate",
      kind: "door",
      zone: box(0, -ROOM.halfDepth + 0.55, 3, 1.1),
      to: "hangul-village",
      arrive: "fromCourtyard",
    },
  ],
  shadowExtent: 14,
};

/* ───────────────────────── Hangul Village ──────────────────────── */

/**
 * One village street, 10 m × 30 m, running north. Hanok houses line both
 * sides just outside the walkable street; every door carries a Hangul
 * letter. South end: the gate back to the courtyard. North end: the shut
 * gate of the Vocabulary Market.
 */
export const VILLAGE = {
  halfWidth: 5,
  halfLength: 15,
  /** Street lamp posts along both kerbs. */
  lampZ: [-10, -4, 4, 10],
  lampX: 4.1,
  lampSize: 0.28,
  well: { x: 0, z: 0, size: 1.7 },
  /** Banner arch (한글 마을) across the street; its posts are solid. */
  arch: { z: 7.5, x: 4.6, post: 0.3 },
  /** Houses: centre z of each house on both sides (5 per side). */
  houseZ: [-11.2, -5.6, 0, 5.6, 11.2],
  houseDepth: 4.6,
  houseLength: 5,
  /** First letters a learner reads (Klovers Hangul course order). */
  lettersLeft: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ"],
  lettersRight: ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅣ"],
  entranceSign: "한글 마을",
  marketSign: "시장",
} as const;

const VB: Box2 = {
  minX: -VILLAGE.halfWidth,
  maxX: VILLAGE.halfWidth,
  minZ: -VILLAGE.halfLength,
  maxZ: VILLAGE.halfLength,
};

const lamps = VILLAGE.lampZ.flatMap((z) => [
  box(-VILLAGE.lampX, z, VILLAGE.lampSize, VILLAGE.lampSize),
  box(VILLAGE.lampX, z, VILLAGE.lampSize, VILLAGE.lampSize),
]);

const archPosts = [-1, 1].map((sx) => box(sx * VILLAGE.arch.x, VILLAGE.arch.z, VILLAGE.arch.post, VILLAGE.arch.post));

const HANGUL_VILLAGE: RoomLayout = {
  id: "hangul-village",
  canonWorldId: "hangul-village",
  bounds: VB,
  colliders: [box(VILLAGE.well.x, VILLAGE.well.z, VILLAGE.well.size, VILLAGE.well.size), ...lamps, ...archPosts],
  cameraColliders: [...lamps, ...archPosts],
  spawns: {
    // Just through the south gate, facing up the street (−z).
    fromCourtyard: { x: 0, z: VILLAGE.halfLength - 2.2, yaw: Math.PI },
  },
  portals: [
    {
      id: "village-back-gate",
      kind: "door",
      zone: box(0, VILLAGE.halfLength - 0.55, 3, 1.1),
      to: "courtyard",
      arrive: "fromVillage",
    },
    {
      id: "market-gate",
      kind: "closed",
      zone: box(0, -VILLAGE.halfLength + 0.9, 3.4, 1.8),
      notice: "marketClosed",
    },
  ],
  shadowExtent: 18,
};

export const ROOMS: Record<RoomId, RoomLayout> = {
  courtyard: COURTYARD,
  "hangul-village": HANGUL_VILLAGE,
};

/** The portal whose zone contains the point, if any (first match wins). */
export function findPortal(x: number, z: number, portals: Portal[]): Portal | undefined {
  return portals.find((p) => x >= p.zone.minX && x <= p.zone.maxX && z >= p.zone.minZ && z <= p.zone.maxZ);
}
