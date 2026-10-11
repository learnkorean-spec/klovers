import { KLOVERS_WORLD } from "@/config/klovers-world";
import { LEVELS, normalizeLevel } from "@/constants/levels";
import type { RoomId } from "../config/rooms";

/**
 * Which worlds a learner may walk into — from real data only.
 *
 * The rule is the same level → world map the dashboard journey uses
 * (KLOVERS_WORLD.levelJourney): a learner's current course level opens its
 * own world and every world before it. So a Level 1 learner (Hangul done)
 * reaches the Vocabulary Market; Level 2 (ready for conversation) reaches
 * the Conversation Café. Guests and learners without a level get Hangul
 * Village, the canon's open first world. Experienced learners are never made
 * to replay beginner worlds (canon: "never force experienced users to replay
 * beginner progression").
 *
 * Admins (the teacher) see every built world as a labelled preview — that is
 * a review tool, not learner progress, and is never shown as progress.
 */

export interface WorldAccess {
  open: ReadonlySet<RoomId>;
  /** True when the set was widened for an admin preview. */
  preview: boolean;
  /** Signed in (decides where "lessons" leads and what the egg suggests). */
  signedIn: boolean;
}

/** Rooms that are canon worlds; anything else (the courtyard) is always open. */
const WORLD_ROOMS: readonly RoomId[] = ["hangul-village", "vocabulary-market", "conversation-cafe"];

/** Rooms that are never gated: the courtyard, the Hub and its information house are not worlds. */
const ALWAYS: RoomId[] = ["courtyard", "hangul-village", "hub", "klovers-house"];

export const GUEST_ACCESS: WorldAccess = { open: new Set<RoomId>(ALWAYS), preview: false, signedIn: false };

export function worldAccess(levelKey: string | null | undefined, isAdmin: boolean): WorldAccess {
  if (isAdmin) return { open: new Set<RoomId>([...ALWAYS, ...WORLD_ROOMS]), preview: true, signedIn: true };

  const key = normalizeLevel(levelKey || "");
  const ordered = [...LEVELS].sort((a, b) => a.order - b.order);
  const current = ordered.findIndex((l) => l.key === key);
  if (current < 0) return { ...GUEST_ACCESS, signedIn: true };

  const journey: Record<string, unknown> = KLOVERS_WORLD.levelJourney;
  const worldOf = (key: string): string | undefined => {
    const stop = journey[key];
    return stop && typeof stop === "object" && "world" in stop ? String((stop as { world: unknown }).world) : undefined;
  };
  const reached = new Set<string>(ordered.slice(0, current + 1).map((l) => worldOf(l.key)).filter((w): w is string => !!w));
  const open = new Set<RoomId>(ALWAYS);
  for (const room of WORLD_ROOMS) if (reached.has(room)) open.add(room);
  return { open, preview: false, signedIn: true };
}
