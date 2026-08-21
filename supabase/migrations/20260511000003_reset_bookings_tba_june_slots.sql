-- NEUTRALISED 2026-08-21 — see docs/MIGRATION_TRIAGE.md
--
-- This migration was written on 2026-05-11 to clear every active trial
-- booking so students could be re-assigned to the June 2026 dates. It was
-- applied to production by hand at the time, but its version was never
-- recorded in supabase_migrations.schema_migrations, so `supabase db push`
-- still considers it pending.
--
-- The removed statement was:
--
--     UPDATE public.trial_bookings
--     SET trial_date = NULL, start_time = NULL, is_tba = true
--     WHERE status IN ('confirmed','pending') AND is_tba = false;
--
-- Replayed today that strips the date and time from every confirmed or
-- pending booking and marks it TBA. It currently matches 0 rows only
-- because all 59 active bookings are already is_tba = true - a property of
-- today's data, not of the statement. One student booking a trial before
-- the next deploy would be silently unscheduled.
--
-- Also removed: three UPDATEs setting class_language on the 2026-06-04,
-- 06-05 and 06-07 slots. Those dates no longer exist (live slots run
-- 2026-09-04 .. 09-07), so they match nothing.
--
-- The ALTER below is kept. It is idempotent, the column exists in
-- production already, and keeping it means a local `supabase db reset`
-- still builds a correct schema from the migration chain.

ALTER TABLE public.trial_slots
  ADD COLUMN IF NOT EXISTS class_language TEXT DEFAULT 'arabic';
