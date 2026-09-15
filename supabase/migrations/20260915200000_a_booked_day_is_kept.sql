-- A booked day is kept — 15 September 2026
-- =========================================
--
-- Re's rule, in her words, after a session with a confirmed student on it was
-- closed during a tidy-up:
--
--     "huge mistake — if someone is registered we keep this day"
--
-- See claude/RULE_A_BOOKED_DAY_IS_KEPT_2026-09-15.md.
--
-- The rule was not only broken by hand that day. It was being broken by this
-- function, on an hourly cron, with nobody watching.
--
-- `advance_trial_slots()` decides each session 48 hours before it starts. If
-- the number of people expecting it was below `min_to_run` — 5 on every slot —
-- it MOVED the slot and every booking on it a week forward. So any session
-- holding one, two, three or four real people had those people postponed
-- automatically. Reem Alghazz was about 24 hours from exactly that: she had
-- answered "yes" for Saturday 19 September, which had 2 bookings against a
-- minimum of 5.
--
-- WHAT CHANGES
--
-- The postponement branch is gone. A session with at least one person
-- expecting it now always keeps its day. `min_to_run` stops being a threshold
-- that moves students and becomes what it should have been: the number that
-- says whether the session is as full as we want, reported to Re.
--
-- WHAT DOES NOT CHANGE
--
--   * Case A — a session whose time has passed still rolls its DATE forward so
--     the calendar never shows a past date. Bookings are deliberately not
--     touched there, exactly as before.
--   * An empty session (nobody booked) still just sits until Case A carries
--     it. There is no student to protect and nothing to tell anyone.
--   * `min_run_checked_at` still guards the decision so it is made once.
--
-- WHAT REPLACES THE MOVE
--
-- An admin notification naming the session and its numbers, so a thin class is
-- something Re SEES and decides about. Filling it is an outreach problem; it
-- was never solved by taking the day away from the person who said yes.
-- No name, email or phone goes into the message, as with the notification it
-- replaces.

CREATE OR REPLACE FUNCTION public.advance_trial_slots()
RETURNS TABLE(advanced_count integer, skipped_count integer, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  -- The statuses that mean "a real person is expecting this class".
  k_expecting CONSTANT text[] := ARRAY[
    'pending', 'date_selected', 'awaiting_attendance', 'confirmed_attendance', 'confirmed'
  ];

  slot            RECORD;
  v_lead_hours    int;
  v_interval_days int;
  v_default_min   int;
  v_min_to_run    int;
  v_count         int;
  v_new_date      date;
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
    -- that quietly did not.
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
    -- The decision is now only ever "this runs". Nobody is moved off a day
    -- they are booked on, however few of them there are.
    ELSIF slot.min_run_checked_at IS NULL
      AND slot.starts_at_tz <= now() + make_interval(hours => v_lead_hours) THEN

      v_min_to_run := COALESCE(slot.min_to_run, v_default_min);

      SELECT COUNT(*) INTO v_count
        FROM public.trial_bookings b
       WHERE b.trial_date = slot.trial_date
         AND b.start_time = slot.start_time
         AND b.is_tba = false
         AND b.status = ANY (k_expecting);

      UPDATE public.trial_slots
         SET min_run_checked_at = now(), updated_at = now()
       WHERE id = slot.id;

      v_details := v_details || jsonb_build_object(
        'id', slot.id,
        'result', CASE
                    WHEN v_count = 0 THEN 'empty'
                    WHEN v_count >= v_min_to_run THEN 'runs'
                    ELSE 'runs_short'
                  END,
        'count', v_count, 'min_to_run', v_min_to_run
      );

      -- Thin, but running. Re sees it and decides what to do about it; the
      -- system does not decide for her by moving anyone.
      IF v_count > 0 AND v_count < v_min_to_run THEN
        BEGIN
          INSERT INTO public.admin_notifications (message, type)
          VALUES (
            format(
              'Trial running under target: the %s session on %s at %s (%s) has %s of %s students. It is going ahead — a booked day is kept. Filling it is outreach, not a reason to move anyone.',
              COALESCE(slot.class_language, 'unspecified'),
              slot.trial_date, slot.start_time,
              COALESCE(slot.timezone, 'Africa/Cairo'),
              v_count, v_min_to_run
            ),
            'trial_rollover'
          );
        EXCEPTION WHEN OTHERS THEN
          NULL;  -- alerting must never break the decision
        END;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_advanced, v_skipped, v_details;
END;
$function$;
