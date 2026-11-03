import { BOUNDS, box, CAMERA_COLLIDERS, COLLIDERS, PLAYER, ROOM, type Box2 } from "./world";
import type { WorldIcon } from "../environment/icons";
import { ALLEY_FRIEND, NAMSAN_FRIEND, CAFE_FRIEND, CULTURE_FRIEND, FRIEND_SPOT, SEOUL_FRIEND, npcColliderSpots } from "./npcs";
import { REAL_PROPS } from "../systems/styleMode";

/** People who stand still are solid (a small circle-ish box). */
const people = (room: RoomId): Box2[] => npcColliderSpots(room).map((p) => box(p.x, p.z, 0.6, 0.6));

/**
 * KLOVERS World — rooms and the doors between them.
 *
 * Each room is a small walkable area with its own bounds, colliders and
 * spawn points. Portals are floor zones: walking into an open one moves the
 * learner to the linked room; a closed one only shows a notice.
 *
 * Story placement (src/config/klovers-world.ts):
 * - courtyard         → originStory.discovery (the egg sleeps here)
 * - hangul-village    → worlds[0], "initial_learning_world": open to all.
 *                       On a first visit it opens with the Klovers tour
 *                       (config/tour.ts): six boards along the street, read
 *                       like slides — who Klovers is, the courses, how we
 *                       teach, why Korean, how to start. Skippable.
 * - vocabulary-market → worlds[1], "core_hangul_milestone_completed"
 * - hub               → the KLOVERS Hub: not a world, a crossroads to every
 *                       world and to the site's own pages
 * - conversation-cafe → worlds[2], "conversation_readiness_milestone"
 * - culture-street    → worlds[4], "beginner_language_foundation_completed"
 *                       (course Level 3, canon levelJourney.l3)
 * - seoul-journey     → worlds[5], "intermediate_real_world_readiness",
 *                       part 1 (course Level 4, canon levelJourney.l4)
 * - klovers-house     → the Hub's information house (안내소): not a world.
 *                       Who Klovers is, and one board per section of the
 *                       site, each with its Korean name and a link. Open to all.
 * A gate into a locked world stays shut and shows a notice. What unlocks a
 * world is the learner's real course level (systems/access.ts) — the same
 * level → world map the dashboard journey uses. Never open one for free.
 */

export type RoomId = "courtyard" | "hangul-village" | "vocabulary-market" | "hub" | "conversation-cafe" | "klovers-house" | "culture-street" | "seoul-journey" | "memory-garden" | "seoul-market" | "seoul-namsan";

/** Notices shown at a gate whose world is still locked (or not built yet). */
export type NoticeKey = "marketLocked" | "cafeLocked" | "cultureLocked" | "seoulLocked" | "cultureSoon" | "seoulSoon" | "gardenSoon" | "gardenLocked" | "seoulMarketLocked" | "seoulNamsanLocked";

export interface Spawn {
  x: number;
  z: number;
  /** Facing (three.js rotation.y): π looks toward −z, 0 toward +z. */
  yaw: number;
}

export interface Portal {
  id: string;
  zone: Box2;
  to: RoomId;
  /** Spawn id in the target room. */
  arrive: string;
  /** Shown instead of travelling while the target world is locked. */
  lockedNotice?: NoticeKey;
}

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
  colliders: [...COLLIDERS, box(FRIEND_SPOT.x, FRIEND_SPOT.z, 0.6, 0.6), ...people("courtyard")],
  cameraColliders: CAMERA_COLLIDERS,
  spawns: {
    start: { x: PLAYER.spawn.x, z: PLAYER.spawn.z, yaw: PLAYER.spawnYaw },
    // Just inside the north gate, facing back into the courtyard (+z).
    fromVillage: { x: 0, z: -ROOM.halfDepth + 1.9, yaw: 0 },
  },
  portals: [
    {
      id: "courtyard-gate",
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
  lampZ: [-7.5, -3, 1.8, 9.8],
  lampX: 4.1,
  lampSize: 0.28,
  well: { x: 0, z: 0, size: 1.7 },
  /** Banner arch (한글 마을) across the street; its posts are solid. */
  arch: { z: 4.6, x: 4.6, post: 0.3 },
  /** Houses: centre z of each house on both sides (5 per side). */
  houseZ: [-11.2, -5.6, 0, 5.6, 11.2],
  houseDepth: 4.6,
  houseLength: 5,
  /** First letters a learner reads (Klovers Hangul course order). */
  lettersLeft: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ"],
  lettersRight: ["ㅏ", "ㅓ", "ㅗ", "ㅜ"],
  /**
   * The lane to the KLOVERS Hub opens where the last house on the right
   * would stand — open to everyone, guests included (the Hub is not a world).
   */
  hubLaneZ: -11.2,
  hubSign: "광장",
  /** A bench by the kerb and a vendor's cart near the well. */
  bench: { x: 3.95, z: 7.4, w: 0.9, d: 1.9 },
  cart: { x: 2.6, z: -5.2, w: 1.3, d: 2.1 },
  /** Planting beds by the kerbs: a tree on the right, flowers on the left. */
  bedRight: { x: 4.35, z: -1.9, w: 0.8, d: 2.2 },
  bedLeft: { x: -4.35, z: -3.4, w: 0.8, d: 2.0 },
  /** Flower boxes along the veranda edges: x, z, length (along z). */
  planters: [
    [-4.7, -12.8, 1.4], [-4.7, -7.2, 1.4], [-4.7, -1.6, 1.3], [-4.7, 3.0, 1.4], [-4.7, 9.6, 1.4],
    [4.7, -7.2, 1.4], [4.7, 3.0, 1.4],
  ] as [number, number, number][],
  entranceSign: "한글 마을",
  marketSign: "시장",
  /**
   * The Klovers tour (config/tour.ts, environment/TourExhibit.tsx): six
   * boards along the street, an exhibition walked in order from the
   * courtyard gate toward the market, alternating sides — who we are, what
   * makes Klovers different, the courses, how we teach, why Korean, how to
   * start. Each faces the street; x/z is the board's centre, yaw its facing
   * (three.js rotation.y), w its width (the panel is 1.5 m tall).
   */
  tour: [
    { id: "about", x: -3.85, z: 7.0, yaw: Math.PI / 2, w: 2.4, sign: "우리는 클로버스" },
    { id: "why", x: 3.85, z: 3.2, yaw: -Math.PI / 2, w: 2.4, sign: "왜 클로버스?" },
    { id: "courses", x: -3.85, z: -0.2, yaw: Math.PI / 2, w: 2.4, sign: "수업" },
    { id: "method", x: 3.7, z: -1.9, yaw: -Math.PI / 2, w: 2.4, sign: "공부 방법" },
    { id: "korean", x: -3.85, z: -5.6, yaw: Math.PI / 2, w: 2.4, sign: "한국어" },
    { id: "trial", x: 3.85, z: -8.5, yaw: -Math.PI / 2, w: 2.4, sign: "시작해요" },
  ],
  /** Yellow posts beside two boards that lead out to the site. */
  tourLinks: [
    { id: "courses", x: -3.75, z: -1.95, yaw: Math.PI / 2, sign: "수업 보기", href: "/courses" },
    { id: "trial", x: 3.7, z: -6.85, yaw: -Math.PI / 2, sign: "무료 수업", href: "/free-trial" },
  ],
} as const;

export type TourStop = (typeof VILLAGE.tour)[number]["id"];

/** Where the learner stands to read a tour board: a step out into the street. */
export function tourSpot(b: { x: number; z: number; yaw: number }, out = 1.9): { x: number; z: number } {
  return { x: b.x + Math.sin(b.yaw) * out, z: b.z + Math.cos(b.yaw) * out };
}

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
  colliders: [
    box(VILLAGE.well.x, VILLAGE.well.z, VILLAGE.well.size, VILLAGE.well.size),
    ...lamps,
    ...archPosts,
    box(VILLAGE.bench.x, VILLAGE.bench.z, VILLAGE.bench.w, VILLAGE.bench.d),
    ...VILLAGE.planters.map(([x, z, l]) => box(x, z, 0.62, l + 0.08)),
    box(VILLAGE.cart.x, VILLAGE.cart.z, VILLAGE.cart.w, VILLAGE.cart.d),
    box(VILLAGE.bedRight.x, VILLAGE.bedRight.z, VILLAGE.bedRight.w + 0.1, VILLAGE.bedRight.d + 0.1),
    box(VILLAGE.bedLeft.x, VILLAGE.bedLeft.z, VILLAGE.bedLeft.w + 0.1, VILLAGE.bedLeft.d + 0.1),
    box(4.35, 9.3, 0.9, 1.3),
    box(-4.5, -8.2, 0.5, 0.5),
    // The tour boards (thin, along the kerb) and their link posts.
    ...VILLAGE.tour.map((b) => box(b.x, b.z, 0.3, b.w + 0.25)),
    ...VILLAGE.tourLinks.map((l) => box(l.x, l.z, 0.3, 0.3)),
    ...people("hangul-village"),
  ],
  cameraColliders: [...lamps, ...archPosts],
  spawns: {
    // Just through the south gate, facing up the street (−z).
    fromCourtyard: { x: 0, z: VILLAGE.halfLength - 3.4, yaw: Math.PI },
    fromMarket: { x: 0, z: -VILLAGE.halfLength + 2.2, yaw: 0 },
    // Just inside the lane gate, facing into the street (−x).
    fromHub: { x: VILLAGE.halfWidth - 2.0, z: VILLAGE.hubLaneZ, yaw: -Math.PI / 2 },
  },
  portals: [
    {
      id: "village-hub-lane",
      zone: box(VILLAGE.halfWidth - 0.55, VILLAGE.hubLaneZ, 1.1, 3),
      to: "hub",
      arrive: "fromVillage",
    },
    {
      id: "village-back-gate",
      zone: box(0, VILLAGE.halfLength - 0.55, 3, 1.1),
      to: "courtyard",
      arrive: "fromVillage",
    },
    {
      id: "village-market-gate",
      zone: box(0, -VILLAGE.halfLength + 0.55, 3, 1.1),
      to: "vocabulary-market",
      arrive: "fromVillage",
      lockedNotice: "marketLocked",
    },
  ],
  shadowExtent: 18,
};

/* ──────────────────────── Vocabulary Market ─────────────────────── */

/**
 * A market square, 18 m × 16 m, with six stalls. Every stall sells one
 * everyday thing and names it in Korean on its signboard — words the Level 1
 * learner meets first. South: back to the village. North: the café.
 */
export const MARKET = {
  halfWidth: 9,
  halfDepth: 8,
  stallZ: [-4.5, 0, 4.5],
  stallX: 7.4,
  stallW: 2.4,
  stallD: 3.4,
  /** One word per stall, south → north: left side (−x), right side (+x). */
  stallsLeft: ["물", "밥", "빵"],
  stallsRight: ["책", "옷", "꽃"],
  /** The market's centrepiece: a tiered produce stand under a big parasol. */
  crates: { x: 0, z: 0, size: 1.8 },
  /** Produce tables under market parasols in the square: x, z, w, d. */
  tables: [
    [-2.9, 1.9, 1.7, 1.0],
    [4.5, -2.1, 1.0, 1.7],
  ] as [number, number, number, number][],
  /**
   * The little shop on the second produce table: three things laid out to
   * pick from (tap one, or walk up and choose). Each is a word the market
   * already teaches, said the way a shopper asks for it: "___ 주세요".
   */
  shop: { table: 1, items: ["사과", "물", "꽃"] as const },
  /**
   * A second shop: a food cart in the south half of the square, seen on the
   * way in from the village. x, z, width (east–west), depth (north–south).
   */
  cart: { x: 2.9, z: 3.3, w: 0.9, d: 1.6, items: ["빵", "밥", "우유"] as const },
  /** Baskets of goods in front of the stalls: x, z, size. */
  baskets: [
    [-5.6, 6.3, 0.9], [-5.1, 6.95, 0.7], [5.6, 6.2, 0.85],
    [5.7, -2.4, 0.8], [-5.7, 2.3, 0.75], [5.2, 2.6, 0.7],
  ] as [number, number, number][],
  /** Flower clumps in the gaps between stalls. */
  flowers: [[-5.95, -2.25], [5.95, 2.25], [-6.2, 6.9], [6.2, -6.9]] as [number, number][],
  lamps: [
    { x: -3.5, z: -5 },
    { x: 3.5, z: -5 },
    { x: -3.5, z: 5 },
    { x: 3.5, z: 5 },
  ],
  lampSize: 0.28,
  /** Sign over the north gate, into the Hub (광장 = the square). */
  nextSign: "광장",
} as const;

const marketLamps = MARKET.lamps.map((l) => box(l.x, l.z, MARKET.lampSize, MARKET.lampSize));
const marketStalls = MARKET.stallZ.flatMap((z) => [
  box(-MARKET.stallX, z, MARKET.stallW, MARKET.stallD),
  box(MARKET.stallX, z, MARKET.stallW, MARKET.stallD),
]);

const VOCABULARY_MARKET: RoomLayout = {
  id: "vocabulary-market",
  canonWorldId: "vocabulary-market",
  bounds: { minX: -MARKET.halfWidth, maxX: MARKET.halfWidth, minZ: -MARKET.halfDepth, maxZ: MARKET.halfDepth },
  colliders: [
    ...marketStalls,
    box(MARKET.crates.x, MARKET.crates.z, MARKET.crates.size, MARKET.crates.size),
    box(MARKET.cart.x, MARKET.cart.z, MARKET.cart.w + 0.3, MARKET.cart.d + 0.1),
    ...MARKET.tables.map(([x, z, w, d]) => box(x, z, w + 0.1, d + 0.1)),
    ...MARKET.flowers.map(([x, z]) => box(x, z, 0.65, 0.6)),
    box(-3.6, -MARKET.halfDepth + 0.7, 0.5, 0.5),
    box(3.6, -MARKET.halfDepth + 0.7, 0.5, 0.5),
    ...marketLamps,
    ...MARKET.baskets.map(([x, z, sc]) => box(x, z, 0.58 * sc, 0.58 * sc)),
    ...people("vocabulary-market"),
  ],
  cameraColliders: [...marketLamps, ...marketStalls, ...MARKET.tables.map(([x, z]) => box(x, z, 0.3, 0.3))],
  spawns: {
    // Off the centre line, so the produce stand in the middle of the square
    // shows beside the learner rather than behind them.
    fromVillage: { x: -1.4, z: MARKET.halfDepth - 4.4, yaw: Math.PI },
    fromHub: { x: 1.4, z: -MARKET.halfDepth + 4.4, yaw: 0 },
  },
  portals: [
    {
      id: "market-back-gate",
      zone: box(0, MARKET.halfDepth - 0.55, 3, 1.1),
      to: "hangul-village",
      arrive: "fromMarket",
    },
    {
      id: "market-hub-gate",
      zone: box(0, -MARKET.halfDepth + 0.55, 3, 1.1),
      to: "hub",
      arrive: "fromMarket",
    },
  ],
  shadowExtent: 14,
};

/* ─────────────────────────── KLOVERS Hub ────────────────────────── */

/**
 * The square every path leads to, 22 m × 22 m. Gates on three walls: the
 * Conversation Café (by level), the worlds still ahead (shut, named), and
 * two doors out to the site itself — the games and the lessons. A signpost
 * in the middle points everywhere. It shows the world is bigger than these
 * rooms, and opens only what really exists.
 */
export type HubGateKind = "room" | "link" | "future";

export interface HubGate {
  id: string;
  kind: HubGateKind;
  /** Wall the gate sits in and its offset along that wall. */
  wall: "north" | "west" | "east";
  along: number;
  /** Real Korean on the gate's signboard. */
  sign: string;
  /** For a "room" gate: the world it opens onto. */
  to?: RoomId;
}

export const HUB = {
  half: 11,
  /** The two gates in the south wall, back toward the village and the market. */
  southGates: { village: -5, market: 5, house: 0 },
  /** The information house's gate sign (안내소: information centre). */
  houseSign: "안내소",
  /** The wayfinding pavilion on its octagonal base (collider is the base). */
  post: { x: 0, z: 0, size: 3.4 },
  /** Planting beds: a tree corner by the market gate, shrubs by the garden gate. */
  beds: [
    { x: 8.3, z: 9.9, w: 2.2, d: 1.2, tree: true },
    { x: -10.2, z: -7.4, w: 1.4, d: 3.0, tree: false },
    { x: 10.2, z: 7.2, w: 1.4, d: 3.2, tree: true },
  ],
  /** Onggi pots in the corners and stone lanterns flanking the café gate. */
  pots: [
    [-9.9, 9.7, 1.1], [-9.1, 10.1, 0.8], [9.9, 9.7, 1], [-9.9, -9.9, 1], [9.9, -9.9, 1.1], [9.1, -10.2, 0.8],
  ] as [number, number, number][],
  lanterns: [
    [-2.5, -9.7], [2.5, -9.7],
  ] as [number, number][],
  /** Flower beds at the corners of the pavilion base. */
  flowerBeds: [[-2.7, -2.7], [2.7, -2.7], [-2.7, 2.7], [2.7, 2.7]] as [number, number][],
  /** A bench with a pine and lantern (a sitting corner), and a notice board. */
  bench: { x: -9.95, z: 0.3, w: 0.9, d: 2.3 },
  benchPine: { x: -9.7, z: 5.8 },
  board: { x: 10.25, z: 2.6 },
  gates: [
    { id: "hub-cafe", kind: "room", wall: "north", along: 0, sign: "카페", to: "conversation-cafe" },
    { id: "hub-culture", kind: "room", wall: "north", along: -6.5, sign: "문화 거리", to: "culture-street" },
    { id: "hub-seoul", kind: "room", wall: "north", along: 6.5, sign: "서울", to: "seoul-journey" },
    { id: "hub-garden", kind: "room", wall: "west", along: -3.5, sign: "기억 정원", to: "memory-garden" },
    { id: "hub-games", kind: "link", wall: "west", along: 4, sign: "게임" },
    { id: "hub-lessons", kind: "link", wall: "east", along: -3.5, sign: "수업" },
  ] as HubGate[],
} as const;

/** Floor point just inside a hub gate (where the learner stands in front of it). */
export function hubGateSpot(g: HubGate, inset = 0.9): { x: number; z: number; yaw: number } {
  const h = HUB.half;
  if (g.wall === "north") return { x: g.along, z: -h + inset, yaw: Math.PI };
  if (g.wall === "west") return { x: -h + inset, z: g.along, yaw: -Math.PI / 2 };
  return { x: h - inset, z: g.along, yaw: Math.PI / 2 };
}

const hubPost = box(HUB.post.x, HUB.post.z, HUB.post.size, HUB.post.size);
const hubProps = [
  ...HUB.pots.map(([x, z, sc]) => box(x, z, 0.55 * sc, 0.55 * sc)),
  ...HUB.lanterns.map(([x, z]) => box(x, z, 0.55, 0.55)),
  box(HUB.bench.x, HUB.bench.z, HUB.bench.w, HUB.bench.d),
  box(HUB.benchPine.x, HUB.benchPine.z, 0.5, 0.5),
  box(HUB.board.x, HUB.board.z, 0.5, 1.8),
  ...HUB.beds.map((b) => box(b.x, b.z, b.w + 0.1, b.d + 0.1)),
  ...HUB.flowerBeds.map(([x, z]) => box(x, z, 1.35, 1.35)),
];

/** The stone pillars beside each real (modelled) future gate are solid. */
const hubGatePillars: Box2[] = REAL_PROPS
  ? HUB.gates
      .filter((g) => g.kind === "future")
      .flatMap((g) => {
        const s = hubGateSpot(g, 0.12);
        return [-1, 1].map((side) =>
          g.wall === "north" ? box(s.x + side * 1.5, s.z, 0.75, 0.62) : box(s.x, s.z + side * 1.5, 0.62, 0.75),
        );
      })
  : [];

const KLOVERS_HUB: RoomLayout = {
  id: "hub",
  bounds: { minX: -HUB.half, maxX: HUB.half, minZ: -HUB.half, maxZ: HUB.half },
  colliders: [hubPost, ...hubProps, ...hubGatePillars, ...people("hub")],
  cameraColliders: [hubPost],
  spawns: {
    // Turned a little toward the pavilion, so the landmark leads the view.
    fromVillage: { x: HUB.southGates.village, z: HUB.half - 3.2, yaw: Math.PI - 0.32 },
    fromMarket: { x: HUB.southGates.market, z: HUB.half - 3.2, yaw: Math.PI + 0.32 },
    fromCafe: { x: 0, z: -HUB.half + 2.2, yaw: 0 },
    fromCulture: { x: -6.5, z: -HUB.half + 2.2, yaw: 0 },
    fromSeoul: { x: 6.5, z: -HUB.half + 2.2, yaw: 0 },
    fromHouse: { x: 0, z: HUB.half - 3, yaw: Math.PI },
    // Back out of the garden gate in the west wall, facing into the square (+x).
    fromGarden: { x: -HUB.half + 2.2, z: -3.5, yaw: Math.PI / 2 },
  },
  portals: [
    {
      id: "hub-village-gate",
      zone: box(HUB.southGates.village, HUB.half - 0.55, 3, 1.1),
      to: "hangul-village",
      arrive: "fromHub",
    },
    {
      id: "hub-market-gate",
      zone: box(HUB.southGates.market, HUB.half - 0.55, 3, 1.1),
      to: "vocabulary-market",
      arrive: "fromHub",
      lockedNotice: "marketLocked",
    },
    {
      id: "hub-house-gate",
      zone: box(HUB.southGates.house, HUB.half - 0.55, 3, 1.1),
      to: "klovers-house",
      arrive: "fromHub",
    },
    {
      id: "hub-cafe",
      zone: box(0, -HUB.half + 0.55, 3, 1.1),
      to: "conversation-cafe",
      arrive: "fromHub",
      lockedNotice: "cafeLocked",
    },
    {
      id: "hub-culture",
      zone: box(-6.5, -HUB.half + 0.55, 3, 1.1),
      to: "culture-street",
      arrive: "fromHub",
      lockedNotice: "cultureLocked",
    },
    {
      id: "hub-seoul",
      zone: box(6.5, -HUB.half + 0.55, 3, 1.1),
      to: "seoul-journey",
      arrive: "fromHub",
      lockedNotice: "seoulLocked",
    },
    {
      id: "hub-garden",
      zone: box(-HUB.half + 0.55, -3.5, 1.1, 3),
      to: "memory-garden",
      arrive: "fromHub",
      lockedNotice: "gardenLocked",
    },
  ],
  shadowExtent: 15,
};

/* ─────────────────────── Conversation Café ──────────────────────── */

/**
 * A warm café, 14 m × 12 m, open to the sky like the courtyard so the
 * camera never fights a ceiling. Counter and menu board on the north wall,
 * four tables with chairs. The only door leads back to the Hub.
 */
export const CAFE = {
  halfWidth: 7,
  halfDepth: 6,
  wallHeight: 3.2,
  counter: { x: 0, z: -4.7, w: 6, d: 1 },
  tables: [
    { x: -4, z: -0.8 },
    { x: 4, z: -0.8 },
    { x: -3.2, z: 2.8 },
    { x: 3.2, z: 2.8 },
  ],
  /** Table with its two chairs, as one footprint. */
  tableFootprint: { w: 2.1, d: 1.1 },
  sign: "카페",
  menu: "메뉴\n커피 · 녹차\n케이크",
  /** What the barista sells (the order card, config/interactions SHOP_ITEMS). */
  items: ["커피", "녹차", "케이크"] as const,
} as const;

const cafeTables = CAFE.tables.map((t) => box(t.x, t.z, CAFE.tableFootprint.w, CAFE.tableFootprint.d));
const cafeCounter = box(CAFE.counter.x, CAFE.counter.z, CAFE.counter.w, CAFE.counter.d);

const CONVERSATION_CAFE: RoomLayout = {
  id: "conversation-cafe",
  canonWorldId: "conversation-cafe",
  bounds: { minX: -CAFE.halfWidth, maxX: CAFE.halfWidth, minZ: -CAFE.halfDepth, maxZ: CAFE.halfDepth },
  colliders: [cafeCounter, ...cafeTables, box(CAFE_FRIEND.x, CAFE_FRIEND.z, 0.6, 0.6)],
  cameraColliders: [],
  spawns: {
    fromHub: { x: 0, z: CAFE.halfDepth - 2.2, yaw: Math.PI },
  },
  portals: [
    {
      id: "cafe-door",
      zone: box(0, CAFE.halfDepth - 0.55, 3, 1.1),
      to: "hub",
      arrive: "fromCafe",
    },
  ],
  shadowExtent: 11,
};

/* ───────────────────────── Klovers House ───────────────────────── */

/**
 * The information house (안내소), 14 m × 12 m, open to the sky like the
 * café. "Who we are" faces the door; every other board names one section of
 * the site in Korean, says what it is for, and links to it. The door in the
 * south wall leads back to the Hub.
 */
export type InfoId = "about" | "courses" | "trial" | "placement" | "textbook" | "shop" | "games" | "blog" | "topik" | "scholarships";

export const HOUSE = {
  halfWidth: 7,
  halfDepth: 6,
  /** Boards: id, centre x/z, facing yaw (three.js rotation.y), width. */
  boards: [
    { id: "courses", x: -4.3, z: -5.55, yaw: 0, w: 2.2 },
    { id: "about", x: 0, z: -5.55, yaw: 0, w: 3.0 },
    { id: "trial", x: 4.3, z: -5.55, yaw: 0, w: 2.2 },
    { id: "placement", x: -6.55, z: -2.6, yaw: Math.PI / 2, w: 2.0 },
    { id: "textbook", x: -6.55, z: 0.4, yaw: Math.PI / 2, w: 2.0 },
    { id: "shop", x: -6.55, z: 3.4, yaw: Math.PI / 2, w: 2.0 },
    { id: "games", x: 6.55, z: -2.6, yaw: -Math.PI / 2, w: 2.0 },
    { id: "blog", x: 6.55, z: 0.4, yaw: -Math.PI / 2, w: 2.0 },
    { id: "topik", x: 6.55, z: 3.4, yaw: -Math.PI / 2, w: 2.0 },
    { id: "scholarships", x: -4.6, z: 5.55, yaw: Math.PI, w: 2.0 },
  ] as { id: InfoId; x: number; z: number; yaw: number; w: number }[],
  /** The Korean on each board (real words; the cards teach them). */
  signs: {
    about: "우리는 클로버스",
    courses: "수업",
    trial: "무료 수업",
    placement: "레벨 테스트",
    textbook: "교재",
    shop: "가게",
    games: "게임",
    blog: "블로그",
    topik: "토픽 시험",
    scholarships: "장학금",
  } as Record<InfoId, string>,
  /** The picture on each board, beside its Korean (environment/icons). */
  icons: {
    about: "clover",
    courses: "live",
    trial: "teacher",
    placement: "test",
    textbook: "book",
    shop: "cart",
    games: "game",
    blog: "pen",
    topik: "medal",
    scholarships: "cap",
  } as Record<InfoId, WorldIcon>,
  /** A round clover dais in the middle (solid). */
  dais: { x: 0, z: 0.4, r: 1.3 },
  sign: "안내소",
} as const;

/** Where the learner stands to read a board: a step out from it. */
export function boardSpot(b: { x: number; z: number; yaw: number }, out = 1.35): { x: number; z: number } {
  return { x: b.x + Math.sin(b.yaw) * out, z: b.z + Math.cos(b.yaw) * out };
}

const KLOVERS_HOUSE: RoomLayout = {
  id: "klovers-house",
  bounds: { minX: -HOUSE.halfWidth, maxX: HOUSE.halfWidth, minZ: -HOUSE.halfDepth, maxZ: HOUSE.halfDepth },
  colliders: [
    box(HOUSE.dais.x, HOUSE.dais.z, HOUSE.dais.r * 2, HOUSE.dais.r * 2),
    ...HOUSE.boards.map((b) => (Math.abs(Math.sin(b.yaw)) > 0.5 ? box(b.x, b.z, 0.5, b.w) : box(b.x, b.z, b.w, 0.5))),
  ],
  cameraColliders: [],
  spawns: {
    fromHub: { x: 0, z: HOUSE.halfDepth - 2.2, yaw: Math.PI },
  },
  portals: [
    {
      id: "house-door",
      zone: box(0, HOUSE.halfDepth - 0.55, 3, 1.1),
      to: "hub",
      arrive: "fromHouse",
    },
  ],
  shadowExtent: 11,
};

/* ───────────────────────── Culture Street ──────────────────────── */

/**
 * Culture Street (canon worlds[4], course Level 3): one street, 10 m × 26 m,
 * running north from the Hub's 문화 거리 gate to a festival arch. Modern
 * shopfronts and hanok fronts side by side; along it, one stop per piece of
 * everyday culture, each something to do, not only to read:
 * greeting an elder (with a bow), shoes off at a hanok step, a food stall
 * (김치 · 비빔밥 · 떡볶이) and what to say before eating, giving and taking
 * with two hands at the hanbok shop, and the two big holidays under the
 * festival arch. Learned words change the street: dishes appear on the
 * table, and the festival lanterns light up.
 */
export const CULTURE = {
  halfWidth: 5,
  halfLength: 13,
  /** The elder greets from the doorway of the first hanok (west side). */
  elder: { x: -3.9, z: 7.4 },
  /** A hanok step with shoes left on it (east side). */
  step: { x: 4.1, z: 3.6, w: 1.6, d: 2.2 },
  /** The food stall (west) and a small table with stools (east). */
  stall: { x: -3.9, z: -0.6, w: 1.2, d: 3.0 },
  table: { x: 3.0, z: -2.6, r: 0.55 },
  /** The hanbok shop: two dressed stands by its door (east side). */
  hanbok: { x: 4.0, z: -7.2 },
  /** The festival arch across the north end, lanterns strung under it. */
  arch: { z: -11.2, post: 0.4 },
  /** Lamps along the kerbs. */
  lamps: [
    { x: -4.6, z: 10.5 }, { x: 4.6, z: 10.5 }, { x: -4.6, z: 2.6 }, { x: 4.6, z: -4.4 },
  ],
  sign: "문화 거리",
} as const;

const cultureLamps = CULTURE.lamps.map((l) => box(l.x, l.z, 0.3, 0.3));

const CULTURE_STREET: RoomLayout = {
  id: "culture-street",
  canonWorldId: "culture-street",
  bounds: { minX: -CULTURE.halfWidth, maxX: CULTURE.halfWidth, minZ: -CULTURE.halfLength, maxZ: CULTURE.halfLength },
  colliders: [
    box(CULTURE.step.x, CULTURE.step.z, CULTURE.step.w, CULTURE.step.d),
    box(CULTURE.stall.x, CULTURE.stall.z, CULTURE.stall.w + 0.1, CULTURE.stall.d + 0.1),
    box(CULTURE.table.x, CULTURE.table.z, CULTURE.table.r * 2 + 0.9, CULTURE.table.r * 2 + 0.2),
    box(CULTURE.hanbok.x, CULTURE.hanbok.z, 0.8, 1.9),
    ...[-1, 1].map((sx) => box(sx * (CULTURE.halfWidth - 0.6), CULTURE.arch.z, CULTURE.arch.post, CULTURE.arch.post)),
    ...cultureLamps,
    box(CULTURE_FRIEND.x, CULTURE_FRIEND.z, 0.6, 0.6),
    ...people("culture-street"),
  ],
  cameraColliders: [...cultureLamps],
  spawns: {
    // Just through the gate from the Hub, facing up the street (−z).
    fromHub: { x: 0, z: CULTURE.halfLength - 2.4, yaw: Math.PI },
  },
  portals: [
    {
      id: "culture-back-gate",
      zone: box(0, CULTURE.halfLength - 0.55, 3, 1.1),
      to: "hub",
      arrive: "fromCulture",
    },
  ],
  shadowExtent: 17,
};

/* ───────────────────────── Seoul Journey ───────────────────────── */

/**
 * Seoul Journey, part 1 (canon worlds[5], course Level 4): a Seoul street
 * corner, 20 m × 18 m. A road with a zebra crossing runs east–west through
 * the middle; around it, the city's everyday places: a subway entrance
 * (line 2) with its attendant, a bus stop, a convenience store, a small
 * restaurant, and Namsan Tower on the skyline to the north. Each is a thing
 * to do in Korean: take the subway, give directions, catch a bus, pay the
 * bill. Parts 2 and 3 (Levels 5 and 6) go further into the city.
 */
export const SEOUL = {
  halfWidth: 10,
  halfDepth: 9,
  /** The road: an east–west strip, z from roadZ − roadW/2 to roadZ + roadW/2. */
  roadZ: -1.0,
  roadW: 3.4,
  /** The crosswalk's middle (x), and the two walk signals at its ends. */
  cross: { x: 1.0 },
  signals: [
    { x: 2.6, z: -3.15 },
    { x: -0.6, z: 1.15 },
  ],
  /** Ginkgo street trees (yellow in autumn), with grates. */
  trees: [
    { x: -6.0, z: 1.75 }, { x: 7.9, z: 1.75 }, { x: -1.2, z: -3.75 }, { x: 8.6, z: -3.6 }, { x: -9.2, z: -3.6 },
  ],
  /** Two planters by the gate back to the Hub. */
  planters: [
    { x: -6.4, z: 8.2, len: 1.9 }, { x: 6.4, z: 8.2, len: 1.9 },
  ],
  /** Subway entrance (north-west): its canopy and stair well, solid. */
  subway: { x: -6.6, z: -6.2, w: 3.4, d: 3.4 },
  /** The line map board beside it, facing the street. */
  lineMap: { x: -3.6, z: -7.8 },
  /** Bus shelter on the west kerb. */
  bus: { x: -8.9, z: 4.2, w: 1.2, d: 3.6 },
  /** Convenience store and restaurant fronts on the east side (x = halfWidth). */
  store: { z: -5.2 },
  restaurant: { z: 5.4 },
  /** An outdoor table in front of the restaurant. */
  table: { x: 6.6, z: 3.4, r: 0.5 },
  /** The tower viewer (coin binoculars) at the north kerb. */
  viewer: { x: 3.6, z: -8.2 },
  /** Namsan Tower, far to the north: beyond the walls, above the roofs. */
  tower: { x: 14, z: -80 },
  lamps: [
    { x: -3.2, z: 2.0 }, { x: 4.2, z: 2.0 }, { x: -3.2, z: -3.9 }, { x: 6.2, z: -3.9 },
  ],
  sign: "서울",
} as const;

const seoulLamps = SEOUL.lamps.map((l) => box(l.x, l.z, 0.3, 0.3));

const SEOUL_JOURNEY: RoomLayout = {
  id: "seoul-journey",
  canonWorldId: "seoul-journey",
  bounds: { minX: -SEOUL.halfWidth, maxX: SEOUL.halfWidth, minZ: -SEOUL.halfDepth, maxZ: SEOUL.halfDepth },
  colliders: [
    box(SEOUL.subway.x, SEOUL.subway.z, SEOUL.subway.w, SEOUL.subway.d),
    box(SEOUL.lineMap.x, SEOUL.lineMap.z, 1.9, 0.4),
    box(SEOUL.bus.x, SEOUL.bus.z, SEOUL.bus.w, SEOUL.bus.d),
    box(SEOUL.table.x, SEOUL.table.z, SEOUL.table.r * 2 + 1.0, SEOUL.table.r * 2 + 0.2),
    box(SEOUL.viewer.x, SEOUL.viewer.z, 0.5, 0.5),
    ...seoulLamps,
    ...SEOUL.signals.map((p) => box(p.x, p.z, 0.3, 0.3)),
    ...SEOUL.trees.map((p) => box(p.x, p.z, 0.5, 0.5)),
    ...SEOUL.planters.map((p) => box(p.x, p.z, p.len, 0.6)),
    box(SEOUL_FRIEND.x, SEOUL_FRIEND.z, 0.6, 0.6),
    ...people("seoul-journey"),
  ],
  cameraColliders: [box(SEOUL.subway.x, SEOUL.subway.z, SEOUL.subway.w, SEOUL.subway.d), ...seoulLamps],
  spawns: {
    // Just in from the Hub's 서울 gate, facing up the street (−z).
    fromHub: { x: 0, z: SEOUL.halfDepth - 2.0, yaw: Math.PI },
    // Up the subway stairs from the market, facing the street (+z).
    fromMarket: { x: -8.9, z: -2.9, yaw: 0.35 },
    // Off the 02 bus back from Namsan, by the bus shelter, facing the street.
    fromNamsan: { x: -7.0, z: 6.9, yaw: Math.PI - 0.5 },
  },
  portals: [
    {
      id: "seoul-back-gate",
      zone: box(0, SEOUL.halfDepth - 0.55, 3, 1.1),
      to: "hub",
      arrive: "fromSeoul",
    },
  ],
  shadowExtent: 16,
};

/* ───────────────────── Seoul Journey, part 2: the market alley ───────────────────── */

/**
 * Seoul Journey, part 2 — canon worlds "seoul-journey", levelJourney.l5
 * (part 2): a neighbourhood market alley (골목 시장), one subway ride from
 * the street corner (part 1). Skills from the canon list: shopping (asking
 * the price, bargaining), restaurants (street food), social (an elder's
 * small talk, a stall-keeper's 덤), directions on the way out.
 *
 * An alley 9 m wide and 26 m long running north. The subway exit at the
 * south end; stalls under awnings down both sides (fruit, side dishes,
 * socks and hats, fish cakes); the street-food cart in the middle; a small
 * café at the north end, with a bench outside it.
 */
export const ALLEY = {
  halfWidth: 4.5,
  halfLength: 13,
  /** Stall fronts: x of the counter edge, and each stall's centre z and goods. */
  stallX: 3.35,
  stalls: [
    { side: -1, z: 6.5, goods: "fruit", sign: "과일" },
    { side: 1, z: 6.5, goods: "banchan", sign: "반찬" },
    { side: -1, z: 0.5, goods: "hats", sign: "모자 · 양말" },
    { side: 1, z: -5.5, goods: "eomuk", sign: "어묵" },
    { side: -1, z: -5.5, goods: "flowers", sign: "꽃" },
  ],
  stallW: 1.6,
  stallD: 3.6,
  /** The street-food cart in the alley's middle (호떡 · 어묵 · 김밥). */
  cart: { x: 0.6, z: 0.6, w: 1.2, d: 2.4 },
  /** The café at the north end (its front, x centre), and the bench outside. */
  cafe: { x: 0, w: 5 },
  bench: { x: -2.6, z: -10.6, w: 1.8, d: 0.6 },
  /** The subway exit's stair well at the south end (solid, its stairs face north). */
  exit: { x: 2.4, z: 11.3, w: 2.2, d: 2.6 },
  /** The arch over the alley's entrance, and the name on it. */
  archZ: 9.2,
  sign: "골목 시장",
} as const;

const alleyStalls = ALLEY.stalls.map((st) => box(st.side * (ALLEY.halfWidth - ALLEY.stallW / 2 + 0.05), st.z, ALLEY.stallW, ALLEY.stallD));

const SEOUL_MARKET: RoomLayout = {
  id: "seoul-market",
  canonWorldId: "seoul-journey",
  bounds: { minX: -ALLEY.halfWidth, maxX: ALLEY.halfWidth, minZ: -ALLEY.halfLength, maxZ: ALLEY.halfLength },
  colliders: [
    ...alleyStalls,
    box(ALLEY.cart.x, ALLEY.cart.z, ALLEY.cart.w, ALLEY.cart.d),
    box(ALLEY.bench.x, ALLEY.bench.z, ALLEY.bench.w, ALLEY.bench.d),
    box(ALLEY.exit.x, ALLEY.exit.z, ALLEY.exit.w, ALLEY.exit.d),
    box(ALLEY_FRIEND.x, ALLEY_FRIEND.z, 0.6, 0.6),
    ...[-1, 1].map((sd) => box(sd * (ALLEY.halfWidth - 0.25), ALLEY.archZ, 0.35, 0.35)),
    ...people("seoul-market"),
  ],
  cameraColliders: [box(ALLEY.exit.x, ALLEY.exit.z, ALLEY.exit.w, ALLEY.exit.d)],
  spawns: {
    // Off the subway, just in under the arch, facing up the alley (−z).
    fromSubway: { x: -0.6, z: 8.0, yaw: Math.PI },
  },
  portals: [],
  shadowExtent: 15,
};

/* ───────────────────── Seoul Journey, part 3: Namsan Tower ───────────────────── */

/**
 * Seoul Journey, part 3 — canon worlds "seoul-journey" (visualDirection:
 * "… and Namsan Tower"), levelJourney.l6. The plaza on top of Namsan at
 * the foot of the tower, reached by the 02 Namsan bus from the street
 * corner (part 1), whose friend asked "남산타워에 가 볼까요?".
 *
 * 20 × 16 m. North: the tower's base with its entrance and the ticket booth.
 * East: the padlock fences. South and west: the lookout rail over Seoul,
 * with two coin viewers. A bench, pines, the 02 bus stop in the south-east.
 */
export const NAMSAN = {
  halfWidth: 10,
  halfDepth: 8,
  /** The tower's base building (its front is the plaza's north edge). */
  base: { z: -8, w: 9 },
  booth: { x: -4.6, z: -7.0, w: 2.4, d: 1.4 },
  /** The padlock fence along the east side (x), from z0 to z1. */
  locks: { x: 8.9, z0: -5.5, z1: 4.0 },
  viewers: [{ x: -5.0, z: 7.4 }, { x: 2.6, z: 7.4 }],
  bench: { x: -8.6, z: 0.2, w: 0.7, d: 2.0 },
  busStop: { x: 8.4, z: 6.4 },
  pines: [{ x: -9, z: -6.6, s: 1.2 }, { x: 9.1, z: -6.8, s: 1.1 }, { x: -9.2, z: 5.6, s: 1.0 }],
  /** Planting beds along the base building's stone wings (x, z, w, d). */
  planters: [
    { x: -6.75, z: -7.35, w: 1.3, d: 0.9 },
    { x: 6.0, z: -7.35, w: 2.6, d: 0.9 },
  ],
  sign: "남산서울타워",
} as const;

const NAMSAN_ROOM: RoomLayout = {
  id: "seoul-namsan",
  canonWorldId: "seoul-journey",
  bounds: { minX: -NAMSAN.halfWidth, maxX: NAMSAN.halfWidth, minZ: -NAMSAN.halfDepth, maxZ: NAMSAN.halfDepth },
  colliders: [
    box(NAMSAN.booth.x, NAMSAN.booth.z, NAMSAN.booth.w, NAMSAN.booth.d),
    box(NAMSAN.locks.x, (NAMSAN.locks.z0 + NAMSAN.locks.z1) / 2, 0.4, NAMSAN.locks.z1 - NAMSAN.locks.z0),
    ...NAMSAN.viewers.map((v) => box(v.x, v.z, 0.5, 0.5)),
    box(NAMSAN.bench.x, NAMSAN.bench.z, NAMSAN.bench.w, NAMSAN.bench.d),
    box(NAMSAN.busStop.x, NAMSAN.busStop.z + 0.3, 1.4, 0.5),
    ...NAMSAN.pines.map((p) => box(p.x, p.z, 0.5, 0.5)),
    ...NAMSAN.planters.map((p) => box(p.x, p.z, p.w, p.d)),
    box(NAMSAN_FRIEND.x, NAMSAN_FRIEND.z, 0.6, 0.6),
    ...people("seoul-namsan"),
  ],
  cameraColliders: [],
  spawns: {
    // Off the 02 bus, at the stop in the south-east corner, facing the tower.
    fromBus: { x: 5.6, z: 4.6, yaw: -2.6 },
  },
  portals: [],
  shadowExtent: 15,
};

/* ─────────────────────── Cluby's Memory Garden ─────────────────────── */

/**
 * Cluby's Memory Garden — canon worlds "memory-garden": a quiet green garden
 * where previously learned words come back for review (purpose: review and
 * spaced repetition as part of the story; lead: Cluby). Not a level stop: it
 * stands beside the road at the Hub (its gate in the Hub's west wall) and
 * opens with the learner's real review data — the words their completed
 * lessons put into their review schedule (lib/reviewSchedule.ts).
 *
 * 16 m square inside clipped hedges. A pond in the middle with the memory
 * tree on its north bank; a ring of flower beds round the pond, one flower
 * per word in review (a bud while it is due, open once reviewed); the
 * memory stone by the tree is where the review happens. The only gate is
 * east, back to the Hub.
 */
export const GARDEN = {
  half: 8,
  pond: { x: 0, z: 0.4, r: 2.3 },
  tree: { x: 0, z: -6.2 },
  /** The memory stone (the review spot is just south-east of it). */
  stone: { x: 2.6, z: -6.0 },
  /** Flower beds in a ring round the pond: radius and count. */
  bedRing: { r: 4.5, n: 8 },
  /** A bench facing the pond from the south-west. */
  bench: { x: -4.6, z: 4.6, w: 1.9, d: 0.8 },
  sign: "기억 정원",
} as const;

const gardenBeds = Array.from({ length: GARDEN.bedRing.n }, (_, i) => {
  const a = (i / GARDEN.bedRing.n) * Math.PI * 2 + Math.PI / GARDEN.bedRing.n;
  return { x: GARDEN.pond.x + Math.sin(a) * GARDEN.bedRing.r, z: GARDEN.pond.z + Math.cos(a) * GARDEN.bedRing.r, a };
});
/** Where each flower bed sits (shared with the garden's drawing). */
export const GARDEN_BEDS = gardenBeds;

const MEMORY_GARDEN: RoomLayout = {
  id: "memory-garden",
  canonWorldId: "memory-garden",
  bounds: { minX: -GARDEN.half, maxX: GARDEN.half, minZ: -GARDEN.half, maxZ: GARDEN.half },
  colliders: [
    box(GARDEN.pond.x, GARDEN.pond.z, GARDEN.pond.r * 2, GARDEN.pond.r * 2),
    box(GARDEN.tree.x, GARDEN.tree.z, 0.8, 0.8),
    box(GARDEN.stone.x, GARDEN.stone.z, 0.9, 0.7),
    box(GARDEN.bench.x, GARDEN.bench.z, GARDEN.bench.w, GARDEN.bench.d),
    // The flower beds are low: step between them, not over them.
    ...gardenBeds.map((b) => box(b.x, b.z, 1.2, 1.2)),
  ],
  cameraColliders: [box(GARDEN.tree.x, GARDEN.tree.z, 0.5, 0.5)],
  spawns: {
    // Just inside the east gate, facing into the garden (−x).
    fromHub: { x: GARDEN.half - 2.0, z: 0, yaw: -Math.PI / 2 },
  },
  portals: [
    {
      id: "garden-hub-gate",
      zone: box(GARDEN.half - 0.55, 0, 1.1, 3),
      to: "hub",
      arrive: "fromGarden",
    },
  ],
  shadowExtent: 12,
};

export const ROOMS: Record<RoomId, RoomLayout> = {
  courtyard: COURTYARD,
  "hangul-village": HANGUL_VILLAGE,
  "vocabulary-market": VOCABULARY_MARKET,
  hub: KLOVERS_HUB,
  "conversation-cafe": CONVERSATION_CAFE,
  "klovers-house": KLOVERS_HOUSE,
  "culture-street": CULTURE_STREET,
  "seoul-journey": SEOUL_JOURNEY,
  "memory-garden": MEMORY_GARDEN,
  "seoul-market": SEOUL_MARKET,
  "seoul-namsan": NAMSAN_ROOM,
};

/** The portal whose zone contains the point, if any (first match wins). */
export function findPortal(x: number, z: number, portals: Portal[]): Portal | undefined {
  return portals.find((p) => x >= p.zone.minX && x <= p.zone.maxX && z >= p.zone.minZ && z <= p.zone.maxZ);
}
