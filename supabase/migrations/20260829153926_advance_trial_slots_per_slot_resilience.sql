-- advance_trial_slots() (the hourly rollover cron, 20260704205200) advances
-- every due trial_slots row's trial_date in one loop with no exception
-- handling. trial_slots has UNIQUE (trial_date, start_time) (see issue #127
-- for the separate, still-open question of whether that constraint should
-- exempt retired rows) -- so if any single slot's computed new_date collides
-- with any row, active or retired, at the same start_time, that UPDATE
-- aborts the WHOLE function and NOTHING advances that run. Silently, on a
-- cron (pg_cron job 23, "advance-trial-slots", hourly at :10), with nobody
-- watching.
--
-- Reproduced against a real local Postgres 16 instance before writing this
-- fix (not guessed): seeded the exact shape of yesterday's real failure --
-- four due slots plus one dead row occupying the date/time one of them was
-- rolling to -- and confirmed the live function aborts entirely, leaving
-- all four slots' trial_date unchanged, including the three that had no
-- collision of their own.
--
-- This migration does three things:
--
-- 1. Each slot's UPDATE now runs inside its own BEGIN/EXCEPTION block. A
--    unique_violation on one slot is caught, that slot is left where it
--    was (not silently dropped -- it stays "due" and will be retried on
--    the next hourly run once whatever it collided with is resolved), and
--    the loop continues to the remaining slots. PL/pgSQL's implicit
--    savepoint around a BEGIN/EXCEPTION block is exactly what makes this
--    safe: only that one slot's write rolls back, not the whole function.
--
-- 2. The function's return type changes from void to
--    TABLE(advanced_count int, skipped_count int, details jsonb) -- per the
--    "Silent Success" rule from PR #123: a rollover that moved 3 of 4 slots
--    must not report plain success. details carries every slot's outcome
--    by id, so "what happened, by number" is answerable from the return
--    value alone.
--
-- 3. Because this function is invoked directly by pg_cron
--    (`SELECT public.advance_trial_slots();`) with nothing downstream
--    reading its return value, the return value alone would still be a log
--    nobody reads. So a skip is ALSO written durably onto the slot's own
--    row (`rollover_skipped_at`, `rollover_skip_reason`), and the admin
--    "Trial Classes" table (TrialClassesManager.tsx -- the surface Re
--    actually uses, per #134) now surfaces it: a header badge visible even
--    with the schedule card collapsed, an expanded warning banner naming
--    every skipped slot and why, and a per-row flag on the affected slot.
--    A successful advance clears both columns, so the flag only ever shows
--    a currently-unresolved skip, never stale history.
--
-- Does NOT touch the UNIQUE (trial_date, start_time) constraint itself --
-- that is issue #127's separate, still-open question, deliberately not
-- decided here.

BEGIN;

SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

ALTER TABLE public.trial_slots
  ADD COLUMN IF NOT EXISTS rollover_skipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS rollover_skip_reason text;

DROP FUNCTION IF EXISTS public.advance_trial_slots();

CREATE FUNCTION public.advance_trial_slots()
 RETURNS TABLE(advanced_count integer, skipped_count integer, details jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  slot RECORD;
  new_date date;
  target_month date;
  block_start date;
  dow_offset int;
  v_advanced int := 0;
  v_skipped int := 0;
  v_details jsonb := '[]'::jsonb;
BEGIN
  FOR slot IN
    SELECT id, trial_date, start_time, timezone, day_of_week
    FROM public.trial_slots
    WHERE is_active = true
      AND lifecycle = 'active'
      AND trial_date IS NOT NULL
      AND (trial_date + start_time::time) AT TIME ZONE COALESCE(timezone, 'Asia/Kuala_Lumpur') <= now()
  LOOP
    target_month := date_trunc('month', slot.trial_date)::date;
    LOOP
      target_month := (target_month + interval '1 month')::date;
      block_start := public.fn_first_trial_block_date(target_month);
      dow_offset := ((slot.day_of_week - EXTRACT(DOW FROM block_start)::int) + 7) % 7;
      new_date := block_start + dow_offset;
      EXIT WHEN (new_date + slot.start_time::time) AT TIME ZONE COALESCE(slot.timezone, 'Asia/Kuala_Lumpur') > now();
    END LOOP;

    BEGIN
      UPDATE public.trial_slots
        SET trial_date = new_date,
            updated_at = now(),
            enrollment_alert_sent_at = CASE WHEN new_date <> slot.trial_date THEN NULL ELSE enrollment_alert_sent_at END,
            min_run_checked_at       = CASE WHEN new_date <> slot.trial_date THEN NULL ELSE min_run_checked_at END,
            rollover_skipped_at = NULL,
            rollover_skip_reason = NULL
        WHERE id = slot.id;
      v_advanced := v_advanced + 1;
      v_details := v_details || jsonb_build_object(
        'id', slot.id, 'result', 'advanced',
        'from_date', slot.trial_date, 'to_date', new_date
      );
    EXCEPTION WHEN unique_violation THEN
      UPDATE public.trial_slots
        SET rollover_skipped_at = now(),
            rollover_skip_reason = format(
              'Could not roll forward to %s %s -- another row already occupies that date and time.',
              new_date, slot.start_time
            )
        WHERE id = slot.id;
      v_skipped := v_skipped + 1;
      v_details := v_details || jsonb_build_object(
        'id', slot.id, 'result', 'skipped', 'reason', 'unique_violation',
        'attempted_date', new_date, 'start_time', slot.start_time
      );
    END;
  END LOOP;

  RETURN QUERY SELECT v_advanced, v_skipped, v_details;
END;
$function$;

-- Same grant the function already had -- postgres (owner) and service_role
-- (the cron job's role) only. Never anon, never authenticated.
GRANT EXECUTE ON FUNCTION public.advance_trial_slots() TO service_role;

DO $$
BEGIN
  IF (
    SELECT count(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'trial_slots'
       AND column_name IN ('rollover_skipped_at', 'rollover_skip_reason')
  ) <> 2 THEN
    RAISE EXCEPTION 'Verify failed: rollover_skipped_at/rollover_skip_reason columns are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_type t ON t.oid = p.prorettype
     WHERE p.proname = 'advance_trial_slots' AND t.typname = 'record'
  ) THEN
    RAISE EXCEPTION 'Verify failed: advance_trial_slots() does not have the expected TABLE(...) return shape';
  END IF;
END $$;

COMMIT;
