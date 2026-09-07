-- Reham is in Thailand. Move the teacher's zone from Asia/Kuala_Lumpur to
-- Asia/Bangkok.
--
-- WHAT A ZONE LABEL DOES HERE
-- ---------------------------
-- These tables store a NAIVE wall time plus the IANA zone that time is
-- expressed in. The real instant is derived on read. So changing a label
-- without changing the time MOVES the class:
--
--     Asia/Kuala_Lumpur = UTC+8      Asia/Bangkok = UTC+7
--
-- 22:00 relabelled from Kuala_Lumpur to Bangkok happens ONE HOUR LATER in
-- absolute terms, and therefore one hour later for the student in Cairo.
--
-- That is the whole risk in this change, and it is why the eight private
-- lessons are NOT in this file. See the bottom.
--
--
-- 1. HER OWN AVAILABILITY WINDOW - 7 rows, safe to relabel
-- --------------------------------------------------------
-- teacher_availability_rules kind='available' holds one 08:00-24:00 window per
-- weekday, noted "Open for trials". It is a statement about when SHE is free.
-- Nobody is booked against it and no email quotes it.
--
-- Relabelled, the same 08:00-24:00 now means 08:00-24:00 Bangkok, which is her
-- actual clock. In Cairo terms the window moves from 02:00-18:00 to
-- 03:00-19:00 - later, and therefore further INTO Egyptian evening demand,
-- which is the direction that helps.
--
-- Checked before writing: the 4 active trial slots are 15:00-16:30 Africa/Cairo
-- = 20:00-21:30 Bangkok, comfortably inside the new window. Nothing that is
-- currently bookable falls outside it.
--
--
-- 2. fn_teacher_timezone() - the hardcoded fallback
-- --------------------------------------------------
-- The function reads the label off the newest kind='available' row, so step 1
-- already changes what it returns. But it COALESCEs to a literal
-- 'Asia/Kuala_Lumpur' when that table is empty, and a fallback that names the
-- wrong continent is a trap waiting for the first person who clears the table.
-- Only the literal changes; the query is untouched.
--
--
-- 3. COLUMN DEFAULTS on the four teacher-side tables
-- ---------------------------------------------------
-- teacher_availability_rules, teacher_availability_exceptions,
-- teacher_schedule_slots and teacher_student_classes all default to
-- 'Asia/Kuala_Lumpur'. Defaults affect FUTURE rows only - no existing row is
-- touched by an ALTER ... SET DEFAULT.
--
-- The student-side tables are deliberately NOT in this list. trial_slots,
-- trial_bookings, schedule_packages and matching_slots all default to
-- 'Africa/Cairo' and must stay that way: those times belong to the students,
-- not to wherever the teacher is living this month. That separation is the
-- reason this migration is small.
--
--
-- TO UNDO
-- -------
--   UPDATE public.teacher_availability_rules
--      SET timezone = 'Asia/Kuala_Lumpur' WHERE kind = 'available';
--   -- plus re-run the previous fn_teacher_timezone() definition and defaults.

BEGIN;

-- ── 1. Her availability window ──
DO $$
DECLARE
  v_before int;
  v_moved  int;
  v_left   int;
BEGIN
  SELECT count(*) INTO v_before
    FROM public.teacher_availability_rules
   WHERE kind = 'available' AND timezone = 'Asia/Kuala_Lumpur';

  IF v_before = 0 THEN
    RAISE NOTICE 'No Kuala_Lumpur availability rows - already moved. Nothing to do.';
  ELSIF v_before <> 7 THEN
    RAISE EXCEPTION
      'expected 7 availability windows on Kuala_Lumpur, found % - not the shape this was written against, nothing changed', v_before;
  ELSE
    UPDATE public.teacher_availability_rules
       SET timezone   = 'Asia/Bangkok',
           updated_at = now()
     WHERE kind = 'available' AND timezone = 'Asia/Kuala_Lumpur';

    GET DIAGNOSTICS v_moved = ROW_COUNT;
    IF v_moved <> 7 THEN
      RAISE EXCEPTION 'expected to move 7 rows, moved % - rolling back', v_moved;
    END IF;
    RAISE NOTICE 'Moved % availability windows to Asia/Bangkok.', v_moved;
  END IF;

  -- The eight private lessons are Africa/Cairo in this table and must stay so:
  -- they are already expressed in the student's own zone, which is the one
  -- thing about them that should never depend on where the teacher is.
  SELECT count(*) INTO v_left
    FROM public.teacher_availability_rules
   WHERE kind = 'blocked' AND timezone <> 'Africa/Cairo';

  IF v_left <> 0 THEN
    RAISE EXCEPTION
      '% blocked rows are not on Africa/Cairo - this migration assumed all of them were, rolling back', v_left;
  END IF;
END $$;

-- ── 2. The fallback ──
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
    'Asia/Bangkok'
  );
$function$;

-- ── 3. Defaults for future rows ──
ALTER TABLE public.teacher_availability_rules
  ALTER COLUMN timezone SET DEFAULT 'Asia/Bangkok';
ALTER TABLE public.teacher_availability_exceptions
  ALTER COLUMN timezone SET DEFAULT 'Asia/Bangkok';
ALTER TABLE public.teacher_schedule_slots
  ALTER COLUMN timezone SET DEFAULT 'Asia/Bangkok';
ALTER TABLE public.teacher_student_classes
  ALTER COLUMN timezone SET DEFAULT 'Asia/Bangkok';

-- ── Proof ──
DO $$
DECLARE
  v_tz       text;
  v_src      text;
  v_defaults int;
  v_cairo    int;
BEGIN
  SELECT public.fn_teacher_timezone() INTO v_tz;
  IF v_tz <> 'Asia/Bangkok' THEN
    RAISE EXCEPTION 'fn_teacher_timezone() returns % after the move, expected Asia/Bangkok', v_tz;
  END IF;

  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'fn_teacher_timezone';
  IF v_src LIKE '%Kuala_Lumpur%' THEN
    RAISE EXCEPTION 'fn_teacher_timezone() still carries a Kuala_Lumpur fallback';
  END IF;

  SELECT count(*) INTO v_defaults
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND column_name = 'timezone'
     AND column_default LIKE '%Kuala_Lumpur%';
  IF v_defaults <> 0 THEN
    RAISE EXCEPTION '% timezone columns still default to Kuala_Lumpur', v_defaults;
  END IF;

  -- The student-side defaults must be untouched by all of the above.
  SELECT count(*) INTO v_cairo
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name IN ('trial_slots','trial_bookings','schedule_packages','matching_slots')
     AND column_name = 'timezone'
     AND column_default LIKE '%Africa/Cairo%';
  IF v_cairo <> 4 THEN
    RAISE EXCEPTION
      'expected all 4 student-side timezone defaults to still be Africa/Cairo, found % - rolling back', v_cairo;
  END IF;

  RAISE NOTICE 'Teacher zone is now %. Student-side defaults untouched.', v_tz;
END $$;

COMMIT;

-- ⚠ DELIBERATELY NOT IN THIS FILE: the eight rows in teacher_student_classes.
--
-- They are labelled Asia/Kuala_Lumpur and they are real lessons with real
-- students. Under that label they land on 18:00, 14:00, 17:00, 14:00, 17:00,
-- 17:00, 17:00 and 11:00 Cairo - which is EXACTLY what the eight matching
-- 'Private lesson' rows in teacher_availability_rules say in Africa/Cairo. The
-- two copies agree today.
--
-- Relabelling them to Asia/Bangkok without touching start_time would push every
-- one of those lessons an hour later in Cairo and break that agreement. Keeping
-- the students where they are requires relabelling AND subtracting an hour from
-- start_time - a rewrite of live commitments, which is a decision for Reham and
-- not something to slip into a timezone housekeeping migration.
