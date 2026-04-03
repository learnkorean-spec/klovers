import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGamification } from "./useGamification";

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

/**
 * Fetches lesson vocabulary and exercises from Supabase scoped to the
 * student's studied lessons. Falls back to fetching all content when the
 * student has no recorded progress (e.g. logged-out / new user).
 *
 * Pass an explicit lessonId to scope to one specific lesson (e.g. when
 * launching a game directly from a lesson page).
 */
export function useGameData(lessonId?: number) {
  const { progress } = useGamification();
  const [vocab, setVocab] = useState<GameVocabItem[]>([]);
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

    setVocab(vocabRes.data || []);
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

  return { vocab, exercises, loading };
}
