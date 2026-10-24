import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cluby's Memory Garden, from the learner's real review schedule
 * (vocabulary_review_history): how many words are in review, how many are
 * due today, and how many are reviewed and resting until their next review
 * (the garden's open flowers). Zero for guests and on any failed read.
 */
export interface GardenCounts {
  words: number;
  due: number;
  reviewed: number;
}

const ZERO: GardenCounts = { words: 0, due: 0, reviewed: 0 };

/** Pure: today is a UTC "YYYY-MM-DD" (the schedule stores dates). */
export function gardenCounts(rows: { review_count: number | null; next_review_date: string | null }[], today: string): GardenCounts {
  let due = 0;
  let reviewed = 0;
  for (const r of rows) {
    const isDue = !r.next_review_date || r.next_review_date <= today;
    if (isDue) due += 1;
    else if ((r.review_count ?? 0) > 0) reviewed += 1;
  }
  return { words: rows.length, due, reviewed };
}

export function useGarden(): { counts: GardenCounts; refresh: () => void } {
  const [counts, setCounts] = useState<GardenCounts>(ZERO);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("vocabulary_review_history")
          .select("review_count, next_review_date")
          .eq("user_id", session.user.id);
        if (error) throw error;
        if (live) setCounts(gardenCounts(data ?? [], new Date().toISOString().split("T")[0]));
      } catch (err) {
        console.warn("[KLOVERS World] garden read failed", err);
      }
    })();
    return () => {
      live = false;
    };
  }, [tick]);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { counts, refresh };
}
