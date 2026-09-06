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
 * (supabase/migrations/20260830120000_games_leaderboard_rpcs.sql).
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

  // Who is asking, and whether we know yet. Tracked as the user id rather than
  // a boolean on purpose: TOKEN_REFRESHED fires with the same user, and an
  // identical string bails out of the re-render, so a token refresh does not
  // restart the fetch.
  const [userId, setUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

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

  // Every one of the five leaderboard RPCs is `revoke all ... from public,
  // anon` and granted only to `authenticated`
  // (supabase/migrations/20260830120000_games_leaderboard_rpcs.sql), so a
  // signed-out visitor could never be handed a board. What actually happened
  // was five permission errors per guest page load, collected by
  // fetchLeaderboardBundle's allSettled and logged as
  // "Leaderboard: partial failure" — five failing round-trips to render
  // nothing. /games mounted this hook for guests only to sit beside a
  // hardcoded board; with that board gone, nothing on the guest path wants
  // this data at all.
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUserId(session?.user?.id ?? null);
      setAuthResolved(true);
    });

    // Signing in and signing out DURING the session both land here, and this
    // is what keeps the guard from becoming a permanent block: a visitor who
    // signs in on this same page gets userId set, which re-runs the fetch
    // effect below. Only setState happens in this callback — calling back into
    // supabase from inside onAuthStateChange is what deadlocks the client.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setAuthResolved(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Wait for the answer before acting on it. Without this, the first render —
    // where userId is still null only because getSession has not resolved —
    // is indistinguishable from a guest, and a signed-in student would be
    // treated as one.
    if (!authResolved) return;

    if (!userId) {
      // Definitively a guest. Fetch nothing, and clear anything a previous
      // session left behind so signing out does not leave the last student's
      // standings on screen.
      setXpLeaderboard([]);
      setStreakLeaderboard([]);
      setWeeklyLeaderboard([]);
      setCurrentUserXpRank(null);
      setCurrentUserStreakRank(null);
      // `loading` starts true. A guest is not waiting for anything, and a
      // consumer that renders a spinner while loading would spin forever.
      setLoading(false);
      return;
    }

    fetchLeaderboard();
  }, [authResolved, userId, fetchLeaderboard]);

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
    // No channel for guests either. Under own-row RLS a signed-out subscriber
    // can never be delivered a row, so the socket was held open purely to wait
    // for events that could not arrive.
    if (!userId) return;

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
  }, [userId, debouncedFetch]);

  return {
    xpLeaderboard,
    streakLeaderboard,
    weeklyLeaderboard,
    currentUserXpRank,
    currentUserStreakRank,
    loading,
  };
}
