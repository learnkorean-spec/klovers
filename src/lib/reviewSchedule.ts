import { supabase } from "@/integrations/supabase/client";

/**
 * Words enter a student's review schedule when they complete a lesson (Re's
 * decision, 24 Oct 2026). Until then nothing ever added them: the review
 * page (and Cluby's Memory Garden, which reviews the same schedule) was
 * empty for every student.
 *
 * New words are first due the day after the lesson. A word already in the
 * schedule is left exactly as it is — completing a lesson again never resets
 * a review that is under way.
 */

// vocabulary_review_history is not in the generated Supabase types yet (see hooks/useSRS.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** lesson_vocabulary ids are uuids in the database (the older SRSCard type says number). */
export type VocabId = string | number;

export interface ReviewRow {
  user_id: string;
  lesson_vocabulary_id: VocabId;
  next_review_date: string;
  difficulty_factor: number;
  interval_days: number;
  review_count: number;
}

/** The rows for new words: first due the day after `today` (UTC date). */
export function newReviewRows(userId: string, vocabIds: VocabId[], today: Date = new Date()): ReviewRow[] {
  const due = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)).toISOString().split("T")[0];
  return [...new Set(vocabIds)].map((id) => ({
    user_id: userId,
    lesson_vocabulary_id: id,
    next_review_date: due,
    difficulty_factor: 2.5,
    interval_days: 1,
    review_count: 0,
  }));
}

/** Add a completed lesson's words to the student's review schedule. Never throws. */
export async function addLessonWordsToReview(userId: string, lessonId: VocabId): Promise<number> {
  try {
    const { data, error } = await db.from("lesson_vocabulary").select("id").eq("lesson_id", lessonId);
    if (error) throw error;
    const ids = ((data ?? []) as { id: VocabId }[]).map((r) => r.id);
    if (!ids.length) return 0;
    const { error: upsertError } = await db
      .from("vocabulary_review_history")
      .upsert(newReviewRows(userId, ids), { onConflict: "user_id,lesson_vocabulary_id", ignoreDuplicates: true });
    if (upsertError) throw upsertError;
    return ids.length;
  } catch (err) {
    console.warn("[review] could not add the lesson's words to review", err);
    return 0;
  }
}
