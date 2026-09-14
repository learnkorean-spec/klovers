-- Move four group classes off the collisions the DST change creates, and
-- rename the groups that carry the old time in their own name.
--
-- WHAT WENT WRONG, AND WHY IT WAS INVISIBLE
-- -----------------------------------------
-- 20260909 opened six Level 1-3 packages and checked them for conflicts. That
-- check was done against the teacher's window expressed in CAIRO time
-- ("03:00-19:00 Cairo", per claude/GROUP_SCHEDULE_L1_L3_2026-09-09.md).
--
-- But the window is not a Cairo fact. It is 14:00-23:00 Asia/Bangkok, and the
-- private lessons are anchored to Bangkok too. Cairo leaves summer time on
-- 30 October; Thailand has no DST. So on that date every Cairo-anchored class
-- slides one hour later on her clock while every Bangkok-anchored lesson stays
-- put. A check done in Cairo time cannot see that coming: it was correct on the
-- day it ran and wrong from 30 October, with nothing in between to announce it.
--
-- One conflict was wrong even on the day: Mon 14:00 Cairo was recorded as an
-- adjacency to the 15:00 class, but Mariam's lesson is 90 minutes, not 60, so
-- it runs to 15:30 and overlaps by half an hour.
--
-- MEASURED ON PRODUCTION BEFORE WRITING (both DST periods, everything
-- converted to one clock - Asia/Bangkok):
--
--   Mon  L1 19:00-20:00  x  Mariam  18:00-19:30     now, gone from 30 Oct
--   Sun  L2 20:00-21:00  x  trial   20:00-20:30     both periods
--   Sat  L3 20:00-21:00  x  trial   20:30-21:00     both periods
--   Tue  L3 21:00-22:00  x  Solafa  21:00-22:30     from 30 Oct, full hour
--   Wed  L2 21:00-22:00  x  Solafa  21:00-22:30     from 30 Oct, full hour
--
-- WHAT THIS CHANGES
-- -----------------
--   level_2  Sunday     16:00 -> 15:00 Cairo
--   level_3  Tuesday    16:00 -> 15:00 Cairo
--   level_2  Wednesday  16:00 -> 15:00 Cairo
--   level_3  Saturday   16:00 -> 14:00 Cairo   (15:00 is the hangul class)
--
-- All four land inside 12:00-17:00 Cairo, which is the strongest signal in the
-- enrolment-form data: "Afternoon (12pm-5pm)" is 13 of 24 answers, against 5
-- for the morning and 1 for the evening. So this is not a retreat to whatever
-- was free; it moves them further INTO the demand band, not out of it.
--
-- WHAT THIS DELIBERATELY DOES NOT CHANGE
-- --------------------------------------
--   * level_1 Monday 15:00. Its collision is the one that ENDS on 30 October,
--     and a student recorded a preference for that exact slot on 14 September.
--     The only clear Monday start is 12:00 - a three-hour move, away from the
--     time she chose, to avoid six weeks of a 30-minute overlap that then fixes
--     itself. If those six weeks need covering, moving Mariam's lesson 30
--     minutes earlier costs one person instead of a class; that is Re's call,
--     not a migration's.
--   * level_1 Thursday 15:00. Already clear in both periods.
--   * Both hangul classes, Fri and Sat 15:00 Cairo. Verified clear in both
--     periods, and the Friday group now has a member. Re confirmed on
--     2026-09-14: "if i am free leave them its good". She is free. They stay.
--
-- THE SYNC - WHAT ELSE HOLDS THESE TIMES
-- --------------------------------------
-- Every consumer was checked, not assumed:
--
--   17 functions read schedule_packages (the placement-result email, the
--   pre-class reminders, the group-link email, the schedule picker, the trial
--   conflict guard, session generation). NONE of them hardcodes a time - all
--   read the column live, so all four follow this change with no further edit.
--   Verified with a regex over pg_get_functiondef for every such function.
--
--   pkg_groups.name is the one exception: it stores the time as TEXT
--   ("Level 2 · Sunday 16:00 Cairo"). It is shown to admins and used in the
--   "your group is formed" email, so a stale name would tell a student the
--   wrong hour in writing. The four names are rewritten here in the same
--   transaction. This is the whole of the sync surface.
--
--   pkg_group_sessions and group_sessions are both EMPTY, and no day changes
--   here, so no generated session is stranded.
--
-- NO EMAIL IS SENT BY THIS MIGRATION
-- ----------------------------------
-- schedule_packages carries no triggers at all. pkg_groups carries exactly one,
--
--     trg_email_group_members_on_link_set AFTER UPDATE OF meeting_url
--
-- which is column-scoped to meeting_url and cannot fire on a name change. The
-- assertions below re-check that scope rather than trusting this comment, so if
-- someone widens the trigger later this migration fails instead of mailing
-- students. The 2026-09-07 customer-email freeze is unaffected.
--
-- TO UNDO: set the four start_time values back to 16:00 and restore the four
-- group names. Nothing else moved.

BEGIN;

-- ── The four moves ─────────────────────────────────────────────────────────
-- Addressed by (level, day_of_week, start_time, course_type) rather than by id,
-- so a re-run after a manual edit changes nothing instead of moving a class
-- that is already where it should be.

UPDATE public.schedule_packages
   SET start_time = TIME '15:00'
 WHERE level = 'level_2' AND day_of_week = 0
   AND start_time = TIME '16:00' AND course_type = 'group' AND is_active;

UPDATE public.schedule_packages
   SET start_time = TIME '15:00'
 WHERE level = 'level_3' AND day_of_week = 2
   AND start_time = TIME '16:00' AND course_type = 'group' AND is_active;

UPDATE public.schedule_packages
   SET start_time = TIME '15:00'
 WHERE level = 'level_2' AND day_of_week = 3
   AND start_time = TIME '16:00' AND course_type = 'group' AND is_active;

UPDATE public.schedule_packages
   SET start_time = TIME '14:00'
 WHERE level = 'level_3' AND day_of_week = 6
   AND start_time = TIME '16:00' AND course_type = 'group' AND is_active;

-- ── The names that carry a copy of the time ────────────────────────────────
-- Derived from the package rather than typed, so the name cannot disagree with
-- the column it describes. Only rows whose name still shows an hour that no
-- longer matches are touched.

UPDATE public.pkg_groups g
   SET name = format('%s · %s %s Cairo',
         CASE p.level WHEN 'level_1' THEN 'Level 1'
                      WHEN 'level_2' THEN 'Level 2'
                      WHEN 'level_3' THEN 'Level 3'
                      WHEN 'hangul'  THEN 'Hangul'
                      ELSE initcap(replace(p.level, '_', ' ')) END,
         CASE p.day_of_week WHEN 0 THEN 'Sunday'    WHEN 1 THEN 'Monday'
                            WHEN 2 THEN 'Tuesday'   WHEN 3 THEN 'Wednesday'
                            WHEN 4 THEN 'Thursday'  WHEN 5 THEN 'Friday'
                            ELSE 'Saturday' END,
         to_char(p.start_time, 'HH24:MI'))
  FROM public.schedule_packages p
 WHERE p.id = g.package_id
   AND p.is_active
   AND g.name ~ '[0-9]{1,2}:[0-9]{2}'
   AND g.name NOT LIKE '%' || to_char(p.start_time, 'HH24:MI') || '%';

-- ── Proof ──────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_moved     int;
  v_stale     int;
  v_overlaps  int;
  v_mon       int;
  v_outside   int;
  v_trigscope int;
  v_hangul    int;
BEGIN
  -- 1. The four packages are where they should be.
  SELECT count(*) INTO v_moved FROM public.schedule_packages
   WHERE is_active AND course_type = 'group'
     AND ((level='level_2' AND day_of_week=0 AND start_time=TIME '15:00')
       OR (level='level_3' AND day_of_week=2 AND start_time=TIME '15:00')
       OR (level='level_2' AND day_of_week=3 AND start_time=TIME '15:00')
       OR (level='level_3' AND day_of_week=6 AND start_time=TIME '14:00'));
  IF v_moved <> 4 THEN
    RAISE EXCEPTION 'expected 4 moved packages, found % - rolling back', v_moved;
  END IF;

  -- 2. The hangul classes Re asked to keep are untouched, and the Friday group
  --    still holds its member.
  SELECT count(*) INTO v_hangul FROM public.schedule_packages
   WHERE level='hangul' AND is_active AND start_time=TIME '15:00' AND day_of_week IN (5,6);
  IF v_hangul <> 2 THEN
    RAISE EXCEPTION 'the two hangul classes were supposed to stay at Fri/Sat 15:00, found % - rolling back', v_hangul;
  END IF;

  -- 3. No group name still advertises an hour its package does not have.
  SELECT count(*) INTO v_stale
    FROM public.pkg_groups g JOIN public.schedule_packages p ON p.id = g.package_id
   WHERE p.is_active AND g.name ~ '[0-9]{1,2}:[0-9]{2}'
     AND g.name NOT LIKE '%' || to_char(p.start_time,'HH24:MI') || '%';
  IF v_stale > 0 THEN
    RAISE EXCEPTION '% group name(s) still show the old time - rolling back', v_stale;
  END IF;

  -- 4. The real test: every group class, trial and private lesson converted to
  --    ONE clock, on a date before the DST change and a date after it. The only
  --    overlap allowed to survive is the Monday one this migration deliberately
  --    leaves alone; anything else means a move landed on something.
  WITH items AS (
    SELECT 'group '||p.level AS what, p.day_of_week dow, p.start_time st,
           (p.start_time + (p.duration_min||' min')::interval)::time en, p.timezone tz
      FROM public.schedule_packages p WHERE p.is_active
    UNION ALL
    SELECT 'trial '||ts.class_language, ts.day_of_week, ts.start_time::time,
           (ts.start_time::time + (ts.duration_min||' min')::interval)::time, ts.timezone
      FROM public.trial_slots ts WHERE ts.is_active AND ts.lifecycle='active'
    UNION ALL
    SELECT 'private '||r.note, r.weekday, r.start_time, r.end_time, r.timezone
      FROM public.teacher_availability_rules r WHERE r.kind='blocked'
  ), anchors(base) AS (VALUES (DATE '2026-09-20'), (DATE '2026-11-15')),
  bkk AS (
    SELECT a.base, i.what,
           ((a.base + i.dow + i.st) AT TIME ZONE i.tz AT TIME ZONE 'Asia/Bangkok') lo,
           ((a.base + i.dow + i.en) AT TIME ZONE i.tz AT TIME ZONE 'Asia/Bangkok') hi
      FROM items i CROSS JOIN anchors a
  ), clashes AS (
    SELECT DISTINCT a.base, a.what aw, b.what bw
      FROM bkk a JOIN bkk b
        ON a.base = b.base AND a.lo < b.hi AND b.lo < a.hi AND a.what < b.what
  )
  SELECT count(*) FILTER (WHERE NOT (aw = 'group level_1' AND bw LIKE 'private Mariam%')),
         count(*) FILTER (WHERE       aw = 'group level_1' AND bw LIKE 'private Mariam%')
    INTO v_overlaps, v_mon
    FROM clashes;

  IF v_overlaps > 0 THEN
    RAISE EXCEPTION
      '% unexpected schedule overlap(s) remain after the move - rolling back', v_overlaps;
  END IF;
  IF v_mon <> 1 THEN
    RAISE EXCEPTION
      'expected exactly the one known Monday overlap to survive, found % - rolling back', v_mon;
  END IF;

  -- 5. Every class still starts and ends inside her stated working window,
  --    checked on her own clock in both periods.
  WITH anchors(base) AS (VALUES (DATE '2026-09-20'), (DATE '2026-11-15'))
  SELECT count(*) INTO v_outside
    FROM public.schedule_packages p CROSS JOIN anchors a
   WHERE p.is_active
     AND ( ((a.base + p.day_of_week + p.start_time) AT TIME ZONE p.timezone
              AT TIME ZONE 'Asia/Bangkok')::time < TIME '14:00'
        OR ((a.base + p.day_of_week + p.start_time + (p.duration_min||' min')::interval)
              AT TIME ZONE p.timezone AT TIME ZONE 'Asia/Bangkok')::time > TIME '23:00' );
  IF v_outside > 0 THEN
    RAISE EXCEPTION
      '% class occurrence(s) fall outside 14:00-23:00 Asia/Bangkok - rolling back', v_outside;
  END IF;

  -- 6. The rename could only be safe because the one trigger on pkg_groups is
  --    scoped to meeting_url. Re-check that rather than trust the comment.
  SELECT count(*) INTO v_trigscope
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
   WHERE NOT t.tgisinternal AND c.relname = 'pkg_groups'
     AND pg_get_triggerdef(t.oid) NOT LIKE '%UPDATE OF meeting_url%';
  IF v_trigscope > 0 THEN
    RAISE EXCEPTION
      '% trigger(s) on pkg_groups are not scoped to meeting_url - a rename here could email students, rolling back',
      v_trigscope;
  END IF;

  RAISE NOTICE
    'Moved 4 group classes, renamed their groups, 0 unexpected overlaps in either DST period.';
END $$;

COMMIT;

-- ⚠ LEFT FOR RE, DELIBERATELY: level_1 Monday 15:00 Cairo overlaps Mariam's
-- private lesson by 30 minutes until 30 October, after which it clears on its
-- own. A student recorded a preference for that slot on 14 September. Moving
-- the class means 12:00 Cairo - the only clear Monday hour - which is a big
-- move for her; moving Mariam 30 minutes earlier costs one person instead.
-- Either is a decision about people, so neither is made here.
