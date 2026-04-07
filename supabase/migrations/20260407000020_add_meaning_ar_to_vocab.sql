-- Add Arabic meaning column to lesson_vocabulary
ALTER TABLE public.lesson_vocabulary
  ADD COLUMN IF NOT EXISTS meaning_ar text DEFAULT NULL;
