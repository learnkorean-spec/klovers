-- Trim Korean-1 to 10 lessons (Hangul Foundation only).
-- Run AFTER content seeding so lessons 1-10 already have their content.
-- Lessons 1-10: Vowels, Basic Consonants, Syllable Blocks, Batchim,
--               Vowel Combinations, Consonant Clusters, Reading Practice,
--               Writing System, Pronunciation Rules, Hangul Mastery.

-- Remove content for lessons 11-180
DELETE FROM public.lesson_vocabulary
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons
    WHERE book = 'korean-1' AND sort_order > 10
  );
DELETE FROM public.lesson_grammar
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons
    WHERE book = 'korean-1' AND sort_order > 10
  );
DELETE FROM public.lesson_dialogues
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons
    WHERE book = 'korean-1' AND sort_order > 10
  );
DELETE FROM public.lesson_exercises
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons
    WHERE book = 'korean-1' AND sort_order > 10
  );
DELETE FROM public.lesson_reading
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons
    WHERE book = 'korean-1' AND sort_order > 10
  );

-- Remove lesson metadata rows 11-180
DELETE FROM public.textbook_lessons
  WHERE book = 'korean-1' AND sort_order > 10;
