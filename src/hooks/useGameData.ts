import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGamification } from "./useGamification";
import { useSRS } from "./useSRS";

export interface GameVocabItem {
  korean: string;
  romanization: string;
  meaning: string;
}

export interface GameExerciseItem {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

// How many words a game's vocab pool is capped to when SRS due words exist.
// Small enough that due words are a meaningful fraction of the pool a game
// shuffles from (games slice a subset after shuffling the full pool, so
// order alone doesn't bias selection — the pool has to actually be small
// and due-heavy for prioritization to have any real effect).
const DUE_PRIORITIZED_POOL_SIZE = 40;

/**
 * Folds SRS "due for review" words to the front of the pool a game draws
 * from, capping the overall pool so due words are a real fraction of it
 * (not just present somewhere in 120 words a shuffle will bury evenly).
 * Purely additive: with no due cards, or when scoped to one lessonId
 * (launched from a lesson page, where pulling in due words from other
 * lessons would feel off-topic), this returns `rawVocab` unchanged.
 */
function buildPrioritizedVocab(
  rawVocab: GameVocabItem[],
  dueVocab: GameVocabItem[],
  scopedToOneLesson: boolean
): GameVocabItem[] {
  if (scopedToOneLesson || dueVocab.length === 0) return rawVocab;

  const cappedDue = dueVocab.slice(0, DUE_PRIORITIZED_POOL_SIZE);
  const dueKorean = new Set(cappedDue.map((v) => v.korean));
  const rest = rawVocab.filter((v) => !dueKorean.has(v.korean));
  const nonDueNeeded = Math.max(0, DUE_PRIORITIZED_POOL_SIZE - cappedDue.length);

  return [...cappedDue, ...rest.slice(0, nonDueNeeded)];
}

/**
 * Fetches lesson vocabulary and exercises from Supabase scoped to the
 * student's studied lessons. Falls back to fetching all content when the
 * student has no recorded progress (e.g. logged-out / new user).
 *
 * Pass an explicit lessonId to scope to one specific lesson (e.g. when
 * launching a game directly from a lesson page).
 *
 * When the student is logged in and has SRS words due for review
 * (useSRS), the returned `vocab` is weighted toward those words — see
 * buildPrioritizedVocab above. Callers don't need to change anything:
 * they keep reading `vocab` exactly as before.
 */
export function useGameData(lessonId?: number) {
  const { progress } = useGamification();
  const { dueCards } = useSRS();
  const [rawVocab, setRawVocab] = useState<GameVocabItem[]>([]);
  const [exercises, setExercises] = useState<GameExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGameData = useCallback(async () => {
    // Determine scope: specific lesson > studied lessons > all lessons
    let lessonIds: number[] | null = null;
    if (lessonId) {
      lessonIds = [lessonId];
    } else {
      const ids = Object.keys(progress.lessonProgress).map(Number);
      if (ids.length > 0) lessonIds = ids;
    }

    const applyFilter = (query: any) =>
      lessonIds ? query.in("lesson_id", lessonIds) : query;

    const [vocabRes, exRes] = await Promise.all([
      applyFilter(
        (supabase as any)
          .from("lesson_vocabulary")
          .select("korean, romanization, meaning")
          .order("sort_order")
          .limit(120)
      ),
      applyFilter(
        (supabase as any)
          .from("lesson_exercises")
          .select("question, options, correct_index, explanation")
          .order("sort_order")
          .limit(60)
      ),
    ]);

    setRawVocab(vocabRes.data || []);
    setExercises(
      (exRes.data || []).map((e: any) => ({
        question: e.question,
        options: Array.isArray(e.options) ? e.options : [],
        correct_index: e.correct_index,
        explanation: e.explanation || "",
      }))
    );
    setLoading(false);
  }, [lessonId, progress.lessonProgress]);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  const dueVocab = useMemo(
    () => dueCards.map((c) => ({ korean: c.korean, romanization: c.romanization, meaning: c.meaning })),
    [dueCards]
  );

  const vocab = useMemo(
    () => buildPrioritizedVocab(rawVocab, dueVocab, Boolean(lessonId)),
    [rawVocab, dueVocab, lessonId]
  );

  return { vocab, exercises, loading };
}
