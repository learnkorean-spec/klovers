import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EarnedBadge, LessonProgressRow, LessonRow, MilestoneRow } from "@/lib/dashboardProgress";

export interface DashboardLearningData {
  /** activity_type of every student_xp row since local midnight. */
  todayActivity: string[];
  lessons: LessonRow[];
  lessonProgress: LessonProgressRow[];
  badges: EarnedBadge[];
  milestones: MilestoneRow[];
}

/**
 * Read-only loader for the redesigned dashboard blocks. Five parallel reads
 * of tables the app already writes; nothing is inserted or updated here.
 * A failed read degrades only its own block (the page keeps rendering).
 */
export function useDashboardLearning(userId: string) {
  const [data, setData] = useState<DashboardLearningData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setError(false);
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    (async () => {
      try {
        const [today, lessons, progress, badges, milestones] = await Promise.all([
          supabase.from("student_xp").select("activity_type").eq("user_id", userId).gte("created_at", midnight.toISOString()),
          supabase.from("textbook_lessons").select("id, book, sort_order, title_en, title_ar, title_ko, topik_level").eq("is_published", true),
          supabase.from("student_lesson_progress")
            .select("lesson_id, vocab_done, grammar_done, dialogue_done, exercises_done, reading_done, writing_done, chapter_completed, completed_at")
            .eq("user_id", userId),
          supabase.from("student_badges").select("badge_key, earned_at").eq("user_id", userId),
          (supabase as any).from("achievement_milestones")
            .select("milestone_type, milestone_tier, milestone_name, target_value, progress_value, is_achieved")
            .eq("user_id", userId),
        ]);
        if (lessons.error || progress.error) throw new Error("learning data unavailable");
        if (cancelled) return;
        setData({
          todayActivity: ((today.data ?? []) as { activity_type: string }[]).map(r => r.activity_type),
          lessons: (lessons.data ?? []) as LessonRow[],
          lessonProgress: (progress.data ?? []) as LessonProgressRow[],
          badges: (badges.data ?? []) as EarnedBadge[],
          milestones: (milestones.data ?? []) as MilestoneRow[],
        });
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);
  /** Optimistic local update after an on-page action (e.g. word claimed). */
  const addTodayActivity = useCallback((activity: string) => {
    setData(d => (d ? { ...d, todayActivity: [...d.todayActivity, activity] } : d));
  }, []);

  return { data, loading: !data && !error, error, retry, addTodayActivity };
}
