-- =====================================================================
-- Trial slots cleanup (2026-04-17)
--
-- Guarantees the free-trial slot picker on the live site shows ONLY the
-- two approved Africa/Cairo sessions:
--     • Wednesday 17:30 (5:30 PM)
--     • Sunday    18:30 (6:30 PM)
--
-- The current live slot dropdown is surfacing stray rows (Sun 23:00,
-- Tue 00:30, Sat 16:00). This migration:
--   1. Ensures the `trial_slots` table exists (idempotent).
--   2. Wipes any previously-seeded rows.
--   3. Re-inserts ONLY the two approved rows.
--   4. Re-installs the `get_trial_availability()` RPC so it reads
--      exclusively from `trial_slots` (never from teacher_availability).
--   5. Idempotent: safe to re-run.
-- No groups, enrollments, bookings, profiles, or students are touched.
-- =====================================================================

BEGIN;

-- ── 1. Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trial_slots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week   int  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    text NOT NULL,
  duration_min  int  NOT NULL DEFAULT 30,
  timezone      text NOT NULL DEFAULT 'Africa/Cairo',
  capacity      int  NOT NULL DEFAULT 6 CHECK (capacity > 0),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day_of_week, start_time, timezone)
);

ALTER TABLE public.trial_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active trial slots" ON public.trial_slots;
CREATE POLICY "Anyone can read active trial slots"
  ON public.trial_slots FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage trial_slots" ON public.trial_slots;
CREATE POLICY "Admins manage trial_slots"
  ON public.trial_slots FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ── 2. Wipe and reseed with only the two approved slots ─────────
-- Deactivating is safer than DELETE because existing FKs (e.g. from
-- analytics) would still resolve. The RPC filters on is_active.
UPDATE public.trial_slots SET is_active = false;

INSERT INTO public.trial_slots
  (day_of_week, start_time, duration_min, timezone, capacity, is_active)
VALUES
  (3, '17:30', 30, 'Africa/Cairo', 6, true),   -- Wednesday 5:30 PM Cairo
  (0, '18:30', 30, 'Africa/Cairo', 6, true)    -- Sunday    6:30 PM Cairo
ON CONFLICT (day_of_week, start_time, timezone)
DO UPDATE SET
  is_active    = true,
  capacity     = EXCLUDED.capacity,
  duration_min = EXCLUDED.duration_min,
  updated_at   = now();

-- ── 3. Rebuild the RPC to read ONLY from trial_slots ────────────
DROP FUNCTION IF EXISTS public.get_trial_availability();
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
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity
  ORDER BY ts.day_of_week, ts.start_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_trial_availability() TO anon, authenticated;

COMMIT;
