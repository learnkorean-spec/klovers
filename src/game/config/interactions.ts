import { boardSpot, HOUSE, HUB, hubGateSpot, MARKET, ROOMS, tourSpot, VILLAGE, type InfoId, type NoticeKey, type RoomId, type TourStop } from "./rooms";
import { FRIEND_SPOT, MINSU_SPOT, NPCS } from "./npcs";
import { PROPS } from "./world";

/**
 * Things the learner can walk up to. Standing within `radius` (and, for a
 * few, facing them) focuses one; E, or the round button on touch screens,
 * uses it. The 3D world only notices the focus — what happens next is
 * ordinary web UI in WorldPage (cards, links), per the rule "complex UI
 * stays HTML". Every interaction is data here; the cards read their words
 * from config/copy by id, so a new world is new rows, not new code.
 *
 * Kinds:
 * - egg      the clover egg (story beat; hatch only on real progress)
 * - letter   the ㄱ card (Hangul Village's first letter, the fullest card)
 * - learn    a small learning card by id: a word, a letter, a thing
 * - quiz     a one-question card by id ("which sound is this?")
 * - word     the baker's missing sign (pick the word; wrong picks teach)
 * - say      a person's short line: Korean, meaning, one note
 * - talk     a named character's first greeting (the other learner, Minsu)
 *            — the "meet the characters" objective
 * - cluby    Cluby himself (added at run time: he moves)
 * - link     a door out to a page of the site (Hub)
 * - door     a gate into a world that IS open: E walks through
 * - info     a board in Klovers House: a part of the site, its Korean
 *            name, what it is for, and a link to it
 * - locked   a gate to a world that is not open yet (or not built yet):
 *            inspecting it says, kindly, what opens it
 * - shop     the market's little shop: pick one of three things and ask
 *            for it in Korean (the things can also be pressed in the scene)
 */
export type InteractionKind = "egg" | "letter" | "learn" | "quiz" | "word" | "say" | "talk" | "cluby" | "link" | "door" | "locked" | "info" | "tour" | "shop";

/** The verb on the prompt ([E] Inspect, the round button's label …). */
export type InteractionAction = "inspect" | "talk" | "learn" | "enter" | "help" | "read" | "shop";

/** Learning cards (words and letters). Text per language: copy.learn[id]. */
export type LearnId =
  | "seokdeung" | "beotnamu" | "nieun" | "digeut" | "mieum" | "o" | "umul"
  | "mul" | "bap" | "chaek" | "ot" | "kkot" | "sagwa" | "gwail" | "jido" | "gesipan" | "annaeso";
/** One-question cards. Text per language: copy.quiz[id]. */
export type QuizId = "a" | "rieul" | "eo" | "u" | "ppang" | "sijang";
/** The market's two shops: the fruit table and the food cart. */
export type ShopId = "fruit" | "food";
/** Which things each shop sells (the words are in copy.shop.items). */
export const SHOP_ITEMS: Record<ShopId, readonly string[]> = { fruit: MARKET.shop.items, food: MARKET.cart.items };
export const shopOf = (item: string): ShopId => (SHOP_ITEMS.food.includes(item) ? "food" : "fruit");
/** People's short lines. Text per language: copy.say[id]. */
export type SayId = "auntie" | "vendor" | "shopkeeper" | "baker" | "hubFriend" | "hubReader" | "shopper";

export interface Interactable {
  id: string;
  room: RoomId;
  kind: InteractionKind;
  action: InteractionAction;
  x: number;
  z: number;
  radius: number;
  /** Wins a close call against a neighbour (default 0). */
  priority?: number;
  /** Only when the learner is turned toward it (Cluby, who stands close). */
  needsFacing?: boolean;
  /** Kind-specific payload. */
  link?: "games" | "lessons";
  who?: "friend" | "minsu";
  notice?: NoticeKey;
  learn?: LearnId;
  quiz?: QuizId;
  say?: SayId;
  info?: InfoId;
  /** A Klovers tour board (reading it frames it close). */
  tour?: TourStop;
  /** A page of the site this leads out to (kind "link"). */
  href?: string;
  /** The person speaking (turns to face the learner, reacts). */
  npc?: string;
  /** A Hangul letter counted by the village's three-letter discovery. */
  letter?: string;
  /** Which market shop this is (kind "shop"). */
  shop?: ShopId;
  /** A market word this reveals (its stall sign goes up once learned). */
  word?: string;
  /** Doors: where walking through leads. */
  to?: RoomId;
  arrive?: string;
  /**
   * For a gate into a world: usable only while that world is still locked
   * for this learner (then it explains why); once open, the gate just opens.
   */
  whileLocked?: RoomId;
  /** The opposite: only once that world is open (the "enter" door). */
  whileOpen?: RoomId;
}

/**
 * The village's discoverable letters (one on every door), in the order a
 * learner walking up the street meets them. Only the next two still to find
 * carry the thin yellow edge, so yellow stays a pointer, not decoration.
 */
export const VILLAGE_LETTERS = ["ㄱ", "ㄴ", "ㅏ", "ㅓ", "ㄷ", "ㅗ", "ㄹ", "ㅜ", "ㅁ"] as const;

/** Sign fronts on the street: a little in from each house's veranda edge. */
const signX = (side: -1 | 1) => side * (VILLAGE.halfWidth - 0.6);
/** Street z of the sign on the house `southIndex` houses from the village gate. */
const signZ = (southIndex: number) => VILLAGE.houseZ[VILLAGE.houseZ.length - 1 - southIndex] + 0.9;

/** A stall's counter front, from the square (x toward the middle). */
const stallFront = (side: -1 | 1, z: number): { x: number; z: number } => ({ x: side * (MARKET.stallX - MARKET.stallW / 2 - 0.7), z });
/** Stall z for a word: stalls run south → north (see VocabularyMarket). */
const stallZ = (side: -1 | 1, word: string) => {
  const list: readonly string[] = side < 0 ? MARKET.stallsLeft : MARKET.stallsRight;
  const n = list.indexOf(word);
  return MARKET.stallZ[MARKET.stallZ.length - 1 - n];
};

const npc = (id: string) => NPCS.find((n) => n.id === id)!;

const hubNotice: Record<string, NoticeKey> = {
  "hub-culture": "cultureSoon",
  "hub-seoul": "seoulSoon",
  "hub-garden": "gardenSoon",
};

const shopkeeper = npc("m-keeper-2");
const baker = npc("m-keeper-1");

export const INTERACTABLES: Interactable[] = [
  /* ── Courtyard (onboarding): the egg, one person, one thing to look at ── */
  { id: "egg", room: "courtyard", kind: "egg", action: "inspect", x: PROPS.eggPlinth.x, z: PROPS.eggPlinth.z, radius: 2.15 },
  { id: "talk-friend", room: "courtyard", kind: "talk", action: "talk", who: "friend", x: FRIEND_SPOT.x, z: FRIEND_SPOT.z, radius: 1.9 },
  // The stone lantern by the north gate, on the way out.
  { id: "learn-lantern", room: "courtyard", kind: "learn", action: "inspect", learn: "seokdeung", x: PROPS.lanterns[1].x - 0.75, z: PROPS.lanterns[1].z + 0.45, radius: 1.3 },
  // The flowering hero tree in the north-west corner.
  { id: "learn-tree", room: "courtyard", kind: "learn", action: "inspect", learn: "beotnamu", x: PROPS.beds[0].x + 0.4, z: PROPS.beds[0].z + 1.7, radius: 1.4 },

  /* ── Hangul Village: letters on the doors, people in the street ── */
  { id: "talk-minsu", room: "hangul-village", kind: "talk", action: "talk", who: "minsu", x: MINSU_SPOT.x, z: MINSU_SPOT.z, radius: 1.9, npc: "v-minsu" },
  { id: "letter-giyeok", room: "hangul-village", kind: "letter", action: "learn", letter: "ㄱ", x: signX(-1), z: signZ(0), radius: 1.7 },
  { id: "learn-nieun", room: "hangul-village", kind: "learn", action: "learn", learn: "nieun", letter: "ㄴ", x: signX(-1), z: signZ(1), radius: 1.6 },
  { id: "quiz-a", room: "hangul-village", kind: "quiz", action: "learn", quiz: "a", letter: "ㅏ", x: signX(1), z: signZ(0), radius: 1.6 },
  // The rest of the street: a card, then a question, in turn — never the same twice in a row.
  { id: "quiz-eo", room: "hangul-village", kind: "quiz", action: "learn", quiz: "eo", letter: "ㅓ", x: signX(1), z: signZ(1), radius: 1.5 },
  { id: "learn-digeut", room: "hangul-village", kind: "learn", action: "learn", learn: "digeut", letter: "ㄷ", x: signX(-1), z: signZ(2), radius: 1.5 },
  { id: "learn-o", room: "hangul-village", kind: "learn", action: "learn", learn: "o", letter: "ㅗ", x: signX(1), z: signZ(2), radius: 1.4 },
  { id: "quiz-rieul", room: "hangul-village", kind: "quiz", action: "learn", quiz: "rieul", letter: "ㄹ", x: signX(-1), z: signZ(3), radius: 1.5 },
  { id: "quiz-u", room: "hangul-village", kind: "quiz", action: "learn", quiz: "u", letter: "ㅜ", x: signX(1), z: signZ(3), radius: 1.3 },
  { id: "learn-mieum", room: "hangul-village", kind: "learn", action: "learn", learn: "mieum", letter: "ㅁ", x: signX(-1), z: signZ(4), radius: 1.5 },
  // The well in the middle of the street.
  { id: "learn-well", room: "hangul-village", kind: "learn", action: "inspect", learn: "umul", x: VILLAGE.well.x - 1.3, z: VILLAGE.well.z - 0.6, radius: 1.1 },
  { id: "say-auntie", room: "hangul-village", kind: "say", action: "talk", say: "auntie", npc: "v-well-1", x: npc("v-well-1").x + 0.4, z: npc("v-well-1").z - 1.0, radius: 1.5 },
  { id: "say-vendor", room: "hangul-village", kind: "say", action: "talk", say: "vendor", npc: "v-vendor", x: npc("v-vendor").x - 0.1, z: npc("v-vendor").z + 1.6, radius: 1.5 },

  /* ── Vocabulary Market: things to name, a shopkeeper, the baker ── */
  { id: "word-bread", room: "vocabulary-market", kind: "word", action: "help", npc: baker.id, x: stallFront(-1, stallZ(-1, "빵")).x, z: stallZ(-1, "빵"), radius: 1.6, priority: 1 },
  { id: "learn-mul", room: "vocabulary-market", kind: "learn", action: "learn", learn: "mul", word: "물", ...stallFront(-1, stallZ(-1, "물")), radius: 1.5 },
  { id: "learn-bap", room: "vocabulary-market", kind: "learn", action: "learn", learn: "bap", word: "밥", x: stallFront(-1, 0).x, z: stallZ(-1, "밥") + 1.0, radius: 1.3 },
  { id: "learn-chaek", room: "vocabulary-market", kind: "learn", action: "learn", learn: "chaek", word: "책", ...stallFront(1, stallZ(1, "책")), radius: 1.5 },
  { id: "learn-ot", room: "vocabulary-market", kind: "learn", action: "learn", learn: "ot", word: "옷", x: stallFront(1, 0).x, z: stallZ(1, "옷") - 1.0, radius: 1.2 },
  { id: "learn-kkot", room: "vocabulary-market", kind: "learn", action: "learn", learn: "kkot", word: "꽃", ...stallFront(1, stallZ(1, "꽃")), radius: 1.5 },
  { id: "learn-sagwa", room: "vocabulary-market", kind: "learn", action: "learn", learn: "sagwa", word: "사과", x: MARKET.crates.x + 0.3, z: MARKET.crates.z + MARKET.crates.size / 2 + 0.55, radius: 1.3 },
  { id: "say-shopkeeper", room: "vocabulary-market", kind: "say", action: "talk", say: "shopkeeper", npc: shopkeeper.id, x: stallFront(1, 0).x, z: shopkeeper.z + 0.2, radius: 1.2, priority: 1 },
  // A shopper asking the price; fruit on the produce table; a word to check.
  { id: "say-shopper", room: "vocabulary-market", kind: "say", action: "talk", say: "shopper", npc: "m-shopper", x: npc("m-shopper").x + 0.9, z: npc("m-shopper").z, radius: 1.1 },
  { id: "learn-gwail", room: "vocabulary-market", kind: "learn", action: "learn", learn: "gwail", word: "과일", x: MARKET.tables[0][0], z: MARKET.tables[0][1] + MARKET.tables[0][3] / 2 + 0.6, radius: 1.2 },
  // The little shop: three things on the second produce table, from the square side.
  { id: "shop", room: "vocabulary-market", kind: "shop", action: "shop", shop: "fruit", x: MARKET.tables[MARKET.shop.table][0] - MARKET.tables[MARKET.shop.table][2] / 2 - 0.75, z: MARKET.tables[MARKET.shop.table][1], radius: 1.4, priority: 1 },
  // The food cart, from the middle of the square (its west side).
  { id: "shop-food", room: "vocabulary-market", kind: "shop", action: "shop", shop: "food", x: MARKET.cart.x - MARKET.cart.w / 2 - 0.85, z: MARKET.cart.z, radius: 1.4, priority: 1 },
  { id: "quiz-ppang", room: "vocabulary-market", kind: "quiz", action: "learn", quiz: "ppang", x: MARKET.crates.x - 0.3, z: MARKET.crates.z - MARKET.crates.size / 2 - 0.55, radius: 1.2 },

  /* ── KLOVERS Hub: every gate can be walked up to ── */
  { id: "learn-map", room: "hub", kind: "learn", action: "inspect", learn: "jido", x: 0, z: HUB.post.size / 2 + 0.75, radius: 1.3 },
  { id: "learn-board", room: "hub", kind: "learn", action: "inspect", learn: "gesipan", x: HUB.board.x - 0.9, z: HUB.board.z, radius: 1.2 },
  // A signpost question on the far side of the pavilion: which way is the market?
  { id: "quiz-sijang", room: "hub", kind: "quiz", action: "learn", quiz: "sijang", x: 0, z: -HUB.post.size / 2 - 0.75, radius: 1.3 },
  { id: "say-hub-friend", room: "hub", kind: "say", action: "talk", say: "hubFriend", npc: "h-talk-2", x: npc("h-talk-2").x + 0.9, z: npc("h-talk-2").z + 0.6, radius: 1.4 },
  { id: "say-hub-reader", room: "hub", kind: "say", action: "talk", say: "hubReader", npc: "h-bench-1", x: npc("h-bench-1").x + 1.15, z: npc("h-bench-1").z, radius: 1.3 },
  ...HUB.gates
    .filter((g) => g.kind !== "room")
    .map((g): Interactable => {
      const spot = hubGateSpot(g);
      return g.kind === "link"
        ? { id: g.id, room: "hub", kind: "link", action: "enter", x: spot.x, z: spot.z, radius: 1.8, link: g.id === "hub-games" ? "games" : "lessons" }
        : { id: g.id, room: "hub", kind: "locked", action: "inspect", x: spot.x, z: spot.z, radius: 1.8, notice: hubNotice[g.id] };
    }),

  // The information house's gate (always open), and inside: its own word
  // under the door, then one board per part of the site.
  { id: "door-house", room: "hub", kind: "door", action: "enter", to: "klovers-house", arrive: "fromHub", x: HUB.southGates.house, z: HUB.half - 1.3, radius: 1.1 },
  { id: "learn-annaeso", room: "klovers-house", kind: "learn", action: "inspect", learn: "annaeso", x: 1.7, z: HOUSE.halfDepth - 1.2, radius: 0.9 },
  ...VILLAGE.tour.map((b): Interactable => ({ id: `tour-${b.id}`, room: "hangul-village", kind: "tour", action: "read", tour: b.id, ...tourSpot(b), radius: 1.6 })),
  ...VILLAGE.tourLinks.map((l): Interactable => ({ id: `tourlink-${l.id}`, room: "hangul-village", kind: "link", action: "enter", href: l.href, x: l.x + Math.sin(l.yaw) * 0.9, z: l.z + Math.cos(l.yaw) * 0.9, radius: 1.1, priority: 1 })),
  ...HOUSE.boards.map((b): Interactable => ({ id: `info-${b.id}`, room: "klovers-house", kind: "info", action: "read", info: b.id, ...boardSpot(b), radius: b.id === "about" ? 1.6 : 1.35, priority: 1 })),

  // Every gate into a world that may be locked: inspect it while it is,
  // walk through it (or press E) once it is open.
  ...Object.values(ROOMS).flatMap((room) =>
    room.portals
      .filter((p) => p.lockedNotice)
      .flatMap((p): Interactable[] => {
        const x = (p.zone.minX + p.zone.maxX) / 2;
        const z = (p.zone.minZ + p.zone.maxZ) / 2;
        return [
          { id: `gate-${p.id}`, room: room.id, kind: "locked", action: "inspect", x, z, radius: 1.5, notice: p.lockedNotice, whileLocked: p.to },
          { id: `door-${p.id}`, room: room.id, kind: "door", action: "enter", x, z, radius: 1.4, to: p.to, arrive: p.arrive, whileOpen: p.to },
        ];
      }),
  ),
];

type IsOpen = (r: RoomId) => boolean;

export function usable(it: Interactable, room: RoomId, isOpen: IsOpen): boolean {
  if (it.room !== room) return false;
  if (it.whileLocked && isOpen(it.whileLocked)) return false;
  if (it.whileOpen && !isOpen(it.whileOpen)) return false;
  return true;
}

/**
 * The few usable things around the learner, for the tappable signs that
 * guide a learner to them: within `range` metres, nearest first — and what
 * lies ahead (along `yaw`, the way the view looks) counts as nearer.
 */
export function nearbyInteractables(room: RoomId, x: number, z: number, isOpen: IsOpen, max = 4, range = 10, list = INTERACTABLES, yaw?: number): Interactable[] {
  const fx = yaw === undefined ? 0 : -Math.sin(yaw);
  const fz = yaw === undefined ? 0 : -Math.cos(yaw);
  return list
    .filter((it) => usable(it, room, isOpen))
    .map((it) => {
      const d = Math.hypot(it.x - x, it.z - z);
      const ahead = d > 0.01 ? ((it.x - x) * fx + (it.z - z) * fz) / d : 0;
      return { it, d, score: d - 5 * ahead };
    })
    .filter((e) => e.d <= range)
    .sort((a, b) => a.score - b.score)
    .slice(0, max)
    .map((e) => e.it);
}

/** Nearest interactable in this room within its radius, if any. */
export function nearestInteractable(room: RoomId, x: number, z: number, list = INTERACTABLES, isOpen: IsOpen = () => false): Interactable | undefined {
  let best: Interactable | undefined;
  let bestD = Infinity;
  for (const it of list) {
    if (!usable(it, room, isOpen)) continue;
    const d = Math.hypot(it.x - x, it.z - z);
    if (d <= it.radius && d < bestD) {
      best = it;
      bestD = d;
    }
  }
  return best;
}

/**
 * The one thing to offer now, when several are close: nearest first, then
 * what the learner is facing, then priority — and the current choice holds
 * on a little (a wider radius, a head start), so the prompt never flickers
 * between two neighbours.
 */
export function pickInteractable(
  room: RoomId,
  x: number,
  z: number,
  yaw: number,
  currentId: string | null,
  isOpen: IsOpen,
  extra: Interactable[] = [],
  list = INTERACTABLES,
): Interactable | undefined {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  let best: Interactable | undefined;
  let bestScore = Infinity;
  const consider = (it: Interactable) => {
    if (!usable(it, room, isOpen)) return;
    const d = Math.hypot(it.x - x, it.z - z);
    const held = it.id === currentId;
    if (d > it.radius * (held ? 1.15 : 1)) return;
    const facing = d > 0.3 ? ((it.x - x) * fx + (it.z - z) * fz) / d : 1;
    if (it.needsFacing && facing < (held ? 0.35 : 0.55)) return;
    const score = d / it.radius - 0.35 * facing - 0.15 * (it.priority ?? 0) - (held ? 0.25 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = it;
    }
  };
  for (const it of list) consider(it);
  for (const it of extra) consider(it);
  return best;
}
