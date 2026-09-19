-- ============================================================================
-- Trials run once a month, on the first weekend of the month.
--
-- Re, 19 September 2026: "trials only will be at the beginning of the first
-- week of the month and will be only 2 classes arabic and 2 english only",
-- then "any 2 days in first day and weekend" — so: the first Friday and the
-- first Saturday of each month, each carrying one Arabic and one English
-- session. Four trials a month, down from four a week.
--
-- WHY THIS IS A MIGRATION AND NOT A SETTING CHANGE
-- ------------------------------------------------
-- `advance_trial_slots()` only knew one move: add `rollover_interval_days` to
-- the date until it is in the future. A weekly rhythm was therefore not a
-- setting at all — it was the shape of the code. Any interval that is a whole
-- number of days drifts off "the first weekend" within two months (2 Oct + 28
-- = 30 Oct, which is the fifth Friday, not the first of November), so a bigger
-- number would have been a slower wrong answer rather than a right one.
--
-- WHAT CHANGES
-- ------------
--   trial_settings.rollover_mode    'weekly' (unchanged behaviour, still the
--                                   default) or 'monthly_first_weekend'
--   trial_settings.trial_weekdays   which weekdays trials may fall on at all
--   advance_trial_slots()           in monthly mode, moves a slot to the first
--                                   matching weekday of the next month, and
--                                   ARCHIVES a slot whose weekday is no longer
--                                   in the pattern once its class has run
--
-- The Sunday English session is exactly that last case. It has three students
-- booked for 27 September and must run for them; what it must not do is roll
-- to 4 October, a Sunday trials no longer happen on. Under this migration it
-- runs, and is then archived by the same job that used to roll it — nothing
-- is cancelled and nobody is emailed.
--
-- NOT CHANGED: everything else about the roller. Case B (the 48-hour decision
-- and its notifications) and the unique-violation guard are reproduced
-- verbatim — that guard is what stopped a double-booked Saturday on 19 Sep,
-- and it is not being touched while it is doing its job.
-- ============================================================================

-- ── 1. The pattern becomes data ────────────────────────────────────────────

ALTER TABLE public.trial_settings
  ADD COLUMN IF NOT EXISTS rollover_mode  text  NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS trial_weekdays int[] NOT NULL DEFAULT '{5,6}';

ALTER TABLE public.trial_settings
  DROP CONSTRAINT IF EXISTS trial_settings_rollover_mode_check;
ALTER TABLE public.trial_settings
  ADD CONSTRAINT trial_settings_rollover_mode_check
  CHECK (rollover_mode IN ('weekly', 'monthly_first_weekend'));

COMMENT ON COLUMN public.trial_settings.rollover_mode IS
  'How advance_trial_slots() moves a session that has run. weekly = add rollover_interval_days (the original behaviour). monthly_first_weekend = jump to the first matching weekday of the next month.';
COMMENT ON COLUMN public.trial_settings.trial_weekdays IS
  'The weekdays (0=Sunday) trials may fall on. In monthly_first_weekend mode a slot on any other weekday is archived once its class has run, instead of being rolled to a day trials no longer run on.';

-- ── 2. Where the next one lands ────────────────────────────────────────────

-- The first `p_dow` on or after the 1st of p_any_date's month.
CREATE OR REPLACE FUNCTION public.first_dow_of_month(p_any_date date, p_dow int)
RETURNS date
LANGUAGE sql IMMUTABLE
SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT (date_trunc('month', p_any_date)::date)
       + ((p_dow - EXTRACT(DOW FROM date_trunc('month', p_any_date))::int + 7) % 7);
$$;

COMMENT ON FUNCTION public.first_dow_of_month(date, int) IS
  'The first given weekday (0=Sunday) of the month containing p_any_date. first_dow_of_month(''2026-10-14'', 5) = 2026-10-02.';

-- The same weekday, in the month AFTER p_from's month.
CREATE OR REPLACE FUNCTION public.next_monthly_trial_date(p_from date, p_dow int)
RETURNS date
LANGUAGE sql IMMUTABLE
SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT public.first_dow_of_month(
           (date_trunc('month', p_from) + interval '1 month')::date, p_dow);
$$;

COMMENT ON FUNCTION public.next_monthly_trial_date(date, int) IS
  'Step one month: the first p_dow of the month after p_from. Deliberately not "+28 days", which lands on the fifth weekday of the same month roughly every third step.';

-- ── 3. The roller learns the second move ───────────────────────────────────

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
  v_mode          text;
  v_weekdays      int[];
  v_count         int;
  v_new_date      date;
  v_advanced      int := 0;
  v_skipped       int := 0;
  v_details       jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(s.rollover_lead_hours, 48),
         COALESCE(s.rollover_interval_days, 7),
         COALESCE(s.min_group_size, 3),
         COALESCE(s.rollover_mode, 'weekly'),
         COALESCE(s.trial_weekdays, ARRAY[5,6])
    INTO v_lead_hours, v_interval_days, v_default_min, v_mode, v_weekdays
    FROM public.trial_settings s
   WHERE s.id = 1;

  v_lead_hours    := COALESCE(v_lead_hours, 48);
  v_interval_days := GREATEST(COALESCE(v_interval_days, 7), 1);
  v_default_min   := COALESCE(v_default_min, 3);
  v_mode          := COALESCE(v_mode, 'weekly');
  v_weekdays      := COALESCE(v_weekdays, ARRAY[5,6]);

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

      -- A session on a weekday the pattern no longer includes has nowhere to
      -- go. Rolling it would offer a day nobody is being invited to; deleting
      -- it would take its history with it. It is retired instead, AFTER its
      -- own class has run, so the students already booked on it are unaffected.
      IF v_mode = 'monthly_first_weekend'
         AND NOT (slot.day_of_week = ANY (v_weekdays)) THEN
        UPDATE public.trial_slots
           SET lifecycle            = 'archived',
               is_active            = false,
               updated_at           = now(),
               rollover_skipped_at  = now(),
               rollover_skip_reason = format(
                 'Archived: trials now run only on weekdays %s, and this one is on %s.',
                 v_weekdays, slot.day_of_week)
         WHERE id = slot.id;
        v_skipped := v_skipped + 1;
        v_details := v_details || jsonb_build_object(
          'id', slot.id, 'result', 'archived_off_pattern',
          'day_of_week', slot.day_of_week, 'pattern', to_jsonb(v_weekdays)
        );
        CONTINUE;
      END IF;

      IF v_mode = 'monthly_first_weekend' THEN
        v_new_date := public.next_monthly_trial_date(slot.trial_date, slot.day_of_week);
        WHILE (v_new_date + slot.start_time::time)
                AT TIME ZONE COALESCE(slot.timezone, 'Africa/Cairo') <= now() LOOP
          v_new_date := public.next_monthly_trial_date(v_new_date, slot.day_of_week);
        END LOOP;
      ELSE
        v_new_date := slot.trial_date;
        WHILE (v_new_date + slot.start_time::time)
                AT TIME ZONE COALESCE(slot.timezone, 'Africa/Cairo') <= now() LOOP
          v_new_date := v_new_date + v_interval_days;
        END LOOP;
      END IF;

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
        -- produced no signal anywhere -- the session went quiet, rolled
        -- forward, and did it again. The notification states the fact and the
        -- two real choices; it does not imply the system will act, because it
        -- will not.
        BEGIN
          INSERT INTO public.admin_notifications (message, type)
          VALUES (
            format(
              'Empty trial in 48 hours: the %s session on %s at %s (%s) has nobody booked, so no class will run. It stays open and bookable until it starts, then rolls forward. Fill it or close it — nothing here does either for you.',
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

-- ── 4. Turn it on ──────────────────────────────────────────────────────────

UPDATE public.trial_settings
   SET rollover_mode  = 'monthly_first_weekend',
       trial_weekdays = ARRAY[5,6],     -- Friday and Saturday
       updated_at     = now()
 WHERE id = 1;
