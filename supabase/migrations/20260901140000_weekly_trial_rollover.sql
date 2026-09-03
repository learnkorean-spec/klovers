-- Weekly trial rollover, decided 48 hours ahead.
--
-- Re's rule, in her words: "the class are not held so all must be postponed one
-- week and if the 3 slots not filled we will postpone a week more and so on",
-- and "to decide doing that 48h from the original time agreed".
--
-- The machinery for this already existed. It never worked, for four reasons.
-- Three are in claude/TRIAL_ROLLOVER_WEEKLY_SPEC.md; the fourth was found while
-- writing this migration and is the one that mattered most.
--
--   1. The check ran AFTER the class. run_trial_min_group_checks() selected
--      slots where the start time was already <= now(), so the decision was
--      taken once the student had already sat waiting for a class that did not
--      run.
--
--   2. The count excluded the status real bookings carry. It counted only
--      'confirmed' and 'confirmed_attendance'. Every authenticated booking is
--      inserted as 'awaiting_attendance', which is in neither list, so a slot
--      holding one real student counted ZERO - and zero was treated as "empty
--      slot, nothing to move". That is why the system never postponed by
--      itself and why 1 September had to be done by hand.
--
--   3. It advanced by a month, not a week. advance_trial_slots() jumped a
--      passed slot to the next month's first Friday block.
--
--   4. FOUND HERE: trial_bookings_no_overlap made a group of three impossible.
--      It was EXCLUDE USING gist (slot_range WITH &&) with no per-person key,
--      so across the WHOLE table only ONE booking with status 'pending' or
--      'confirmed' could occupy any given time range. Every slot has
--      capacity 10 and min_group_size is 3, and both capacity triggers allow
--      10 - but the second student to book a slot was told "Sorry, that time
--      was just taken". The threshold this whole feature waits for could never
--      be reached. Fixing the rollover without fixing this would have shipped
--      a machine that postpones forever.
--
-- This migration changes no student data. It replaces one constraint, replaces
-- three functions, and adds two settings columns. The only row it writes is the
-- single trial_settings row picking up its new defaults.

BEGIN;

-- ── Guards ──────────────────────────────────────────────────────────
DO $guard$
BEGIN
  IF to_regclass('public.trial_slots')    IS NULL
     OR to_regclass('public.trial_bookings') IS NULL
     OR to_regclass('public.trial_settings') IS NULL THEN
    RAISE EXCEPTION 'weekly rollover: a table this migration depends on is missing.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') THEN
    RAISE EXCEPTION
      'weekly rollover: btree_gist is required for the per-student exclusion constraint.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.trial_settings WHERE id = 1) THEN
    RAISE EXCEPTION 'weekly rollover: trial_settings row 1 is missing.';
  END IF;
END
$guard$;

-- ── 1. The two numbers, as settings rather than constants ─────────────────
-- Re can change either without another migration.
ALTER TABLE public.trial_settings
  ADD COLUMN IF NOT EXISTS rollover_lead_hours    integer NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS rollover_interval_days integer NOT NULL DEFAULT 7;

COMMENT ON COLUMN public.trial_settings.rollover_lead_hours IS
  'How long before a slot starts the run-or-postpone decision is taken, measured in the slot''s own timezone. Re''s rule: 48 hours.';
COMMENT ON COLUMN public.trial_settings.rollover_interval_days IS
  'How far a slot moves when it is postponed. Re''s rule: one week. There is deliberately no cap on how many times a slot may move - every move writes an admin_notifications row instead, so a student who has been postponed repeatedly is visible rather than silently rescheduled forever.';

-- ── 2. Let a group actually reach three ───────────────────────────────
-- The old constraint had no per-person key, so it capped every time range at
-- one booking table-wide. Capacity is already enforced twice over, by
-- check_trial_slot_capacity and trial_bookings_validate_slot, both against
-- trial_slots.capacity (10). The only thing this constraint should prevent is
-- ONE person holding two overlapping trials. email is NOT NULL on this table
-- and is the identity that exists on both the authenticated and the
-- unauthenticated path, so it is the right key; user_id is null for guests.
--
-- Nothing is rewritten. No row currently in the table matches the predicate -
-- the one live dated booking is 'awaiting_attendance', which is in neither the
-- old list nor the new one - so the new constraint validates against zero rows.
ALTER TABLE public.trial_bookings
  DROP CONSTRAINT IF EXISTS trial_bookings_no_overlap;

ALTER TABLE public.trial_bookings
  ADD CONSTRAINT trial_bookings_no_overlap
  EXCLUDE USING gist (email WITH =, slot_range WITH &&)
  WHERE (slot_range IS NOT NULL AND status IN ('pending', 'confirmed'));

COMMENT ON CONSTRAINT trial_bookings_no_overlap ON public.trial_bookings IS
  'One student cannot hold two overlapping trial bookings. Different students share a class freely - capacity is enforced separately against trial_slots.capacity. Before 1 Sep 2026 this had no per-person key and silently capped every trial at one student, which made min_group_size unreachable.';

-- ── 3. The engine ─────────────────────────────────────────────────
-- This lives in advance_trial_slots() on purpose: cron job 23 runs it HOURLY
-- (10 * * * *), and a 48-hour rule needs hourly resolution. Job 26, which used
-- to own the decision, is daily - on a daily cadence the decision for a Sunday
-- 15:00 class would land about 33 hours ahead, AFTER job 12 had already sent
-- that student "your class is tomorrow". No cron job is added, paused or
-- rescheduled by this migration.
CREATE OR REPLACE FUNCTION public.advance_trial_slots()
 RETURNS TABLE(advanced_count integer, skipped_count integer, details jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  -- The statuses that mean "a real person is expecting this class".
  -- 'awaiting_attendance' is what every authenticated booking is created with,
  -- and its absence from the old list is defect 2 above. 'completed',
  -- 'no_show' and 'cancelled' are deliberately excluded: they are finished.
  k_expecting CONSTANT text[] := ARRAY[
    'pending', 'date_selected', 'awaiting_attendance', 'confirmed_attendance', 'confirmed'
  ];

  slot            RECORD;
  v_lead_hours    int;
  v_interval_days int;
  v_default_min   int;
  v_min_to_run    int;
  v_count         int;
  v_moved         int;
  v_new_date      date;
  v_starts        timestamptz;
  v_advanced      int := 0;
  v_skipped       int := 0;
  v_details       jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(s.rollover_lead_hours, 48),
         COALESCE(s.rollover_interval_days, 7),
         COALESCE(s.min_group_size, 3)
    INTO v_lead_hours, v_interval_days, v_default_min
    FROM public.trial_settings s
   WHERE s.id = 1;

  v_lead_hours    := COALESCE(v_lead_hours, 48);
  v_interval_days := GREATEST(COALESCE(v_interval_days, 7), 1);
  v_default_min   := COALESCE(v_default_min, 3);

  FOR slot IN
    SELECT id, trial_date, start_time, timezone, day_of_week, min_to_run,
           class_language, min_run_checked_at,
           (trial_date + start_time::time)
             AT TIME ZONE COALESCE(timezone, 'Africa/Cairo') AS starts_at_tz
      FROM public.trial_slots
     WHERE is_active = true
       AND lifecycle = 'active'
       AND trial_date IS NOT NULL
       AND start_time IS NOT NULL
     ORDER BY trial_date, start_time
  LOOP

    -- ══ Case A: the slot has already started ══════════════════════════
    -- Keep the calendar moving so it never shows a past date. Bookings are
    -- deliberately NOT touched here: a class that actually ran leaves real
    -- attendance on its rows, and this branch cannot tell that apart from one
    -- that quietly did not. Moving a booking off a class the student attended
    -- would be worse than leaving it. The T-48h branch below is where a
    -- student is moved, and it only fires when we know the class is short.
    IF slot.starts_at_tz <= now() THEN
      v_new_date := slot.trial_date;
      WHILE (v_new_date + slot.start_time::time)
              AT TIME ZONE COALESCE(slot.timezone, 'Africa/Cairo') <= now() LOOP
        v_new_date := v_new_date + v_interval_days;
      END LOOP;

      BEGIN
        UPDATE public.trial_slots
           SET trial_date               = v_new_date,
               updated_at               = now(),
               enrollment_alert_sent_at = NULL,
               min_run_checked_at       = NULL,
               rollover_skipped_at      = NULL,
               rollover_skip_reason     = NULL
         WHERE id = slot.id;

        v_advanced := v_advanced + 1;
        v_details := v_details || jsonb_build_object(
          'id', slot.id, 'result', 'advanced',
          'from_date', slot.trial_date, 'to_date', v_new_date
        );
      EXCEPTION WHEN unique_violation THEN
        UPDATE public.trial_slots
           SET rollover_skipped_at  = now(),
               rollover_skip_reason = format(
                 'Could not advance to %s %s -- another slot already occupies that date and time.',
                 v_new_date, slot.start_time)
         WHERE id = slot.id;
        v_skipped := v_skipped + 1;
        v_details := v_details || jsonb_build_object(
          'id', slot.id, 'result', 'skipped', 'reason', 'unique_violation',
          'attempted_date', v_new_date, 'start_time', slot.start_time
        );
      END;

    -- ══ Case B: inside the decision window, not yet decided ═══════════════
    ELSIF slot.min_run_checked_at IS NULL
      AND slot.starts_at_tz <= now() + make_interval(hours => v_lead_hours) THEN

      v_min_to_run := COALESCE(slot.min_to_run, v_default_min);

      SELECT COUNT(*) INTO v_count
        FROM public.trial_bookings b
       WHERE b.trial_date = slot.trial_date
         AND b.start_time = slot.start_time
         AND b.is_tba = false
         AND b.status = ANY (k_expecting);

      IF v_count >= v_min_to_run OR v_count = 0 THEN
        -- The class runs, or nobody booked it at all. An empty slot is a
        -- different case from a short one and stays where it is: there is no
        -- student to tell, and Case A will carry it forward once it passes.
        UPDATE public.trial_slots
           SET min_run_checked_at = now(), updated_at = now()
         WHERE id = slot.id;

        v_details := v_details || jsonb_build_object(
          'id', slot.id,
          'result', CASE WHEN v_count = 0 THEN 'empty' ELSE 'runs' END,
          'count', v_count, 'min_to_run', v_min_to_run
        );

      ELSE
        -- Short of the minimum, with real people on it. Move the slot one
        -- interval forward AND move every booking with it. Moving the slot
        -- alone is what stranded a student on 1 September: her date stayed
        -- while the slot did not.
        v_new_date := slot.trial_date + v_interval_days;
        v_starts   := (v_new_date + slot.start_time::time)
                        AT TIME ZONE COALESCE(slot.timezone, 'Africa/Cairo');

        BEGIN
          UPDATE public.trial_slots
             SET trial_date               = v_new_date,
                 updated_at               = now(),
                 enrollment_alert_sent_at = NULL,
                 min_run_checked_at       = NULL,
                 rollover_skipped_at      = NULL,
                 rollover_skip_reason     = NULL
           WHERE id = slot.id;

          -- starts_at is set as well as trial_date on purpose: the trigger that
          -- maintains slot_range fires on starts_at and duration_min, not on
          -- trial_date, so updating the date alone leaves slot_range pointing
          -- at the old week.
          --
          -- rollover_notified_at is cleared, not preserved: a booking that is
          -- postponed a second time has to be told a second time.
          UPDATE public.trial_bookings
             SET trial_date            = v_new_date,
                 starts_at             = v_starts,
                 rollover_status       = 'pending_notification',
                 rollover_notified_at  = NULL,
                 followup_day1_sent_at = COALESCE(followup_day1_sent_at, now()),
                 followup_day3_sent_at = COALESCE(followup_day3_sent_at, now()),
                 followup_day7_sent_at = COALESCE(followup_day7_sent_at, now())
           WHERE trial_date = slot.trial_date
             AND start_time = slot.start_time
             AND is_tba = false
             AND status = ANY (k_expecting);
          GET DIAGNOSTICS v_moved = ROW_COUNT;

          v_advanced := v_advanced + 1;
          v_details := v_details || jsonb_build_object(
            'id', slot.id, 'result', 'postponed',
            'from_date', slot.trial_date, 'to_date', v_new_date,
            'count', v_count, 'min_to_run', v_min_to_run, 'bookings_moved', v_moved
          );

          -- Visible to Re rather than capped. She asked for no cap; this is how
          -- a student who has slipped three weeks becomes something she can
          -- see. No name, email or phone number goes in this message.
          BEGIN
            INSERT INTO public.admin_notifications (message, type)
            VALUES (
              format(
                'Trial postponed %s day(s): the %s slot on %s at %s (%s) had %s of %s students, so it moved to %s. %s booking(s) moved and will be emailed.',
                v_interval_days,
                COALESCE(slot.class_language, 'unspecified'),
                slot.trial_date, slot.start_time,
                COALESCE(slot.timezone, 'Africa/Cairo'),
                v_count, v_min_to_run, v_new_date, v_moved
              ),
              'trial_rollover'
            );
          EXCEPTION WHEN OTHERS THEN
            NULL;  -- alerting must never undo the rollover
          END;

        EXCEPTION
          WHEN unique_violation THEN
            -- Something already occupies the target date and time. The slot and
            -- its bookings are both rolled back together by this subtransaction,
            -- so they cannot drift apart. min_run_checked_at is left NULL so the
            -- next hourly run tries again.
            UPDATE public.trial_slots
               SET rollover_skipped_at  = now(),
                   rollover_skip_reason = format(
                     'Could not postpone to %s %s -- another slot already occupies that date and time.',
                     v_new_date, slot.start_time)
             WHERE id = slot.id;
            v_skipped := v_skipped + 1;
            v_details := v_details || jsonb_build_object(
              'id', slot.id, 'result', 'skipped', 'reason', 'unique_violation',
              'attempted_date', v_new_date, 'start_time', slot.start_time
            );
          WHEN OTHERS THEN
            UPDATE public.trial_slots
               SET rollover_skipped_at  = now(),
                   rollover_skip_reason = format(
                     'Could not postpone to %s %s -- %s', v_new_date, slot.start_time, SQLERRM)
             WHERE id = slot.id;
            v_skipped := v_skipped + 1;
            v_details := v_details || jsonb_build_object(
              'id', slot.id, 'result', 'skipped', 'reason', SQLERRM,
              'attempted_date', v_new_date, 'start_time', slot.start_time
            );
        END;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_advanced, v_skipped, v_details;
END;
$function$;

COMMENT ON FUNCTION public.advance_trial_slots() IS
  'Hourly (cron job 23). Two jobs: carry any slot that has already started forward by trial_settings.rollover_interval_days, and - rollover_lead_hours before a slot starts, once - decide whether it runs. Short of min_to_run but not empty means the slot and every booking on it move one interval forward together and the students are flagged for the rollover email.';

-- ── 4. The daily job becomes a safety net ─────────────────────────────
CREATE OR REPLACE FUNCTION public.run_trial_min_group_checks()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- The decision moved into advance_trial_slots() because cron job 23 runs it
  -- hourly and the 48-hour rule needs hourly resolution; this job (26) is
  -- daily. Kept and pointed at the same engine so the job stays meaningful and
  -- the pipeline survives if job 23 is ever disabled. Idempotent: a slot is
  -- decided once, guarded by min_run_checked_at.
  PERFORM public.advance_trial_slots();
END;
$function$;

-- ── 5. Keep the standalone RPC honest ────────────────────────────────
-- Nothing in the repo calls this any more, but it is a SECURITY DEFINER RPC
-- that still exists, and leaving the wrong status list in it is how the same
-- bug comes back. Same status set as the engine.
CREATE OR REPLACE FUNCTION public.claim_trial_min_run_check(p_trial_date date, p_start_time text)
 RETURNS TABLE(should_rollover boolean, confirmed_count integer, min_required integer, affected_bookings integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  k_expecting CONSTANT text[] := ARRAY[
    'pending', 'date_selected', 'awaiting_attendance', 'confirmed_attendance', 'confirmed'
  ];
  v_slot_id         uuid;
  v_min_to_run      int;
  v_default_min     int;
  v_already_checked timestamptz;
  v_count           int;
  v_affected        int;
BEGIN
  SELECT id, min_to_run, min_run_checked_at
    INTO v_slot_id, v_min_to_run, v_already_checked
  FROM public.trial_slots
  WHERE trial_date = p_trial_date AND start_time = p_start_time
  FOR UPDATE;

  IF v_slot_id IS NULL OR v_already_checked IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::int, NULL::int, 0;
    RETURN;
  END IF;

  SELECT min_group_size INTO v_default_min FROM public.trial_settings WHERE id = 1;
  v_min_to_run := COALESCE(v_min_to_run, v_default_min, 3);

  SELECT COUNT(*) INTO v_count
  FROM public.trial_bookings
  WHERE trial_date = p_trial_date AND start_time = p_start_time
    AND status = ANY (k_expecting) AND is_tba = false;

  UPDATE public.trial_slots SET min_run_checked_at = now() WHERE id = v_slot_id;

  IF v_count = 0 OR v_count >= v_min_to_run THEN
    RETURN QUERY SELECT false, v_count, v_min_to_run, 0;
    RETURN;
  END IF;

  UPDATE public.trial_bookings
  SET rollover_status = 'pending_notification',
      rollover_notified_at = NULL,
      followup_day1_sent_at = COALESCE(followup_day1_sent_at, now()),
      followup_day3_sent_at = COALESCE(followup_day3_sent_at, now()),
      followup_day7_sent_at = COALESCE(followup_day7_sent_at, now())
  WHERE trial_date = p_trial_date AND start_time = p_start_time
    AND status = ANY (k_expecting) AND is_tba = false;
  GET DIAGNOSTICS v_affected = ROW_COUNT;

  RETURN QUERY SELECT true, v_count, v_min_to_run, v_affected;
END;
$function$;

-- ── Verification, before COMMIT ───────────────────────────────────
-- This migration must not have moved a single date or touched a single
-- booking. Prove it rather than assume it.
DO $verify$
DECLARE
  v_slots      int;
  v_bookings   int;
  v_dates      date[];
  v_live       int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.trial_bookings'::regclass
       AND conname  = 'trial_bookings_no_overlap'
       AND pg_get_constraintdef(oid) LIKE '%email%'
  ) THEN
    RAISE EXCEPTION 'verification failed: trial_bookings_no_overlap is not keyed per student.';
  END IF;

  SELECT COUNT(*), array_agg(trial_date ORDER BY trial_date)
    INTO v_slots, v_dates
    FROM public.trial_slots WHERE is_active = true;

  IF v_slots <> 4 OR v_dates <> ARRAY[
       DATE '2026-09-11', DATE '2026-09-12', DATE '2026-09-13', DATE '2026-09-14'] THEN
    RAISE EXCEPTION
      'verification failed: expected the four 11-14 Sep slots unchanged, found % slots on %',
      v_slots, v_dates;
  END IF;

  SELECT COUNT(*) INTO v_bookings FROM public.trial_bookings;
  IF v_bookings <> 76 THEN
    RAISE EXCEPTION 'verification failed: expected 76 bookings, found %', v_bookings;
  END IF;

  SELECT COUNT(*) INTO v_live
    FROM public.trial_bookings
   WHERE status = 'awaiting_attendance' AND trial_date = DATE '2026-09-13';
  IF v_live <> 1 THEN
    RAISE EXCEPTION
      'verification failed: expected exactly 1 awaiting_attendance booking on 13 Sep, found %', v_live;
  END IF;

  RAISE NOTICE 'weekly rollover: constraint replaced, 3 functions replaced, 0 dates moved, 76 bookings untouched.';
END
$verify$;

COMMIT;
