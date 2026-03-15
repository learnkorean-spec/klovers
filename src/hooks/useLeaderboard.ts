import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  currentUserXpRank: number | null;
  currentUserStreakRank: number | null;
  loading: boolean;
}

export function useLeaderboard(): LeaderboardData {
  const { user } = useAuth();
  const [xpLeaderboard, setXpLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserXpRank, setCurrentUserXpRank] = useState<number | null>(null);
  const [currentUserStreakRank, setCurrentUserStreakRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [user?.id]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch all XP totals grouped by user
      const { data: xpData } = await supabase
        .from("student_xp")
        .select("user_id, xp_earned");

      // Fetch top streaks
      const { data: streakData } = await supabase
        .from("student_streaks")
        .select("user_id, current_streak")
        .gt("current_streak", 0)
        .order("current_streak", { ascending: false })
        .limit(20);

      if (!xpData) { setLoading(false); return; }

      // Aggregate XP by user
      const xpByUser: Record<string, number> = {};
      xpData.forEach((r: any) => {
        xpByUser[r.user_id] = (xpByUser[r.user_id] || 0) + (r.xp_earned || 0);
      });

      // Sort by XP descending, take top 10
      const topXpUsers = Object.entries(xpByUser)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([uid, xp]) => ({ user_id: uid, value: xp }));

      // Get all unique user IDs needed
      const streakUserIds = (streakData || []).slice(0, 10).map((r: any) => r.user_id);
      const allUserIds = [...new Set([...topXpUsers.map(u => u.user_id), ...streakUserIds])];

      // Fetch profiles for all those users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", allUserIds);

      const profileMap: Record<string, { name: string; avatar_url: string | null }> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.user_id] = { name: p.name || "Anonymous", avatar_url: p.avatar_url };
      });

      // Build XP leaderboard
      const xpBoard: LeaderboardEntry[] = topXpUsers.map((u, idx) => ({
        user_id: u.user_id,
        name: profileMap[u.user_id]?.name || "Anonymous",
        avatar_url: profileMap[u.user_id]?.avatar_url || null,
        value: u.value,
        rank: idx + 1,
        isCurrentUser: u.user_id === user?.id,
      }));

      setXpLeaderboard(xpBoard);

      // Find current user's XP rank (among all users, not just top 10)
      if (user?.id) {
        const allSorted = Object.entries(xpByUser).sort(([, a], [, b]) => b - a);
        const userXpRank = allSorted.findIndex(([uid]) => uid === user.id);
        setCurrentUserXpRank(userXpRank >= 0 ? userXpRank + 1 : null);
      }

      // Build streak leaderboard
      if (streakData) {
        const streakBoard: LeaderboardEntry[] = streakData
          .slice(0, 10)
          .map((r: any, idx: number) => ({
            user_id: r.user_id,
            name: profileMap[r.user_id]?.name || "Anonymous",
            avatar_url: profileMap[r.user_id]?.avatar_url || null,
            value: r.current_streak,
            rank: idx + 1,
            isCurrentUser: r.user_id === user?.id,
          }));
        setStreakLeaderboard(streakBoard);

        if (user?.id) {
          const userStreakRank = streakData.findIndex((r: any) => r.user_id === user.id);
          setCurrentUserStreakRank(userStreakRank >= 0 ? userStreakRank + 1 : null);
        }
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    xpLeaderboard,
    streakLeaderboard,
    currentUserXpRank,
    currentUserStreakRank,
    loading,
  };
}
