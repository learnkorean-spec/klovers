/**
 * KLOVERS World — prototype tuning and layout.
 *
 * Every number the lobby, player and camera read lives here so movement feel
 * and room layout can be tuned without touching component code.
 *
 * Story placement (src/config/klovers-world.ts, originStory.discovery): the
 * lobby is the quiet hanok courtyard where the two friends found the dormant
 * clover egg. The egg sits in the middle, still asleep. Nothing here reacts
 * to progress yet — that arrives with real learner data in a later stage.
 */

/**
 * Brand palette (Klovers Design System) plus the warm wood the brief allows.
 * Raw hex here because three.js materials cannot read Tailwind tokens; keep
 * these in step with the tokens in tailwind.config.ts / index.css.
 */
export const PALETTE = {
  yellow: "#FFFF00",
  charcoal: "#2E2E2E",
  ivory: "#FFF9EC",
  white: "#FFFFFF",
  woodWarm: "#B7875A",
  woodDark: "#6B4A33",
  /** Stone surfaces (madang, footings, lanterns) are ivory under light. */
  stone: "#FFF9EC",
  cloverGreen: "#39FF14",
} as const;

/** Half-extents of the walkable courtyard, metres. 22 m × 18 m in total. */
export const ROOM = {
  halfWidth: 11,
  halfDepth: 9,
  wallHeight: 3.2,
  wallThickness: 0.4,
} as const;

export const PLAYER = {
  radius: 0.35,
  height: 1.7,
  walkSpeed: 3.2,
  runSpeed: 6.2,
  /** How quickly velocity reaches the target speed (1/s, exponential). */
  acceleration: 10,
  /** How quickly velocity bleeds off when no key is held (1/s). */
  deceleration: 12,
  /** How quickly the body turns to face the travel direction (1/s). */
  turnRate: 12,
  spawn: { x: 0, z: 3.6 },
  /** Facing at spawn: looking toward the egg (−z). */
  spawnYaw: Math.PI,
} as const;

export const CAMERA = {
  distance: 5.2,
  minDistance: 2.4,
  maxDistance: 7.5,
  /** Height of the point the camera looks at, above the player's feet. */
  targetHeight: 1.45,
  /** Pitch limits, radians (positive looks down on the player). */
  minPitch: -0.15,
  maxPitch: 1.1,
  startPitch: 0.32,
  mouseSensitivity: 0.0028,
  followSharpness: 14,
  /** Keeps the camera this far from walls so it never clips through. */
  wallPadding: 0.25,
  fov: 55,
} as const;

/** Largest simulated step; protects collision after a tab switch or hitch. */
export const MAX_DT = 1 / 20;

/** Axis-aligned box on the floor plane, used for collision (metres). */
export interface Box2 {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const box = (cx: number, cz: number, w: number, d: number): Box2 => ({
  minX: cx - w / 2,
  maxX: cx + w / 2,
  minZ: cz - d / 2,
  maxZ: cz + d / 2,
});

/**
 * Solid furniture inside the courtyard. The Lobby renders from the same
 * list, so what you see is exactly what you collide with.
 */
export const PROPS = {
  eggPlinth: { x: 0, z: 0, w: 2.2, d: 2.2 },
  benches: [
    { x: -7, z: -5.5, w: 2.4, d: 0.7 },
    { x: 7, z: -5.5, w: 2.4, d: 0.7 },
    { x: -7, z: 5.5, w: 2.4, d: 0.7 },
    { x: 7, z: 5.5, w: 2.4, d: 0.7 },
  ],
  lanterns: [
    { x: -3.5, z: -3.5 },
    { x: 3.5, z: -3.5 },
    { x: -3.5, z: 3.5 },
    { x: 3.5, z: 3.5 },
  ],
  lanternSize: 0.6,
  /** Wooden posts along the walls (hanok columns): four bays per wall. */
  postSpacingX: 5.5,
  postSpacingZ: 4.5,
  postSize: 0.34,
} as const;

/** Hanok columns, centred on the inner wall faces (corners included). */
export const POSTS: { x: number; z: number }[] = (() => {
  const out: { x: number; z: number }[] = [];
  const { halfWidth: hw, halfDepth: hd } = ROOM;
  for (let x = -hw; x <= hw + 1e-6; x += PROPS.postSpacingX) {
    out.push({ x, z: -hd }, { x, z: hd });
  }
  for (let z = -hd + PROPS.postSpacingZ; z <= hd - PROPS.postSpacingZ + 1e-6; z += PROPS.postSpacingZ) {
    out.push({ x: -hw, z }, { x: hw, z });
  }
  return out;
})();

/** All static colliders in the lobby, walls excluded (walls are the bounds). */
export const COLLIDERS: Box2[] = [
  box(PROPS.eggPlinth.x, PROPS.eggPlinth.z, PROPS.eggPlinth.w, PROPS.eggPlinth.d),
  ...PROPS.benches.map((b) => box(b.x, b.z, b.w, b.d)),
  ...PROPS.lanterns.map((l) => box(l.x, l.z, PROPS.lanternSize, PROPS.lanternSize)),
  ...POSTS.map((p) => box(p.x, p.z, PROPS.postSize, PROPS.postSize)),
];

/** Tall colliders only (posts): the camera may pass over benches and plinth. */
export const CAMERA_COLLIDERS: Box2[] = POSTS.map((p) => box(p.x, p.z, PROPS.postSize, PROPS.postSize));

/** Walkable bounds: the inner wall faces. */
export const BOUNDS: Box2 = {
  minX: -ROOM.halfWidth,
  maxX: ROOM.halfWidth,
  minZ: -ROOM.halfDepth,
  maxZ: ROOM.halfDepth,
};
