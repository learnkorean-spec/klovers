-- ============================================================
-- Trial slots table (2026-04-16)
--   * Adds a dedicated `trial_slots` table with timezone + capacity
--     per row so trial sessions can be managed independently of the
--     teacher_availability grid (which is Malaysia-frame).
--   * Seeds the two approved trial sessions:
--       • Wednesday 17:30 Africa/Cairo (5:30 PM)
--       • Sunday    18:30 Africa/Cairo (6:30 PM)
--   * Adds the new Level 2 group package:
--       • Wednesday 18:00 Africa/Cairo (6:00 PM), 90 min, cap 7
--   * Rewrites get_trial_availability() to read from trial_slots.
-- Idempotent: safe to re-run.
-- No existing groups, enrollments, schedule_packages, profiles, or
-- student records are modified.
-- ============================================================

BEGIN;

-- ── 1. New table: trial_slots ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trial_slots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week   int  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    text NOT NULL,                                -- 'HH:MM' 24-h
  duration_min  int  NOT NULL DEFAULT 30,
  timezone      text NOT NULL DEFAULT 'Africa/Cairo',
  capacity      int  NOT NULL DEFAULT 3 CHECK (capacity > 0),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day_of_week, start_time, timezone)
);

COMMENT ON TABLE public.trial_slots IS
  'Bookable trial class time slots. Each row defines a recurring weekly '
  'trial session (day_of_week + start_time) in its own timezone, with '
  'per-slot capacity. Replaces the previous approach of piggy-backing '
  'on teacher_availability (which has no timezone column).';

COMMENT ON COLUMN public.trial_slots.timezone IS
  'IANA timezone label for start_time. Defaults to Africa/Cairo.';

COMMENT ON COLUMN public.trial_slots.capacity IS
  'Maximum concurrent trial bookings for this slot on a given date. '
  'UI hides the slot once booked_count >= capacity.';

ALTER TABLE public.trial_slots ENABLE ROW LEVEL SECURITY;

-- Public read so the booking form can render available slots without auth
DROP POLICY IF EXISTS "Anyone can read active trial slots" ON public.trial_slots;
CREATE POLICY "Anyone can read active trial slots"
  ON public.trial_slots FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins manage everything (matches existing admin RLS conventions)
DROP POLICY IF EXISTS "Admins manage trial_slots" ON public.trial_slots;
CREATE POLICY "Admins manage trial_slots"
  ON public.trial_slots FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at housekeeping
CREATE OR REPLACE FUNCTION public.tg_trial_slots_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_trial_slots_updated_at ON public.trial_slots;
CREATE TRIGGER trg_trial_slots_updated_at
  BEFORE UPDATE ON public.trial_slots
  FOR EACH ROW EXECUTE FUNCTION public.tg_trial_slots_set_updated_at();

-- ── 2. Seed the two approved trial slots ──────────────────────
INSERT INTO public.trial_slots (day_of_week, start_time, duration_min, timezone, capacity, is_active)
VALUES
  (3, '17:30', 30, 'Africa/Cairo', 3, true),   -- Wednesday 5:30 PM Cairo
  (0, '18:30', 30, 'Africa/Cairo', 3, true)    -- Sunday    6:30 PM Cairo
ON CONFLICT (day_of_week, start_time, timezone) DO NOTHING;

-- ── 3. New Level 2 group package: Wed 18:00 Cairo 90 min ──────
INSERT INTO public.schedule_packages
  (level, day_of_week, start_time, duration_min, timezone, capacity, course_type, is_active)
SELECT 'l2', 3, '18:00'::time, 90, 'Africa/Cairo', 7, 'group', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedule_packages
  WHERE level='l2' AND day_of_week=3 AND start_time='18:00'::time AND course_type='group'
);

-- Auto-create the pkg_group shell for the new package (safe if already exists)
SELECT public.ensure_pkg_groups_for_packages();

-- ── 4. Rewrite get_trial_availability() to read from trial_slots
-- Backwards-compatible signature (day_of_week, start_time, booked_count).
-- The UI additionally needs capacity + timezone to hide full slots and
-- render the dropdown correctly, so we add those as new columns at the
-- end of the record — existing callers keep working because the
-- positional tuple still starts with (day_of_week, start_time, booked_count).
CREATE OR REPLACE FUNCTION public.get_trial_availability()
RETURNS TABLE (
  day_of_week   int,
  start_time    text,
  booked_count  bigint,
  capacity      int,
  duration_min  int,
  timezone      text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ts.day_of_week,
    ts.start_time,
    COALESCE(COUNT(tb.id), 0) AS booked_count,
    ts.capacity,
    ts.duration_min,
    ts.timezone
  FROM public.trial_slots ts
  LEFT JOIN public.trial_bookings tb
    ON tb.day_of_week = ts.day_of_week
   AND tb.start_time  = ts.start_time
   AND tb.trial_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
   AND tb.status NOT IN ('cancelled')
  WHERE ts.is_active = true
  GROUP BY ts.id, ts.day_of_week, ts.start_time, ts.capacity, ts.duration_min, ts.timezone
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity     -- hide full slots
  ORDER BY ts.day_of_week, ts.start_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_trial_availability() TO anon, authenticated;

COMMENT ON FUNCTION public.get_trial_availability() IS
  'Returns currently-bookable trial slots. Slots at capacity are filtered '
  'out server-side; the client simply renders whatever rows come back.';

COMMIT;
