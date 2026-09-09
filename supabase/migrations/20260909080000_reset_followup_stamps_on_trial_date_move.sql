-- A postponed booking never got its prep email, and lost its follow-up sequence.
--
-- advance_trial_slots() Case B moves a short slot forward one interval and
-- carries its bookings with it. It clears rollover_notified_at so the student
-- is told again, but it does two things to the follow-up columns that are
-- wrong once the booking has a new date:
--
--   1. followup_prep_sent_at is left as it was. The prep letter (placement
--      test, what to bring, the Meet link) goes out the day BEFORE the class.
--      A booking that was stamped for its old date is therefore never sent one
--      for the new date. Six bookings on the September slots were in exactly
--      this state: all six stamped 2026-05-01 14:40, for a May class, then
--      rolled forward to 18/19/26 September. They were about to attend with no
--      prep letter and no Meet link. Their stamps were cleared by hand on
--      9 September; this migration is so it does not happen again.
--
--   2. followup_day1/3/7_sent_at are stamped with now() where they were NULL.
--      The rationale recorded in 20260812134650 is that the old class "never
--      ran", so the post-class letters do not apply -- true of the class that
--      was cancelled, but these columns belong to the BOOKING, not to one
--      occurrence of it. Stamping them permanently suppresses the day 1, 3 and
--      7 letters after the rescheduled class, which is the entire trial-to-paid
--      conversion sequence. A student whose class slipped one week is exactly
--      the student least likely to convert without it.
--
-- Both are fixed here at the table rather than inside advance_trial_slots(),
-- because the invariant belongs to the booking: whenever a booking's
-- trial_date moves to a later date, it is a different class, and every
-- follow-up column describes the class that has not happened yet.
--
-- Deliberately scoped to a FORWARD move. Correcting a date backwards, or any
-- other edit to the row, leaves the stamps alone -- this must not become a way
-- to re-send letters to someone who has already had them.

CREATE OR REPLACE FUNCTION public.tg_trial_bookings_reset_followups_on_move()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  IF NEW.trial_date IS NOT NULL
     AND OLD.trial_date IS NOT NULL
     AND NEW.trial_date > OLD.trial_date THEN
    NEW.followup_prep_sent_at := NULL;
    NEW.followup_day1_sent_at := NULL;
    NEW.followup_day3_sent_at := NULL;
    NEW.followup_day7_sent_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.tg_trial_bookings_reset_followups_on_move() IS
  'Clears the four follow-up idempotency stamps when a booking is moved to a later trial_date, so the new class gets its own prep letter and its own post-class sequence.';

DROP TRIGGER IF EXISTS trg_trial_bookings_reset_followups_on_move ON public.trial_bookings;

-- BEFORE UPDATE, and after trg_trial_bookings_track_change_cancel in name order
-- so it sees the row as the other BEFORE triggers leave it.
CREATE TRIGGER trg_trial_bookings_reset_followups_on_move
  BEFORE UPDATE OF trial_date ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_trial_bookings_reset_followups_on_move();
