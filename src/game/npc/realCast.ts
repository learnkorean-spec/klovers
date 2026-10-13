import type { DressRule } from "../player/RiggedBody";
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
