import type { DressRule } from "../player/RiggedBody";
import { Color } from "three";
import { CAST, type CastId } from "./cast";

/**
 * Which real (Mixamo) person plays each part, and the clothes colours from
 * the cast list (config stays in cast.ts): five bodies, recoloured, make the
 * fifteen people of the world without anyone looking like a twin up close.
 */
const BODY: Record<CastId, { model: string; female: boolean }> = {
  minsu: { model: "npc-leonard", female: false },
  gardener: { model: "npc-brian", female: false },
  elder: { model: "npc-brian", female: false },
  vendor: { model: "npc-brian", female: false },
  porter: { model: "npc-brian", female: false },
  readerB: { model: "npc-joe", female: false },
  student2: { model: "npc-joe", female: false },
  friendA: { model: "npc-joe", female: false },
  readerA: { model: "npc-elizabeth", female: true },
  auntie: { model: "npc-elizabeth", female: true },
  shopper: { model: "npc-elizabeth", female: true },
  student1: { model: "npc-megan", female: true },
  walker: { model: "npc-megan", female: true },
  barista: { model: "npc-megan", female: true },
  friendB: { model: "npc-megan", female: true },
};

/**
 * Each person's own look, from their id, so no two people are twins and
 * everyone in Korea looks Korean: the base body is picked per person (among
 * the bodies of their gender, not one per role), hair is black or very dark
 * brown (grey for elders), skin is shifted to one of six Korean skin tones
 * (a tint: lips, brows and eyes keep their own colours), clothes take their
 * own shade of the role's colours, and height follows Korean averages.
 *
 * The two learners (Adam and Lina) are not people of this list: the canon
 * makes them foreign learners (ethnicityRule "not_korean_and_not_asian").
 */
const MALE_BODIES = ["npc-joe", "npc-leonard", "npc-brian"];
const FEMALE_BODIES = ["npc-elizabeth", "npc-megan"];
/** Korean skin tones, light to tan (sRGB). */
const SKIN_KO = ["#EECFB6", "#E8C6A9", "#E0BC9C", "#D8B190", "#CFA683", "#C69A76"];
const HAIR_KO = ["#100D0C", "#16110E", "#1C1511", "#231A14", "#2B1F17"];
const HAIR_GREY = ["#8E8A86", "#A29E99", "#76726E"];
/** Roles who keep the body chosen for them (named characters people recognise). */
const FIXED_BODY = new Set<CastId>(["minsu"]);

function hash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface PersonLook {
  model: string;
  female: boolean;
  rules: DressRule[];
  /** Multiplies the role's own scale. */
  scale: number;
}

const people = new Map<string, PersonLook>();

/** One person's look, stable for their id (salt picks another variation of it). */
export function realPerson(cast: CastId, personId: string, salt = 0): PersonLook {
  const key = `${cast}|${personId}|${salt}`;
  const hit = people.get(key);
  if (hit) return hit;
  const h = hash(salt ? `${personId}#${salt}` : personId);
  const pick = <T,>(list: readonly T[], salt: number) => list[(h >>> salt) % list.length];
  const base = BODY[cast];
  const model = FIXED_BODY.has(cast) ? base.model : pick(base.female ? FEMALE_BODIES : MALE_BODIES, 3);
  const c = CAST[cast] as { top: string; over?: string; lower: { color: string }; hair?: string };
  const older = cast === "elder" || cast === "gardener";
  const shade = (hex: string, salt: number) => {
    const col = new Color(hex);
    col.offsetHSL(0, 0, (((h >>> salt) % 9) - 4) * 0.025);
    return `#${col.getHexString()}`;
  };
  const rules: DressRule[] = [
    { match: /_Hair/, color: older ? pick(HAIR_GREY, 5) : pick(HAIR_KO, 7), contrast: 0.85 },
    { match: /_Body$/, color: pick(SKIN_KO, 11), tint: true },
    { match: /Suit|Sweater/, color: shade(c.over ?? c.top, 13) },
    { match: /Shirt|Collar/, color: shade(c.top, 15) },
    { match: /Pants/, color: shade(c.lower.color, 17) },
  ];
  // Korean average heights (≈1.73 m men, 1.61 m women) against the models'.
  const scale = (base.female ? 0.95 : 0.98) + (((h >>> 19) % 7) - 3) * 0.012;
  const look = { model, female: base.female, rules, scale };
  people.set(key, look);
  return look;
}

const cache = new Map<CastId, DressRule[]>();

export function realCast(id: CastId): { model: string; female: boolean; rules: DressRule[] } {
  let rules = cache.get(id);
  if (!rules) {
    const c = CAST[id] as { top: string; over?: string; lower: { color: string } };
    rules = [
      { match: /Suit|Sweater/, color: c.over ?? c.top },
      { match: /Shirt|Collar/, color: c.top },
      { match: /Pants/, color: c.lower.color },
    ];
    cache.set(id, rules);
  }
  return { ...BODY[id], rules };
}

/** What makes two people look alike: the same body, hair and skin. */
const lookKey = (p: PersonLook) => `${p.model}|${p.rules[0].color}|${p.rules[1].color}`;
const assigned = new Map<string, PersonLook>();

/**
 * A person's look, guaranteed different from everyone else in their room:
 * people are taken in list order, and anyone whose look is already used in
 * that room takes their next variation until it is free.
 */
export function realPersonInRoom(n: { id: string; room: string; cast: CastId }, everyone: readonly { id: string; room: string; cast: CastId }[]): PersonLook {
  const hit = assigned.get(n.id);
  if (hit) return hit;
  const used = new Set<string>();
  for (const m of everyone) {
    if (m.room !== n.room) continue;
    let look = realPerson(m.cast, m.id);
    for (let salt = 1; used.has(lookKey(look)) && salt < 50; salt++) look = realPerson(m.cast, m.id, salt);
    used.add(lookKey(look));
    assigned.set(m.id, look);
  }
  return assigned.get(n.id) ?? realPerson(n.cast, n.id);
}
