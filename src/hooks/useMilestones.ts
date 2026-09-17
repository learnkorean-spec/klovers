import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface Milestone {
  id: number;
  user_id: string;
  milestone_type: string;
  milestone_tier: number;
  milestone_name: string;
  target_value: number;
  progress_value: number;
  is_achieved: boolean;
  achieved_at?: string;
}

export interface MilestoneGroup {
  type: string;
  tiers: Milestone[];
}

/**
 * Milestone rows are seeded per-student by a DB trigger on profile creation
 * (see supabase/migrations/20260918000000_seed_achievement_milestones.sql),
 * and progress_value / is_achieved are kept current by triggers on
 * student_xp, student_lesson_progress and student_streaks
 * (20260918010000_milestone_progress_triggers.sql) — the same
 * write-and-let-the-server-compute pattern already used for game XP (see
 * lib/gameXpApi.ts). Nothing on the client computes or writes progress.
 *
 * There used to be an `updateMilestoneProgress` exported from this hook for
 * the client to call after finishing a lesson or game. Nothing in the app
 * ever called it — every seeded milestone row sat at 0/target forever. It's
 * removed now that the server does this instead; this hook only reads.
 */
export function useMilestones() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  // A queue, not a single slot. One game/lesson completion can cross more
  // than one milestone's threshold at once (e.g. it both finishes a lesson
  // and pushes total XP past a tier — lessons_completed and xp_earned are
  // updated by separate triggers but can both land in the same moment), so
  // realtime can deliver two UPDATE events back to back. A single
  // `newlyAchieved` slot with its own setTimeout meant the second event
  // overwrote the first before it had been shown, and the first event's
  // stale 5s timer then cleared the second celebration early — cutting it
  // short before its own 5 seconds had elapsed. Queueing (same pattern as
  // GamesPage's celebrationQueue) gives each achievement its own full 5s,
  // shown one at a time.
  const [newlyAchievedQueue, setNewlyAchievedQueue] = useState<Milestone[]>([]);
  const newlyAchieved = newlyAchievedQueue[0] ?? null;
  // Read inside the realtime callback without re-subscribing every time
  // `milestones` changes.
  const milestonesRef = useRef<Milestone[]>([]);
  useEffect(() => { milestonesRef.current = milestones; }, [milestones]);

  // Advances the queue 5s after whichever milestone is currently at its
  // head — restarted whenever the head changes, so each item gets its own
  // full 5s regardless of how soon the next one was enqueued.
  useEffect(() => {
    if (!newlyAchieved) return;
    const timer = setTimeout(() => {
      setNewlyAchievedQueue((q) => q.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [newlyAchieved]);

  useEffect(() => {
    if (!user) return;
    fetchMilestones();
  }, [user]);

  const fetchMilestones = async () => {
    if (!user) return;

    setLoading(true);
    const { data } = await (supabase as any)
      .from("achievement_milestones")
      .select("*")
      .eq("user_id", user.id)
      .order("milestone_type")
      .order("milestone_tier");

    if (data) {
      setMilestones(data as Milestone[]);
    }
    setLoading(false);
  };

  // Progress changes server-side (a trigger fires the moment new XP, a
  // completed lesson, or a longer streak lands), so this listens for the
  // resulting UPDATE rather than polling. Mirrors the leaderboard's realtime
  // subscription in useLeaderboard.ts.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`milestones-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "achievement_milestones", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Milestone;
          const prev = milestonesRef.current.find((m) => m.id === updated.id);
          if (updated.is_achieved && !prev?.is_achieved) {
            setNewlyAchievedQueue((q) => [...q, updated]);
          }
          setMilestones((curr) => curr.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getGroupedMilestones = (): MilestoneGroup[] => {
    const grouped: Record<string, Milestone[]> = {};
    milestones.forEach((m) => {
      if (!grouped[m.milestone_type]) {
        grouped[m.milestone_type] = [];
      }
      grouped[m.milestone_type].push(m);
    });

    return Object.entries(grouped).map(([type, tiers]) => ({
      type,
      tiers: tiers.sort((a, b) => a.milestone_tier - b.milestone_tier),
    }));
  };

  const getCompletionPercentage = (): number => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.is_achieved).length;
    return Math.round((completed / milestones.length) * 100);
  };

  return {
    milestones,
    groupedMilestones: getGroupedMilestones(),
    completionPercentage: getCompletionPercentage(),
    loading,
    newlyAchieved,
    refetch: fetchMilestones,
  };
}
