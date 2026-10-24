import { ALLEY, boardSpot, CAFE, CULTURE, GARDEN, HOUSE, SEOUL, HUB, hubGateSpot, MARKET, ROOMS, tourSpot, VILLAGE, type InfoId, type NoticeKey, type RoomId, type TourStop } from "./rooms";
import { ALLEY_FRIEND, CAFE_FRIEND, CULTURE_FRIEND, FRIEND_SPOT, MINSU_SPOT, NPCS, SEOUL_FRIEND } from "./npcs";
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
export type InteractionKind = "egg" | "letter" | "learn" | "quiz" | "word" | "say" | "talk" | "cluby" | "link" | "door" | "locked" | "info" | "tour" | "shop" | "review";

/** The verb on the prompt ([E] Inspect, the round button's label …). */
export type InteractionAction = "inspect" | "talk" | "learn" | "enter" | "help" | "read" | "shop" | "order" | "review";

/** Learning cards (words and letters). Text per language: copy.learn[id]. */
export type LearnId =
  | "seokdeung" | "beotnamu" | "nieun" | "digeut" | "mieum" | "o" | "umul"
  | "mul" | "bap" | "chaek" | "ot" | "kkot" | "sagwa" | "gwail" | "jido" | "gesipan" | "annaeso" | "keopi"
  | "kimchi" | "bibimbap" | "tteokbokki" | "sinbal" | "hanbok" | "seollal" | "chuseok"
  | "jihacheol" | "beoseu" | "pyeonuijeom" | "sikdang" | "namsan"
  | "golmok" | "eolmayeyo" | "hotteok" | "eomuk" | "gimbap";
/** One-question cards. Text per language: copy.quiz[id]. */
export type QuizId = "a" | "rieul" | "eo" | "u" | "ppang" | "sijang" | "insa" | "meal" | "gil" | "gyesan" | "kkakka" | "masisseo";
/** The market's two shops (the fruit table, the food cart) and the café counter. */
export type ShopId = "fruit" | "food" | "cafe";
/** Which things each shop sells (the words are in copy.shop.items). */
export const SHOP_ITEMS: Record<ShopId, readonly string[]> = { fruit: MARKET.shop.items, food: MARKET.cart.items, cafe: CAFE.items };
export const shopOf = (item: string): ShopId => (SHOP_ITEMS.cafe.includes(item) ? "cafe" : SHOP_ITEMS.food.includes(item) ? "food" : "fruit");
/** What one of each costs, in won (whole thousands, so every total is a Sino-Korean 천). */
export const SHOP_PRICES: Record<string, number> = { 사과: 1000, 물: 1000, 꽃: 2000, 빵: 2000, 밥: 3000, 우유: 1000, 커피: 3000, 녹차: 2000, 케이크: 3000 };
/** Thousands in Sino-Korean, for prices: 1 → 천, 2 → 이천 … 9 → 구천. */
const THOUSANDS = ["", "천", "이천", "삼천", "사천", "오천", "육천", "칠천", "팔천", "구천"];
/** A price in won, read the Korean way ("삼천 원"); up to 9,000. */
export const wonInKorean = (won: number): string => `${THOUSANDS[Math.round(won / 1000)] ?? won} 원`;
/** People's short lines. Text per language: copy.say[id]. */
export type SayId = "auntie" | "vendor" | "shopkeeper" | "baker" | "hubFriend" | "hubReader" | "shopper" | "cafeA" | "cafeB" | "cook" | "twoHands" | "newYear" | "friendCafe" | "friendCulture" | "friendSeoul" | "attendant" | "owner" | "friendMarket" | "deom" | "grandpa" | "alleyCafe";

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

  /* ── Conversation Café: the menu, the counter, a table that talks ── */
  // The menu board on the north wall, beside the counter.
  { id: "learn-keopi", room: "conversation-cafe", kind: "learn", action: "learn", learn: "keopi", word: "커피", x: -4.9, z: -CAFE.halfDepth + 1.4, radius: 1.3 },
  // Order from the barista, at the front of the counter.
  { id: "shop-cafe", room: "conversation-cafe", kind: "shop", action: "order", shop: "cafe", npc: "k-barista", x: 0.9, z: CAFE.counter.z + CAFE.counter.d / 2 + 0.85, radius: 1.5, priority: 1 },
  // The other learner, by the counter: ordering together.
  { id: "say-friend-cafe", room: "conversation-cafe", kind: "say", action: "talk", say: "friendCafe", x: CAFE_FRIEND.x, z: CAFE_FRIEND.z, radius: 1.7 },
  // Two students at a table, from the aisle in front of them.
  { id: "say-cafe-a", room: "conversation-cafe", kind: "say", action: "talk", say: "cafeA", npc: "k-table-1", x: npc("k-table-1").x - 0.2, z: npc("k-table-1").z + 1.15, radius: 1.0 },
  { id: "say-cafe-b", room: "conversation-cafe", kind: "say", action: "talk", say: "cafeB", npc: "k-table-2", x: npc("k-table-2").x + 0.2, z: npc("k-table-2").z + 1.15, radius: 1.0 },

  /* ── Culture Street: one stop per piece of everyday culture ── */
  // The other learner at the start of the street: walking it together.
  { id: "say-friend-culture", room: "culture-street", kind: "say", action: "talk", say: "friendCulture", x: CULTURE_FRIEND.x, z: CULTURE_FRIEND.z, radius: 1.7 },
  // The elder in the first doorway: greet them properly.
  { id: "quiz-insa", room: "culture-street", kind: "quiz", action: "talk", quiz: "insa", npc: "c-elder", x: CULTURE.elder.x + 1.45, z: CULTURE.elder.z, radius: 1.4, priority: 1 },
  // Shoes left on a hanok step.
  { id: "learn-sinbal", room: "culture-street", kind: "learn", action: "learn", learn: "sinbal", word: "신발", x: CULTURE.step.x - 1.35, z: CULTURE.step.z, radius: 1.3 },
  // The food stall: three dishes on its counter, and the cook.
  ...(["kimchi", "bibimbap", "tteokbokki"] as const).map((id, i): Interactable => ({
    id: `learn-${id}`, room: "culture-street", kind: "learn", action: "learn", learn: id, word: ["김치", "비빔밥", "떡볶이"][i],
    x: CULTURE.stall.x + CULTURE.stall.w / 2 + 0.75, z: CULTURE.stall.z + (i - 1) * 1.0, radius: 0.75,
  })),
  { id: "say-cook", room: "culture-street", kind: "say", action: "talk", say: "cook", npc: "c-cook", x: CULTURE.stall.x + CULTURE.stall.w / 2 + 0.75, z: CULTURE.stall.z + 2.0, radius: 0.8 },
  // The table across the street: what to say before eating.
  { id: "quiz-meal", room: "culture-street", kind: "quiz", action: "learn", quiz: "meal", x: CULTURE.table.x - 1.2, z: CULTURE.table.z, radius: 1.2 },
  // The hanbok shop: its seller hands things over with both hands.
  { id: "say-two-hands", room: "culture-street", kind: "say", action: "talk", say: "twoHands", npc: "c-seller", x: CULTURE.hanbok.x - 1.0, z: CULTURE.hanbok.z + 1.6, radius: 1.1 },
  { id: "learn-hanbok", room: "culture-street", kind: "learn", action: "learn", learn: "hanbok", word: "한복", x: CULTURE.hanbok.x - 1.2, z: CULTURE.hanbok.z, radius: 1.0 },
  // Under the festival arch: the two great holidays, and a neighbour in hanbok.
  { id: "learn-seollal", room: "culture-street", kind: "learn", action: "learn", learn: "seollal", word: "설날", x: -2.6, z: CULTURE.arch.z + 1.6, radius: 1.2 },
  { id: "learn-chuseok", room: "culture-street", kind: "learn", action: "learn", learn: "chuseok", word: "추석", x: 3.1, z: CULTURE.arch.z + 1.6, radius: 1.0 },
  { id: "say-new-year", room: "culture-street", kind: "say", action: "talk", say: "newYear", npc: "c-neighbour", x: 1.0, z: CULTURE.arch.z + 2.2, radius: 1.0 },

  /* ── Seoul Journey (part 1): a Seoul street corner ── */
  // The other learner at the corner, looking at the tower.
  { id: "say-friend-seoul", room: "seoul-journey", kind: "say", action: "talk", say: "friendSeoul", x: SEOUL_FRIEND.x, z: SEOUL_FRIEND.z, radius: 1.7 },
  // The subway: its entrance (지하철), and the attendant at the top of the steps.
  { id: "learn-jihacheol", room: "seoul-journey", kind: "learn", action: "learn", learn: "jihacheol", word: "지하철", x: SEOUL.subway.x + 0.4, z: SEOUL.subway.z + SEOUL.subway.d / 2 + 0.8, radius: 1.2 },
  { id: "say-attendant", room: "seoul-journey", kind: "say", action: "talk", say: "attendant", npc: "s-attendant", x: npc("s-attendant").x + 0.9, z: npc("s-attendant").z + 0.9, radius: 1.1, priority: 1 },
  // Someone asks the way to the convenience store.
  { id: "quiz-gil", room: "seoul-journey", kind: "quiz", action: "talk", quiz: "gil", npc: "s-asker", x: npc("s-asker").x - 1.1, z: npc("s-asker").z, radius: 1.2, priority: 1 },
  { id: "learn-pyeonuijeom", room: "seoul-journey", kind: "learn", action: "learn", learn: "pyeonuijeom", word: "편의점", x: SEOUL.halfWidth - 1.3, z: SEOUL.store.z, radius: 1.4 },
  // The bus stop on the west kerb.
  { id: "learn-beoseu", room: "seoul-journey", kind: "learn", action: "learn", learn: "beoseu", word: "버스", x: SEOUL.bus.x + 1.5, z: SEOUL.bus.z - 0.6, radius: 1.2 },
  // The restaurant: its name, the bill at the outdoor table, the owner.
  { id: "learn-sikdang", room: "seoul-journey", kind: "learn", action: "learn", learn: "sikdang", word: "식당", x: SEOUL.halfWidth - 1.3, z: SEOUL.restaurant.z - 1.6, radius: 1.0 },
  { id: "quiz-gyesan", room: "seoul-journey", kind: "quiz", action: "learn", quiz: "gyesan", x: SEOUL.table.x - 1.25, z: SEOUL.table.z, radius: 1.1 },
  { id: "say-owner", room: "seoul-journey", kind: "say", action: "talk", say: "owner", npc: "s-owner", x: npc("s-owner").x - 1.1, z: npc("s-owner").z, radius: 1.0, priority: 1 },
  // The tower viewer at the north kerb: Namsan Tower.
  { id: "learn-namsan", room: "seoul-journey", kind: "learn", action: "learn", learn: "namsan", word: "남산타워", x: SEOUL.viewer.x, z: SEOUL.viewer.z + 1.0, radius: 1.1 },

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

  /* ── Seoul Journey part 1 → part 2: line 2 to the market alley ── */
  { id: "gate-subway-market", room: "seoul-journey", kind: "locked", action: "inspect", x: SEOUL.subway.x - 1.2, z: SEOUL.subway.z + SEOUL.subway.d / 2 + 0.55, radius: 1.0, notice: "seoulMarketLocked", whileLocked: "seoul-market" },
  { id: "door-subway-market", room: "seoul-journey", kind: "door", action: "enter", x: SEOUL.subway.x - 1.2, z: SEOUL.subway.z + SEOUL.subway.d / 2 + 0.55, radius: 1.0, to: "seoul-market", arrive: "fromSubway", whileOpen: "seoul-market" },

  /* ── Seoul Journey part 2: the market alley (골목 시장) ── */
  { id: "door-alley-subway", room: "seoul-market", kind: "door", action: "enter", x: ALLEY.exit.x, z: ALLEY.exit.z - ALLEY.exit.d / 2 - 0.7, radius: 1.1, to: "seoul-journey", arrive: "fromMarket" },
  { id: "say-friend-market", room: "seoul-market", kind: "say", action: "talk", say: "friendMarket", x: ALLEY_FRIEND.x - 0.2, z: ALLEY_FRIEND.z - 0.9, radius: 1.5 },
  { id: "learn-golmok", room: "seoul-market", kind: "learn", action: "learn", learn: "golmok", word: "골목", x: -1.9, z: ALLEY.archZ - 0.2, radius: 1.1 },
  // The fruit stall: its price card, then the keeper — ask the price, then bargain.
  { id: "learn-eolmayeyo", room: "seoul-market", kind: "learn", action: "learn", learn: "eolmayeyo", word: "얼마예요?", x: -(ALLEY.stallX - 0.85), z: 7.7, radius: 1.0 },
  { id: "quiz-kkakka", room: "seoul-market", kind: "quiz", action: "talk", quiz: "kkakka", npc: "a-fruit", x: -(ALLEY.stallX - 0.85), z: 5.5, radius: 1.0, priority: 1 },
  { id: "say-deom", room: "seoul-market", kind: "say", action: "talk", say: "deom", npc: "a-banchan", x: ALLEY.stallX - 0.85, z: 6.2, radius: 1.1, priority: 1 },
  // The street-food cart: three dishes on its west side, the cook behind.
  ...(["hotteok", "eomuk", "gimbap"] as const).map((id, i): Interactable => ({
    id: `learn-${id}`, room: "seoul-market", kind: "learn", action: "learn", learn: id, word: ["호떡", "어묵", "김밥"][i],
    x: ALLEY.cart.x - ALLEY.cart.w / 2 - 0.7, z: ALLEY.cart.z + (i - 1) * 1.0, radius: 0.7,
  })),
  { id: "quiz-masisseo", room: "seoul-market", kind: "quiz", action: "talk", quiz: "masisseo", npc: "a-cook", x: ALLEY.cart.x + 1.1, z: ALLEY.cart.z + ALLEY.cart.d / 2 + 0.75, radius: 0.9, priority: 1 },
  // The elder on the bench by the café, and the barista.
  { id: "say-grandpa", room: "seoul-market", kind: "say", action: "talk", say: "grandpa", npc: "a-grandpa", x: ALLEY.bench.x, z: ALLEY.bench.z + 1.3, radius: 1.2, priority: 1 },
  { id: "say-alley-cafe", room: "seoul-market", kind: "say", action: "talk", say: "alleyCafe", npc: "a-barista", x: 1.3, z: -11.0, radius: 1.1, priority: 1 },

  /* ── Cluby's Memory Garden: the memory stone, where words come back ── */
  { id: "review-garden", room: "memory-garden", kind: "review", action: "review", x: GARDEN.stone.x, z: GARDEN.stone.z + 1.05, radius: 1.5, priority: 1 },

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
