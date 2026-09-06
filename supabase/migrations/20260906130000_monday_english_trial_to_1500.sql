-- Move the Monday English trial from 16:00 to 15:00 Cairo.
--
-- THIS UPDATES EXISTING ROWS - one trial_slots row and any booking on it.
-- Measured before writing: the slot has ZERO bookings of any status, so
-- nobody is being moved and nobody has to be told.
--
-- WHY, AND WHY NOW
-- ----------------
-- Egypt leaves summer time on 30 October 2026: Cairo goes from UTC+3 to
-- UTC+2. Every Cairo-fixed time therefore lands an hour LATER for the teacher
-- in Vietnam (UTC+7). Nothing changes for a student in Egypt; her evening
-- moves.
--
-- The Monday English trial is the one that breaks:
--
--   today          16:00 Cairo = 20:00-20:30 Vietnam   30 minutes clear
--   after 30 Oct   16:00 Cairo = 21:00-21:30 Vietnam   fully inside her
--                                                      Monday 21:00-22:30
--                                                      private lesson
--
-- 15:00 Cairo is 19:00 Vietnam now and 20:00 after the change - clear of that
-- lesson in both halves of the year, and clear of the Doo work block
-- (09:00-18:00 Vietnam, Monday to Friday) either way.
--
-- It also puts this trial at the same hour as the Sunday English trial, so
-- both English trials now read 15:00 Cairo.
--
-- Doing it today rather than in late October is the entire point: right now
-- this is one row with nothing attached. After the invitations go out it
-- becomes an email to everyone who picked Monday.
--
-- Order matters and is preserved: the slot moves BEFORE any booking, because
-- trial_bookings_validate_slot() rejects a booking whose (day_of_week,
-- start_time) matches no active slot.
--
-- NOT included: the Google Calendar event for this trial room is moved
-- separately by hand. Moving a calendar event does not change its Meet link,
-- so the link stored on this row stays correct either way.
--
-- WHY THIS FILE FAILED ONCE, AND WHAT CHANGED
-- -------------------------------------------
-- Apply Migrations #138 aborted this file with:
--
--   ERROR:  syntax error at or near ">"
--
-- The verification block below declared a variable called `overlaps`.
-- OVERLAPS is a type_func_name keyword in Postgres - the period-comparison
-- operator, `(a, b) OVERLAPS (c, d)` - so a bare `overlaps` is parsed as that
-- operator, the `>` in `IF overlaps > 0` is left with nothing on its left,
-- and the block never compiles. It is now v_overlaps.
--
-- An earlier comment here blamed make_interval's named-argument arrow. That
-- was wrong, and it is corrected below rather than left to mislead the next
-- person: the arrow is fine inside a DO block. 20260904050000 hit this same
-- keyword and only applied once it was renamed too.
--
-- The failure was clean: this file manages its own transaction, so the move
-- it had already made was rolled back with it. Confirmed on production - the
-- slot was still 16:00 and this version was not recorded.
--
-- ROLLBACK
-- --------
--   update public.trial_slots set start_time = '16:00'
--    where id = '369da68c-c751-4eef-9b15-f576c404254a';

BEGIN;

DO $$
DECLARE
  v_slot_id  CONSTANT uuid := '369da68c-c751-4eef-9b15-f576c404254a';
  v_old      CONSTANT text := '16:00';
  v_new      CONSTANT text := '15:00';
  v_date     date;
  v_tz       text;
  v_lang     text;
  v_live     int;
  v_moved    int;
  v_clash    int;
BEGIN
  SELECT ts.trial_date, ts.timezone, ts.class_language
    INTO v_date, v_tz, v_lang
    FROM public.trial_slots ts
   WHERE ts.id = v_slot_id AND ts.start_time = v_old AND ts.is_active
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'the Monday English trial slot is not where this migration expects it (id %, start %) - it has already been moved or retired, so nothing has been changed', v_slot_id, v_old;
  END IF;

  IF v_lang IS DISTINCT FROM 'english' THEN
    RAISE EXCEPTION 'slot % is % , not english - refusing to move the wrong slot', v_slot_id, v_lang;
  END IF;

  -- Moving a slot out from under a student who booked it means telling them,
  -- which is a different job from this one.
  SELECT count(*) INTO v_live
    FROM public.trial_bookings tb
   WHERE tb.slot_id = v_slot_id
     AND tb.status NOT IN ('cancelled', 'no_show', 'completed');

  IF v_live > 0 THEN
    RAISE EXCEPTION
      '% live booking(s) on this slot - moving it would change the time for a student who was told 16:00. Nothing has been changed; tell them first.', v_live;
  END IF;

  SELECT count(*) INTO v_clash
    FROM public.trial_slots x
   WHERE x.is_active AND x.trial_date = v_date AND x.start_time = v_new AND x.id <> v_slot_id;

  IF v_clash > 0 THEN
    RAISE EXCEPTION 'another active slot already sits at % on % - pick a different time', v_new, v_date;
  END IF;

  UPDATE public.trial_slots
     SET start_time = v_new
   WHERE id = v_slot_id;

  UPDATE public.trial_bookings tb
     SET start_time = v_new,
         starts_at  = CASE
                        WHEN v_date IS NULL OR v_tz IS NULL THEN tb.starts_at
                        ELSE ((v_date::text || ' ' || v_new)::timestamp AT TIME ZONE v_tz)
                      END
   WHERE tb.slot_id = v_slot_id
     AND tb.start_time = v_old;

  GET DIAGNOSTICS v_moved = row_count;

  RAISE NOTICE 'Monday English trial moved % to % on %. % booking row(s) moved with it.',
    v_old, v_new, v_date, v_moved;
END $$;

-- Nothing may now overlap a paid cohort.
--
-- v_overlaps, not overlaps: see the header. OVERLAPS is a Postgres keyword and
-- a variable of that name makes this whole block unparseable.
DO $$
DECLARE
  v_overlaps int;
BEGIN
  SELECT count(*) INTO v_overlaps
    FROM public.trial_slots ts
    JOIN public.schedule_packages sp
      ON sp.is_active
     AND sp.day_of_week = ts.day_of_week
     AND sp.timezone    = ts.timezone
     AND (ts.start_time)::time <  (sp.start_time + (sp.duration_min * interval '1 minute'))
     AND ((ts.start_time)::time + (ts.duration_min * interval '1 minute')) > sp.start_time
   WHERE ts.is_active;

  IF v_overlaps > 0 THEN
    RAISE EXCEPTION '% trial slot(s) overlap a paid cohort on the same day', v_overlaps;
  END IF;

  RAISE NOTICE 'No active trial slot overlaps a paid cohort.';
END $$;

COMMIT;
