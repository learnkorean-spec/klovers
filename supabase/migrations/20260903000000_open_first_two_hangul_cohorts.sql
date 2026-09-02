-- ---------------------------------------------------------------------------
-- Open the first two class slots since April 2026.
--
-- WHY THIS EXISTS
-- ---------------
-- `schedule_packages` and `pkg_groups` are both EMPTY — 0 rows, verified
-- 2026-09-02. The eight packages that used to be there were all is_active=false
-- and were removed in PR #190. So every "Book this level" button now on the
-- public levels grid leads to an enrolment page with no days to offer, and the
-- paid funnel has produced nothing since the last APPROVED enrolment in April.
--
-- THE DECISIONS THIS ENCODES (Reham, 2026-09-02)
-- ----------------------------------------------
-- 1. The first product is HANGUL, not Level 1.
--    29 of the waiting trial students have never studied Korean and cannot
--    read the alphabet; Level 1 would lose them in a fortnight. Hangul is 4
--    classes over 1 month — a far smaller commitment than a 6-month level
--    (≈1200 EGP against ≈6100 in Egypt), and the cohort that finishes it rolls
--    into Level 1 in the SAME weekly slot four weeks later. One weekly hour
--    carries a group from the alphabet all the way up; no new slot is needed
--    to progress them.
--
-- 2. TWO slots, split by LANGUAGE — not offered as a free choice of day.
--    Of the waiting beginners, 14 are on the Arabic track and 15 on the
--    English track. If both days were offered to everyone, the two languages
--    would mix and neither group would be teachable. The student chooses a
--    track; the day comes with it.
--
-- 3. Friday and Saturday, 15:00 Africa/Cairo.
--    Both are the Egyptian weekend. 15:00 Cairo is 20:00 in Kuala Lumpur,
--    where Reham finishes her weekday job at 19:00 — an evening class for her,
--    a weekend afternoon for them.
--
--    The time is anchored to CAIRO on purpose. When Egypt leaves DST on
--    30 October 2026 the Cairo↔KL gap widens from 5 hours to 6, so something
--    has to move: this way the class stays at 15:00 for eight students and
--    shifts to 21:00 for one teacher. One person moving beats eight.
--
-- 4. 60 minutes, capacity 8.
--    BOTH DIFFER FROM THE COLUMN DEFAULTS (duration_min 90, capacity 5), so
--    both are written explicitly here. A 60-minute class of 10 gives each
--    student six minutes of speaking a week, which is a lecture, not a
--    language class; 8 is the ceiling that still lets every student be heard.
--
-- 5. Do not open a third slot until one of these two has 8 PAYING students.
--    Opening on interest rather than on payment is what splits a viable group
--    into two unviable ones.
--
-- SAFETY
-- ------
-- Inserts are guarded by NOT EXISTS on the natural key (level, day_of_week,
-- start_time, course_type), so a re-run cannot duplicate them. Nothing here
-- deletes or updates an existing row. The DO block at the end raises before
-- COMMIT unless the end state is exactly what was intended.
-- ---------------------------------------------------------------------------

BEGIN;

-- ── The two weekly slots ───────────────────────────────────────────────────
-- day_of_week follows the app's convention throughout (0 = Sunday), so
-- 5 = Friday and 6 = Saturday.

INSERT INTO schedule_packages
  (level, day_of_week, start_time, duration_min, timezone, capacity, course_type, is_active)
SELECT 'hangul', 5, TIME '15:00', 60, 'Africa/Cairo', 8, 'group', true
WHERE NOT EXISTS (
  SELECT 1 FROM schedule_packages
  WHERE level = 'hangul' AND day_of_week = 5
    AND start_time = TIME '15:00' AND course_type = 'group'
);

INSERT INTO schedule_packages
  (level, day_of_week, start_time, duration_min, timezone, capacity, course_type, is_active)
SELECT 'hangul', 6, TIME '15:00', 60, 'Africa/Cairo', 8, 'group', true
WHERE NOT EXISTS (
  SELECT 1 FROM schedule_packages
  WHERE level = 'hangul' AND day_of_week = 6
    AND start_time = TIME '15:00' AND course_type = 'group'
);

-- ── The two groups ─────────────────────────────────────────────────────────
-- The track language lives ONLY in the group name — neither table has a
-- language column — so the names say it plainly. They are read by admins and
-- appear in the "your group is formed" email, so they stay in English.

INSERT INTO pkg_groups (package_id, name, capacity, is_active)
SELECT p.id, 'Hangul · Arabic track · Friday 15:00 Cairo', 8, true
FROM schedule_packages p
WHERE p.level = 'hangul' AND p.day_of_week = 5
  AND p.start_time = TIME '15:00' AND p.course_type = 'group'
  AND NOT EXISTS (SELECT 1 FROM pkg_groups g WHERE g.package_id = p.id);

INSERT INTO pkg_groups (package_id, name, capacity, is_active)
SELECT p.id, 'Hangul · English track · Saturday 15:00 Cairo', 8, true
FROM schedule_packages p
WHERE p.level = 'hangul' AND p.day_of_week = 6
  AND p.start_time = TIME '15:00' AND p.course_type = 'group'
  AND NOT EXISTS (SELECT 1 FROM pkg_groups g WHERE g.package_id = p.id);

-- ── Verify before committing ───────────────────────────────────────────────
-- Every value below is one a wrong default would silently produce, which is
-- exactly the failure this guards: 90 minutes instead of 60, capacity 5
-- instead of 8, or a slot created in the wrong timezone.

DO $$
DECLARE
  v_packages int;
  v_groups   int;
  v_bad      int;
BEGIN
  SELECT count(*) INTO v_packages
  FROM schedule_packages
  WHERE level = 'hangul' AND is_active AND course_type = 'group'
    AND start_time = TIME '15:00' AND day_of_week IN (5, 6);

  IF v_packages <> 2 THEN
    RAISE EXCEPTION 'Expected 2 active Hangul packages at 15:00 on Fri/Sat, found %', v_packages;
  END IF;

  SELECT count(*) INTO v_bad
  FROM schedule_packages
  WHERE level = 'hangul' AND is_active AND day_of_week IN (5, 6)
    AND start_time = TIME '15:00'
    AND (duration_min <> 60 OR capacity <> 8 OR timezone <> 'Africa/Cairo');

  IF v_bad > 0 THEN
    RAISE EXCEPTION
      '% Hangul package(s) did not take the intended 60 min / capacity 8 / Africa/Cairo', v_bad;
  END IF;

  SELECT count(*) INTO v_groups
  FROM pkg_groups g
  JOIN schedule_packages p ON p.id = g.package_id
  WHERE g.is_active AND p.level = 'hangul' AND p.day_of_week IN (5, 6)
    AND p.start_time = TIME '15:00';

  IF v_groups <> 2 THEN
    RAISE EXCEPTION 'Expected 2 active Hangul groups, found %', v_groups;
  END IF;

  SELECT count(*) INTO v_bad
  FROM pkg_groups g
  JOIN schedule_packages p ON p.id = g.package_id
  WHERE g.is_active AND p.level = 'hangul' AND p.day_of_week IN (5, 6)
    AND p.start_time = TIME '15:00' AND g.capacity <> 8;

  IF v_bad > 0 THEN
    RAISE EXCEPTION '% Hangul group(s) did not take capacity 8', v_bad;
  END IF;

  RAISE NOTICE 'Opened 2 Hangul cohorts: Fri and Sat 15:00 Africa/Cairo, 60 min, capacity 8.';
END $$;

COMMIT;
