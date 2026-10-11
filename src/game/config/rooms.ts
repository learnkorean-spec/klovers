import { BOUNDS, box, CAMERA_COLLIDERS, COLLIDERS, PLAYER, ROOM, type Box2 } from "./world";
import { FRIEND_SPOT, npcColliderSpots } from "./npcs";

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
 * - hangul-village    → worlds[0], "initial_learning_world": open to all
 * - vocabulary-market → worlds[1], "core_hangul_milestone_completed"
 * - hub               → the KLOVERS Hub: not a world, a crossroads to every
 *                       world and to the site's own pages
 * - conversation-cafe → worlds[2], "conversation_readiness_milestone"
 * - klovers-house     → the Hub's information house (안내소): not a world.
 *                       Who Klovers is, and one board per section of the
 *                       site, each with its Korean name and a link. Open to all.
 * A gate into a locked world stays shut and shows a notice. What unlocks a
 * world is the learner's real course level (systems/access.ts) — the same
 * level → world map the dashboard journey uses. Never open one for free.
 */

export type RoomId = "courtyard" | "hangul-village" | "vocabulary-market" | "hub" | "conversation-cafe" | "klovers-house";

/** Notices shown at a gate whose world is still locked (or not built yet). */
export type NoticeKey = "marketLocked" | "cafeLocked" | "cultureSoon" | "seoulSoon" | "gardenSoon";

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
    { id: "hub-cafe", kind: "room", wall: "north", along: 0, sign: "카페" },
    { id: "hub-culture", kind: "future", wall: "north", along: -6.5, sign: "문화 거리" },
    { id: "hub-seoul", kind: "future", wall: "north", along: 6.5, sign: "서울" },
    { id: "hub-garden", kind: "future", wall: "west", along: -3.5, sign: "기억 정원" },
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

const KLOVERS_HUB: RoomLayout = {
  id: "hub",
  bounds: { minX: -HUB.half, maxX: HUB.half, minZ: -HUB.half, maxZ: HUB.half },
  colliders: [hubPost, ...hubProps, ...people("hub")],
  cameraColliders: [hubPost],
  spawns: {
    // Turned a little toward the pavilion, so the landmark leads the view.
    fromVillage: { x: HUB.southGates.village, z: HUB.half - 3.2, yaw: Math.PI - 0.32 },
    fromMarket: { x: HUB.southGates.market, z: HUB.half - 3.2, yaw: Math.PI + 0.32 },
    fromCafe: { x: 0, z: -HUB.half + 2.2, yaw: 0 },
    fromHouse: { x: 0, z: HUB.half - 3, yaw: Math.PI },
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
} as const;

const cafeTables = CAFE.tables.map((t) => box(t.x, t.z, CAFE.tableFootprint.w, CAFE.tableFootprint.d));
const cafeCounter = box(CAFE.counter.x, CAFE.counter.z, CAFE.counter.w, CAFE.counter.d);

const CONVERSATION_CAFE: RoomLayout = {
  id: "conversation-cafe",
  canonWorldId: "conversation-cafe",
  bounds: { minX: -CAFE.halfWidth, maxX: CAFE.halfWidth, minZ: -CAFE.halfDepth, maxZ: CAFE.halfDepth },
  colliders: [cafeCounter, ...cafeTables],
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

export const ROOMS: Record<RoomId, RoomLayout> = {
  courtyard: COURTYARD,
  "hangul-village": HANGUL_VILLAGE,
  "vocabulary-market": VOCABULARY_MARKET,
  hub: KLOVERS_HUB,
  "conversation-cafe": CONVERSATION_CAFE,
  "klovers-house": KLOVERS_HOUSE,
};

/** The portal whose zone contains the point, if any (first match wins). */
export function findPortal(x: number, z: number, portals: Portal[]): Portal | undefined {
  return portals.find((p) => x >= p.zone.minX && x <= p.zone.maxX && z >= p.zone.minZ && z <= p.zone.maxZ);
}
