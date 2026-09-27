import { HUB, hubGateSpot, MARKET, VILLAGE, type NoticeKey, type RoomId } from "./rooms";
import { PROPS } from "./world";

/**
 * Things the learner can walk up to. Standing within `radius` focuses one
 * (the nearest); E, or the round button on touch screens, uses it. The 3D
 * world only notices the focus — what happens next is ordinary web UI in
 * WorldPage (cards, links), per the rule "complex UI stays HTML".
 *
 * Kinds:
 * - egg      the clover egg (story beat; hatch only on real progress)
 * - letter   a Hangul letter card (Hangul Village)
 * - word     pick the word for an object (Vocabulary Market)
 * - link     a door out to a page of the site (Hub)
 * - locked   a gate to a world that is not open yet: just says so
 */
export type InteractionKind = "egg" | "letter" | "word" | "link" | "locked";

export interface Interactable {
  id: string;
  room: RoomId;
  kind: InteractionKind;
  x: number;
  z: number;
  radius: number;
  /** Kind-specific payload. */
  link?: "games" | "lessons";
  notice?: NoticeKey;
}

/** The ㄱ house: first on the left, nearest the village gate. */
const firstHouseZ = VILLAGE.houseZ[VILLAGE.houseZ.length - 1] + 0.9;
/** The bread stall: its sign is missing until the learner names it. */
const breadZ = MARKET.stallZ[0];

const hubNotice: Record<string, NoticeKey> = {
  "hub-culture": "cultureLocked",
  "hub-seoul": "seoulLocked",
  "hub-garden": "gardenLocked",
};

export const INTERACTABLES: Interactable[] = [
  { id: "egg", room: "courtyard", kind: "egg", x: PROPS.eggPlinth.x, z: PROPS.eggPlinth.z, radius: 2.3 },
  { id: "letter-giyeok", room: "hangul-village", kind: "letter", x: -VILLAGE.halfWidth + 0.6, z: firstHouseZ, radius: 1.7 },
  { id: "word-bread", room: "vocabulary-market", kind: "word", x: -MARKET.stallX + MARKET.stallW / 2 + 0.7, z: breadZ, radius: 1.6 },
  ...HUB.gates
    .filter((g) => g.kind !== "room")
    .map((g): Interactable => {
      const spot = hubGateSpot(g);
      return g.kind === "link"
        ? { id: g.id, room: "hub", kind: "link", x: spot.x, z: spot.z, radius: 1.8, link: g.id === "hub-games" ? "games" : "lessons" }
        : { id: g.id, room: "hub", kind: "locked", x: spot.x, z: spot.z, radius: 1.8, notice: hubNotice[g.id] };
    }),
];

/** Nearest interactable in this room within its radius, if any. */
export function nearestInteractable(room: RoomId, x: number, z: number, list = INTERACTABLES): Interactable | undefined {
  let best: Interactable | undefined;
  let bestD = Infinity;
  for (const it of list) {
    if (it.room !== room) continue;
    const d = Math.hypot(it.x - x, it.z - z);
    if (d <= it.radius && d < bestD) {
      best = it;
      bestD = d;
    }
  }
  return best;
}
