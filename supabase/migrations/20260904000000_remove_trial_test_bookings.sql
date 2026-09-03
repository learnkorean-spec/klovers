-- Remove the four duplicate test bookings on the Friday Arabic trial slot.
--
-- THIS DELETES EXISTING ROWS. Reham confirmed on 2026-09-03 that they are
-- test data and asked for these four specifically.
--
-- The four are identical live bookings by the same person on the same slot,
-- created at 17:10:59, 17:11:00, 17:11:01 and 17:11:02 on 2026-09-01 - three
-- seconds apart, which is a repeated submit rather than four intentions.
--
-- Scope was narrowed from six to four on Reham's instruction. Two rows that
-- an earlier draft included are deliberately LEFT IN PLACE:
--
--   e0dbe8d9  09-11 arabic, same person, status 'cancelled'. Occupies no
--             seat and is a true record of a booking that was made and
--             withdrawn. Nothing is gained by erasing it.
--   885b7cd9  09-13 english, name "Admin", created 2026-08-31. Still counts
--             against the Sunday English slot, so that slot will continue to
--             read as having one booking. Left because it was not asked for;
--             it is a one-line change to remove later.
--
-- Targeted by primary key, not by a predicate on name or email, so this can
-- only ever touch these exact four rows. It refuses to run if the count has
-- changed - if a row has been deleted or its id differs, the whole
-- transaction aborts and nothing is touched.
--
-- Root cause, for the record. A unique index for exactly this already exists:
--
--   CREATE UNIQUE INDEX idx_trial_bookings_unique_active
--     ON trial_bookings (lower(email), trial_date, start_time)
--     WHERE is_tba = false AND status = ANY (ARRAY['pending','confirmed']);
--
-- Its predicate enumerates the live statuses. These four are
-- 'awaiting_attendance', a status added later in
-- 20260517000003_trial_attendance_flow.sql and never added to that list, so
-- the guard stops applying exactly when a duplicate starts costing a seat.
-- The fix is to invert the predicate - exclude 'cancelled' rather than list
-- the live statuses - so a future status is covered by default. Not done here:
-- rebuilding that index turns a double-click into a database error that
-- supabase/functions/book-trial/index.ts does not catch, and that is not a
-- change to ship into the booking funnel in the same hour as the first real
-- invitation.

BEGIN;

DO $$
DECLARE
  test_ids CONSTANT uuid[] := ARRAY[
    'd55cca15-1cbb-4051-976b-f2f58304bb6c',  -- created 2026-09-01 17:10:59
    '015e48b8-60dd-46a6-adbe-d6454a706e6a',  -- created 2026-09-01 17:11:00
    'ec664f76-f03e-466f-955a-dfd8e606a05a',  -- created 2026-09-01 17:11:01
    '33331dca-a4d6-4feb-8174-0fbf67cc4738'   -- created 2026-09-01 17:11:02
  ]::uuid[];
  found     int;
  deleted   int;
  left_over int;
BEGIN
  SELECT count(*) INTO found FROM trial_bookings WHERE id = ANY(test_ids);
  IF found <> 4 THEN
    RAISE EXCEPTION
      'expected the 4 known duplicate bookings, found % - the table has changed since this migration was written, so nothing has been deleted', found;
  END IF;

  DELETE FROM trial_bookings WHERE id = ANY(test_ids);
  GET DIAGNOSTICS deleted = ROW_COUNT;
  IF deleted <> 4 THEN
    RAISE EXCEPTION 'deleted % rows, expected 4', deleted;
  END IF;

  -- Whatever is left on the September trial dates is reported, never deleted.
  -- Expected to be 2 at the time of writing: the cancelled row above, and the
  -- Admin row on 09-13.
  SELECT count(*) INTO left_over
    FROM trial_bookings
   WHERE trial_date BETWEEN DATE '2026-09-11' AND DATE '2026-09-14';

  RAISE NOTICE 'Removed 4 duplicate bookings. % booking(s) remain on the September trial dates.', left_over;
END $$;

COMMIT;
