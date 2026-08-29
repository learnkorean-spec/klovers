/**
 * Leaderboard data access — the six SECURITY DEFINER RPCs added in
 * supabase/migrations/20260828120000_games_leaderboard_rpcs.sql
 *
 * WHY THIS FILE EXISTS AS A NEW MODULE
 * ------------------------------------
 * Everything here is self-contained: it depends only on the RPC contract, which
 * is verified, and on the supabase client. Nothing in it assumes the shape of
 * code it has not seen. That is deliberate — `useLeaderboard.ts` then needs
 * three import swaps instead of a rewrite, and the risky part (matching your
 * existing `LeaderboardEntry`) is isolated to one exported mapper you can check
 * in ten seconds.
 *
 * WHAT IT REPLACES
 * ----------------
 *   XP tab      `.from('xp_leaderboard')`   → 1 row per student (own-row RLS)
 *   Streak tab  `.from('student_streaks')`  → 1 row per student (own-row RLS)
 *   Weekly tab  `.select('...xp_amount...')`→ column does not exist; silent null
 *
 * ⚠️ `types.ts` is not regenerated in CI, so these RPCs are unknown to the
 * generated `.rpc()` name union. `(supabase as any)` matches existing house
 * style (SessionAttendanceManager.tsx:97, EnrollmentChecklist.tsx:92).
 * Drop the casts once someone regenerates types.
 */

import { supabase } from '@/integrations/supabase/client';

/* ------------------------------------------------------------------ raw rows */
/* These match the RPC return types exactly. Note: no `user_id` on any of them —
   student identity never leaves the server. */

export interface XpLeaderboardRow {
  rank: number;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  is_me: boolean;
}

export interface StreakLeaderboardRow {
  rank: number;
  display_name: string;
  avatar_url: string | null;
  current_streak: number;
  is_me: boolean;
}

export interface WeeklyLeaderboardRow {
  rank: number;
  display_name: string;
  avatar_url: string | null;
  week_xp: number;
  is_me: boolean;
}

export interface MyRankRow {
  rank: number;
  out_of: number;
  /** total_xp on get_my_xp_rank, current_streak on get_my_streak_rank */
  value: number;
}

/* ------------------------------------------------------------------ fetchers */

const DEFAULT_LIMIT = 50;

/** All-time XP board. Aggregates above RLS, so it returns every ranked student. */
export async function fetchXpLeaderboard(
  limit = DEFAULT_LIMIT,
): Promise<XpLeaderboardRow[]> {
  const { data, error } = await (supabase as any).rpc('get_xp_leaderboard', {
    p_limit: limit,
  });
  // Throw rather than swallow. The weekly tab was dead from launch precisely
  // because one query's error was never read.
  if (error) throw error;
  return (data ?? []) as XpLeaderboardRow[];
}

/** Current-streak board. Students with a streak of 0 are excluded. */
export async function fetchStreakLeaderboard(
  limit = DEFAULT_LIMIT,
): Promise<StreakLeaderboardRow[]> {
  const { data, error } = await (supabase as any).rpc('get_streak_leaderboard', {
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as StreakLeaderboardRow[];
}

/**
 * XP earned since the start of the current week.
 * The week boundary is Africa/Cairo, computed server-side — not UTC and not the
 * device. Delete any client-side week arithmetic near the call site rather than
 * adjusting it.
 */
export async function fetchWeeklyLeaderboard(
  limit = DEFAULT_LIMIT,
): Promise<WeeklyLeaderboardRow[]> {
  const { data, error } = await (supabase as any).rpc('get_weekly_leaderboard', {
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as WeeklyLeaderboardRow[];
}

/**
 * The caller's own XP rank, present even when they fall outside `limit`.
 *
 * This is what actually closes the rank cliff. Deriving rank with `findIndex`
 * over the returned window gives -1 for anyone ranked past the limit — invisible
 * today (the broken query returns one row) and live the moment the board starts
 * returning everyone.
 *
 * Returns null when the student has no XP at all.
 */
export async function fetchMyXpRank(): Promise<MyRankRow | null> {
  const { data, error } = await (supabase as any).rpc('get_my_xp_rank');
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return { rank: row.rank, out_of: row.out_of, value: row.total_xp };
}

/**
 * The caller's own streak rank.
 *
 * Returns null for a student whose current streak is 0 — matching the board,
 * which excludes them. Render that as "no rank yet", never as #0.
 */
export async function fetchMyStreakRank(): Promise<MyRankRow | null> {
  const { data, error } = await (supabase as any).rpc('get_my_streak_rank');
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return { rank: row.rank, out_of: row.out_of, value: row.current_streak };
}

/* ------------------------------------------------------------------- mapper */

/**
 * Mapped to the REAL `LeaderboardEntry` from `useLeaderboard.ts:5-12`:
 *
 *   { user_id: string; name: string; avatar_url: string | null;
 *     value: number; rank: number; isCurrentUser: boolean }
 *
 * An earlier draft of this file emitted `isMe` and omitted `user_id`. Both were
 * wrong, and neither would have crashed:
 *
 *   - `isMe` → `entry.isCurrentUser` is undefined → falsy → the amber ring, the
 *     "(You)" tag and the Arabic "(أنت)" never render, for anyone. The board
 *     fills with names and totals and no student can find herself in it — which
 *     is the single thing this whole fix exists to deliver.
 *   - missing `user_id` → undefined React keys on every row → duplicate-key
 *     warnings and unstable reconciliation, visible as rows swapping during the
 *     realtime refetch.
 *
 * `user_id` is deliberately absent from the RPC rows (identity never leaves the
 * server) and is used only as a React key here. `rank` is unique per board, so
 * `rank-N` is a stable, correct substitute.
 *
 * Consumers, for reference:
 *   LeaderboardCard.tsx:50            entry.name.slice(0, 2)
 *   LeaderboardCard.tsx:66            entry.value.toLocaleString()
 *   LeaderboardCard.tsx:126           entry.isCurrentUser
 *   GamesPage.tsx:322, 324, 325, 328  p.isCurrentUser, p.value
 *   LeaderboardCard.tsx:120/154/187   key={entry.user_id}
 */
export interface LeaderboardEntryLike {
  user_id: string;
  name: string;
  avatar_url: string | null;
  value: number;
  rank: number;
  isCurrentUser: boolean;
}

export function toEntries(
  rows: Array<XpLeaderboardRow | StreakLeaderboardRow | WeeklyLeaderboardRow>,
): LeaderboardEntryLike[] {
  return rows.map((r) => ({
    user_id: `rank-${r.rank}`,
    name: r.display_name,
    avatar_url: r.avatar_url,
    value:
      'total_xp' in r ? r.total_xp
      : 'week_xp' in r ? r.week_xp
      : r.current_streak,
    rank: r.rank,
    isCurrentUser: r.is_me,
  }));
}

/* ------------------------------------------------------------- convenience */

export interface LeaderboardBundle {
  xpLeaderboard: LeaderboardEntryLike[];
  streakLeaderboard: LeaderboardEntryLike[];
  weeklyLeaderboard: LeaderboardEntryLike[];
  currentUserXpRank: number | null;
  currentUserStreakRank: number | null;
  /** Non-empty when one or more of the five reads failed. See the note below. */
  errors: unknown[];
}

/**
 * All five reads in one round of parallel requests.
 *
 * ⚠️ DELIBERATE CHOICE: `allSettled`, not `all`.
 *
 * The individual fetchers throw rather than swallow — that is the correction
 * that matters, because swallowing is exactly why the weekly tab was dead from
 * launch. But `Promise.all` over five throwing fetchers turns one transient RPC
 * failure into a completely blank card: all three tabs and both ranks gone.
 *
 * `allSettled` degrades per tab instead. A failed streak query blanks the streak
 * tab; the XP board still renders. Failures are collected in `errors` rather
 * than discarded, so the caller can log them — silence is what created the
 * original bug, and this must not reintroduce it.
 *
 * If you would rather fail the whole card atomically, swap this for
 * `Promise.all` — just make it a decision, not an accident.
 */
export async function fetchLeaderboardBundle(
  limit = DEFAULT_LIMIT,
): Promise<LeaderboardBundle> {
  const [xp, streak, weekly, myXp, myStreak] = await Promise.allSettled([
    fetchXpLeaderboard(limit),
    fetchStreakLeaderboard(limit),
    fetchWeeklyLeaderboard(limit),
    fetchMyXpRank(),
    fetchMyStreakRank(),
  ]);

  const errors: unknown[] = [];
  const take = <T,>(r: PromiseSettledResult<T>, fallback: T): T => {
    if (r.status === 'fulfilled') return r.value;
    errors.push(r.reason);
    return fallback;
  };

  return {
    xpLeaderboard: toEntries(take(xp, [])),
    streakLeaderboard: toEntries(take(streak, [])),
    weeklyLeaderboard: toEntries(take(weekly, [])),
    currentUserXpRank: take(myXp, null)?.rank ?? null,
    currentUserStreakRank: take(myStreak, null)?.rank ?? null,
    errors,
  };
}
