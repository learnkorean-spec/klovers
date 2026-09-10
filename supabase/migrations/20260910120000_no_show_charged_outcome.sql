-- A group student who does not turn up still pays. The table could not say so.
--
-- Re's rule, stated 10 Sep 2026: for a group class, the class is the unit
-- that is sold, not the seat. If the class ran and the teacher taught, every
-- enrolled student is charged — including one who did not attend. One
-- student's absence does not earn a credit when the group met.
--
-- public.student_class_sessions could not record that. Its CHECK allowed
-- exactly three combinations:
--
--   attended             AND counted
--   cancelled_no_charge  AND NOT counted
--   scheduled            AND NOT counted
--
-- So a group absence had to be written as one of two lies: 'attended', which
-- inflates every attendance figure and tells the student they were there, or
-- 'cancelled_no_charge', which hands back a class that was delivered and
-- should have been paid for. Whichever was picked, revenue and attendance
-- reporting from this table was wrong in one direction.
--
-- This adds the missing fourth pair. Nothing else changes: no existing row is
-- touched, no default moves, and nothing is obliged to use the new value.
-- Rows already written stay exactly as they are, including any group absence
-- previously recorded as 'attended' — correcting those needs a person who
-- knows what happened in the room, not a migration.
--
-- Deliberately not named 'no_show'. The charge is the whole point of the
-- value, and a bare 'no_show' invites the next reader to assume it is free.

ALTER TABLE public.student_class_sessions
  DROP CONSTRAINT IF EXISTS student_class_sessions_outcome_check;

ALTER TABLE public.student_class_sessions
  ADD CONSTRAINT student_class_sessions_outcome_check
  CHECK (
       (outcome = 'attended'            AND counted)
    OR (outcome = 'no_show_charged'     AND counted)
    OR (outcome = 'cancelled_no_charge' AND NOT counted)
    OR (outcome = 'scheduled'           AND NOT counted)
  );

COMMENT ON COLUMN public.student_class_sessions.outcome IS
  'attended — the student was there, and the class is deducted. '
  'no_show_charged — the class ran without them and is still deducted; this '
  'is the group rule, where the class rather than the seat is what was sold. '
  'cancelled_no_charge — the class did not run and nothing is deducted. '
  'scheduled — in the future, not yet deducted. '
  'counted is not free to vary: it is fixed by the outcome, and the CHECK '
  'constraint on this table enforces the pairing.';
