-- Correct the trial-slot timezone from Asia/Ho_Chi_Minh (UTC+7) to
-- Asia/Kuala_Lumpur (UTC+8), which is where the teacher actually is.
--
-- Background
-- ----------
-- trial_slots stores a naive local time (start_time text) plus the IANA zone
-- that time is expressed in. The real instant is derived on read as
--   (trial_date + start_time::time) AT TIME ZONE timezone
-- That is sound, but the zone being stored was wrong: the admin dialog
-- defaulted its free-text timezone field to 'Asia/Ho_Chi_Minh', and the column
-- default and both read paths used the same value as their fallback.
--
-- The effect was that a slot the teacher entered as 22:00 resolved to
-- 15:00 UTC = 23:00 in her own time — every trial an hour later than intended
-- for her, and an hour earlier than intended for the student.
--
-- The four affected slots have no bookings against them (verified against
-- trial_bookings before writing this), so correcting the zone moves the real
-- instant an hour earlier with no student to notify and no email to re-send.
--
-- We keep the start_time labels exactly as typed (22:00 stays 22:00) and change
-- only the zone they are interpreted in, because 22:00 Malaysia time is what
-- was meant in the first place.
--
-- Scope note: the 25 retired Asia/Ho_Chi_Minh rows are deliberately left alone.
-- They are a historical record, no read path reaches them (both functions below
-- filter on is_active AND lifecycle = 'active'), and rewriting them would edit
-- history to no benefit.

BEGIN;

-- 1. The live slots. Idempotent: re-running matches nothing once corrected.
UPDATE public.trial_slots
   SET timezone   = 'Asia/Kuala_Lumpur',
       updated_at = now()
 WHERE timezone   = 'Asia/Ho_Chi_Minh'
   AND is_active  = true
   AND lifecycle  = 'active';

-- 2. Stop the wrong value being the default for anything created later.
ALTER TABLE public.trial_slots
  ALTER COLUMN timezone SET DEFAULT 'Asia/Kuala_Lumpur';

-- 3. Read paths. Both functions are reproduced verbatim from the live
--    definitions (pg_get_functiondef, read immediately before writing this)
--    with one change each: the COALESCE fallback. Every other clause is
--    preserved deliberately — advance_trial_slots is SECURITY DEFINER with
--    SET search_path TO 'pg_catalog', 'public'; get_trial_availability is
--    STABLE with SET search_path TO 'public', 'extensions'. Dropping a
--    search_path here would be a security regression, not a tidy-up.

CREATE OR REPLACE FUNCTION public.get_trial_availability(p_language text DEFAULT NULL::text)
 RETURNS TABLE(day_of_week integer, start_time text, booked_count bigint, capacity integer, duration_min integer, timezone text, next_trial_date date, class_language text, session_period text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT
    ts.day_of_week,
    ts.start_time,
    COALESCE(COUNT(tb.id), 0) AS booked_count,
    ts.capacity,
    ts.duration_min,
    ts.timezone,
    ts.trial_date AS next_trial_date,
    ts.class_language,
    ts.session_period
  FROM public.trial_slots ts
  LEFT JOIN public.trial_bookings tb
    ON  tb.day_of_week = ts.day_of_week
   AND tb.start_time   = ts.start_time
   AND tb.trial_date   = ts.trial_date
   AND tb.status NOT IN ('cancelled','rejected')
   AND tb.is_tba = false
  WHERE ts.is_active = true
    AND ts.lifecycle  = 'active'
    AND ts.trial_date IS NOT NULL
    AND (ts.trial_date + ts.start_time::time) AT TIME ZONE COALESCE(ts.timezone, 'Asia/Kuala_Lumpur') > now()
    AND (p_language IS NULL OR ts.class_language IS NULL OR ts.class_language = p_language)
  GROUP BY ts.id, ts.day_of_week, ts.start_time, ts.capacity, ts.duration_min, ts.timezone, ts.trial_date, ts.class_language, ts.session_period
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity
  ORDER BY ts.trial_date, ts.start_time;
$function$;

CREATE OR REPLACE FUNCTION public.advance_trial_slots()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  slot RECORD;
  new_date date;
  target_month date;
  block_start date;
  dow_offset int;
BEGIN
  FOR slot IN
    SELECT id, trial_date, start_time, timezone, day_of_week
    FROM public.trial_slots
    WHERE is_active = true
      AND lifecycle = 'active'
      AND trial_date IS NOT NULL
      AND (trial_date + start_time::time) AT TIME ZONE COALESCE(timezone, 'Asia/Kuala_Lumpur') <= now()
  LOOP
    target_month := date_trunc('month', slot.trial_date)::date;
    LOOP
      target_month := (target_month + interval '1 month')::date;
      block_start := public.fn_first_trial_block_date(target_month);
      dow_offset := ((slot.day_of_week - EXTRACT(DOW FROM block_start)::int) + 7) % 7;
      new_date := block_start + dow_offset;
      EXIT WHEN (new_date + slot.start_time::time) AT TIME ZONE COALESCE(slot.timezone, 'Asia/Kuala_Lumpur') > now();
    END LOOP;

    UPDATE public.trial_slots
      SET trial_date = new_date,
          updated_at = now(),
          enrollment_alert_sent_at = CASE WHEN new_date <> slot.trial_date THEN NULL ELSE enrollment_alert_sent_at END,
          min_run_checked_at       = CASE WHEN new_date <> slot.trial_date THEN NULL ELSE min_run_checked_at END
      WHERE id = slot.id;
  END LOOP;
END;
$function$;

COMMIT;
