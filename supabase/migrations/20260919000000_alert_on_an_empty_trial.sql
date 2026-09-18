-- An empty trial session says so.
--
-- `advance_trial_slots()` already notifies when a session is running UNDER
-- target -- two people booked against a minimum of five. It said nothing when a
-- session had NOBODY, which is the one case that is strictly worse. The result
-- was computed ('empty'), returned in the function's JSONB, and then thrown
-- away, because nothing reads that return value.
--
-- So the quietest session on the calendar was the one in the most trouble. An
-- empty session passes its 48-hour check in silence, passes its start time in
-- silence, and Case A then rolls it a week forward -- and it repeats, week after
-- week, with no line anywhere saying so. Saturday 26 September is that session
-- today: ten bookings, all cleaned off on 14 September, nobody since.
--
-- This adds one branch in the same place, writing to the same table with the
-- same type. Everything else in the function is unchanged, and is reproduced
-- here verbatim because CREATE OR REPLACE takes the whole body.
--
-- What the message deliberately does NOT say: that anything will be done about
-- it. Nothing here moves, closes or cancels a thing -- the day still belongs to
-- whoever books it, and the standing rule (a booked day is kept) is untouched.
-- An empty day simply has nobody to protect, so the choice is Re's and the
-- notification exists to make sure she gets to make it.

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

      IF v_count = 0 THEN
        -- Nobody at all, two days out. This used to be the ONE outcome that
        -- produced no signal anywhere -- the session went quiet, rolled a week
        -- forward, and did it again. The notification states the fact and the
        -- two real choices; it does not imply the system will act, because it
        -- will not.
        BEGIN
          INSERT INTO public.admin_notifications (message, type)
          VALUES (
            format(
              'Empty trial in 48 hours: the %s session on %s at %s (%s) has nobody booked, so no class will run. It stays open and bookable until it starts, then rolls forward a week. Fill it or close it — nothing here does either for you.',
              COALESCE(slot.class_language, 'unspecified'),
              slot.trial_date, slot.start_time,
              COALESCE(slot.timezone, 'Africa/Cairo')
            ),
            'trial_rollover'
          );
        EXCEPTION WHEN OTHERS THEN
          NULL;  -- alerting must never break the decision
        END;

      -- Thin, but running. Re sees it and decides what to do about it; the
      -- system does not decide for her by moving anyone.
      ELSIF v_count < v_min_to_run THEN
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
