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
  /** Off the path a little, so the egg shows beside the learner, not behind. */
  spawn: { x: -1.3, z: 3.7 },
  /** Facing at spawn: looking toward the egg (−z). */
  spawnYaw: Math.PI,
} as const;

export const CAMERA = {
  /**
   * Adventure framing: the learner stands full-length in the lower-middle
   * third, and most of the frame is the place ahead. (With the old close,
   * look-far-ahead setting the feet fell below the frame.)
   */
  distance: 7.2,
  minDistance: 3.2,
  maxDistance: 9.5,
  /** Height of the point the camera looks at, above the player's feet. */
  targetHeight: 1.3,
  /** How far ahead of the learner the camera aims (keeps them low in frame). */
  lookAhead: 1.5,
  /** Pitch limits, radians (positive looks down on the player). Never top-down. */
  minPitch: -0.08,
  maxPitch: 0.6,
  /** A low adventure angle: the horizon sits just above the middle. */
  startPitch: 0.24,
  mouseSensitivity: 0.0028,
  followSharpness: 14,
  /** Keeps the camera this far from walls so it never clips through. */
  wallPadding: 0.35,
  fov: 52,
  /** Short landscape phones see a little more to each side. */
  fovLandscapePhone: 58,
  /** Wider view on portrait screens (phones held upright). */
  fovPortrait: 66,
  /** Portrait screens also pull the camera back a little. */
  portraitDistance: 1.12,
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
 * The courtyard's furniture, in one place: the renderer (environment/Lobby)
 * and the collision lists below both read it, so what you see is exactly
 * what you bump into. The egg platform is octagonal; its collider is the
 * square that circumscribes it.
 */
export const PROPS = {
  eggPlinth: { x: 0, z: 0, w: 2.8 },
  lanterns: [
    { x: -2.6, z: -6.3 },
    { x: 2.6, z: -6.3 },
    { x: -3.4, z: 3.0 },
    { x: 3.4, z: 3.0 },
  ],
  lanternSize: 0.55,
  /** Raised wooden platforms to sit on (pyeongsang). */
  platforms: [
    { x: -7.4, z: -4.6, w: 2.4, d: 1.6 },
    { x: 7.4, z: -4.6, w: 2.4, d: 1.6 },
  ],
  pines: [
    { x: -9.3, z: 6.8, s: 1.1 },
    { x: 9.2, z: -7.2, s: 1.25 },
    { x: 9.4, z: 6.9, s: 0.95 },
  ],
  /** Notice board (게시판) against the east hall. */
  board: { x: 9.95, z: 1.8 },
  pots: [
    { x: -4.9, z: -8.3, s: 1 },
    { x: -4.1, z: -8.5, s: 0.75 },
    { x: 10.0, z: 2.9, s: 0.9 },
  ],
  /**
   * Planting beds (low stone kerb, moss, shrubs, grass): the flowering hero
   * tree in the north-west corner, green beds against both halls.
   */
  beds: [
    { x: -8.5, z: -7.8, w: 4.4, d: 2.0, blossom: true },
    { x: -10.25, z: 1.0, w: 1.3, d: 3.6, blossom: false },
    { x: 10.25, z: -2.4, w: 1.3, d: 3.2, blossom: false },
  ],
} as const;

/** Everything tall enough to stop the camera, as points (tests use this). */
export const SOLID_POINTS: { x: number; z: number }[] = [...PROPS.lanterns, ...PROPS.pines, { x: -8.9, z: -7.9 }];

/** All static colliders in the courtyard (walls are the bounds). */
export const COLLIDERS: Box2[] = [
  box(PROPS.eggPlinth.x, PROPS.eggPlinth.z, PROPS.eggPlinth.w, PROPS.eggPlinth.w),
  ...PROPS.platforms.map((b) => box(b.x, b.z, b.w, b.d)),
  ...PROPS.lanterns.map((l) => box(l.x, l.z, PROPS.lanternSize, PROPS.lanternSize)),
  ...PROPS.pines.map((t) => box(t.x, t.z, 0.5, 0.5)),
  ...PROPS.pots.map((t) => box(t.x, t.z, 0.55 * t.s, 0.55 * t.s)),
  box(PROPS.board.x, PROPS.board.z, 0.5, 1.8),
  ...PROPS.beds.map((b) => box(b.x, b.z, b.w + 0.1, b.d + 0.1)),
];

/** Tall colliders only: the camera may pass over platforms and the egg. */
export const CAMERA_COLLIDERS: Box2[] = SOLID_POINTS.map((p) => box(p.x, p.z, 0.4, 0.4));

/** Walkable bounds: the inner wall faces. */
export const BOUNDS: Box2 = {
  minX: -ROOM.halfWidth,
  maxX: ROOM.halfWidth,
  minZ: -ROOM.halfDepth,
  maxZ: ROOM.halfDepth,
};
