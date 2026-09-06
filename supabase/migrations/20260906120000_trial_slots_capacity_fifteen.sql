-- Raise the trial slot capacity from 8 to 15.
--
-- THIS UPDATES EXISTING ROWS - the four active trial_slots, capacity only.
--
-- WHY
-- ---
-- The trial is a 30-minute introduction to the academy, the levels and the
-- teacher. It is not the course. The course keeps 8 per group and is not
-- touched here: that capacity lives on schedule_packages, a different table.
--
-- Eight is a number the trial inherited from the course, and it does not fit
-- the invitation batches. Measured on production 2026-09-06, the Hangul batch
-- that goes out first:
--
--   English track   20 people   2 English slots x 8  =  16 seats
--   Arabic  track    9 people   2 Arabic  slots x 8  =  16 seats
--
-- Twenty people invited into sixteen seats means four of them open the email,
-- pick a date, and are told the class is full - and it lands on whoever
-- responded fastest. That is the worst first impression the academy can give.
--
-- 15 rather than 10 or 20: it holds the whole English batch twice over (30
-- seats), leaves room for the Levels 1-6 and no-level batches that follow,
-- and is still a number one teacher can hold a conversation with for half an
-- hour. Nothing here is one-way - the number can be raised again, or dropped
-- back, with one more migration.
--
-- WHAT READS THIS NUMBER
-- ----------------------
-- Every consumer reads trial_slots.capacity off the row, so changing the row
-- is enough. Checked against the live definitions before writing this, rather
-- than assumed:
--
--   trial_bookings_validate_slot   the seat guard - reads ts.capacity
--   check_trial_slot_capacity      the older seat guard - reads capacity
--   get_trial_availability         hides a full slot: HAVING count < capacity
--   claim_trial_capacity_alert     returns capacity, but fires on its own
--                                  threshold of 4 confirmations
--
-- The alert is deliberately left alone. "The group has formed" is about a
-- group being viable, not about a slot being nearly full, so it should not
-- move when capacity does.
--
-- NOT changed: min_to_run and trial_settings.min_group_size. A slot short of
-- its minimum still postpones a week and carries its bookings with it.
--
-- ROLLBACK
-- --------
--   update public.trial_slots set capacity = 8 where is_active;

BEGIN;

DO $$
DECLARE
  k_new   CONSTANT int := 15;
  v_rows  int;
  v_wrong int;
  v_over  int;
BEGIN
  -- Raising only. If a slot has somehow been set higher than 15 by hand, this
  -- migration is not the thing that should quietly lower it.
  SELECT count(*) INTO v_over
    FROM public.trial_slots
   WHERE is_active AND capacity > k_new;

  IF v_over > 0 THEN
    RAISE EXCEPTION
      '% active slot(s) already have a capacity above % - this migration only raises, so it is refusing to lower one. Nothing has been changed.',
      v_over, k_new;
  END IF;

  UPDATE public.trial_slots
     SET capacity = k_new
   WHERE is_active
     AND capacity IS DISTINCT FROM k_new;

  GET DIAGNOSTICS v_rows = row_count;

  SELECT count(*) INTO v_wrong
    FROM public.trial_slots
   WHERE is_active AND capacity IS DISTINCT FROM k_new;

  IF v_wrong > 0 THEN
    RAISE EXCEPTION
      '% active slot(s) still do not have capacity % after the update', v_wrong, k_new;
  END IF;

  RAISE NOTICE
    'Trial slot capacity is now % on every active slot (% row(s) changed). The paid cohorts are untouched.',
    k_new, v_rows;
END $$;

-- The course is a different thing and must not have moved with the trial.
DO $$
DECLARE
  v_changed int;
BEGIN
  SELECT count(*) INTO v_changed
    FROM public.schedule_packages
   WHERE is_active AND capacity IS DISTINCT FROM 8;

  IF v_changed > 0 THEN
    RAISE EXCEPTION
      '% active paid cohort(s) no longer have capacity 8 - the trial change must not touch the course', v_changed;
  END IF;

  RAISE NOTICE 'Paid cohorts still hold 8 students each, as intended.';
END $$;

COMMIT;
