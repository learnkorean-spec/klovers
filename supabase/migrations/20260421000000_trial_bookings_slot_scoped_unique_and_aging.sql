-- Trial bookings: slot-scoped uniqueness + daily aging of stale pending rows.
--
-- Problem:
--   The previous partial unique index `idx_trial_bookings_unique_active` was
--   defined on `(email) WHERE status IN ('pending','confirmed')`. Because no
--   process ever moved a pending row to a terminal status after the trial_date
--   passed, the first booking per email permanently blocked that email from
--   booking any further slot — the edge function surfaced this to the browser
--   as HTTP 409 (Conflict) every time.
--
-- Fix (two parts):
--   1. Replace the index with `(email, trial_date, start_time) WHERE status IN
--      ('pending','confirmed')` so uniqueness is per-slot instead of per-email.
--      Re-booking the same slot twice is still blocked (correct); other slots
--      are no longer blocked by an unrelated past booking.
--   2. Install a pg_cron job that, daily at 03:00 UTC, flips any pending rows
--      whose trial_date is already in the past to 'no_show'. This keeps the
--      lifecycle honest going forward, so the partial unique predicate stops
--      including rows that are effectively abandoned.

BEGIN;

DROP INDEX IF EXISTS public.idx_trial_bookings_unique_active;

CREATE UNIQUE INDEX idx_trial_bookings_unique_active
  ON public.trial_bookings (email, trial_date, start_time)
  WHERE status IN ('pending', 'confirmed');

COMMIT;

-- pg_cron is already installed on this project; this block is idempotent so
-- re-running the migration won't duplicate the job.
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'age-stale-trial-bookings') THEN
    PERFORM cron.unschedule('age-stale-trial-bookings');
  END IF;
END $$;

SELECT cron.schedule(
  'age-stale-trial-bookings',
  '0 3 * * *',
  $cmd$UPDATE public.trial_bookings
         SET status = 'no_show'
         WHERE status = 'pending' AND trial_date < CURRENT_DATE$cmd$
);
