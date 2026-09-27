/**
 * Short-lived reactions of the people in the world, outside React: a
 * person answered, or pleased (the baker's sign is back). The page asks for
 * one; the person's own frame loop plays it. Nothing here is saved.
 */
const until = new Map<string, number>();

/** This person gestures (a wave and a small lift) for `ms`. */
export function cheer(npcId: string, ms = 1600): void {
  until.set(npcId, performance.now() + ms);
}

/** 0 when still, rising to 1 while a reaction plays. */
export function cheerAmount(npcId: string, now: number): number {
  const t = until.get(npcId);
  if (!t || now >= t) return 0;
  return Math.min(1, (t - now) / 300);
}
