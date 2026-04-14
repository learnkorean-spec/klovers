-- Add columns to store the actual assigned schedule for private students
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS assigned_day TEXT,
  ADD COLUMN IF NOT EXISTS assigned_time TEXT,
  ADD COLUMN IF NOT EXISTS assigned_timezone TEXT;
