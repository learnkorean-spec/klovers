/**
 * Server-authoritative game XP — wraps award_game_xp, added in
 * supabase/migrations/20260828120200_game_xp_rules_and_award_rpc.sql
 *
 * WHAT CHANGES
 * ------------
 * Before: the browser computed `score * XP_VALUES.game_complete` and inserted
 * the row itself. The RLS policy checked only WHO the row belonged to — not the
 * amount, not the activity type, not how often. Any student could insert any
 * number from the console.
 *
 * After: the client sends a game id and a score. The server looks up the game's
 * own rules, clamps the score to that game's real round ceiling, computes the
 * XP, and writes the row.
 *
 * ⚠️ THIS IS A NO-OP ON AWARD AMOUNTS. Verified against every value production
 * has actually paid:
 *
 *   match     score 6  → 30    (all 11 production rows are exactly 30)
 *   hangul    score 18 → 90    (5 rows at exactly 90; nothing above)
 *   sentence  score 8  → 40
 *   flashcard score 12 → 60    (ceiling never reached in production)
 *   any 10-round game  → 50
 *   vocab_daily        → 25
 *
 * Moving scoring server-side is a security refactor. Changing what a game pays
 * is a separate, deliberate PR.
 */

import { supabase } from '@/integrations/supabase/client';

export interface AwardGameXpResult {
  /** XP written for this play. Always equals what was actually stored. */
  awarded: number;
  /** The student's total XP for the current Africa/Cairo calendar day. */
  totalToday: number;
}

/**
 * Award XP for a finished game.
 *
 * @param gameId  The game's id — `'match'`, NOT `'game_match'`. The server
 *                builds `'game_' || p_game_id` itself, which is why the two
 *                runtime-generated activity types keep working.
 * @param score   The raw score from the game component. The server clamps it to
 *                that game's ceiling, so a tampered value cannot inflate the
 *                award; it does not need sanitising here.
 *
 * Throws if the game id is unknown or inactive (Postgres 22023) or if there is
 * no authenticated session (28000). Both are real errors — do not swallow them
 * into a 0 award, or a student silently plays for nothing.
 */
export async function awardGameXpServer(
  gameId: string,
  score: number,
): Promise<AwardGameXpResult> {
  const { data, error } = await (supabase as any).rpc('award_game_xp', {
    p_game_id: gameId,
    p_score: score,
  });

  if (error) throw error;

  // The RPC returns TABLE(...), so PostgREST delivers an array — data[0], not data.
  const row = data?.[0];

  return {
    awarded: row?.awarded ?? 0,
    totalToday: row?.total_today ?? 0,
  };
}

/**
 * Drop-in shape for the existing `awardGameXp(gameId, score, totalRounds)`.
 *
 * `totalRounds` is accepted and ignored on purpose: the rules table is the
 * trustworthy ceiling, and the one call that a `score > totalRounds` check would
 * reject is `awardGameXp("vocab_daily", 5, 1)` (StudentDashboard.tsx:721) — a
 * live production path that has awarded 25 XP twelve times. Validating it would
 * stop that award on day one.
 *
 * Keeping the parameter means call sites need no edits.
 *
 * ⚠️ RETURNS THE AWARDED NUMBER, AND MUST KEEP DOING SO.
 * GamesPage.tsx:111-114 consumes the return value to drive the XP float
 * animation and the toast. Drop the return and both silently stop firing —
 * a cosmetic-only regression, which is exactly the kind that ships unnoticed.
 */
export async function awardGameXpCompat(
  gameId: string,
  score: number,
  _totalRounds?: number,
): Promise<number> {
  const { awarded } = await awardGameXpServer(gameId, score);
  return awarded;
}
