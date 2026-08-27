-- Second rebuild of the same student's bundle/session split. 20260826110000
-- (previous migration) applied cleanly and verified correct at commit time.
-- What undid it happened afterward, through ordinary UI action, not through
-- that migration: restoring the weekly class row (Monday, effective_from
-- 2026-07-06, no effective_to) meant the confirm/catch-up queue recomputed
-- "dates with no session row yet" against it and re-offered 3, 10 and 17
-- August as unconfirmed -- the exact dates the prior migration had just
-- removed because no class happened on them. They were confirmed again,
-- recreating the negative balance. Bundle 46623fd2 was then deleted
-- entirely (by hand) once that mess was visible, along with its one session.
--
-- This migration does not repeat that mistake: it removes 3 and 10 August
-- (17 August is already gone) without relying on any encoding of the point
-- in time it applies, and it does NOT touch the weekly class row -- that
-- row is correct as it stands (Monday 19:00-20:30 has been the real
-- schedule since 6 July) and is not the thing that needs fixing. What needs
-- fixing is the confirm/catch-up habit of re-surfacing dates a human already
-- ruled out, and that is a UI/process question flagged separately in the PR
-- body, not something this migration can fix by touching data.
--
-- SCOPE: exactly one student (5249236a-5d6c-44c1-899a-7aeece38cfdc), one
-- existing bundle (session removal only, no bundle-row write), one new
-- bundle row (fixed id), one new session row (fixed id). Every statement
-- targets an explicit row id; nothing here is pattern-matched.
--
-- IDEMPOTENT: the guard accepts either the pre-rebuild state or the
-- already-applied end state and no-ops the second time through. Any other
-- state -- meaning this student's data has moved again since this migration
-- was reviewed -- raises and changes nothing.
--
-- AUDIT: the new bundle row is created by INSERT, not UPDATE, so
-- tg_student_bundles_audit (which reads OLD.* and is only ever attached to
-- UPDATE) does not fire for its creation -- same as every other bundle
-- created through the app's own "New bundle" action. set_config below is
-- still set for consistency and in case any future statement here ever
-- becomes an UPDATE; it is not doing any work this migration actually needs.
--
-- PLACEHOLDER, NOT A FACT: the new bundle is unpaid. purchased_on cannot be
-- NULL, so it is set to 2026-08-24 (matching coverage_start) as an explicit
-- placeholder, named as such in both the row's own `note` and the PR body.
-- Re sets the real purchased_on once payment actually happens.

BEGIN;

SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

-- ---------------------------------------------------------------------------
-- PART 1 -- GUARD: refuse to run against anything other than the exact
-- reviewed state (either the pre-rebuild state or the already-applied one).
-- ---------------------------------------------------------------------------
DO $guard$
DECLARE
  v_bundle1_ok     boolean;
  v_bundle2_ok     boolean;
  v_weekly_ok      boolean;
  v_pre_sessions   int;
  v_post_sessions  int;
  v_total_sessions int;
BEGIN
  -- Bundle 1 is not written by this migration at all -- it must already be
  -- exactly right, in both the pre- and post-rebuild state alike.
  SELECT EXISTS (
    SELECT 1 FROM student_bundles
     WHERE id = 'a7bc3da7-9216-441d-be1a-07730a2da912'
       AND student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
       AND status = 'completed'
       AND coverage_start = '2026-07-06'
       AND purchased_on = '2026-07-06'
       AND total_classes = 4
       AND total_price = 2350.00
       AND currency = 'EGP'
  ) INTO v_bundle1_ok;

  IF NOT v_bundle1_ok THEN
    RAISE EXCEPTION 'mariam_rebuild_guard: bundle a7bc3da7 does not match the reviewed state (student 5249236a, completed, coverage_start/purchased_on 2026-07-06, 4 classes, EGP 2350). Changed since review -- aborting, nothing touched.';
  END IF;

  -- Bundle 2: either does not exist yet (pre-rebuild -- it was deleted), or
  -- already exists exactly as this migration would create it (already applied).
  SELECT (
    NOT EXISTS (SELECT 1 FROM student_bundles WHERE id = '4a67c092-0827-4e2b-9c3a-46623fd24245')
  ) OR (
    EXISTS (
      SELECT 1 FROM student_bundles
       WHERE id = '4a67c092-0827-4e2b-9c3a-46623fd24245'
         AND student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
         AND status = 'active'
         AND coverage_start = '2026-08-24'
         AND purchased_on = '2026-08-24'
         AND total_classes = 4
         AND total_price = 2350.00
         AND currency = 'EGP'
    )
  ) INTO v_bundle2_ok;

  IF NOT v_bundle2_ok THEN
    RAISE EXCEPTION 'mariam_rebuild_guard: bundle id 4a67c092 exists but does not match what this migration would have created. Changed since review -- aborting, nothing touched.';
  END IF;

  -- Weekly class row: not touched by this migration, must already be exactly
  -- the restored Monday row, unconditionally.
  SELECT EXISTS (
    SELECT 1 FROM teacher_student_classes
     WHERE id = '1c1a5500-0706-4e1a-8c6a-5249236a5d6c'
       AND student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
       AND weekday = 1 AND start_time = '19:00:00' AND duration_minutes = 90
       AND effective_from = '2026-07-06' AND effective_to IS NULL
  ) INTO v_weekly_ok;

  IF NOT v_weekly_ok THEN
    RAISE EXCEPTION 'mariam_rebuild_guard: teacher_student_classes row 1c1a5500 for student 5249236a no longer matches the expected Monday 19:00-20:30 row. This migration does not manage that row and will not proceed while it is unexpected. Aborting, nothing touched.';
  END IF;

  -- Sessions: accept exactly the 6-row pre-rebuild state or exactly the
  -- 5-row post-rebuild state, and refuse anything else.
  SELECT count(*) INTO v_pre_sessions FROM student_class_sessions
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
     AND (
       (id = '2f5b6e0a-0706-4e1a-8c6a-a7bc3da79216' AND session_date = '2026-07-06' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'fe4b698d-1855-447c-bac1-035487688ee0' AND session_date = '2026-07-13' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'd0c3abe3-e7f9-4041-8b9c-7a3ac0939595' AND session_date = '2026-07-20' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = '7e600562-0e9b-4051-9c12-03a70f2a2663' AND session_date = '2026-07-27' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'd958df71-b13e-45a5-aa7d-1761c1587eaf' AND session_date = '2026-08-03' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'e63d5496-2d37-4225-a7c6-8d4b007467e5' AND session_date = '2026-08-10' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
     );

  SELECT count(*) INTO v_post_sessions FROM student_class_sessions
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
     AND (
       (id = '2f5b6e0a-0706-4e1a-8c6a-a7bc3da79216' AND session_date = '2026-07-06' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'fe4b698d-1855-447c-bac1-035487688ee0' AND session_date = '2026-07-13' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'd0c3abe3-e7f9-4041-8b9c-7a3ac0939595' AND session_date = '2026-07-20' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = '7e600562-0e9b-4051-9c12-03a70f2a2663' AND session_date = '2026-07-27' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = '7b2c1a00-0827-4e2b-9c3a-553df6385f81' AND session_date = '2026-08-24' AND bundle_id = '4a67c092-0827-4e2b-9c3a-46623fd24245' AND counted AND outcome = 'attended')
     );

  SELECT count(*) INTO v_total_sessions FROM student_class_sessions
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc';

  IF NOT ((v_pre_sessions = 6 AND v_total_sessions = 6) OR (v_post_sessions = 5 AND v_total_sessions = 5)) THEN
    RAISE EXCEPTION 'mariam_rebuild_guard: student 5249236a session rows do not match the reviewed pre-state (6 rows) or post-state (5 rows) exactly -- pre_match=%, post_match=%, total=%. Changed since review -- aborting, nothing touched.',
      v_pre_sessions, v_post_sessions, v_total_sessions;
  END IF;
END;
$guard$;

-- ---------------------------------------------------------------------------
-- PART 2 -- APPLY: every statement is independently idempotent via its own
-- WHERE clause or NOT EXISTS check, so a second run of an already-applied
-- statement is a true no-op, not an error.
-- ---------------------------------------------------------------------------

-- Remove the 2 sessions Re confirmed never happened.
DELETE FROM student_class_sessions
 WHERE id = 'd958df71-b13e-45a5-aa7d-1761c1587eaf'
   AND session_date = '2026-08-03'
   AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912';

DELETE FROM student_class_sessions
 WHERE id = 'e63d5496-2d37-4225-a7c6-8d4b007467e5'
   AND session_date = '2026-08-10'
   AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912';

-- Recreate the second bundle. INSERT, not UPDATE -- the audit trigger does
-- not fire here, same as any bundle created through the app's own "New
-- bundle" action. purchased_on is an explicit, named placeholder: this
-- bundle is unpaid.
INSERT INTO student_bundles
       (id, student_id, label, total_classes, total_price, currency, status,
        coverage_start, coverage_start_confirmed_at, purchased_on, note)
SELECT '4a67c092-0827-4e2b-9c3a-46623fd24245', '5249236a-5d6c-44c1-899a-7aeece38cfdc',
       'Private · 1 month · 4 classes', 4, 2350.00, 'EGP', 'active',
       '2026-08-24', now(),
       '2026-08-24', -- PLACEHOLDER, not a real payment date -- see note below
       'Rebuilt by migration 20260827140000_mariam_bundle_rebuild_v2.sql, authorised by Re (admin@klovers.com). purchased_on (2026-08-24) is a PLACEHOLDER equal to coverage_start, not a real payment date -- this bundle is UNPAID. Re sets the real purchased_on once payment arrives.'
WHERE NOT EXISTS (
  SELECT 1 FROM student_bundles WHERE id = '4a67c092-0827-4e2b-9c3a-46623fd24245'
);

-- The one real August session, on the new bundle.
INSERT INTO student_class_sessions
       (id, student_id, bundle_id, class_id, session_date, start_time, outcome, counted, confirmed_at, note, entry_source)
SELECT '7b2c1a00-0827-4e2b-9c3a-553df6385f81', '5249236a-5d6c-44c1-899a-7aeece38cfdc',
       '4a67c092-0827-4e2b-9c3a-46623fd24245', NULL, '2026-08-24', '19:00:00',
       'attended', true, now(),
       'Recreated by migration 20260827140000_mariam_bundle_rebuild_v2.sql: the original 24 August session (id 553df638) was deleted along with the first rebuild of bundle 2. Authorised by Re (admin@klovers.com).',
       'manual'
WHERE NOT EXISTS (
  SELECT 1 FROM student_class_sessions WHERE id = '7b2c1a00-0827-4e2b-9c3a-553df6385f81'
);

-- ---------------------------------------------------------------------------
-- PART 3 -- VERIFY: assert the exact end state before committing. Any
-- mismatch rolls back everything above.
-- ---------------------------------------------------------------------------
DO $verify$
DECLARE
  v_bundle1_used int;
  v_bundle2_used int;
  v_total        int;
  v_bundle_count int;
BEGIN
  SELECT count(*) INTO v_bundle1_used FROM student_class_sessions
   WHERE bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted;

  SELECT count(*) INTO v_bundle2_used FROM student_class_sessions
   WHERE bundle_id = '4a67c092-0827-4e2b-9c3a-46623fd24245' AND counted;

  SELECT count(*) INTO v_total FROM student_class_sessions
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc';

  SELECT count(*) INTO v_bundle_count FROM student_bundles
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc';

  IF v_bundle1_used <> 4 OR v_bundle2_used <> 1 OR v_total <> 5 OR v_bundle_count <> 2 THEN
    RAISE EXCEPTION 'mariam_rebuild_verify: end state mismatch -- bundle1_used=% (want 4), bundle2_used=% (want 1), total_sessions=% (want 5), bundle_count=% (want 2). Rolling back.',
      v_bundle1_used, v_bundle2_used, v_total, v_bundle_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM student_bundles sb
    WHERE sb.id IN ('a7bc3da7-9216-441d-be1a-07730a2da912', '4a67c092-0827-4e2b-9c3a-46623fd24245')
      AND (
        SELECT count(*) FROM student_class_sessions scs
         WHERE scs.bundle_id = sb.id AND scs.counted
      ) > sb.total_classes
  ) THEN
    RAISE EXCEPTION 'mariam_rebuild_verify: a negative balance exists on one of these two bundles after applying. Rolling back.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM student_bundles
     WHERE id = '4a67c092-0827-4e2b-9c3a-46623fd24245'
       AND status = 'active' AND coverage_start = '2026-08-24' AND purchased_on = '2026-08-24'
  ) THEN
    RAISE EXCEPTION 'mariam_rebuild_verify: new bundle 4a67c092 did not end in the expected state. Rolling back.';
  END IF;
END;
$verify$;

COMMIT;
