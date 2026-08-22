-- Phase 3 of the trial redesign (docs/TRIAL_REDESIGN_PLAN.md): the availability
-- engine that reads the Phase 2 tables.
--
-- Nothing calls this yet. The student picker moves onto it in Phase 6 and the
-- admin page in Phase 4, so applying this changes nothing anyone can see.
--
-- What it does
-- ------------
-- Computes bookable 30-minute slots on demand instead of storing them:
--
--   every 30-min start in the window
--     minus  anything not inside an 'available' rule
--     minus  anything overlapping a 'blocked' rule      (Mon-Fri 10:00-19:00)
--     then   exceptions override both, in either direction
--     minus  anything overlapping an existing booking
--     minus  anything inside the booking lead time      (2 hours)
--   = what the student is offered
--
-- The last-start-23:30 rule is deliberately NOT expressed anywhere. A candidate
-- survives only if the whole slot fits inside its window, and 23:30 + 30 min is
-- exactly 24:00. Change the day to end at 22:00 and the last start becomes 21:30
-- with no code change; make trials 60 minutes and it becomes 23:00.
--
-- Privacy: the function is SECURITY DEFINER so anon can call it without any read
-- access to teacher_availability_rules or _exceptions, which stay admin-only
-- under RLS. It returns instants and nothing else — never a rule, a reason, a
-- block, or a hint of what the teacher is doing with the rest of her day.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Settings the engine reads.
--
-- Kept as data so Re can change them from the admin screen later without a code
-- change, exactly like the 08:00-24:00 window itself.
-- ---------------------------------------------------------------------------
ALTER TABLE public.trial_settings
  ADD COLUMN IF NOT EXISTS slot_minutes         integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS booking_lead_minutes integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS buffer_minutes       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_horizon_days     integer NOT NULL DEFAULT 60;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trial_settings_slot_minutes_check') THEN
    ALTER TABLE public.trial_settings
      ADD CONSTRAINT trial_settings_slot_minutes_check
      CHECK (slot_minutes > 0 AND 1440 % slot_minutes = 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trial_settings_lead_minutes_check') THEN
    ALTER TABLE public.trial_settings
      ADD CONSTRAINT trial_settings_lead_minutes_check CHECK (booking_lead_minutes >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trial_settings_buffer_minutes_check') THEN
    ALTER TABLE public.trial_settings
      ADD CONSTRAINT trial_settings_buffer_minutes_check CHECK (buffer_minutes >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trial_settings_horizon_check') THEN
    ALTER TABLE public.trial_settings
      ADD CONSTRAINT trial_settings_horizon_check
      CHECK (max_horizon_days > 0 AND max_horizon_days <= 365);
  END IF;
END
$$;

COMMENT ON COLUMN public.trial_settings.booking_lead_minutes IS
  'How far ahead a student must book. 120 = a slot stops being offered two hours before it starts.';
COMMENT ON COLUMN public.trial_settings.buffer_minutes IS
  'Gap reserved after each trial. 0 means back-to-back trials are allowed.';
COMMENT ON COLUMN public.trial_settings.max_horizon_days IS
  'Hard cap on how far ahead availability is computed. Also bounds the work an '
  'anonymous caller can ask this database to do.';

-- ---------------------------------------------------------------------------
-- 2. The teacher's timezone, resolved from the rules themselves.
--
-- v2 assumes every rule and exception row shares one timezone: there is one
-- teacher. Mixing zones within a single grid is not supported, and the trigger
-- from Phase 2 already guarantees whatever is stored is a real IANA name.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_teacher_timezone()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT COALESCE(
    (SELECT r.timezone
       FROM public.teacher_availability_rules r
      WHERE r.kind = 'available'
      ORDER BY r.effective_from DESC, r.created_at DESC
      LIMIT 1),
    'Asia/Kuala_Lumpur'
  );
$function$;

-- ---------------------------------------------------------------------------
-- 3. The engine.
--
-- Signature is deliberately small: a window and an optional language. Callers
-- get instants back and convert for display; there is no source timezone left
-- for a caller to get wrong, which is the whole point of the redesign.
--
-- p_from / p_to are clamped, never trusted: p_from cannot be earlier than today
-- and p_to cannot exceed max_horizon_days. An anonymous caller therefore cannot
-- ask for a decade of 30-minute slots.
--
-- p_language matches rules that are language-scoped. Trials are currently one
-- pool with the student choosing at booking, so every seeded rule has
-- class_language NULL and matches regardless — the parameter exists so a
-- language-specific window can be added later without changing this signature.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_trial_availability_v2(
  p_from     date DEFAULT NULL,
  p_to       date DEFAULT NULL,
  p_language text DEFAULT NULL
)
 RETURNS TABLE(starts_at timestamptz, ends_at timestamptz, duration_min integer)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  WITH cfg AS (
    SELECT
      s.slot_minutes                AS slot_min,
      s.booking_lead_minutes        AS lead_min,
      s.buffer_minutes              AS buffer_min,
      s.max_horizon_days            AS horizon_days,
      public.fn_teacher_timezone()  AS tz
    FROM public.trial_settings s
    ORDER BY s.id
    LIMIT 1
  ),
  bounds AS (
    SELECT
      c.*,
      (now() AT TIME ZONE c.tz)::date AS today_local,
      GREATEST(COALESCE(p_from, (now() AT TIME ZONE c.tz)::date),
               (now() AT TIME ZONE c.tz)::date) AS d_from,
      LEAST(COALESCE(p_to, (now() AT TIME ZONE c.tz)::date + c.horizon_days),
            (now() AT TIME ZONE c.tz)::date + c.horizon_days) AS d_to
    FROM cfg c
  ),
  -- Full-day grid, then filter. Generating candidates per available window
  -- would be fussier and would miss slots opened by an 'available' exception
  -- that falls outside every rule window. 48 candidates a day at 60 days is
  -- ~2900 rows before filtering, which is nothing.
  grid AS (
    SELECT
      b.*,
      d::date AS slot_day,
      (d::date + make_interval(mins => b.slot_min * g)) AS local_start,
      (d::date + make_interval(mins => b.slot_min * (g + 1))) AS local_end
    FROM bounds b
    CROSS JOIN LATERAL generate_series(b.d_from, b.d_to, interval '1 day') d
    CROSS JOIN LATERAL generate_series(0, (1440 / b.slot_min) - 1) g
  ),
  judged AS (
    SELECT
      gr.*,
      -- Inside an 'available' rule for this weekday, with the whole slot fitting.
      EXISTS (
        SELECT 1 FROM public.teacher_availability_rules r
         WHERE r.kind = 'available'
           AND r.weekday = EXTRACT(DOW FROM gr.slot_day)::int
           AND r.effective_from <= gr.slot_day
           AND (r.effective_to IS NULL OR r.effective_to >= gr.slot_day)
           AND (p_language IS NULL OR r.class_language IS NULL OR r.class_language = p_language)
           AND (gr.slot_day + r.start_time) <= gr.local_start
           AND (gr.slot_day + r.end_time)   >= gr.local_end
      ) AS in_available_rule,
      -- Overlapping a 'blocked' rule — her regular teaching.
      EXISTS (
        SELECT 1 FROM public.teacher_availability_rules r
         WHERE r.kind = 'blocked'
           AND r.weekday = EXTRACT(DOW FROM gr.slot_day)::int
           AND r.effective_from <= gr.slot_day
           AND (r.effective_to IS NULL OR r.effective_to >= gr.slot_day)
           AND (gr.slot_day + r.start_time) <  gr.local_end
           AND (gr.slot_day + r.end_time)   >  gr.local_start
      ) AS in_blocked_rule,
      -- An 'available' exception covering the whole slot.
      EXISTS (
        SELECT 1 FROM public.teacher_availability_exceptions e
         WHERE e.kind = 'available'
           AND e.exception_date = gr.slot_day
           AND (gr.slot_day + e.start_time) <= gr.local_start
           AND (gr.slot_day + e.end_time)   >= gr.local_end
      ) AS in_available_exception,
      -- A 'blocked' exception overlapping it.
      EXISTS (
        SELECT 1 FROM public.teacher_availability_exceptions e
         WHERE e.kind = 'blocked'
           AND e.exception_date = gr.slot_day
           AND (gr.slot_day + e.start_time) <  gr.local_end
           AND (gr.slot_day + e.end_time)   >  gr.local_start
      ) AS in_blocked_exception
    FROM grid gr
  ),
  open_slots AS (
    SELECT
      j.*,
      (j.local_start AT TIME ZONE j.tz) AS utc_start,
      (j.local_end   AT TIME ZONE j.tz) AS utc_end,
      -- Occupancy includes the buffer, so a buffer would keep the next slot
      -- clear without changing the length of the class itself.
      ((j.local_end AT TIME ZONE j.tz) + make_interval(mins => j.buffer_min)) AS utc_occupied_to
    FROM judged j
     -- Precedence, stated exactly once: exceptions beat rules, and within either
     -- level blocked beats available.
     WHERE (j.in_available_rule OR j.in_available_exception)
       AND NOT j.in_blocked_exception
       AND (NOT j.in_blocked_rule OR j.in_available_exception)
  )
  SELECT
    o.utc_start AS starts_at,
    o.utc_end   AS ends_at,
    o.slot_min  AS duration_min
  FROM open_slots o
  WHERE o.utc_start >= now() + make_interval(mins => o.lead_min)
    AND NOT EXISTS (
      SELECT 1 FROM public.trial_bookings tb
       WHERE tb.status IN ('pending', 'confirmed')
         AND tb.slot_range IS NOT NULL
         AND tb.slot_range && tstzrange(o.utc_start, o.utc_occupied_to, '[)')
    )
  ORDER BY o.utc_start;
$function$;

COMMENT ON FUNCTION public.get_trial_availability_v2(date, date, text) IS
  'Bookable trial slots as absolute instants. SECURITY DEFINER so anonymous '
  'callers get computed availability without any read access to the teacher''s '
  'raw calendar. Returns instants only — never a rule, a block or a reason.';

-- Explicit rather than relying on the default PUBLIC grant, since this function
-- reads admin-only tables on the caller's behalf.
REVOKE ALL ON FUNCTION public.get_trial_availability_v2(date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trial_availability_v2(date, date, text)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.fn_teacher_timezone() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_teacher_timezone() TO anon, authenticated, service_role;

COMMIT;
