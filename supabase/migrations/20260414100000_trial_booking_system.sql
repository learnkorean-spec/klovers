-- Trial Booking System
-- Allows free trial students to self-book into available teacher slots

-- ── Table: trial_bookings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trial_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  level text,
  goal text,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time text NOT NULL,
  trial_date date NOT NULL,
  timezone text DEFAULT 'Africa/Cairo',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'no_show', 'cancelled')),
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trial_bookings ENABLE ROW LEVEL SECURITY;

-- Anon/authenticated users can insert (form submission without auth)
CREATE POLICY "Anyone can book a trial"
  ON public.trial_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can do everything
CREATE POLICY "Admins can manage trial_bookings"
  ON public.trial_bookings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for availability lookups
CREATE INDEX idx_trial_bookings_slot ON public.trial_bookings (day_of_week, start_time, trial_date)
  WHERE status NOT IN ('cancelled');

-- Prevent same email booking multiple active trials
CREATE UNIQUE INDEX idx_trial_bookings_unique_active
  ON public.trial_bookings (email)
  WHERE status IN ('pending', 'confirmed');

-- ── RPC: get_trial_availability ─────────────────────────────────────────────
-- Returns teacher available slots with booking count for next 7 days
CREATE OR REPLACE FUNCTION public.get_trial_availability()
RETURNS TABLE (
  day_of_week int,
  start_time text,
  booked_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ta.day_of_week,
    ta.start_time,
    COALESCE(COUNT(tb.id), 0) AS booked_count
  FROM teacher_availability ta
  LEFT JOIN trial_bookings tb
    ON tb.day_of_week = ta.day_of_week
    AND tb.start_time = ta.start_time
    AND tb.trial_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
    AND tb.status NOT IN ('cancelled')
  WHERE ta.is_available = true
  GROUP BY ta.day_of_week, ta.start_time
  ORDER BY ta.day_of_week, ta.start_time;
$$;

-- Grant execute to anon so the form can fetch availability without auth
GRANT EXECUTE ON FUNCTION public.get_trial_availability() TO anon, authenticated;
