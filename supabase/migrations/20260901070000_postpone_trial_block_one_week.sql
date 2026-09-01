-- Postpone the September trial block by one week: 4-7 Sep -> 11-14 Sep.
--
-- Why
-- ---
-- Re's decision, 2026-09-01: the 4-7 Sep classes are not being held. The
-- block moves forward one week at the same times. Verified state at the time
-- of writing: three of the four slots have zero bookings, and the 6 Sep
-- English slot has exactly one real (non-TBA, non-cancelled) booking, alone
-- against a minimum group size of 3.
--
-- Why this is urgent rather than cosmetic
-- --------------------------------------
-- pg_cron job 12 (trial-followups-hourly) sends a `trial_prep` email to every
-- non-TBA booking whose trial_date is tomorrow. It does NOT filter on status.
-- Left alone, at 00:15 Cairo on 2026-09-05 it would have told a real student
-- "your class is tomorrow" about a class that is not running. Moving the
-- booking's date is what stops that: the selector simply no longer matches.
-- No cron job is altered by this migration.
--
-- Why both tables move in one migration
-- -------------------------------------
-- `trial_bookings` has no slot_id. A booking is tied to its slot by
-- (day_of_week, start_time) and carries its own trial_date. Moving the slots
-- without the booking would strand it on a date with no class.
--
-- Safety notes, all verified against production before writing
-- -----------------------------------------------------------
--  * +7 days preserves day_of_week (5,6,0,1) and start_time, so both
--    `trial_slots_session_period_check` and the UNIQUE (trial_date, start_time)
--    key stay satisfied. Confirmed no trial_slots row exists 2026-09-08..20,
--    so the destination week is empty.
--  * `starts_at` MUST move with `trial_date`. The trigger that maintains
--    `slot_range` (trg_trial_bookings_set_slot_range) fires on
--    starts_at/duration_min, NOT on trial_date - updating the date alone would
--    leave slot_range pointing at the old week.
--  * Egypt is UTC+3 on both 6 and 13 Sep (DST ends in October), so +7 days
--    keeps 15:00 Africa/Cairo == 12:00Z. This is a whole-week shift, not a
--    timezone recalculation.
--  * The exclusion constraint `trial_bookings_no_overlap` only covers rows
--    with status IN ('pending','confirmed'); the affected row is
--    'awaiting_attendance', so it is not covered. `trial_bookings_validate_slot`
--    likewise returns early for any status outside ('pending','confirmed').
--  * min_run_checked_at / rollover_skipped_at / rollover_skip_reason are all
--    NULL on all four slots, so there is no stale rollover bookkeeping to
--    clear. Deliberately not touched.
--
-- What this does NOT do
-- ---------------------
--  * It does not email anyone. The student still has to be told her class
--    moved - that is Re's, by hand, and it is not automated here.
--  * It does not fix the automatic weekly rollover. That is a separate change
--    (see claude/TRIAL_ROLLOVER_WEEKLY_SPEC.md): the min-group check currently
--    runs after the class rather than before it, counts only
--    ('confirmed','confirmed_attendance') so an 'awaiting_attendance' student
--    reads as zero, and advances by a month rather than a week. Until that
--    ships, a block that needs postponing again will need doing by hand.
--  * It does not alter any pg_cron job.

BEGIN;

SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

-- Guards. Fail loudly rather than moving the wrong thing.
DO $$
DECLARE
  v_slots    int;
  v_occupied int;
BEGIN
  SELECT count(*) INTO v_slots
    FROM public.trial_slots
   WHERE is_active IS TRUE
     AND lifecycle = 'active'
     AND trial_date IN (DATE '2026-09-04', DATE '2026-09-05',
                        DATE '2026-09-06', DATE '2026-09-07');

  IF v_slots <> 4 THEN
    RAISE EXCEPTION
      'Guard failed: expected exactly 4 active slots on 2026-09-04..07, found %. The block has already moved or changed - do not run this blind.',
      v_slots
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO v_occupied
    FROM public.trial_slots
   WHERE trial_date BETWEEN DATE '2026-09-11' AND DATE '2026-09-14';

  IF v_occupied > 0 THEN
    RAISE EXCEPTION
      'Guard failed: % trial_slots row(s) already exist in 2026-09-11..14. Refusing to move into an occupied week (UNIQUE (trial_date, start_time)).',
      v_occupied
      USING ERRCODE = '23514';
  END IF;
END $$;

-- 1. Move the four slots. Same times, same weekdays, one week later.
UPDATE public.trial_slots
   SET trial_date = trial_date + 7
 WHERE is_active IS TRUE
   AND lifecycle = 'active'
   AND trial_date IN (DATE '2026-09-04', DATE '2026-09-05',
                      DATE '2026-09-06', DATE '2026-09-07');

-- 2. Move the real dated bookings sitting on those slots.
--    starts_at moves too, so slot_range is recomputed by its trigger.
UPDATE public.trial_bookings
   SET trial_date = trial_date + 7,
       starts_at  = starts_at + INTERVAL '7 days'
 WHERE trial_date IN (DATE '2026-09-04', DATE '2026-09-05',
                      DATE '2026-09-06', DATE '2026-09-07')
   AND is_tba IS NOT TRUE
   AND status <> 'cancelled';

-- Verify before commit.
DO $$
DECLARE
  v_moved_slots int;
  v_left_behind int;
  v_bad_range   int;
BEGIN
  SELECT count(*) INTO v_moved_slots
    FROM public.trial_slots
   WHERE is_active IS TRUE
     AND lifecycle = 'active'
     AND trial_date IN (DATE '2026-09-11', DATE '2026-09-12',
                        DATE '2026-09-13', DATE '2026-09-14');

  IF v_moved_slots <> 4 THEN
    RAISE EXCEPTION 'Verify failed: expected 4 slots on 2026-09-11..14 after the move, found %.', v_moved_slots;
  END IF;

  SELECT count(*) INTO v_left_behind
    FROM public.trial_bookings
   WHERE trial_date IN (DATE '2026-09-04', DATE '2026-09-05',
                        DATE '2026-09-06', DATE '2026-09-07')
     AND is_tba IS NOT TRUE
     AND status <> 'cancelled';

  IF v_left_behind > 0 THEN
    RAISE EXCEPTION 'Verify failed: % booking(s) still sit on the old 4-7 Sep dates with no slot to attend.', v_left_behind;
  END IF;

  -- slot_range must agree with starts_at for every row we moved.
  SELECT count(*) INTO v_bad_range
    FROM public.trial_bookings
   WHERE trial_date IN (DATE '2026-09-11', DATE '2026-09-12',
                        DATE '2026-09-13', DATE '2026-09-14')
     AND is_tba IS NOT TRUE
     AND status <> 'cancelled'
     AND (slot_range IS NULL OR lower(slot_range) <> starts_at);

  IF v_bad_range > 0 THEN
    RAISE EXCEPTION 'Verify failed: % moved booking(s) have a slot_range that disagrees with starts_at.', v_bad_range;
  END IF;
END $$;

COMMIT;
