-- Drop get_trial_availability_v2. Nothing calls it.
--
-- THIS DROPS A DATABASE OBJECT. Reham asked for it on 2026-09-03, after it
-- turned up while tracing which function actually decides how many trial seats
-- are left.
--
-- What it was. Added 2026-08-22 in 20260822140000_trial_availability_v2.sql as
-- a smarter booking model: instead of a handful of fixed weekly slots, it
-- generated a grid of candidate times and subtracted everything that makes the
-- teacher unavailable - her availability rules, her blocked hours, her existing
-- students' classes (including one that starts at night and runs past
-- midnight), date exceptions, and any trial already booked over the same range.
-- A student would then see every hour she is genuinely free.
--
-- It was never wired up. Searched the whole repository: zero calls from src/,
-- zero from supabase/functions/. Checked in the database too: no other
-- function, no view and no cron job references it.
--
-- What is actually live is the older get_trial_availability, which reads the
-- four fixed dated slots and returns booked_count and capacity. Three places
-- call it - TrialSlotPicker.tsx, useUpcomingTrialSlots.ts and FreeTrialPage.tsx.
--
-- Worth recording, because it is the reason this came up at all: that live
-- function counts with
--
--   AND tb.status NOT IN ('cancelled','rejected')
--
-- which is the correct shape - exclude what is dead rather than enumerate what
-- is alive - so the seat count students see was never wrong. The bug fixed in
-- 20260904020000 was in the guard that REFUSES a booking, not in the number
-- displayed. v2 carried the enumerating form, which is what drew attention to
-- it, but a predicate inside an uncalled function is not a bug; it is dead code
-- that misleads whoever reads it next.
--
-- Reversible. The full body is preserved in
-- 20260822140000_trial_availability_v2.sql, so bringing it back is re-running
-- that file - which is also what would happen if the flexible booking model is
-- taken up later. Dropping it now costs nothing and stops it being mistaken for
-- something in use.
--
-- Only the function goes. fn_teacher_timezone, teacher_availability_rules,
-- teacher_availability_exceptions and teacher_student_classes are used
-- elsewhere and are untouched.

BEGIN;

DO $$
DECLARE
  callers int;
  views   int;
  jobs    int;
BEGIN
  SELECT count(*) INTO callers
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname <> 'get_trial_availability_v2'
     AND pg_get_functiondef(p.oid) ILIKE '%get_trial_availability_v2%';

  SELECT count(*) INTO views
    FROM pg_views
   WHERE schemaname = 'public' AND definition ILIKE '%get_trial_availability_v2%';

  SELECT count(*) INTO jobs
    FROM cron.job
   WHERE command ILIKE '%get_trial_availability_v2%';

  IF callers > 0 OR views > 0 OR jobs > 0 THEN
    RAISE EXCEPTION
      'get_trial_availability_v2 is referenced by % function(s), % view(s) and % cron job(s) - it is no longer unused, so nothing has been dropped', callers, views, jobs;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_trial_availability_v2(p_from date, p_to date, p_language text);

DO $$
DECLARE
  gone_v2  int;
  kept_v1  int;
BEGIN
  SELECT count(*) INTO gone_v2
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_trial_availability_v2';

  -- The one three pages depend on. Dropping the wrong overload would be
  -- silent until a student opened the booking page, so it is checked here.
  SELECT count(*) INTO kept_v1
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_trial_availability';

  IF gone_v2 <> 0 THEN
    RAISE EXCEPTION 'get_trial_availability_v2 still exists after the drop';
  END IF;
  IF kept_v1 < 1 THEN
    RAISE EXCEPTION 'get_trial_availability is missing - the live booking function was affected';
  END IF;

  RAISE NOTICE 'get_trial_availability_v2 dropped; get_trial_availability intact.';
END $$;

COMMIT;
