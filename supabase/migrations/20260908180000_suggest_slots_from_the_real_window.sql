-- The "suggested slots" screen has been showing nothing at all. Point it at the
-- window that is actually maintained.
--
-- FIRST, A CORRECTION I OWE THE RECORD
-- ------------------------------------
-- I said repeatedly - in 20260907190000, in 20260907240000, in 20260908000000
-- and out loud several times - that fn_suggest_trial_slots() "ignores the
-- private lessons". That was WRONG, and it was wrong the moment 20260907240000
-- shipped. The function has always contained:
--
--     AND NOT EXISTS (SELECT 1 FROM public.fn_trial_slot_conflicts(...))
--
-- so the instant the conflict guard learned to read teacher_availability_rules,
-- this function inherited that for free. The buffer from 20260908000000 came
-- through the same door. Nothing here needs fixing on that count.
--
-- WHAT IS ACTUALLY BROKEN
-- -----------------------
-- The CANDIDATE SOURCE. Candidates come from `teacher_availability` - a table
-- that is not the one anyone maintains:
--
--     rows                        5
--     rows with is_available=true 0     <- every one is false
--     last written                2026-04-14   (five months ago)
--     times                       00:30 .. 23:00   (00:30 Cairo is nobody's class)
--
-- With every row false, the candidate set is empty, so the function returns
-- ZERO suggestions and has done since April. The screen is not showing bad
-- advice; it is showing an empty list, silently.
--
-- THE FIX
-- -------
-- Generate candidates from `teacher_availability_rules` kind='available' - the
-- window that 20260908000000 set to 14:00-23:00 Asia/Bangkok and that
-- fn_teacher_timezone() already treats as the source of truth. That window is
-- walked in `slot_minutes` steps and converted to Africa/Cairo, which is the
-- zone trial_slots are anchored to.
--
-- Two details that are easy to get wrong and are handled explicitly:
--
--   * DST. Egypt leaves summer time on 30 October and Thailand has no DST, so
--     the Cairo equivalent of her window MOVES. The conversion is therefore
--     anchored to a real date - the next occurrence of each weekday - rather
--     than to a fixed offset, so the answer stays right through the change.
--
--   * The weekday can differ between the two zones. A late window can start on
--     one day for her and land on the previous day in Cairo. The returned
--     day_of_week is read back OUT of the converted timestamp rather than
--     copied from the rule, so it describes the student's day, which is the
--     day trial_slots is keyed on. It does not differ today; it would have been
--     silently wrong the first time it did.
--
-- SCORING
-- -------
-- The previous scoring is kept, with one addition: +25 for a start between
-- 12:00 and 17:00 Cairo. That is not a guess - it is the single strongest
-- signal in the preference data recorded on the enrolment form, where
-- "Afternoon (12pm-5pm)" is 13 of 24 answers, against 5 for the morning and 1
-- for the evening.
--
-- Capped at 20 rows. Measured before writing: her window yields 126 raw
-- candidates, 73 of which survive the conflict guard. Seventy-three
-- near-identical rows is not a suggestion list, it is a wall, and a screen
-- nobody can read is only marginally better than the empty one this replaces.
--
-- Verified read-only before writing, top of the ranked list:
--
--     Sun 12:00 12:30 13:00 13:30 14:00 16:00 16:30 17:00
--     Mon 12:00 12:30 13:00                     <- stops at Mariam's 14:00 lesson
--     Tue 12:00 12:30 13:00 15:30 16:00         <- the gap between two lessons
--     Wed 12:00 12:30 13:00 13:30
--
-- The Monday and Tuesday shapes are the private lessons being respected. That
-- is the guard working, visible in the output.
--
-- The RETURNS TABLE signature is unchanged; CREATE OR REPLACE refuses a changed
-- return type, so any drift fails loudly instead of creating a second overload.
--
-- NOT DONE HERE: `teacher_availability` is left exactly as it is. It is stale
-- and now unread by this function, but something else may still read it, and
-- deleting a table nobody has traced is how the next silent gap gets made.
--
-- TO UNDO: restore the previous function definition.

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_suggest_trial_slots()
 RETURNS TABLE(day_of_week integer, day_name text, start_time text, duration_min integer,
               timezone text, source text, score integer, reasons text[],
               is_reasonable_hour boolean, has_historical_demand boolean,
               would_replace_full_slot boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dur  int  := COALESCE((SELECT default_duration_min FROM public.trial_settings WHERE id = 1), 30);
  v_step int  := COALESCE((SELECT slot_minutes         FROM public.trial_settings WHERE id = 1), 30);
  v_tz   text := 'Africa/Cairo';
BEGIN
  RETURN QUERY
  WITH rules AS (
    SELECT r.weekday, r.start_time, r.end_time, r.timezone
      FROM public.teacher_availability_rules r
     WHERE r.kind = 'available'
       AND (r.effective_from IS NULL OR r.effective_from <= CURRENT_DATE)
       AND (r.effective_to   IS NULL OR r.effective_to   >= CURRENT_DATE)
  ),
  -- Anchor each rule to the next real date it applies to, so the zone
  -- conversion below is done against real DST rules rather than an offset.
  dated AS (
    SELECT r.*,
           (CURRENT_DATE + ((r.weekday - EXTRACT(DOW FROM CURRENT_DATE)::int + 7) % 7)) AS d
      FROM rules r
  ),
  bounds AS (
    SELECT ((d.d + d.start_time) AT TIME ZONE d.timezone AT TIME ZONE v_tz) AS lo,
           ((d.d + d.end_time)   AT TIME ZONE d.timezone AT TIME ZONE v_tz) AS hi
      FROM dated d
  ),
  candidates AS (
    SELECT DISTINCT
           EXTRACT(DOW FROM g)::int AS c_dow,      -- the STUDENT's day, read back out
           to_char(g, 'HH24:MI')    AS c_start,
           v_dur                    AS c_dur,
           v_tz                     AS c_tz,
           'teacher_availability_rules'::text AS c_src
      FROM bounds b
      CROSS JOIN LATERAL generate_series(
        b.lo, b.hi - (v_dur || ' min')::interval, (v_step || ' min')::interval) g
  ),
  filtered AS (
    SELECT c.* FROM candidates c
     WHERE NOT EXISTS (
       SELECT 1 FROM public.trial_slots ts
        WHERE ts.lifecycle = 'active' AND ts.is_active = true
          AND ts.day_of_week = c.c_dow AND ts.start_time = c.c_start)
       AND NOT EXISTS (
       SELECT 1 FROM public.fn_trial_slot_conflicts(c.c_dow, c.c_start, c.c_dur))
  ),
  demand AS (
    SELECT tb.day_of_week AS d_dow, tb.start_time AS d_start, COUNT(*) AS past_attempts
      FROM public.trial_bookings tb
     WHERE tb.is_tba = false AND tb.start_time IS NOT NULL
     GROUP BY tb.day_of_week, tb.start_time
  ),
  full_active AS (
    SELECT DISTINCT 1 AS has_full FROM public.v_trial_slots_admin v WHERE v.is_full = true
  ),
  scored AS (
    SELECT
      f.c_dow AS r_dow,
      CASE f.c_dow
        WHEN 0 THEN 'Sunday'    WHEN 1 THEN 'Monday'   WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
      END AS r_day_name,
      f.c_start AS r_start, f.c_dur AS r_dur, f.c_tz AS r_tz, f.c_src AS r_src,
      (
        100
        -- Measured, not assumed: "Afternoon (12pm-5pm)" is 13 of 24 answers on
        -- the enrolment form, against 5 for the morning and 1 for the evening.
        + CASE WHEN public._trial_time_to_minutes(f.c_start) BETWEEN (12*60) AND (17*60)
               THEN 25 ELSE 0 END
        + CASE
            WHEN public._trial_time_to_minutes(f.c_start) BETWEEN (9*60) AND (22*60) THEN 20
            ELSE 0
          END
        + CASE WHEN d.past_attempts IS NOT NULL AND d.past_attempts >= 1 THEN 15 ELSE 0 END
        + CASE WHEN EXISTS (SELECT 1 FROM full_active) THEN 10 ELSE 0 END
      ) AS r_score,
      ARRAY_REMOVE(ARRAY[
        'Inside the teacher''s stated working window',
        CASE WHEN public._trial_time_to_minutes(f.c_start) BETWEEN (12*60) AND (17*60)
             THEN 'Most-requested band on the enrolment form (12:00-17:00 Cairo)' ELSE NULL END,
        CASE WHEN public._trial_time_to_minutes(f.c_start) BETWEEN (9*60) AND (22*60)
             THEN 'Student-friendly hour (09:00-22:00 Cairo)' ELSE NULL END,
        CASE WHEN d.past_attempts IS NOT NULL AND d.past_attempts >= 1
             THEN format('Demonstrated demand (%s past booking attempt(s))', d.past_attempts)
             ELSE NULL END,
        CASE WHEN EXISTS (SELECT 1 FROM full_active)
             THEN 'Helps absorb overflow from a full existing slot' ELSE NULL END,
        'Clear of group classes, private lessons, matching slots and other trials'
      ], NULL) AS r_reasons,
      (public._trial_time_to_minutes(f.c_start) BETWEEN (9*60) AND (22*60)) AS r_reasonable,
      (d.past_attempts IS NOT NULL AND d.past_attempts >= 1) AS r_demand,
      EXISTS (SELECT 1 FROM full_active) AS r_overflow
    FROM filtered f
    LEFT JOIN demand d ON d.d_dow = f.c_dow AND d.d_start = f.c_start
  )
  SELECT s.r_dow, s.r_day_name, s.r_start, s.r_dur, s.r_tz, s.r_src,
         s.r_score, s.r_reasons, s.r_reasonable, s.r_demand, s.r_overflow
  FROM scored s
  ORDER BY s.r_score DESC, s.r_dow, s.r_start
  LIMIT 20;
END
$function$;

-- ── Proof ──
DO $$
DECLARE
  v_n       int;
  v_bad     int;
  v_outside int;
BEGIN
  SELECT count(*) INTO v_n FROM public.fn_suggest_trial_slots();
  IF v_n = 0 THEN
    RAISE EXCEPTION
      'the function still returns no suggestions - the whole point of this change was that it returned none, rolling back';
  END IF;

  -- Every suggestion must survive the guard it claims to have passed.
  SELECT count(*) INTO v_bad
    FROM public.fn_suggest_trial_slots() s
   WHERE EXISTS (SELECT 1 FROM public.fn_trial_slot_conflicts(
                          s.day_of_week, s.start_time, s.duration_min));
  IF v_bad > 0 THEN
    RAISE EXCEPTION
      '% suggestion(s) collide with something the guard already knows about - rolling back', v_bad;
  END IF;

  -- ...and none may fall outside the working window it was generated from.
  SELECT count(*) INTO v_outside
    FROM public.fn_suggest_trial_slots() s
   WHERE public._trial_time_to_minutes(s.start_time) < 9*60
      OR public._trial_time_to_minutes(s.start_time) > 22*60;
  IF v_outside > 0 THEN
    RAISE EXCEPTION
      '% suggestion(s) fall outside 09:00-22:00 Cairo - rolling back', v_outside;
  END IF;

  RAISE NOTICE 'Suggestions: % (was 0), all conflict-free and inside the window.', v_n;
END $$;

COMMIT;

-- ⚠ LEFT ALONE DELIBERATELY: public.teacher_availability, the stale table this
-- function used to read. Five rows, all is_available = false, untouched since
-- 2026-04-14. It is no longer read HERE, but it has not been traced across the
-- rest of the codebase, and dropping a table nobody has followed to its last
-- reader is how the next silent gap gets made. Trace it, then remove it.
