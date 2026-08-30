-- Delete the retired trial_slots row that blocks 20260828114539 from ever
-- applying, and record the historical fact in admin_audit_log before it's
-- gone.
--
-- Background
-- ----------
-- 20260828114539 (merged, still pending -- three apply attempts against it
-- today all failed identically) tries to move the Saturday Arabic slot
-- (cc68b1b8-adbe-4210-82c4-39d96de1f973) to Africa/Cairo 17:00 on
-- 2026-09-05. trial_slots has UNIQUE (trial_date, start_time) -- a
-- constraint that does not include timezone -- and this row already
-- occupies exactly that date and time:
--
--   d54acaf3-e7db-4267-8cd5-1a999c26149a | 2026-09-05 | 17:00 |
--   Asia/Ho_Chi_Minh | lifecycle=retired | is_active=false | archived
--   2026-08-13 | superseded twice (Ho_Chi_Minh -> Kuala_Lumpur by
--   20260822103000, then Kuala_Lumpur -> Cairo by 20260828114539 itself,
--   for the row it's actually blocking).
--
-- It was left alone when it was retired -- correctly, for reads: no read
-- path reaches a retired row. Nobody checked whether a later WRITE to the
-- same (date, time) pair could still collide with it, and one now does.
--
-- Re's decision: delete the row, don't nudge its start_time to dodge the
-- constraint. A nudge would write a time into the historical record for a
-- class that never ran at that time -- a false record is worse than no
-- record. Deleting it and keeping the true fact (what it was, and that it
-- was removed) in admin_audit_log is the honest version of "gone."
--
-- Sequencing -- why this file exists instead of editing 20260828114539
-- ----------------------------------------------------------------------
-- 20260828114539 is merged to main but has never successfully applied --
-- all three attempts today aborted on this exact collision before COMMIT,
-- and verified live afterward: nothing from any of them changed anything.
-- Because nothing from that file (or 20260828122451, or 20260828140321) is
-- recorded as applied yet, the Apply Migrations workflow's ordering is
-- decided purely by version-string sort of files not yet in the remote
-- migration history -- not by merge chronology. That means a new file
-- whose version sorts BEFORE 20260828114539 slots in ahead of it in the
-- same apply run without touching that file's contents at all: this
-- migration's version (20260828094117) sorts after the last actually-
-- applied migration (20260827163417) and before 20260828114539, so it runs
-- first, clears the collision, and 20260828114539 then applies cleanly
-- against a table with no occupant at (2026-09-05, 17:00).
--
-- Editing 20260828114539 in place was the alternative and is deliberately
-- not what this does: it is an already-merged, already-reviewed migration,
-- and this repo's convention throughout (20260826110000 correcting a prior
-- wrong state, 20260828114539 itself replacing 20260822103000's zone) is a
-- new corrective migration, never a rewrite of one already on main. That
-- convention is followed here too.
--
-- No trial_bookings row can reference this dead row (it's matched by
-- trial_date + start_time + timezone, same as every other slot check in
-- this repo) -- confirmed live below, not assumed.

BEGIN;

-- Same attribution pattern as every prior fix in this sequence:
-- transaction-scoped set_config, never a disabled trigger.
SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

DO $$
BEGIN
  -- Guard: if the row exists, it must be EXACTLY lifecycle='retired' AND
  -- is_active=false. Anything else -- still active, or edited into some
  -- other state -- aborts rather than deleting something it shouldn't.
  -- If the row doesn't exist at all (a prior successful run of this same
  -- migration), that's fine: EXISTS is false, no exception, and the insert
  -- + delete below both no-op.
  IF EXISTS (
    SELECT 1 FROM public.trial_slots
     WHERE id = 'd54acaf3-e7db-4267-8cd5-1a999c26149a'
       AND NOT (lifecycle = 'retired' AND is_active = false)
  ) THEN
    RAISE EXCEPTION 'Guard failed: d54acaf3... exists but is not lifecycle=retired/is_active=false -- refusing to delete';
  END IF;

  -- Guard: no trial_bookings row resolves against this row's own
  -- (trial_date, start_time, timezone) tuple. Re-verified live here, not
  -- trusted from the PR body -- there should still be zero.
  IF EXISTS (
    SELECT 1 FROM public.trial_bookings
     WHERE trial_date = '2026-09-05' AND start_time = '17:00' AND timezone = 'Asia/Ho_Chi_Minh'
  ) THEN
    RAISE EXCEPTION 'Guard failed: a trial_bookings row references d54acaf3...''s (trial_date, start_time, timezone) tuple -- refusing to delete';
  END IF;
END $$;

-- Record the full row before it's gone. Only inserts if the row still
-- matches the expected state above -- a re-run after a successful delete
-- finds nothing to select and this is a true no-op (no duplicate audit
-- rows on re-apply).
INSERT INTO public.admin_audit_log (admin_id, enrollment_id, action, field, old_value, new_value)
SELECT
  'eb51d4be-8378-493f-b6c7-9c3a5e9b5416'::uuid,
  NULL,
  'trial_slot_deleted',
  'trial_slots.d54acaf3-e7db-4267-8cd5-1a999c26149a',
  row_to_json(ts)::text,
  NULL
FROM public.trial_slots ts
WHERE ts.id = 'd54acaf3-e7db-4267-8cd5-1a999c26149a'
  AND ts.lifecycle = 'retired'
  AND ts.is_active = false;

-- The actual deletion. Same guard repeated in the WHERE clause, not just
-- the DO block above, so this statement is safe even if something else
-- changed the row between the guard and here.
DELETE FROM public.trial_slots
 WHERE id = 'd54acaf3-e7db-4267-8cd5-1a999c26149a'
   AND lifecycle = 'retired'
   AND is_active = false;

-- Verify before commit. Not "should be right" -- asserted.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.trial_slots WHERE id = 'd54acaf3-e7db-4267-8cd5-1a999c26149a') THEN
    RAISE EXCEPTION 'Verify failed: d54acaf3... still exists after DELETE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.admin_audit_log
     WHERE action = 'trial_slot_deleted'
       AND field = 'trial_slots.d54acaf3-e7db-4267-8cd5-1a999c26149a'
  ) THEN
    RAISE EXCEPTION 'Verify failed: no admin_audit_log record for the deleted row -- the historical fact must survive';
  END IF;

  -- The collision is actually gone: nothing occupies the slot
  -- 20260828114539 needs to write into.
  IF EXISTS (
    SELECT 1 FROM public.trial_slots WHERE trial_date = '2026-09-05' AND start_time = '17:00'
  ) THEN
    RAISE EXCEPTION 'Verify failed: something still occupies (2026-09-05, 17:00) -- 20260828114539 would fail again';
  END IF;
END $$;

COMMIT;
