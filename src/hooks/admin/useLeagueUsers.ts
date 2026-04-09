import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfiles } from "./useProfiles";
import { getLeague, LEAGUES } from "@/constants/gamification";

export interface LeagueUserRow {
  user_id: string;
  name: string;
  email: string;
  total_xp: number;
  league: ReturnType<typeof getLeague>;
  current_streak: number;
  longest_streak: number;
  badges_count: number;
  last_activity: string | null;
}

export function useLeagueUsers() {
  const { data: profileMap } = useProfiles();

  return useQuery({
    queryKey: ["admin", "league-users"],
    enabled: !!profileMap,
    queryFn: async () => {
      const [xpRes, streakRes, badgeRes] = await Promise.all([
        supabase.from("student_xp").select("user_id, xp_earned, created_at"),
        supabase.from("student_streaks").select("user_id, current_streak, longest_streak"),
        supabase.from("student_badges").select("user_id"),
      ]);

      // Aggregate XP per user
      const xpMap: Record<string, { total: number; lastActivity: string | null }> = {};
      for (const row of xpRes.data ?? []) {
        const prev = xpMap[row.user_id];
        if (prev) {
          prev.total += row.xp_earned ?? 0;
          if (row.created_at && (!prev.lastActivity || row.created_at > prev.lastActivity)) {
            prev.lastActivity = row.created_at;
          }
        } else {
          xpMap[row.user_id] = { total: row.xp_earned ?? 0, lastActivity: row.created_at };
        }
      }

      // Streak map
      const streakMap: Record<string, { current: number; longest: number }> = {};
      for (const row of streakRes.data ?? []) {
        streakMap[row.user_id] = {
          current: row.current_streak ?? 0,
          longest: row.longest_streak ?? 0,
        };
      }

      // Badge count map
      const badgeMap: Record<string, number> = {};
      for (const row of badgeRes.data ?? []) {
        badgeMap[row.user_id] = (badgeMap[row.user_id] || 0) + 1;
      }

      // Build rows for ALL profiles (including zero-XP users)
      const rows: LeagueUserRow[] = [];
      for (const [userId, profile] of Object.entries(profileMap!)) {
        const xp = xpMap[userId]?.total ?? 0;
        rows.push({
          user_id: userId,
          name: profile.name || "Anonymous",
          email: profile.email || "",
          total_xp: xp,
          league: getLeague(xp),
          current_streak: streakMap[userId]?.current ?? 0,
          longest_streak: streakMap[userId]?.longest ?? 0,
          badges_count: badgeMap[userId] ?? 0,
          last_activity: xpMap[userId]?.lastActivity ?? null,
        });
      }

      // Compute league summary counts
      const leagueSummary: Record<string, number> = {};
      for (const l of LEAGUES) leagueSummary[l.key] = 0;
      for (const r of rows) leagueSummary[r.league.key] = (leagueSummary[r.league.key] || 0) + 1;

      return { rows, leagueSummary };
    },
    staleTime: 2 * 60 * 1000,
  });
}
