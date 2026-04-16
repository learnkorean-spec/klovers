-- Fix trial_bookings table: add missing columns required by the book-trial edge function.
-- The original table was created with an older schema (name, phone, level, goal, etc.)
-- but the edge function expects email, day_of_week, start_time, trial_date, timezone.

ALTER TABLE public.trial_bookings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.trial_bookings ADD COLUMN IF NOT EXISTS day_of_week INTEGER;
ALTER TABLE public.trial_bookings ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE public.trial_bookings ADD COLUMN IF NOT EXISTS trial_date DATE;
ALTER TABLE public.trial_bookings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Cairo';

-- Make phone and level nullable (edge function may pass null for authenticated users)
ALTER TABLE public.trial_bookings ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.trial_bookings ALTER COLUMN level DROP NOT NULL;

-- Unique constraint: one active trial per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_bookings_unique_active
  ON public.trial_bookings (email) WHERE status IN ('pending', 'confirmed');

-- RLS: allow inserts from anon and authenticated
DROP POLICY IF EXISTS "Anyone can book a trial" ON public.trial_bookings;
CREATE POLICY "Anyone can book a trial"
  ON public.trial_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS: allow reads so .select().single() works after insert
DROP POLICY IF EXISTS "Service can read trial bookings" ON public.trial_bookings;
CREATE POLICY "Service can read trial bookings"
  ON public.trial_bookings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
