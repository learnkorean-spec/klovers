-- Seed Re's real recurring classes as blocked availability rules.
--
-- These sit on top of the Mon-Fri 10:00-19:00 base block seeded in
-- 20260822140100. Each row carries the student's name in `note`, which is
-- admin-only: teacher_availability_rules is behind admin RLS, and
-- get_trial_availability_v2 returns instants only -- never a rule, a note or a
-- reason -- so a class name can never reach a student.
--
-- All times are the teacher's own (Asia/Kuala_Lumpur).
--
--   Menna  (English)   Sat            16:00-17:30
--   Rynad              Sun            23:00-00:30   <- crosses midnight
--   Solafa (English)   Mon-Thu        22:00-23:30
--   Mariam             Mon            19:00-20:30
--   Namy               Tue            19:00-20:00
--
-- Crossing midnight
-- -----------------
-- Both availability tables enforce end_time > start_time, so a window cannot
-- wrap past 24:00 in a single row. Rynad's Sunday 23:00-00:30 is therefore
-- stored as two rows describing the same class:
--
--   Sunday  23:00 -> 24:00   (the first hour)
--   Monday  00:00 -> 00:30   (the remaining half hour)
--
-- This is the schema working as intended rather than a workaround: a weekly
-- rule is keyed by weekday, and after midnight it genuinely is a different
-- weekday. The two rows share a note so they read as one class in the admin UI.
--
-- Note the Monday 00:00-00:30 row blocks nothing today, because trials do not
-- open until 08:00. It is recorded anyway so the block is truthful if that
-- floor ever moves, and so the admin calendar shows the class where it happens.
--
-- This does not conflict with "no class starts after midnight": Rynad starts at
-- 23:00, which is before midnight. The trial system's own last start is 23:30
-- for the same reason -- a start time, not an end time, is what is capped.
--
-- Idempotent, and deliberately non-destructive: re-running inserts nothing, and
-- it never updates a row that already exists. If Re has since changed one of
-- these from the admin screen, a re-dispatched workflow must not put it back.

BEGIN;

INSERT INTO public.teacher_availability_rules
  (weekday, start_time, end_time, kind, timezone, class_language, note)
SELECT v.weekday, v.start_time, v.end_time, 'blocked', 'Asia/Kuala_Lumpur', NULL, v.note
FROM (VALUES
  -- weekday: 0 = Sunday .. 6 = Saturday, matching EXTRACT(DOW).
  (6, TIME '16:00', TIME '17:30', 'Menna (English)'),
  (0, TIME '23:00', TIME '24:00', 'Rynad (part 1 of 2, continues Mon 00:00)'),
  (1, TIME '00:00', TIME '00:30', 'Rynad (part 2 of 2, continues from Sun 23:00)'),
  (1, TIME '22:00', TIME '23:30', 'Solafa (English)'),
  (2, TIME '22:00', TIME '23:30', 'Solafa (English)'),
  (3, TIME '22:00', TIME '23:30', 'Solafa (English)'),
  (4, TIME '22:00', TIME '23:30', 'Solafa (English)'),
  (1, TIME '19:00', TIME '20:30', 'Mariam'),
  (2, TIME '19:00', TIME '20:00', 'Namy')
) AS v(weekday, start_time, end_time, note)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teacher_availability_rules r
   WHERE r.weekday    = v.weekday
     AND r.start_time = v.start_time
     AND r.end_time   = v.end_time
     AND r.kind       = 'blocked'
     AND r.effective_to IS NULL
);

COMMIT;
