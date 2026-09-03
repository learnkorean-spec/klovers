-- Remove the six test bookings from the September trial slots.
--
-- THIS DELETES EXISTING ROWS. Reham confirmed on 2026-09-03 that they are
-- test data and asked for them to go.
--
-- What they are. Every booking on the four September trial slots was made by
-- Reham herself or by the Admin account; not one is a student:
--
--   2026-09-11 15:00 arabic   5 rows, all "Reham Elshrkawy", timezone
--                             Asia/Bangkok. One cancelled at 17:10:48 and
--                             four more created at 17:10:59, 17:11:00,
--                             17:11:01 and 17:11:02 - four identical live
--                             bookings inside three seconds, which is a
--                             repeated submit, not four intentions.
--   2026-09-13 15:00 english  1 row, "Admin", created 2026-08-31.
--
-- Why it matters enough to clean up rather than leave. The trial invitation
-- is about to go to 18 people and the capacity line in it is driven by these
-- counts: the Friday Arabic slot reads as half full and the Sunday English
-- slot as occupied, when both are empty. Trial attendance, conversion and
-- no-show rates are all computed off this table too, so six phantom rows
-- against a base this small distort every one of them.
--
-- Targeted by primary key, not by a predicate on name or email, so this can
-- only ever touch these exact six rows. It refuses to run if the count has
-- changed - if a row has been deleted or its id differs, the whole
-- transaction aborts and nothing is touched.
--
-- Deliberately NOT included: a unique index to stop a repeated submit
-- creating duplicates again. That is the right fix and there is now exactly
-- one duplicate group in the table (these four), so the index would build
-- cleanly - but adding it turns a double-click into a database error that
-- supabase/functions/book-trial/index.ts does not currently catch, and that
-- is not a change to ship into the booking funnel in the same hour as the
-- first real invitation. It follows separately, with the insert path handled.

BEGIN;

DO $$
DECLARE
  test_ids CONSTANT uuid[] := ARRAY[
    'e0dbe8d9-e40a-4977-8231-eb085850aa1a',  -- 09-11 arabic, cancelled
    'd55cca15-1cbb-4051-976b-f2f58304bb6c',  -- 09-11 arabic, awaiting_attendance
    '015e48b8-60dd-46a6-adbe-d6454a706e6a',  -- 09-11 arabic, awaiting_attendance
    'ec664f76-f03e-466f-955a-dfd8e606a05a',  -- 09-11 arabic, awaiting_attendance
    '33331dca-a4d6-4feb-8174-0fbf67cc4738',  -- 09-11 arabic, awaiting_attendance
    '885b7cd9-a456-4d26-8152-f1523e884484'   -- 09-13 english, "Admin"
  ]::uuid[];
  found     int;
  deleted   int;
  left_over int;
BEGIN
  SELECT count(*) INTO found FROM trial_bookings WHERE id = ANY(test_ids);
  IF found <> 6 THEN
    RAISE EXCEPTION
      'expected the 6 known test bookings, found % - the table has changed since this migration was written, so nothing has been deleted', found;
  END IF;

  DELETE FROM trial_bookings WHERE id = ANY(test_ids);
  GET DIAGNOSTICS deleted = ROW_COUNT;
  IF deleted <> 6 THEN
    RAISE EXCEPTION 'deleted % rows, expected 6', deleted;
  END IF;

  -- Any booking still on these dates is a real one made since this was
  -- written. Reported, never deleted.
  SELECT count(*) INTO left_over
    FROM trial_bookings
   WHERE trial_date BETWEEN DATE '2026-09-11' AND DATE '2026-09-14';

  RAISE NOTICE 'Removed 6 test bookings. % real booking(s) now on the September trial dates.', left_over;
END $$;

COMMIT;
