-- Erase all Korean-1 data from the database.
-- Removes all lesson content and metadata for book='korean-1'.

DELETE FROM public.lesson_vocabulary
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons WHERE book = 'korean-1'
  );
DELETE FROM public.lesson_grammar
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons WHERE book = 'korean-1'
  );
DELETE FROM public.lesson_dialogues
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons WHERE book = 'korean-1'
  );
DELETE FROM public.lesson_exercises
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons WHERE book = 'korean-1'
  );
DELETE FROM public.lesson_reading
  WHERE lesson_id IN (
    SELECT id FROM public.textbook_lessons WHERE book = 'korean-1'
  );

DELETE FROM public.textbook_lessons WHERE book = 'korean-1';
