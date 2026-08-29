import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchLeaderboardBundle } from "@/lib/leaderboardApi";

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  value: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  xpLeaderboard: LeaderboardEntry[];
  streakLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  currentUserXpRank: number | null;
  currentUserStreakRank: number | null;
  loading: boolean;
}

/**
 * All three boards now come from SECURITY DEFINER RPCs
 * (supabase/migrations/20260828120000_games_leaderboard_rpcs.sql).
 *
 * What was wrong before, one bug per tab:
 *   XP      `.from('xp_leaderboard')` — the view is security_invoker=true and
 *           student_xp RLS is own-row-only, so it returned exactly one row.
 *   Streak  `.from('student_streaks')` — same own-row RLS, same one row.
 *   Weekly  `.select('user_id, xp_amount')` — no such column (it is xp_earned).
 *           PostgREST rejected the request, the error was never destructured,
 *           and the `if (weeklyXpData)` guard silently skipped the whole block.
 *           This tab never rendered a row, and no database fix touches it.
 *
 * Rank is now computed server-side by row_number(). The old local derivation
 * (`idx + 1`, and findIndex over the returned window) returned -1 for anyone
 * ranked past the limit — invisible while one row came back, live the moment
 * the board started returning everyone. get_my_xp_rank() / get_my_streak_rank()
 * return the caller's rank even when they fall outside the window.
 *
 * The weekly window boundary is Africa/Cairo, computed server-side — not UTC and
 * not the device clock. There is deliberately no week arithmetic left here.
 */
export function useLeaderboard(): LeaderboardData {
  const [xpLeaderboard, setXpLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserXpRank, setCurrentUserXpRank] = useState<number | null>(null);
  const [currentUserStreakRank, setCurrentUserStreakRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await fetchLeaderboardBundle(50);

      setXpLeaderboard(bundle.xpLeaderboard);
      setStreakLeaderboard(bundle.streakLeaderboard);
      setWeeklyLeaderboard(bundle.weeklyLeaderboard);
      setCurrentUserXpRank(bundle.currentUserXpRank);
      setCurrentUserStreakRank(bundle.currentUserStreakRank);

      // fetchLeaderboardBundle uses allSettled so one failed tab does not blank
      // the others — but the failures must still be surfaced. Swallowing an
      // error is what kept the weekly tab dead from launch.
      if (bundle.errors.length > 0) {
        console.error("Leaderboard: partial failure", bundle.errors);
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchLeaderboard(); }, 2000);
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Realtime — decision recorded rather than left implicit.
  //
  // This listens for INSERT on student_xp. Under own-row RLS, Realtime delivers
  // only YOUR OWN inserts, so the board refreshes when you earn XP but not when
  // anyone else does. Standings therefore go stale until the next mount.
  //
  // Accepted deliberately: with 2 weekly active students, a 60s poll would cost
  // five RPC round-trips a minute per open tab to show a board that changes a
  // few times a month. Revisit if activity picks up — swap this for
  // setInterval(fetchLeaderboard, 60_000).
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-student-xp")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "student_xp" },
        () => { debouncedFetch(); }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedFetch]);

  return {
    xpLeaderboard,
    streakLeaderboard,
    weeklyLeaderboard,
    currentUserXpRank,
    currentUserStreakRank,
    loading,
  };
}
