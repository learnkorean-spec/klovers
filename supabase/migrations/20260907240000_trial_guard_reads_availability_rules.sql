-- The trial-slot conflict guard never looked at the teacher's own commitments,
-- and a live slot is sitting on top of a private lesson because of it.
--
-- WHAT WENT WRONG
-- ---------------
-- fn_trial_slot_conflicts() is the function that answers "can a trial go here?"
-- It checked three tables: schedule_packages, matching_slots, trial_slots. It
-- did NOT check teacher_availability_rules - the table that holds the private
-- lessons. So the guard could see every Klovers class and none of the teacher's
-- other obligations, and cheerfully opened a slot on top of one:
--
--     Trial slot   Mon 14 Sep  15:00-15:30 Cairo  (English)
--     Private      Mon         14:00-15:30 Cairo
--     overlap      30 minutes - the whole slot
--
-- The calendar-drift watchdog caught this and wrote it to admin_notifications
-- on 2026-09-07. It was right. Verified independently against the live tables
-- before writing this file, rather than trusting the alert text.
--
-- Bookings on that slot: ZERO. This is the cheapest moment this will ever be
-- fixable - after a booking it stops being a data fix and becomes cancelling on
-- a student.
--
-- TWO CHANGES, IN THIS ORDER
-- --------------------------
--   1. Teach the guard to read teacher_availability_rules, so it cannot happen
--      again.
--   2. Move the one slot that already got through, to 16:00-16:30 Cairo.
--
-- Monday's private lessons are 14:00-15:30 and 17:00-18:30, so the free window
-- is 15:30-17:00. 16:00 was chosen over 16:30 to leave a 30-minute gap before
-- the 17:00 lesson rather than ending exactly as it begins. (The Friday trial
-- at 16:30-17:00 does end exactly when its 17:00 private lesson starts. That is
-- not a conflict and is left alone - but it is worth knowing it has no margin.)
--
-- WHAT THIS DELIBERATELY DOES NOT DO
-- ----------------------------------
-- The same alert also said the paid cohorts (Fri and Sat 15:00-16:00) "have no
-- blocked rule, so the DB thinks she is free while teaching". Adding blocked
-- rows for them was considered and REJECTED:
--
--   * fn_trial_slot_conflicts() already reads schedule_packages directly, for
--     is_active = true rows, which both cohorts are. They are guarded already.
--   * WeekTimetable.tsx draws trial_slots, schedule_packages AND blocked rules.
--     A cohort present in both tables would be drawn twice, side by side - and
--     that component draws overlapping blocks side by side precisely to mean
--     "these two collide". The fix would have manufactured the appearance of
--     the bug it was meant to prevent.
--
-- The real gap the alert points at is fn_suggest_trial_slots(), which reads a
-- DIFFERENT table (`teacher_availability`, not `teacher_availability_rules`).
-- That is a separate problem with a separate blast radius and it gets its own
-- change, not a duplicate row here.
--
-- A NOTE ON WHAT THE GUARD CAN AND CANNOT COMPARE
-- -----------------------------------------------
-- The function is given a weekday and a wall-clock string, not a date and not a
-- zone. So it can only honestly compare rules that are stored in the same zone
-- the trial slots are anchored to (Africa/Cairo) and that do not cross
-- midnight. Every blocked rule today is Africa/Cairo and none crosses midnight,
-- so nothing is skipped right now.
--
-- Rather than let a future non-Cairo rule be silently ignored - which is the
-- exact failure this migration exists to fix, one table further along - such a
-- rule is RETURNED as a row of its own, source 'availability_rule_unchecked'.
-- The admin sees "I could not check this", never a false all-clear.
--
-- Effective dating is honoured: a rule already ended, or not yet started, is
-- not a conflict.
--
-- TO UNDO
-- -------
--   UPDATE public.trial_slots SET start_time = '15:00'
--    WHERE id = '369da68c-c751-4eef-9b15-f576c404254a';
--   -- and restore the previous fn_trial_slot_conflicts() definition.

BEGIN;

-- ── 1. The guard learns to read the teacher's own commitments ──
--
-- Signature is byte-identical to the existing function; CREATE OR REPLACE
-- refuses a changed return type, so any drift fails loudly instead of quietly
-- creating a second overload the callers do not use.
CREATE OR REPLACE FUNCTION public.fn_trial_slot_conflicts(
  p_day_of_week integer, p_start_text text, p_duration_min integer DEFAULT NULL::integer)
 RETURNS TABLE(source text, detail text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start int := public._trial_time_to_minutes(p_start_text);
  v_dur   int := COALESCE(p_duration_min,
                          (SELECT default_duration_min FROM public.trial_settings WHERE id = 1),
                          30);
  v_end   int;
BEGIN
  IF v_start IS NULL THEN RETURN; END IF;
  v_end := v_start + v_dur;

  RETURN QUERY
  SELECT 'schedule_package'::text,
         format('Group class on day %s at %s for %s min',
                sp.day_of_week, sp.start_time, sp.duration_min)
  FROM public.schedule_packages sp
  WHERE sp.is_active = true
    AND sp.day_of_week = p_day_of_week
    AND NOT (
      v_end   <= (EXTRACT(HOUR FROM sp.start_time)::int * 60
                  + EXTRACT(MINUTE FROM sp.start_time)::int)
      OR v_start >= (EXTRACT(HOUR FROM sp.start_time)::int * 60
                     + EXTRACT(MINUTE FROM sp.start_time)::int
                     + sp.duration_min)
    );

  RETURN QUERY
  SELECT 'matching_slot'::text,
         format('Matching slot %s %s %s', ms.course_level, ms.day, ms.time)
  FROM public.matching_slots ms
  WHERE ms.status IN ('open','confirmed','full')
    AND CASE lower(ms.day)
          WHEN 'sunday' THEN 0 WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3 WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6 ELSE -1 END = p_day_of_week
    AND NOT (
      v_end   <= public._trial_time_to_minutes(ms.time)
      OR v_start >= public._trial_time_to_minutes(ms.time) + 90
    );

  RETURN QUERY
  SELECT 'trial_slot'::text,
         format('Existing trial slot on day %s at %s',
                ts.day_of_week, ts.start_time)
  FROM public.trial_slots ts
  WHERE ts.lifecycle = 'active' AND ts.is_active = true
    AND ts.day_of_week = p_day_of_week
    AND NOT (
      v_end   <= public._trial_time_to_minutes(ts.start_time)
      OR v_start >= public._trial_time_to_minutes(ts.start_time) + ts.duration_min
    );

  -- NEW: the teacher's own blocked hours - the private lessons. This is the
  -- table whose absence let a trial be booked on top of a real lesson.
  RETURN QUERY
  SELECT 'availability_rule'::text,
         format('%s on day %s, %s-%s %s',
                COALESCE(r.note, 'Blocked'), r.weekday,
                to_char(r.start_time, 'HH24:MI'), to_char(r.end_time, 'HH24:MI'),
                r.timezone)
  FROM public.teacher_availability_rules r
  WHERE r.kind = 'blocked'
    AND r.weekday = p_day_of_week
    AND r.timezone = 'Africa/Cairo'
    AND r.end_time > r.start_time
    AND (r.effective_from IS NULL OR r.effective_from <= CURRENT_DATE)
    AND (r.effective_to   IS NULL OR r.effective_to   >= CURRENT_DATE)
    AND NOT (
      v_end   <= (EXTRACT(HOUR FROM r.start_time)::int * 60
                  + EXTRACT(MINUTE FROM r.start_time)::int)
      OR v_start >= (EXTRACT(HOUR FROM r.end_time)::int * 60
                     + EXTRACT(MINUTE FROM r.end_time)::int)
    );

  -- Anything the comparison above cannot honestly evaluate is REPORTED, not
  -- skipped. A silently ignored rule is how the original bug worked.
  RETURN QUERY
  SELECT 'availability_rule_unchecked'::text,
         format('%s on day %s (%s-%s %s) was NOT compared: this guard only understands Africa/Cairo rules that do not cross midnight. Check it by hand.',
                COALESCE(r.note, 'Blocked'), r.weekday,
                to_char(r.start_time, 'HH24:MI'), to_char(r.end_time, 'HH24:MI'),
                r.timezone)
  FROM public.teacher_availability_rules r
  WHERE r.kind = 'blocked'
    AND r.weekday = p_day_of_week
    AND (r.effective_from IS NULL OR r.effective_from <= CURRENT_DATE)
    AND (r.effective_to   IS NULL OR r.effective_to   >= CURRENT_DATE)
    AND (r.timezone <> 'Africa/Cairo' OR r.end_time <= r.start_time);
END;
$function$;

-- ── Prove the new check actually catches the slot that got through ──
--
-- Run BEFORE the slot is moved, so this asserts the guard works rather than
-- asserting that a slot we already moved is fine.
DO $$
DECLARE
  v_hits int;
BEGIN
  SELECT count(*) INTO v_hits
    FROM public.fn_trial_slot_conflicts(1, '15:00', 30)
   WHERE source = 'availability_rule';

  IF v_hits = 0 THEN
    RAISE EXCEPTION
      'the new availability_rule check reports NO conflict for Mon 15:00-15:30, but a private lesson runs 14:00-15:30 - the check does not work, rolling back';
  END IF;
  RAISE NOTICE 'Guard now catches the Monday overlap (% row(s)).', v_hits;
END $$;

-- ── 2. Move the one slot that already got through ──
DO $$
DECLARE
  v_booked  int;
  v_moved   int;
BEGIN
  -- Never move a slot somebody is sitting in.
  SELECT count(*) INTO v_booked
    FROM public.trial_bookings b
   WHERE b.slot_id = '369da68c-c751-4eef-9b15-f576c404254a'
     AND b.status <> 'cancelled';

  IF v_booked > 0 THEN
    RAISE EXCEPTION
      '% live booking(s) on the Mon 14 Sep slot - moving it would be rescheduling a real student, which is not something a migration gets to decide. Nothing changed.', v_booked;
  END IF;

  UPDATE public.trial_slots
     SET start_time = '16:00',
         updated_at = now()
   WHERE id         = '369da68c-c751-4eef-9b15-f576c404254a'
     AND trial_date = DATE '2026-09-14'
     AND start_time = '15:00'
     AND is_active  = true;

  GET DIAGNOSTICS v_moved = ROW_COUNT;

  IF v_moved = 0 THEN
    RAISE NOTICE 'Mon 14 Sep slot is not at 15:00 any more - already moved or changed. Guard fix still applied.';
  ELSIF v_moved <> 1 THEN
    RAISE EXCEPTION 'expected to move exactly 1 slot, moved % - rolling back', v_moved;
  ELSE
    RAISE NOTICE 'Moved Mon 14 Sep trial from 15:00 to 16:00 Cairo.';
  END IF;
END $$;

-- ── Prove the result, across every active slot, not just the one ──
DO $$
DECLARE
  v_bad       int;
  v_still     int;
  v_unchecked int;
BEGIN
  -- The new position must be clear of everything except itself.
  SELECT count(*) INTO v_still
    FROM public.fn_trial_slot_conflicts(1, '16:00', 30)
   WHERE source IN ('availability_rule', 'schedule_package', 'matching_slot');

  IF v_still > 0 THEN
    RAISE EXCEPTION
      'Mon 16:00-16:30 still collides with % thing(s) - rolling back', v_still;
  END IF;

  -- And no ACTIVE Cairo slot may overlap any in-effect Cairo blocked rule.
  -- This is the check that would have caught the original bug, applied to the
  -- whole live schedule rather than the one row this migration knew about.
  SELECT count(*) INTO v_bad
    FROM public.trial_slots ts
    JOIN public.teacher_availability_rules r
      ON r.kind = 'blocked'
     AND r.weekday = ts.day_of_week
     AND r.timezone = 'Africa/Cairo'
     AND r.end_time > r.start_time
     AND (r.effective_to IS NULL OR r.effective_to >= CURRENT_DATE)
     AND ts.start_time::time < r.end_time
     AND (ts.start_time::time + (ts.duration_min || ' min')::interval) > r.start_time
   WHERE ts.is_active AND ts.lifecycle = 'active' AND ts.timezone = 'Africa/Cairo';

  IF v_bad > 0 THEN
    RAISE EXCEPTION
      '% active trial slot(s) still overlap a private lesson - rolling back', v_bad;
  END IF;

  -- Not a failure, but say it out loud if any rule could not be compared.
  SELECT count(*) INTO v_unchecked
    FROM public.teacher_availability_rules r
   WHERE r.kind = 'blocked'
     AND (r.effective_to IS NULL OR r.effective_to >= CURRENT_DATE)
     AND (r.timezone <> 'Africa/Cairo' OR r.end_time <= r.start_time);

  IF v_unchecked > 0 THEN
    RAISE WARNING
      '% blocked rule(s) are not Africa/Cairo or cross midnight; the guard reports them as unchecked rather than clearing them.', v_unchecked;
  END IF;

  RAISE NOTICE 'No active trial slot overlaps a private lesson.';
END $$;

COMMIT;

-- ⚠ SEPARATELY, NOT FIXED HERE:
--
-- 1. fn_suggest_trial_slots() reads `teacher_availability` - a different table
--    from the one this migration taught the guard to read. It has its own gap
--    and needs its own change.
-- 2. The Friday trial (16:30-17:00 Cairo) ends at the exact minute its 17:00
--    private lesson begins. Legal, and left alone, but there is no margin: any
--    overrun lands on a paying student.
