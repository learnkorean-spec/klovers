-- age-stale-trial-bookings marked attendees as no-shows.
--
-- The job runs daily at 02:00 Cairo:
--
--   UPDATE public.trial_bookings SET status = 'no_show'
--    WHERE status = 'pending' AND is_tba = false
--      AND trial_date < (now() AT TIME ZONE 'Africa/Cairo')::date
--
-- There is no grace period, so "trial_date has passed" means the small
-- hours of the morning after the class. A student who attended is recorded
-- as a no-show unless somebody opened the admin table and marked her the
-- same evening.
--
-- This is about to matter. Nine students sit on the 18 Sep class; two have
-- confirmed and are at 'confirmed_attendance', which this job does not
-- touch. The other seven are at 'pending'. At 02:00 on 19 Sep all seven
-- would be stamped 'no_show' whether or not they were in the room — the
-- attendance record for the first trial classes in five months, wrong from
-- the first morning, with no way to reconstruct the truth afterwards.
--
-- The fix is a grace period, not a new filter. The job exists to clear the
-- ancient untouched backlog, not to adjudicate last night's class, and
-- seven days does the first without pretending to do the second. Anything
-- still 'pending' a week after its date genuinely has been abandoned.
--
-- 'confirmed_attendance' stays excluded, as it always was by virtue of not
-- being 'pending': a student who pressed "I'll be there" is never silently
-- marked absent by a cron job. Whether she actually came is a question for
-- a person.

DO $mig$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid
    FROM cron.job
   WHERE jobname = 'age-stale-trial-bookings';

  IF v_jobid IS NULL THEN
    -- Not scheduled in this environment (a branch database, or a local
    -- stack that never ran the scheduling migration). Nothing to alter,
    -- and creating it here would be a surprise.
    RAISE NOTICE 'age-stale-trial-bookings is not scheduled here; skipping';
    RETURN;
  END IF;

  PERFORM cron.alter_job(
    v_jobid,
    command => $cmd$UPDATE public.trial_bookings
         SET status = 'no_show'
         WHERE status = 'pending'
           AND is_tba = false
           AND trial_date < (now() AT TIME ZONE 'Africa/Cairo')::date - 7$cmd$
  );
END
$mig$;

-- The transition table already declares pending -> no_show with the note
-- "age-stale-trial-bookings cron, trial date passed". That is still true;
-- only the definition of "passed" has moved. Restate it so the note does
-- not quietly mislead the next person who reads the table.
UPDATE public.trial_booking_status_transitions
   SET note = 'age-stale-trial-bookings cron, trial date passed more than 7 days ago'
 WHERE from_status = 'pending'
   AND to_status   = 'no_show';
