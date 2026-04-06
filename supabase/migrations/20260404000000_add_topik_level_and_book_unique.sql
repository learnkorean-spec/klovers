-- Add topik_level column to textbook_lessons
ALTER TABLE public.textbook_lessons
  ADD COLUMN IF NOT EXISTS topik_level integer NOT NULL DEFAULT 1;

-- Add UNIQUE constraint on (book, sort_order) so upserts work correctly
-- First drop any existing duplicate rows keeping the most recent id
DELETE FROM public.textbook_lessons a
  USING public.textbook_lessons b
  WHERE a.id < b.id
    AND a.book = b.book
    AND a.sort_order = b.sort_order;

-- Now add the unique constraint
ALTER TABLE public.textbook_lessons
  DROP CONSTRAINT IF EXISTS textbook_lessons_book_sort_order_key;

ALTER TABLE public.textbook_lessons
  ADD CONSTRAINT textbook_lessons_book_sort_order_key UNIQUE (book, sort_order);

-- Update topik_level for existing korean-1 lessons based on sort_order ranges
-- Foundation/A0: lessons 1-10
UPDATE public.textbook_lessons
  SET topik_level = 0
  WHERE book = 'korean-1' AND sort_order BETWEEN 1 AND 10;

-- TOPIK 1/A1: lessons 11-50
UPDATE public.textbook_lessons
  SET topik_level = 1
  WHERE book = 'korean-1' AND sort_order BETWEEN 11 AND 50;

-- TOPIK 2/A2: lessons 51-90
UPDATE public.textbook_lessons
  SET topik_level = 2
  WHERE book = 'korean-1' AND sort_order BETWEEN 51 AND 90;

-- TOPIK 3/B1: lessons 91-120
UPDATE public.textbook_lessons
  SET topik_level = 3
  WHERE book = 'korean-1' AND sort_order BETWEEN 91 AND 120;

-- TOPIK 4/B2: lessons 121-150
UPDATE public.textbook_lessons
  SET topik_level = 4
  WHERE book = 'korean-1' AND sort_order BETWEEN 121 AND 150;

-- TOPIK 5/C1: lessons 151-165
UPDATE public.textbook_lessons
  SET topik_level = 5
  WHERE book = 'korean-1' AND sort_order BETWEEN 151 AND 165;

-- TOPIK 6/C2: lessons 166+
UPDATE public.textbook_lessons
  SET topik_level = 6
  WHERE book = 'korean-1' AND sort_order >= 166;

-- daily-routine and kdrama are TOPIK 1 level
UPDATE public.textbook_lessons
  SET topik_level = 1
  WHERE book IN ('daily-routine', 'kdrama');
