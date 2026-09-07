-- Reham has left Doo Prime. Retire the day-job block from the teaching week.
--
-- ONE COLUMN, FIVE ROWS, NOTHING DELETED.
--
-- WHAT IS BEING RETIRED
-- ---------------------
-- teacher_availability_rules holds five `kind='blocked'` rows noted
-- "Regular classes", Monday to Friday, 10:00-19:00 Asia/Kuala_Lumpur. Despite
-- the label these are not classes - they are the day job. Confirmed with Reham
-- before writing this; the label was wrong from the day it was entered and is
-- left as-is rather than rewritten, because a retired row is history and
-- history is not improved by editing it. This comment is the correction.
--
-- In Cairo terms those hours are 06:00-15:00, Monday to Friday.
--
-- DATED, NOT DELETED
-- ------------------
-- `effective_to` is set to 2026-09-07, her last day. The rows stay exactly
-- where they are.
--
-- Deleting them would have thrown away the fact that those hours were ever
-- committed, which is the one thing anyone looking back at this schedule would
-- want to know. Dating them also keeps the "After 30 Oct" view of the timetable
-- honest about its own week rather than retroactively pretending the block
-- never existed.
--
-- To undo: set effective_to back to NULL on the same five rows.
--
--   UPDATE public.teacher_availability_rules
--      SET effective_to = NULL
--    WHERE kind = 'blocked' AND note = 'Regular classes';
--
-- WHAT THIS DOES **NOT** DO - read this before expecting a change
-- --------------------------------------------------------------
-- Nothing in the database ever enforced these rows. Checked, one by one:
--
--   fn_trial_slot_conflicts()   guards new trial slots. Reads schedule_packages,
--                               matching_slots and trial_slots. Does NOT read
--                               teacher_availability_rules at all.
--   fn_suggest_trial_slots()    reads `teacher_availability` - a DIFFERENT
--                               table (id, teacher_id, day_of_week, start_time,
--                               is_available) - not this one.
--   fn_teacher_timezone()       reads this table but only rows with
--                               kind='available'. The rows below are 'blocked',
--                               so her detected timezone is unaffected.
--
-- The only thing that reads these rows is the admin week timetable, for
-- display. So this migration frees no hours in software, because no hours were
-- locked in software: it corrects the picture, and the picture was the only
-- thing that was ever wrong.
--
-- Making the freed time USABLE is a separate act - adding rows to trial_slots
-- or schedule_packages. Nothing here does that, deliberately: which hours to
-- open is a business decision, and the honest finding is that these particular
-- hours (06:00-15:00 Cairo) are the least valuable ones for a mostly-Egyptian
-- student body, who are at work or school through all of them.
--
-- A NOTE ON effective_to
-- ----------------------
-- Until today nothing read this column - not the timetable, not
-- fn_teacher_timezone, not the guards - so dating a rule out had no effect
-- anywhere and the column was a promise the application did not keep. The
-- timetable was taught to honour effective_from/effective_to in the same change
-- as this migration. If a future reader adds another consumer of this table,
-- honour both columns there too.

BEGIN;

DO $$
DECLARE
  v_before        int;
  v_updated       int;
  v_private_open  int;
  v_available     int;
BEGIN
  -- Refuse to run against a shape this was not written for.
  SELECT count(*) INTO v_before
    FROM public.teacher_availability_rules
   WHERE kind = 'blocked'
     AND note = 'Regular classes'
     AND weekday BETWEEN 1 AND 5
     AND effective_to IS NULL;

  IF v_before = 0 THEN
    RAISE NOTICE 'No open "Regular classes" blocks - already retired. Nothing to do.';
    RETURN;
  END IF;

  IF v_before <> 5 THEN
    RAISE EXCEPTION
      'expected 5 open day-job blocks (Mon-Fri), found % - the schedule is not the shape this migration was written against, so nothing has been changed', v_before;
  END IF;

  UPDATE public.teacher_availability_rules
     SET effective_to = DATE '2026-09-07',
         updated_at   = now()
   WHERE kind = 'blocked'
     AND note = 'Regular classes'
     AND weekday BETWEEN 1 AND 5
     AND effective_to IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated <> 5 THEN
    RAISE EXCEPTION 'expected to retire 5 rows, retired % - rolling back', v_updated;
  END IF;

  -- The private lessons are real teaching and must be untouched by this.
  SELECT count(*) INTO v_private_open
    FROM public.teacher_availability_rules
   WHERE kind = 'blocked' AND note = 'Private lesson' AND effective_to IS NULL;

  IF v_private_open <> 8 THEN
    RAISE EXCEPTION
      'the 8 private lessons should all still be open, found % - rolling back', v_private_open;
  END IF;

  -- And the availability windows, which fn_teacher_timezone() reads.
  SELECT count(*) INTO v_available
    FROM public.teacher_availability_rules
   WHERE kind = 'available' AND effective_to IS NULL;

  IF v_available <> 7 THEN
    RAISE EXCEPTION
      'the 7 availability windows should all still be open, found % - rolling back', v_available;
  END IF;

  RAISE NOTICE 'Retired % day-job blocks as of 2026-09-07. % private lessons and % availability windows untouched.',
    v_updated, v_private_open, v_available;
END $$;

-- Her timezone must not have moved. It is derived from kind='available' rows,
-- which this migration does not touch, but the cost of proving it is one query
-- and the cost of being wrong is every class time in the admin UI.
DO $$
DECLARE
  v_tz text;
BEGIN
  SELECT public.fn_teacher_timezone() INTO v_tz;
  IF v_tz IS DISTINCT FROM 'Asia/Kuala_Lumpur' THEN
    RAISE EXCEPTION
      'fn_teacher_timezone() now returns % - retiring the day-job block changed the detected timezone, which it must not', v_tz;
  END IF;
  RAISE NOTICE 'Teacher timezone unchanged: %.', v_tz;
END $$;

COMMIT;

-- ⚠ SEPARATELY, AND NOT FIXED HERE: fn_teacher_timezone() returns
-- Asia/Kuala_Lumpur (UTC+8) while Reham lives in Vietnam (Asia/Ho_Chi_Minh,
-- UTC+7). Every derived time in the admin UI is therefore an hour out. That is
-- a real bug, it is older than this change, and correcting it moves times on
-- screens this migration has no business moving - so it gets its own change
-- with its own review, rather than being smuggled in beside a resignation.
