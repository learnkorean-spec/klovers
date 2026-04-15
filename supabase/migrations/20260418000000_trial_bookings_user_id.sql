-- Link trial_bookings to authenticated user accounts so the protected
-- /trial-booking flow can attribute a booking to the signed-in user.
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trial_bookings_user ON public.trial_bookings(user_id);

-- Allow signed-in users to read their own bookings (for dashboard views).
DROP POLICY IF EXISTS "Users can read own trial bookings" ON public.trial_bookings;
CREATE POLICY "Users can read own trial bookings"
  ON public.trial_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
