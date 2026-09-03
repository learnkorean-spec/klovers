-- The duplicate-booking guard stops applying exactly when it starts to matter.
--
-- trial_bookings already carries a unique index for this:
--
--   CREATE UNIQUE INDEX idx_trial_bookings_unique_active
--     ON trial_bookings (lower(email), trial_date, start_time)
--     WHERE is_tba = false AND status = ANY (ARRAY['pending','confirmed']);
--
-- Its predicate ENUMERATES the live statuses. 'awaiting_attendance' was added
-- later, in 20260517000003_trial_attendance_flow.sql, and was never added to
-- that list. Nothing failed loudly; the index simply stopped covering the rows
-- it was written to cover.
--
-- Which rows those are is the point. book-trial sets the status by path:
--
--   const bookingStatus = authed && resolvedUserId ? "awaiting_attendance"
--                                                  : "confirmed";
--
-- So an anonymous booking is protected and a SIGNED-IN one is not - and the
-- signed-in path is the one that takes a real seat in a real cohort. On
-- 2026-09-01 that produced four identical bookings on the Friday Arabic slot
-- in three seconds, from one repeated submit. They were removed in
-- 20260904000000; this stops it happening to a student.
--
-- The fix is to stop listing what is alive and exclude what is dead, so a
-- status added in future is covered by default rather than silently falling
-- outside the constraint. Both halves are written NULL-safe (IS NOT TRUE,
-- IS DISTINCT FROM) so a NULL in either column cannot drop a row out of the
-- index the way a NULL would with = and <>.
--
-- No application change is needed. book-trial already handles 23505 and
-- returns 409 "You already have a trial class booked. Check your email for
-- details." - which is also the right thing for a reader to see after a
-- double-click. Verified in supabase/functions/book-trial/index.ts before
-- writing this.
--
-- Rebooking still works. The authenticated rebook path cancels the previous
-- booking before inserting the new one, and a cancelled row is outside the
-- predicate.
--
-- Measured on production before writing: 77 rows, no NULL in is_tba or
-- status, and ZERO groups that would violate the new predicate. The index
-- therefore builds without a rewrite of anything.
--
-- Not CONCURRENTLY: the table is 77 rows, and CREATE INDEX CONCURRENTLY
-- cannot run inside the transaction this migration needs to be atomic.

BEGIN;

-- Refuse to proceed if reality moved between writing and applying. Creating
-- the index would fail anyway; this fails first, with a message that says why.
DO $$
DECLARE
  violations int;
BEGIN
  SELECT count(*) INTO violations FROM (
    SELECT 1
      FROM trial_bookings
     WHERE is_tba IS NOT TRUE
       AND status IS DISTINCT FROM 'cancelled'
     GROUP BY lower(email), trial_date, start_time
    HAVING count(*) > 1
  ) x;

  IF violations > 0 THEN
    RAISE EXCEPTION
      '% duplicate live booking group(s) exist; the new index cannot be built. Resolve them first - nothing has been changed.', violations;
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_trial_bookings_unique_active;

CREATE UNIQUE INDEX idx_trial_bookings_unique_active
    ON public.trial_bookings (lower(email), trial_date, start_time)
 WHERE is_tba IS NOT TRUE
   AND status IS DISTINCT FROM 'cancelled';

COMMENT ON INDEX public.idx_trial_bookings_unique_active IS
  'One live booking per email per dated slot. The predicate excludes cancelled rather than listing the live statuses, so a status added later is covered by default - the previous version listed only pending and confirmed and silently stopped covering awaiting_attendance.';

-- Confirm the index exists with the predicate intended, not the old one.
DO $$
DECLARE
  def text;
BEGIN
  SELECT indexdef INTO def
    FROM pg_indexes
   WHERE schemaname = 'public' AND indexname = 'idx_trial_bookings_unique_active';

  IF def IS NULL THEN
    RAISE EXCEPTION 'idx_trial_bookings_unique_active is missing after creation';
  END IF;
  IF def NOT LIKE '%UNIQUE%' THEN
    RAISE EXCEPTION 'idx_trial_bookings_unique_active is not unique: %', def;
  END IF;
  IF def LIKE '%pending%' OR def LIKE '%confirmed%' THEN
    RAISE EXCEPTION 'the old status-list predicate is still in place: %', def;
  END IF;

  RAISE NOTICE 'idx_trial_bookings_unique_active rebuilt: %', def;
END $$;

COMMIT;
