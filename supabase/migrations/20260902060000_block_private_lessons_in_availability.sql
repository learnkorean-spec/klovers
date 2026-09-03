-- ─────────────────────────────────────────────────────────────────────────────
-- Teach the availability rules about the private lessons.
--
-- `teacher_availability_rules` was seeded on 2026-08-22 with twelve rows: an
-- "available" window every day, and a Mon-Fri "blocked" window for the Doo
-- job. That job runs 10:00-19:00 Asia/Kuala_Lumpur and the rule says exactly
-- that, so it is right and this migration does not touch it.
--
-- What the table did not know about is the ongoing private teaching: five
-- students, 11.5 hours a week. Every one of those hours sat inside a window
-- the rules called "available", so anything reading this table would have
-- believed she was free while she was mid-lesson.
--
-- Nothing has collided yet, and that is luck rather than design. The four live
-- September trial slots happen to miss all five commitments - Mon 14 Sep at
-- 16:00 Cairo drops into the 90-minute gap between two lessons. Half an hour
-- later and it would have been offered to students on top of a lesson.
--
-- TIMEZONE. These eight rows are stored in Africa/Cairo while the Doo rule is
-- stored in Asia/Kuala_Lumpur. That mix is deliberate, and the per-row
-- `timezone` column exists for it:
--
--   * The Sunday lesson is 23:00-00:30 in Kuala Lumpur. It crosses midnight
--     and cannot be expressed as one (start_time, end_time) pair. In Cairo it
--     is 18:00-19:30 and needs no special case.
--   * Every row in `trial_slots` is Africa/Cairo. A reader checking a slot
--     against these rules is then comparing like with like.
--
-- PRIVACY. `note` says "Private lesson" and nothing else. The times identify
-- the commitment well enough for Re, and student names have no business in a
-- file that lives in git.
--
-- Source: her Google Calendar, read 2026-09-02, cross-checked against the
-- "5 active · 11.5 teaching hours a week" line on the My Students page. The
-- two agree exactly, which is why these hours are trusted.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Weekday numbering matches the rest of the codebase and Postgres: 0 = Sunday.
-- The existing Doo block uses 1-5 for Monday-Friday, which agrees.

INSERT INTO public.teacher_availability_rules
  (weekday, start_time, end_time, kind, timezone, class_language, effective_from, note)
VALUES
  -- Monday
  (1, '14:00', '15:30', 'blocked', 'Africa/Cairo', NULL, '2026-09-02', 'Private lesson'),
  (1, '17:00', '18:30', 'blocked', 'Africa/Cairo', NULL, '2026-09-02', 'Private lesson'),
  -- Tuesday
  (2, '14:00', '15:00', 'blocked', 'Africa/Cairo', NULL, '2026-09-02', 'Private lesson'),
  (2, '17:00', '18:30', 'blocked', 'Africa/Cairo', NULL, '2026-09-02', 'Private lesson'),
  -- Wednesday
  (3, '17:00', '18:30', 'blocked', 'Africa/Cairo', NULL, '2026-09-02', 'Private lesson'),
  -- Thursday
  (4, '17:00', '18:30', 'blocked', 'Africa/Cairo', NULL, '2026-09-02', 'Private lesson'),
  -- Saturday
  (6, '11:00', '12:30', 'blocked', 'Africa/Cairo', NULL, '2026-09-02', 'Private lesson'),
  -- Sunday
  (0, '18:00', '19:30', 'blocked', 'Africa/Cairo', NULL, '2026-09-02', 'Private lesson');

-- ── Verification ────────────────────────────────────────────────────────────
-- Refuse to commit unless the rows landed and add up to the 11.5 hours the
-- My Students page reports. A silent partial insert here would put the table
-- back into the state this migration exists to fix, only harder to notice.
DO $$
DECLARE
  v_rows    integer;
  v_hours   numeric;
  v_overlap integer;
BEGIN
  SELECT count(*), COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0), 0)
    INTO v_rows, v_hours
    FROM public.teacher_availability_rules
   WHERE kind = 'blocked'
     AND timezone = 'Africa/Cairo'
     AND note = 'Private lesson';

  IF v_rows <> 8 THEN
    RAISE EXCEPTION 'expected 8 private-lesson blocks, found %', v_rows;
  END IF;

  IF v_hours <> 11.5 THEN
    RAISE EXCEPTION 'expected 11.5 blocked hours a week, found %', v_hours;
  END IF;

  -- Two blocks on the same weekday must not overlap each other. Cheap to check
  -- and it catches a typo that would otherwise quietly double-count an hour.
  SELECT count(*) INTO v_overlap
    FROM public.teacher_availability_rules a
    JOIN public.teacher_availability_rules b
      ON a.weekday = b.weekday
     AND a.id < b.id
     AND a.timezone = b.timezone
     AND a.kind = 'blocked' AND b.kind = 'blocked'
     AND a.start_time < b.end_time
     AND b.start_time < a.end_time;

  IF v_overlap > 0 THEN
    RAISE EXCEPTION 'blocked rules overlap on the same weekday (% pairs)', v_overlap;
  END IF;

  RAISE NOTICE 'availability: 8 private-lesson blocks, 11.5 h/week, no overlaps';
END $$;

COMMIT;
