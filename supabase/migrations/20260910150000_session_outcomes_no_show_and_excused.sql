-- Attendance is recorded per student, and "not in the room" is three things.
--
-- Re's rules, stated 10 Sep 2026. When attendance is confirmed for a class,
-- each student gets one of:
--
--   attended          — was there. Charged.
--   no_show_charged   — did not come, unannounced. Still charged: for a group
--                       the class is the unit that was sold, not the seat, so
--                       one student's absence does not earn a credit when the
--                       group met and the teacher taught.
--   absent_excused    — did not come, agreed beforehand. Not charged, and the
--                       class is not deducted from their bundle.
--
-- And, separately from any student, the class itself may not have happened:
--
--   cancelled_no_charge — nobody was taught. Nothing is deducted from anyone.
--   scheduled           — still in the future.
--
-- Before this migration the CHECK allowed only three combinations:
--
--   attended             AND counted
--   cancelled_no_charge  AND NOT counted
--   scheduled            AND NOT counted
--
-- so both of the ways a student can miss a class that DID run had to borrow
-- a value that means something else:
--
--   • A charged no-show written as 'attended' inflates every attendance
--     figure and tells the student they were somewhere they were not.
--   • A charged no-show written as 'cancelled_no_charge' hands back a class
--     that was delivered and owed.
--   • An excused absence written as 'cancelled_no_charge' claims the class
--     never ran — false when the group met — and makes an excused absence
--     indistinguishable from a cancellation afterwards.
--
-- Whichever was chosen, attendance and revenue drawn from this table were
-- wrong in one direction, and the record could not be reconstructed later.
--
-- Naming. 'no_show_charged' rather than 'no_show' because the charge is the
-- entire point of the value and a bare 'no_show' invites the next reader to
-- assume it is free. 'absent_excused' rather than 'absent' for the mirror
-- reason: it says the absence was agreed, not merely observed.
--
-- Additive only. No existing row is touched, no default moves, nothing is
-- obliged to use either new value. Rows already written stay as they are,
-- including any absence previously recorded as 'attended' or as a
-- cancellation — correcting those needs someone who knows what happened in
-- the room, not a migration.
--
-- Renumbered from 20260910120000 on 10 Sep 2026: that version was already in
-- use on feat/confirm-student-before-payment, and two migrations sharing a
-- version means whichever merges second never runs.

ALTER TABLE public.student_class_sessions
  DROP CONSTRAINT IF EXISTS student_class_sessions_outcome_check;

ALTER TABLE public.student_class_sessions
  ADD CONSTRAINT student_class_sessions_outcome_check
  CHECK (
       (outcome = 'attended'            AND counted)
    OR (outcome = 'no_show_charged'     AND counted)
    OR (outcome = 'absent_excused'      AND NOT counted)
    OR (outcome = 'cancelled_no_charge' AND NOT counted)
    OR (outcome = 'scheduled'           AND NOT counted)
  );

COMMENT ON COLUMN public.student_class_sessions.outcome IS
  'Per student, for a class that ran: attended — was there, deducted. '
  'no_show_charged — did not come and did not say, still deducted; the group '
  'rule, where the class rather than the seat is what was sold. '
  'absent_excused — did not come, agreed in advance, not deducted. '
  'For the class itself: cancelled_no_charge — it did not run for anyone, '
  'nothing deducted. scheduled — still in the future. '
  'counted is not free to vary: the outcome fixes it, and the CHECK '
  'constraint on this table enforces the pairing.';
