-- The eight private lessons move onto her Bangkok clock WITHOUT moving for the
-- student. Not one lesson changes when it actually happens.
--
-- WHY THIS IS A SEPARATE MIGRATION
-- --------------------------------
-- 20260907200000 moved the teacher's zone from Asia/Kuala_Lumpur (UTC+8) to
-- Asia/Bangkok (UTC+7) and deliberately left these rows alone, because they are
-- the only ones in the system where a careless relabel would reschedule a real
-- person. This is that decision, made explicitly, with the arithmetic shown.
--
-- THE TRANSFORMATION
-- ------------------
-- These tables store a naive wall time plus the zone it is written in. Moving
-- the label from UTC+8 to UTC+7 makes the same wall time happen an hour LATER,
-- so the wall time is moved an hour EARLIER to cancel it exactly:
--
--     timezone:   Asia/Kuala_Lumpur  ->  Asia/Bangkok    (+1h to the instant)
--     start_time: minus one hour                         (-1h to the instant)
--                                                        ------------------
--                                                         net zero
--
--     wd  before (KL)   after (Bangkok)   student sees, Cairo
--     --  -----------   ---------------   -------------------
--     Sun    23:00           22:00              18:00   unchanged
--     Mon    19:00           18:00              14:00   unchanged
--     Mon    22:00           21:00              17:00   unchanged
--     Tue    19:00           18:00              14:00   unchanged
--     Tue    22:00           21:00              17:00   unchanged
--     Wed    22:00           21:00              17:00   unchanged
--     Thu    22:00           21:00              17:00   unchanged
--     Sat    16:00           15:00              11:00   unchanged
--
-- Rehearsed read-only against production on BOTH sides of the Egyptian clock
-- change - 2026-09-07 (summer time) and 2026-11-07 (after 30 Oct) - because
-- Cairo has DST and Bangkok does not, so a transformation that is neutral in
-- September could still have been wrong in November. All 16 comparisons came
-- back identical. The assertions below repeat that check inside the transaction
-- rather than trusting the rehearsal.
--
-- THE ATTENDANCE HISTORY MOVES TOO, AND MUST
-- -------------------------------------------
-- student_class_sessions stores session_date + start_time and NO timezone of
-- its own: a session inherits its meaning from its class. So changing the class
-- label silently reinterprets every past attendance row hanging off it - a
-- lesson recorded at 23:00 would start reading as 19:00 Cairo instead of the
-- 18:00 it really was.
--
-- The session times are therefore shifted by the same hour, which keeps every
-- historical record pointing at the instant it always pointed at. This is not
-- rewriting history; it is what stops the relabel from rewriting it.
--
-- Measured first: all 36 session rows are in the PAST (latest 2026-09-01, today
-- is 2026-09-07). Nothing scheduled is touched because nothing is scheduled.
--
-- NOT TOUCHED: five orphan session rows whose class_id points at no surviving
-- class. With no class there is no zone to reinterpret and no way to know what
-- they meant, so guessing would be worse than leaving them. Flagged, not fixed.
--
-- ALSO NOT TOUCHED: the eight matching 'Private lesson' rows in
-- teacher_availability_rules. They are already stored in Africa/Cairo, which is
-- the student's own zone, and their whole point is to be independent of where
-- the teacher lives. The assertions below fail if this migration disturbs them,
-- and separately check that they still agree with the classes afterwards -
-- which is the real proof that nobody moved.
--
-- TO UNDO
-- -------
--   UPDATE public.student_class_sessions s
--      SET start_time = (s.start_time + interval '1 hour')::time
--     FROM public.teacher_student_classes c
--    WHERE c.id = s.class_id AND c.timezone = 'Asia/Bangkok';
--   UPDATE public.teacher_student_classes
--      SET start_time = (start_time + interval '1 hour')::time,
--          timezone   = 'Asia/Kuala_Lumpur'
--    WHERE timezone = 'Asia/Bangkok';

BEGIN;

-- ── Refuse to run against a shape this was not written for ──
DO $$
DECLARE
  v_classes  int;
  v_wrap     int;
  v_ses_wrap int;
  v_future   int;
BEGIN
  SELECT count(*) INTO v_classes
    FROM public.teacher_student_classes WHERE timezone = 'Asia/Kuala_Lumpur';

  IF v_classes = 0 THEN
    RAISE NOTICE 'No Kuala_Lumpur private lessons - already moved. Nothing to do.';
    RETURN;
  END IF;

  IF v_classes <> 8 THEN
    RAISE EXCEPTION
      'expected 8 private lessons on Kuala_Lumpur, found % - nothing has been changed', v_classes;
  END IF;

  -- Subtracting an hour from a time before 01:00 wraps past midnight, which
  -- would silently move the lesson to the previous weekday. None do today
  -- (earliest is 16:00) and this migration does not handle the case.
  SELECT count(*) INTO v_wrap
    FROM public.teacher_student_classes
   WHERE timezone = 'Asia/Kuala_Lumpur' AND start_time < TIME '01:00';
  IF v_wrap > 0 THEN
    RAISE EXCEPTION
      '% lessons start before 01:00 and would wrap to the previous day - this migration does not handle that, nothing changed', v_wrap;
  END IF;

  SELECT count(*) INTO v_ses_wrap
    FROM public.student_class_sessions s
    JOIN public.teacher_student_classes c ON c.id = s.class_id
   WHERE c.timezone = 'Asia/Kuala_Lumpur' AND s.start_time < TIME '01:00';
  IF v_ses_wrap > 0 THEN
    RAISE EXCEPTION
      '% sessions start before 01:00 and would wrap - nothing changed', v_ses_wrap;
  END IF;

  -- Not a blocker, just worth saying out loud if it ever stops being true.
  SELECT count(*) INTO v_future
    FROM public.student_class_sessions s
    JOIN public.teacher_student_classes c ON c.id = s.class_id
   WHERE c.timezone = 'Asia/Kuala_Lumpur' AND s.session_date >= CURRENT_DATE;
  IF v_future > 0 THEN
    RAISE NOTICE '% session rows are dated today or later; their instant is preserved too.', v_future;
  END IF;
END $$;

-- ── Snapshot the truth we must not change ──
--
-- Two dates on purpose: Cairo observes DST and Bangkok does not, so a change
-- that is neutral in September is not automatically neutral in November.
CREATE TEMP TABLE _cls_before ON COMMIT DROP AS
SELECT c.id, d.day, (d.day + c.start_time) AT TIME ZONE c.timezone AS instant
  FROM public.teacher_student_classes c
  CROSS JOIN (VALUES (DATE '2026-09-07'), (DATE '2026-11-07')) AS d(day)
 WHERE c.timezone = 'Asia/Kuala_Lumpur';

CREATE TEMP TABLE _ses_before ON COMMIT DROP AS
SELECT s.id, (s.session_date + s.start_time) AT TIME ZONE c.timezone AS instant
  FROM public.student_class_sessions s
  JOIN public.teacher_student_classes c ON c.id = s.class_id
 WHERE c.timezone = 'Asia/Kuala_Lumpur';

-- ── The sessions first, while their classes still say Kuala_Lumpur ──
UPDATE public.student_class_sessions s
   SET start_time = (s.start_time - INTERVAL '1 hour')::time,
       updated_at = now()
  FROM public.teacher_student_classes c
 WHERE c.id = s.class_id
   AND c.timezone = 'Asia/Kuala_Lumpur';

-- ── Then the classes ──
UPDATE public.teacher_student_classes
   SET start_time = (start_time - INTERVAL '1 hour')::time,
       timezone   = 'Asia/Bangkok',
       updated_at = now()
 WHERE timezone = 'Asia/Kuala_Lumpur';

-- ── Proof that nothing moved ──
DO $$
DECLARE
  v_bad_cls  int;
  v_bad_ses  int;
  v_left     int;
  v_rules    int;
  v_disagree int;
BEGIN
  -- Every class must land on the same instant it did before, on both dates.
  SELECT count(*) INTO v_bad_cls
    FROM _cls_before b
    JOIN public.teacher_student_classes c ON c.id = b.id
   WHERE ((b.day + c.start_time) AT TIME ZONE c.timezone) IS DISTINCT FROM b.instant;
  IF v_bad_cls > 0 THEN
    RAISE EXCEPTION
      '% class/date pairs changed the instant the lesson happens - rolling back', v_bad_cls;
  END IF;

  -- And every attendance record must still point where it pointed.
  SELECT count(*) INTO v_bad_ses
    FROM _ses_before b
    JOIN public.student_class_sessions s ON s.id = b.id
    JOIN public.teacher_student_classes c ON c.id = s.class_id
   WHERE ((s.session_date + s.start_time) AT TIME ZONE c.timezone) IS DISTINCT FROM b.instant;
  IF v_bad_ses > 0 THEN
    RAISE EXCEPTION
      '% attendance rows now describe a different instant - rolling back', v_bad_ses;
  END IF;

  SELECT count(*) INTO v_left
    FROM public.teacher_student_classes WHERE timezone = 'Asia/Kuala_Lumpur';
  IF v_left > 0 THEN
    RAISE EXCEPTION '% private lessons are still on Kuala_Lumpur - rolling back', v_left;
  END IF;

  -- The Cairo-stored mirror rows must be exactly as they were.
  SELECT count(*) INTO v_rules
    FROM public.teacher_availability_rules
   WHERE kind = 'blocked' AND note = 'Private lesson'
     AND timezone = 'Africa/Cairo' AND effective_to IS NULL;
  IF v_rules <> 8 THEN
    RAISE EXCEPTION
      'expected the 8 Africa/Cairo private-lesson rules to be untouched, found % - rolling back', v_rules;
  END IF;

  -- The point of all of the above: the two copies of the same eight lessons
  -- still agree about when they are. If this passes, no student moved.
  SELECT count(*) INTO v_disagree
  FROM (
    SELECT c.weekday,
           ((DATE '2026-09-07' + c.start_time) AT TIME ZONE c.timezone
              AT TIME ZONE 'Africa/Cairo')::time AS cairo
      FROM public.teacher_student_classes c
    EXCEPT ALL
    SELECT r.weekday, r.start_time
      FROM public.teacher_availability_rules r
     WHERE r.kind = 'blocked' AND r.note = 'Private lesson' AND r.effective_to IS NULL
  ) t;
  IF v_disagree > 0 THEN
    RAISE EXCEPTION
      '% lessons no longer match their Africa/Cairo mirror row - rolling back', v_disagree;
  END IF;

  RAISE NOTICE 'Eight private lessons are on Asia/Bangkok. Every student keeps the exact time they had.';
END $$;

COMMIT;

-- ⚠ STILL OPEN: five orphan rows in student_class_sessions (all at 19:00, all
-- dated 2026-07-06 to 2026-08-24) whose class_id matches no surviving class.
-- Whatever renders them falls back to a constant rather than a per-row zone, so
-- the teacher-zone change shifted how they READ by an hour even though nothing
-- about them changed. They are five past attendance records with no owner; the
-- fix is to work out which student they belonged to, not to guess an hour.
