-- Phase 3, part 2: seed Re's standard week.
--
-- Twelve rows describe the whole schedule, every week, indefinitely:
--
--   7 x available  08:00-24:00   every day, including weekends
--   5 x blocked    10:00-19:00   Mon-Fri, her regular classes
--
-- weekday follows the convention already used by trial_slots and
-- trial_bookings: 0 = Sunday .. 6 = Saturday, matching EXTRACT(DOW).
--
-- class_language is NULL on every row: trials are one pool and the student
-- chooses their language at booking.
--
-- Idempotent. Re-running matches the existing rows and inserts nothing, so a
-- re-dispatched workflow cannot double-seed. Deliberately does NOT update rows
-- that already exist -- if Re has since changed her hours from the admin screen,
-- this migration must not quietly put them back.

BEGIN;

INSERT INTO public.teacher_availability_rules
  (weekday, start_time, end_time, kind, timezone, class_language, note)
SELECT v.weekday, v.start_time, v.end_time, v.kind, 'Asia/Kuala_Lumpur', NULL, v.note
FROM (VALUES
  -- Open for trials, 08:00 to midnight, every day.
  -- 24:00 is a real time in Postgres and means midnight at the end of the day,
  -- so the last 30-minute slot starts at 23:30 and ends exactly at 24:00.
  (0, TIME '08:00', TIME '24:00', 'available', 'Open for trials'),
  (1, TIME '08:00', TIME '24:00', 'available', 'Open for trials'),
  (2, TIME '08:00', TIME '24:00', 'available', 'Open for trials'),
  (3, TIME '08:00', TIME '24:00', 'available', 'Open for trials'),
  (4, TIME '08:00', TIME '24:00', 'available', 'Open for trials'),
  (5, TIME '08:00', TIME '24:00', 'available', 'Open for trials'),
  (6, TIME '08:00', TIME '24:00', 'available', 'Open for trials'),
  -- Regular classes, Monday to Friday. Blocked for trials.
  (1, TIME '10:00', TIME '19:00', 'blocked', 'Regular classes'),
  (2, TIME '10:00', TIME '19:00', 'blocked', 'Regular classes'),
  (3, TIME '10:00', TIME '19:00', 'blocked', 'Regular classes'),
  (4, TIME '10:00', TIME '19:00', 'blocked', 'Regular classes'),
  (5, TIME '10:00', TIME '19:00', 'blocked', 'Regular classes')
) AS v(weekday, start_time, end_time, kind, note)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teacher_availability_rules r
   WHERE r.weekday    = v.weekday
     AND r.start_time = v.start_time
     AND r.end_time   = v.end_time
     AND r.kind       = v.kind
     AND r.effective_to IS NULL
);

COMMIT;
