
-- Add session_date column
ALTER TABLE public.attendance_log
  ADD COLUMN IF NOT EXISTS session_date date DEFAULT CURRENT_DATE;

-- Deduplicate: keep earliest record per (student_id, session_date)
DELETE FROM public.attendance_log
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id, session_date ORDER BY marked_at ASC) as rn
    FROM public.attendance_log
  ) sub WHERE rn > 1
);

-- Now add unique constraint
ALTER TABLE public.attendance_log
  ADD CONSTRAINT unique_student_session_date UNIQUE (student_id, session_date);
