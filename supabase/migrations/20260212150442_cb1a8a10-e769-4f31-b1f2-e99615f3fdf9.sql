
-- Add schedule preference columns to enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS preferred_days TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_time TEXT,
  ADD COLUMN IF NOT EXISTS preferred_start TEXT;
