
-- Add writing_done column to student_lesson_progress
ALTER TABLE public.student_lesson_progress 
  ADD COLUMN IF NOT EXISTS writing_done boolean NOT NULL DEFAULT false;
