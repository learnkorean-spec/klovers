-- ---------------------------------------------------------------------------
-- Trial slots: capacity 10 -> 8.
--
-- ⚠ THIS MIGRATION UPDATES EXISTING ROWS. Every other migration in this batch
-- only inserts. Four active trial slots change from capacity 10 to 8:
--
--   2026-09-11 Fri 15:00  Arabic   4 booked
--   2026-09-12 Sat 16:30  Arabic   0 booked
--   2026-09-13 Sun 15:00  English  1 booked
--   2026-09-14 Mon 16:00  English  0 booked
--
-- WHY
-- ---
-- A trial class should be the size of the class it is a trial for. The Hangul
-- cohorts opened in 20260903000000 are capacity 8, and the invitation email
-- (templates/trialRebook.ts) now tells students 8. Leaving the slots at 10
-- would mean a student is promised a class of 8, sits in one of 10, and then
-- buys a course of 8 — three different numbers for the same room.
--
-- The 60-minute hour is the real constraint: ten students is six minutes of
-- speaking each, which is a lecture. Eight is the ceiling where everyone is
-- still heard.
--
-- SAFETY
-- ------
-- Reducing a capacity can strand people who have already booked, so this does
-- not just run the UPDATE. It counts first, and raises before touching
-- anything if any active slot already holds more than 8 — nobody is bumped by
-- this migration. The highest current booking is 4.
--
-- Only `capacity` changes. No booking, status, date or time is touched.
-- ---------------------------------------------------------------------------

BEGIN;

DO $$
DECLARE
  v_overfull int;
  v_changed  int;
BEGIN
  -- Refuse rather than strand anyone. `booked_count` is the admin view's own
  -- seat count, so this asks the same question the booking page does.
  SELECT count(*) INTO v_overfull
  FROM v_trial_slots_admin
  WHERE is_active AND booked_count > 8;

  IF v_overfull > 0 THEN
    RAISE EXCEPTION
      '% active trial slot(s) already hold more than 8 students. Reducing capacity to 8 would strand them; nothing has been changed.',
      v_overfull;
  END IF;

  UPDATE trial_slots
     SET capacity = 8,
         updated_at = now()
   WHERE is_active AND capacity <> 8;

  GET DIAGNOSTICS v_changed = ROW_COUNT;
  RAISE NOTICE 'Trial slots moved to capacity 8: % row(s).', v_changed;

  -- And confirm the end state rather than trusting the UPDATE's own filter.
  IF EXISTS (SELECT 1 FROM trial_slots WHERE is_active AND capacity <> 8) THEN
    RAISE EXCEPTION 'Some active trial slots are still not capacity 8.';
  END IF;
END $$;

COMMIT;
