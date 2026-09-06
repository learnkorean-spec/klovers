-- ---------------------------------------------------------------------------
-- Two more Hangul day options - Wednesday (Arabic) and Thursday (English) -
-- created INACTIVE.
--
-- INSERT ONLY. Nothing existing is read-modified or deleted.
--
-- WHAT THIS IS FOR
-- ----------------
-- Reham wants a second day per language to offer students during the trial:
-- "which day suits you - Friday, Wednesday, Saturday or Thursday?" The answer
-- decides which day fills first.
--
-- WHY INACTIVE RATHER THAN OPEN
-- -----------------------------
-- 20260903000000 records a decision made on 2026-09-02:
--
--   "Do not open a third slot until one of these two has 8 PAYING students.
--    Opening on interest rather than on payment is what splits a viable group
--    into two unviable ones."
--
-- Both existing cohorts have zero members today. Four open Hangul days would
-- spread 29 waiting beginners across four groups instead of two, and a group
-- of two or three does not run.
--
-- Asking the question does not require the cohort to be bookable. These rows
-- give the days a real, validated definition to point at, stay off the
-- enrolment page, and turn on with one UPDATE each when a day has the numbers:
--
--   update public.schedule_packages set is_active = true where id = '<id>';
--   update public.pkg_groups        set is_active = true where package_id = '<id>';
--
-- WHY WEDNESDAY AND THURSDAY, AT 15:00 CAIRO
-- ------------------------------------------
-- Checked against the teacher's live calendar, in BOTH halves of the year -
-- Egypt leaves summer time on 30 October 2026, after which a Cairo-fixed time
-- lands an hour later for her in Vietnam:
--
--   Mon  work 09:00-18:00 - private 18:00-19:30 - private 21:00-22:30
--   Tue  work 09:00-18:00 - private 18:00-19:00 - private 21:00-22:30
--   Wed  work 09:00-18:00 - private 21:00-22:30            <- 18:00-21:00 free
--   Thu  work 09:00-18:00 - private 21:00-22:30            <- 18:00-21:00 free
--   Fri  work 09:00-18:00 - Klovers 19:00-21:00
--   Sat  private 15:00-16:30 - Klovers 19:00-21:00
--   Sun  Klovers 19:00-19:30 - private 22:00-23:30
--
-- Wednesday and Thursday are the two emptiest evenings. 15:00 Cairo is
-- 19:00-20:00 for her now and 20:00-21:00 after 30 October - clear of work in
-- both - and it keeps every Hangul cohort at the same hour.
--
-- The one caveat, recorded rather than hidden: after 30 October these two end
-- at 21:00 exactly as her weekday private lesson begins. That bundle has 9
-- classes left at roughly 4 a week, so it should be finished well before then.
-- If it is not, move these two to 14:30 Cairo.
--
-- 60 minutes and capacity 8 are written out because both differ from the
-- column defaults (90 and 5) - the same trap the first cohort migration
-- guarded against.
--
-- day_of_week follows the app's convention (0 = Sunday), so 3 = Wednesday and
-- 4 = Thursday.
--
-- ROLLBACK
-- --------
--   delete from public.pkg_groups
--    where package_id in (select id from public.schedule_packages
--                          where level='hangul' and day_of_week in (3,4)
--                            and start_time = time '15:00' and course_type='group');
--   delete from public.schedule_packages
--    where level='hangul' and day_of_week in (3,4)
--      and start_time = time '15:00' and course_type='group';
-- ---------------------------------------------------------------------------

BEGIN;

INSERT INTO public.schedule_packages
  (level, day_of_week, start_time, duration_min, timezone, capacity, course_type, is_active)
SELECT 'hangul', 3, TIME '15:00', 60, 'Africa/Cairo', 8, 'group', false
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedule_packages
   WHERE level = 'hangul' AND day_of_week = 3
     AND start_time = TIME '15:00' AND course_type = 'group'
);

INSERT INTO public.schedule_packages
  (level, day_of_week, start_time, duration_min, timezone, capacity, course_type, is_active)
SELECT 'hangul', 4, TIME '15:00', 60, 'Africa/Cairo', 8, 'group', false
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedule_packages
   WHERE level = 'hangul' AND day_of_week = 4
     AND start_time = TIME '15:00' AND course_type = 'group'
);

-- The track language lives ONLY in the group name - neither table has a
-- language column - so the names say it plainly, in the same shape as the
-- two groups already there.

INSERT INTO public.pkg_groups (package_id, name, capacity, is_active)
SELECT p.id, 'Hangul · Arabic track · Wednesday 15:00 Cairo', 8, false
  FROM public.schedule_packages p
 WHERE p.level = 'hangul' AND p.day_of_week = 3
   AND p.start_time = TIME '15:00' AND p.course_type = 'group'
   AND NOT EXISTS (SELECT 1 FROM public.pkg_groups g WHERE g.package_id = p.id);

INSERT INTO public.pkg_groups (package_id, name, capacity, is_active)
SELECT p.id, 'Hangul · English track · Thursday 15:00 Cairo', 8, false
  FROM public.schedule_packages p
 WHERE p.level = 'hangul' AND p.day_of_week = 4
   AND p.start_time = TIME '15:00' AND p.course_type = 'group'
   AND NOT EXISTS (SELECT 1 FROM public.pkg_groups g WHERE g.package_id = p.id);

DO $$
DECLARE
  v_new_packages int;
  v_new_groups   int;
  v_bad          int;
  v_active       int;
BEGIN
  SELECT count(*) INTO v_new_packages
    FROM public.schedule_packages
   WHERE level = 'hangul' AND course_type = 'group'
     AND start_time = TIME '15:00' AND day_of_week IN (3, 4);

  IF v_new_packages <> 2 THEN
    RAISE EXCEPTION 'Expected 2 Hangul packages on Wed/Thu at 15:00, found %', v_new_packages;
  END IF;

  -- The whole point: they must NOT be bookable yet.
  SELECT count(*) INTO v_bad
    FROM public.schedule_packages
   WHERE level = 'hangul' AND day_of_week IN (3, 4)
     AND start_time = TIME '15:00' AND is_active;

  IF v_bad > 0 THEN
    RAISE EXCEPTION
      '% of the new day option(s) came out ACTIVE - they must stay off the enrolment page until a day has the numbers', v_bad;
  END IF;

  SELECT count(*) INTO v_bad
    FROM public.schedule_packages
   WHERE level = 'hangul' AND day_of_week IN (3, 4) AND start_time = TIME '15:00'
     AND (duration_min <> 60 OR capacity <> 8 OR timezone <> 'Africa/Cairo');

  IF v_bad > 0 THEN
    RAISE EXCEPTION
      '% new package(s) took a column default instead of 60 min / capacity 8 / Africa/Cairo', v_bad;
  END IF;

  SELECT count(*) INTO v_new_groups
    FROM public.pkg_groups g
    JOIN public.schedule_packages p ON p.id = g.package_id
   WHERE p.level = 'hangul' AND p.day_of_week IN (3, 4) AND p.start_time = TIME '15:00';

  IF v_new_groups <> 2 THEN
    RAISE EXCEPTION 'Expected 2 groups for the new day options, found %', v_new_groups;
  END IF;

  -- The two live cohorts must be exactly as they were.
  SELECT count(*) INTO v_active
    FROM public.schedule_packages
   WHERE is_active AND level = 'hangul' AND course_type = 'group';

  IF v_active <> 2 THEN
    RAISE EXCEPTION
      'Expected the same 2 active Hangul cohorts as before, found % - this migration must not change what is open', v_active;
  END IF;

  RAISE NOTICE
    'Added Wed (Arabic) and Thu (English) Hangul options at 15:00 Cairo, both INACTIVE. Still 2 cohorts open.';
END $$;

COMMIT;
