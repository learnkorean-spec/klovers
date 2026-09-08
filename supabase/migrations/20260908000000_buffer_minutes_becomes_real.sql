-- `buffer_minutes` has been a number nobody reads. Wire it to the one guard
-- that actually runs, and set the teaching window to what Reham really works.
--
-- WHY THIS FILE EXISTS
-- --------------------
-- trial_settings.buffer_minutes was added by 20260822140000 and read by a
-- function created in 20260822160000. That function was DROPPED by
-- 20260904030000_drop_unused_trial_availability_v2. Checked against the live
-- catalogue before writing this: no function in `public` or `app_private`
-- references buffer_minutes any more, and nothing under src/ does either.
--
-- So the setting exists, is editable in the admin UI, reads like a safety
-- margin, and enforces nothing. Setting it to 15 on its own would have changed
-- exactly nothing - the same trap as `effective_to`, which sat unread until
-- 20260907190000, and as the private lessons the conflict guard could not see
-- until 20260907240000. Three of the same shape in one week.
--
-- The fix is therefore NOT "set it to 15". It is: make the guard read it, THEN
-- set it to 15.
--
-- WHAT A BUFFER MEANS HERE
-- ------------------------
-- The proposed trial is widened by the buffer on BOTH sides before it is
-- compared to anything. A 30-minute trial at 16:30 with a 15-minute buffer is
-- tested as 16:15-17:15, so a private lesson starting at 17:00 now collides
-- where before it merely touched.
--
-- Applied uniformly - blocked rules, paid cohorts, matching slots and other
-- trials - because a margin that only applies to some of the things in a day is
-- not a margin. Back-to-back trials are exactly as bad as a trial that ends as
-- a private lesson begins.
--
-- The REPORTED detail still describes the real row, not the widened window: the
-- admin should read "Private lesson 17:00-18:30", not a padded time that exists
-- nowhere.
--
-- Verified before writing, against the four live slots, widened by 15 minutes:
--
--     11 Sep 16:30  ->  16:15-17:15   clear
--     12 Sep 16:30  ->  16:15-17:15   clear
--     13 Sep 15:00  ->  14:45-15:45   clear
--     14 Sep 16:00  ->  15:45-16:45   clear (exactly 15 min each side)
--
-- Nothing currently bookable is invalidated by turning this on.
--
-- buffer_minutes = 0 keeps the previous behaviour exactly, so this is safe to
-- ship even if the value is later set back to zero.
--
--
-- THE TEACHING WINDOW - AND AN HONEST LABEL ON IT
-- -----------------------------------------------
-- The seven kind='available' rows say 08:00-24:00 Asia/Bangkok. That is
-- 04:00-20:00 in Cairo, which is not a teaching day anyone has ever worked:
-- 08:00 Bangkok means 4am for an Egyptian student, and Reham has stated her
-- last acceptable class is 23:00 Bangkok, not midnight.
--
-- Corrected to 14:00-23:00 Asia/Bangkok = 18:00-03:00 UTC = 10:00-19:00 Cairo
-- while Egypt is on summer time.
--
-- ⚠ BE CLEAR ABOUT WHAT THIS DOES: nothing reads these two columns today.
-- fn_teacher_timezone() reads only the `timezone` of these rows; the conflict
-- guard reads only kind='blocked'. This corrects the record and the admin
-- display. It does NOT stop anyone booking outside the window, because no code
-- consults it. Do not cite this migration later as the reason a slot could not
-- be created - it is not.
--
-- The consumer that SHOULD read it is fn_suggest_trial_slots(), and that
-- function reads a different table entirely (`teacher_availability`, not
-- `teacher_availability_rules`). Wiring that up is its own change.
--
-- TO UNDO
-- -------
--   UPDATE public.trial_settings SET buffer_minutes = 0 WHERE id = 1;
--   UPDATE public.teacher_availability_rules
--      SET start_time = '08:00', end_time = '24:00' WHERE kind = 'available';
--   -- and restore the previous fn_trial_slot_conflicts() definition.

BEGIN;

-- ── 1. The guard honours the buffer ──
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
  v_buf   int := COALESCE((SELECT buffer_minutes FROM public.trial_settings WHERE id = 1), 0);
  v_end   int;
  v_lo    int;   -- widened by the buffer; used for every comparison
  v_hi    int;
BEGIN
  IF v_start IS NULL THEN RETURN; END IF;
  v_end := v_start + v_dur;

  -- The whole point of the buffer: compare the padded window, report the real
  -- row. v_buf = 0 makes v_lo/v_hi identical to v_start/v_end, so a zero
  -- setting reproduces the previous behaviour byte for byte.
  v_lo := v_start - v_buf;
  v_hi := v_end   + v_buf;

  RETURN QUERY
  SELECT 'schedule_package'::text,
         format('Group class on day %s at %s for %s min',
                sp.day_of_week, sp.start_time, sp.duration_min)
  FROM public.schedule_packages sp
  WHERE sp.is_active = true
    AND sp.day_of_week = p_day_of_week
    AND NOT (
      v_hi <= (EXTRACT(HOUR FROM sp.start_time)::int * 60
               + EXTRACT(MINUTE FROM sp.start_time)::int)
      OR v_lo >= (EXTRACT(HOUR FROM sp.start_time)::int * 60
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
      v_hi <= public._trial_time_to_minutes(ms.time)
      OR v_lo >= public._trial_time_to_minutes(ms.time) + 90
    );

  RETURN QUERY
  SELECT 'trial_slot'::text,
         format('Existing trial slot on day %s at %s',
                ts.day_of_week, ts.start_time)
  FROM public.trial_slots ts
  WHERE ts.lifecycle = 'active' AND ts.is_active = true
    AND ts.day_of_week = p_day_of_week
    AND NOT (
      v_hi <= public._trial_time_to_minutes(ts.start_time)
      OR v_lo >= public._trial_time_to_minutes(ts.start_time) + ts.duration_min
    );

  -- The teacher's own blocked hours - added by 20260907240000, now buffered.
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
      v_hi <= (EXTRACT(HOUR FROM r.start_time)::int * 60
               + EXTRACT(MINUTE FROM r.start_time)::int)
      OR v_lo >= (EXTRACT(HOUR FROM r.end_time)::int * 60
                  + EXTRACT(MINUTE FROM r.end_time)::int)
    );

  -- Anything the comparison cannot honestly evaluate is REPORTED, not skipped.
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

-- ── 2. Now the number means something, give it a value ──
UPDATE public.trial_settings SET buffer_minutes = 15, updated_at = now() WHERE id = 1;

-- ── 3. The teaching window, corrected (display + record only - see header) ──
DO $$
DECLARE
  v_rows int;
BEGIN
  UPDATE public.teacher_availability_rules
     SET start_time = TIME '14:00',
         end_time   = TIME '23:00',
         updated_at = now()
   WHERE kind = 'available'
     AND effective_to IS NULL
     AND timezone = 'Asia/Bangkok';

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows <> 7 THEN
    RAISE EXCEPTION
      'expected 7 Asia/Bangkok availability windows, updated % - not the shape this was written against, rolling back', v_rows;
  END IF;
  RAISE NOTICE 'Teaching window set to 14:00-23:00 Asia/Bangkok on % rows.', v_rows;
END $$;

-- ── Proof ──
DO $$
DECLARE
  v_buf     int;
  v_touch   int;
  v_broken  int;
  v_tz      text;
BEGIN
  SELECT buffer_minutes INTO v_buf FROM public.trial_settings WHERE id = 1;
  IF v_buf <> 15 THEN
    RAISE EXCEPTION 'buffer_minutes is % after the update, expected 15', v_buf;
  END IF;

  -- The behaviour that did not exist before: a trial ending exactly when a
  -- private lesson starts must now be reported. Monday's lesson starts at
  -- 17:00 Cairo, so a 16:30-17:00 trial touches it without overlapping.
  SELECT count(*) INTO v_touch
    FROM public.fn_trial_slot_conflicts(1, '16:30', 30)
   WHERE source = 'availability_rule';
  IF v_touch = 0 THEN
    RAISE EXCEPTION
      'a Monday trial at 16:30-17:00 abuts the 17:00 private lesson but is still reported clear - the buffer is not being applied, rolling back';
  END IF;

  -- ...and nothing currently live may be invalidated by switching it on.
  SELECT count(*) INTO v_broken
    FROM public.trial_slots ts
   WHERE ts.is_active AND ts.lifecycle = 'active' AND ts.timezone = 'Africa/Cairo'
     AND EXISTS (
       SELECT 1 FROM public.fn_trial_slot_conflicts(
                       ts.day_of_week, ts.start_time, ts.duration_min) c
        WHERE c.source IN ('availability_rule','schedule_package','matching_slot'));
  IF v_broken > 0 THEN
    RAISE EXCEPTION
      '% live trial slot(s) become conflicted once the buffer is on - rolling back rather than shipping a schedule that contradicts itself', v_broken;
  END IF;

  -- The window edit must not have moved her detected timezone.
  SELECT public.fn_teacher_timezone() INTO v_tz;
  IF v_tz <> 'Asia/Bangkok' THEN
    RAISE EXCEPTION 'fn_teacher_timezone() now returns %, expected Asia/Bangkok', v_tz;
  END IF;

  RAISE NOTICE 'Buffer is live at 15 min, enforced by the guard, and no live slot is broken by it.';
END $$;

COMMIT;

-- ⚠ STILL NOT WIRED, and worth saying plainly so nobody assumes otherwise:
--
-- 1. The 14:00-23:00 window above is read by NOTHING. It corrects the record
--    and what the admin sees. It does not prevent a booking outside it.
-- 2. fn_suggest_trial_slots() still reads `teacher_availability` - a different
--    table - so its suggestions ignore both the window and the private lessons.
--    That is the last of this family of gaps and it needs its own change.
