-- Scenario 1, Option A: a student class may not be moved onto a live trial
-- booking. The move is refused and names the booking; Re resolves the trial
-- first (reschedule or cancel, student notified), then moves the class.
--
-- Why refuse rather than warn
-- --------------------------
-- A student class silently swallowing a confirmed trial is the one failure
-- nobody notices until two people join the same call. Availability is computed,
-- so the trial slot would simply stop being offered -- the booking itself would
-- survive, invisible, until it collided. Refusing keeps the two calendars
-- honest and puts the decision where it belongs.
--
-- Enforced in two places on purpose:
--   * this trigger, so the conflict is impossible however the row is written
--   * the admin UI, which calls fn_student_class_conflicts first to show a
--     readable message instead of a raised exception
-- The UI check is for kindness; this one is the guarantee.

BEGIN;

-- ---------------------------------------------------------------------------
-- Which live trial bookings would a proposed class collide with?
--
-- Returns rows so the UI can name them. SECURITY DEFINER because it reads
-- trial_bookings, but EXECUTE is granted to authenticated only -- this returns
-- student names and emails and must never be reachable anonymously.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_student_class_conflicts(
  p_weekday          integer,
  p_start_time       time,
  p_duration_minutes integer,
  p_effective_from   date DEFAULT NULL,
  p_effective_to     date DEFAULT NULL
)
 RETURNS TABLE(booking_id uuid, booked_name text, booked_email text, starts_at timestamptz)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  WITH cfg AS (
    SELECT public.fn_teacher_timezone() AS tz,
           COALESCE(s.max_horizon_days, 60) AS horizon
      FROM public.trial_settings s
     ORDER BY s.id
     LIMIT 1
  ),
  win AS (
    -- Only ever looks forward. A class moving cannot invalidate a trial that
    -- has already happened.
    SELECT c.tz,
           GREATEST(COALESCE(p_effective_from, (now() AT TIME ZONE c.tz)::date),
                    (now() AT TIME ZONE c.tz)::date) AS d_from,
           LEAST(COALESCE(p_effective_to, (now() AT TIME ZONE c.tz)::date + c.horizon),
                 (now() AT TIME ZONE c.tz)::date + c.horizon) AS d_to
      FROM cfg c
  ),
  occurrences AS (
    SELECT ((d::date + p_start_time) AT TIME ZONE w.tz) AS occ_start,
           ((d::date + p_start_time + make_interval(mins => p_duration_minutes)) AT TIME ZONE w.tz) AS occ_end
      FROM win w
      CROSS JOIN LATERAL generate_series(w.d_from, w.d_to, interval '1 day') d
     WHERE EXTRACT(DOW FROM d::date)::int = p_weekday
  )
  SELECT tb.id, tb.name, tb.email, tb.starts_at
    FROM occurrences o
    JOIN public.trial_bookings tb
      ON tb.status IN ('pending', 'confirmed')
     AND tb.slot_range IS NOT NULL
     AND tb.slot_range && tstzrange(o.occ_start, o.occ_end, '[)')
   ORDER BY tb.starts_at;
$function$;

COMMENT ON FUNCTION public.fn_student_class_conflicts(integer, time, integer, date, date) IS
  'Live trial bookings a proposed student class would collide with. Returns '
  'booked student names, so it is granted to authenticated admins only.';

REVOKE ALL ON FUNCTION public.fn_student_class_conflicts(integer, time, integer, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_student_class_conflicts(integer, time, integer, date, date)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The guarantee.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_student_class_no_booking_conflict()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_count    integer;
  v_first_at timestamptz;
  v_first_nm text;
BEGIN
  -- Only the timing matters. Renaming a note or reassigning a class must not
  -- be refused because of a conflict that already existed.
  IF TG_OP = 'UPDATE'
     AND NEW.weekday          =            OLD.weekday
     AND NEW.start_time       =            OLD.start_time
     AND NEW.duration_minutes =            OLD.duration_minutes
     AND NEW.effective_from   IS NOT DISTINCT FROM OLD.effective_from
     AND NEW.effective_to     IS NOT DISTINCT FROM OLD.effective_to THEN
    RETURN NEW;
  END IF;

  -- A paused or ended student blocks nothing, so their class cannot collide.
  -- Reactivating them is guarded separately, on students.
  IF NOT EXISTS (
    SELECT 1 FROM public.teacher_students st
     WHERE st.id = NEW.student_id AND st.status = 'active'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT count(*), min(c.starts_at)
    INTO v_count, v_first_at
    FROM public.fn_student_class_conflicts(
           NEW.weekday, NEW.start_time, NEW.duration_minutes,
           NEW.effective_from, NEW.effective_to) c;

  IF v_count > 0 THEN
    SELECT c.booked_name INTO v_first_nm
      FROM public.fn_student_class_conflicts(
             NEW.weekday, NEW.start_time, NEW.duration_minutes,
             NEW.effective_from, NEW.effective_to) c
     WHERE c.starts_at = v_first_at
     LIMIT 1;

    RAISE EXCEPTION
      'student_class_booking_conflict: this class time overlaps % booked trial(s). First: % on %. Reschedule or cancel that trial first.',
      v_count,
      COALESCE(v_first_nm, 'a student'),
      to_char(v_first_at AT TIME ZONE public.fn_teacher_timezone(), 'Dy DD Mon HH24:MI')
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_student_class_no_booking_conflict ON public.teacher_student_classes;
CREATE TRIGGER trg_student_class_no_booking_conflict
  BEFORE INSERT OR UPDATE ON public.teacher_student_classes
  FOR EACH ROW EXECUTE FUNCTION public.tg_student_class_no_booking_conflict();

-- ---------------------------------------------------------------------------
-- The other route in: reactivating a paused student whose classes have since
-- been booked over. Same refusal, same reason.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_teacher_student_activate_no_booking_conflict()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_total    integer := 0;
  v_first_at timestamptz;
  rec        RECORD;
BEGIN
  IF NEW.status <> 'active' OR (TG_OP = 'UPDATE' AND OLD.status = 'active') THEN
    RETURN NEW;
  END IF;

  FOR rec IN
    SELECT sc.weekday, sc.start_time, sc.duration_minutes, sc.effective_from, sc.effective_to
      FROM public.teacher_student_classes sc
     WHERE sc.student_id = NEW.id
  LOOP
    SELECT v_total + count(*), LEAST(COALESCE(v_first_at, 'infinity'::timestamptz), COALESCE(min(c.starts_at), 'infinity'::timestamptz))
      INTO v_total, v_first_at
      FROM public.fn_student_class_conflicts(
             rec.weekday, rec.start_time, rec.duration_minutes,
             rec.effective_from, rec.effective_to) c;
  END LOOP;

  IF v_total > 0 THEN
    RAISE EXCEPTION
      'student_class_booking_conflict: reactivating this student would clash with % booked trial(s), the first on %. Reschedule or cancel those trials first.',
      v_total,
      to_char(v_first_at AT TIME ZONE public.fn_teacher_timezone(), 'Dy DD Mon HH24:MI')
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_teacher_students_activate_no_booking_conflict ON public.teacher_students;
CREATE TRIGGER trg_teacher_students_activate_no_booking_conflict
  BEFORE INSERT OR UPDATE OF status ON public.teacher_students
  FOR EACH ROW EXECUTE FUNCTION public.tg_teacher_student_activate_no_booking_conflict();

COMMIT;
