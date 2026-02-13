
-- Add structured columns to leads table (replacing the single "goal" text blob)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS schedule TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'enroll';
