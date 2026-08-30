-- One-time data correction for a single student (bundle_id 64ea8056... deletion
-- fallout — Finding 2 / follow-on investigation, 2026-08-26).
--
-- WHAT HAPPENED: a bundle believed to be an accidental zero-session duplicate was
-- deleted. It was in fact the student's real, older bundle. Re recreated it by hand
-- (new id 46623fd2...) and began re-attributing sessions through the app UI, which
-- correctly updated student_bundles.coverage_start/status/purchased_on on both
-- bundles (already live, not touched here). Two things the UI's per-field edit
-- cannot do in one step are finished here: session-level bundle reattribution across
-- both bundles at once, deleting three sessions that were generated from the weekly
-- schedule for dates no class happened, and restoring the weekly class row itself
-- (deleted, which is why the student's card read "No classes scheduled").
--
-- SCOPE: exactly one student (5249236a-5d6c-44c1-899a-7aeece38cfdc), two bundles,
-- seven named session rows, one weekly-class row. Every statement targets an
-- explicit row id or a fixed id of its own; nothing here is pattern-matched.
--
-- IDEMPOTENT: the guard below accepts either the pre-correction state or the
-- already-applied end state and no-ops the second time through. Any other state --
-- meaning someone has changed this student's data since this migration was
-- reviewed -- raises and changes nothing.
--
-- AUDIT: student_bundles carries a SECURITY DEFINER trigger
-- (tg_student_bundles_audit) that refuses to record a change with no authenticated
-- actor (auth.uid() IS NULL) rather than logging one anonymously. This migration
-- does not disable that trigger. Re confirmed her working admin account is
-- eb51d4be-8378-493f-b6c7-9c3a5e9b5416 (admin@klovers.com) -- independently
-- corroborated: it is the account that made both live edits to these two bundles
-- earlier this morning (09:12:53 and 09:49:16 UTC), the same correction pass this
-- migration completes. set_config('request.jwt.claim.sub', ..., true) below gives
-- the trigger that real identity for auth.uid(), scoped to this transaction only --
-- not a bypass. The one student_bundles write this migration makes also sets
-- `note`, so the resulting student_bundle_edits row records both required facts at
-- once: edited_by = eb51d4be (who authorised it) and changes.note names this
-- migration by file (that it was applied here, not through the Edit-bundle dialog).
--
-- NOTE ON PRECEDENT: fix_orphaned_credits and restore_ayaaraffaa_credits (both
-- 2026-04-23) are NOT live precedent for this -- both were neutralised on
-- 2026-08-21 (see docs/MIGRATION_TRIAGE.md) specifically because a per-user data
-- correction in the permanent migration chain is unsafe: it can silently overwrite
-- a legitimate later change if ever replayed, and if it disables a protective
-- trigger, an abort mid-transaction leaves that protection off. This migration
-- avoids both failure modes on purpose: idempotent guards instead of a hard-set
-- overwrite, and the audit trigger stays enabled throughout, given a real identity
-- instead of being switched off.

BEGIN;

-- Give the audit trigger a real actor for the one student_bundles write below.
-- Transaction-scoped (the `true` third argument) -- cleared automatically at COMMIT.
SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

-- ---------------------------------------------------------------------------
-- GUARD: refuse to run against anything other than the exact reviewed state.
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
    RAISE EXCEPTION 'mariam_correction_guard: bundle a7bc3da7 does not match the reviewed state (student 5249236a, completed, coverage_start/purchased_on 2026-07-06, 4 classes, EGP 2350). Changed since review -- aborting, nothing touched.';
  END IF;

  -- Tolerates either the pre-correction coverage_start (2026-07-12, not yet moved)
  -- or the already-applied one (2026-08-24) -- this is what makes a re-run a no-op.
  SELECT EXISTS (
    SELECT 1 FROM student_bundles
     WHERE id = '46623fd2-4245-48ca-b043-683284909dc0'
       AND student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
       AND status = 'active'
       AND coverage_start IN ('2026-07-12', '2026-08-24')
       AND purchased_on = '2026-07-12'
       AND total_classes = 4
       AND total_price = 2350.00
       AND currency = 'EGP'
  ) INTO v_bundle2_ok;

  IF NOT v_bundle2_ok THEN
    RAISE EXCEPTION 'mariam_correction_guard: bundle 46623fd2 does not match the reviewed state (student 5249236a, active, coverage_start 2026-07-12 or 2026-08-24, purchased_on 2026-07-12, 4 classes, EGP 2350). Changed since review -- aborting, nothing touched.';
  END IF;

  -- Weekly class row: either still absent, or already exactly the restored row.
  SELECT (count(*) = 0) OR (
    count(*) = 1 AND bool_and(
      weekday = 1 AND start_time = '19:00:00' AND duration_minutes = 90
      AND effective_from = '2026-07-06' AND effective_to IS NULL
    )
  ) INTO v_weekly_ok
  FROM teacher_student_classes
  WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc';

  IF NOT v_weekly_ok THEN
    RAISE EXCEPTION 'mariam_correction_guard: teacher_student_classes for student 5249236a is neither empty nor exactly the expected Monday 19:00-20:30 row (effective_from 2026-07-06). Changed since review -- aborting, nothing touched.';
  END IF;

  -- Sessions: accept exactly the 7-row pre-state or exactly the 5-row post-state,
  -- and refuse anything else, including extra/missing rows either way.
  SELECT count(*) INTO v_pre_sessions FROM student_class_sessions
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
     AND (
       (id = 'fe4b698d-1855-447c-bac1-035487688ee0' AND session_date = '2026-07-13' AND bundle_id = '46623fd2-4245-48ca-b043-683284909dc0' AND counted AND outcome = 'attended')
    OR (id = 'd0c3abe3-e7f9-4041-8b9c-7a3ac0939595' AND session_date = '2026-07-20' AND bundle_id = '46623fd2-4245-48ca-b043-683284909dc0' AND counted AND outcome = 'attended')
    OR (id = '7e600562-0e9b-4051-9c12-03a70f2a2663' AND session_date = '2026-07-27' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'daab4e5e-9eb7-4eb0-b137-4c975f809769' AND session_date = '2026-08-03' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = '797928ad-03fa-48bd-83cc-b6de799a12cf' AND session_date = '2026-08-10' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'c049756a-34e4-4187-b195-32e975afd8d7' AND session_date = '2026-08-17' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = '553df638-5f81-4725-916d-cc1b165e4e34' AND session_date = '2026-08-24' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
     );

  SELECT count(*) INTO v_post_sessions FROM student_class_sessions
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
     AND (
       (id = '2f5b6e0a-0706-4e1a-8c6a-a7bc3da79216' AND session_date = '2026-07-06' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'fe4b698d-1855-447c-bac1-035487688ee0' AND session_date = '2026-07-13' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = 'd0c3abe3-e7f9-4041-8b9c-7a3ac0939595' AND session_date = '2026-07-20' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = '7e600562-0e9b-4051-9c12-03a70f2a2663' AND session_date = '2026-07-27' AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted AND outcome = 'attended')
    OR (id = '553df638-5f81-4725-916d-cc1b165e4e34' AND session_date = '2026-08-24' AND bundle_id = '46623fd2-4245-48ca-b043-683284909dc0' AND counted AND outcome = 'attended')
     );

  SELECT count(*) INTO v_total_sessions FROM student_class_sessions
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc';

  IF NOT ((v_pre_sessions = 7 AND v_total_sessions = 7) OR (v_post_sessions = 5 AND v_total_sessions = 5)) THEN
    RAISE EXCEPTION 'mariam_correction_guard: student 5249236a session rows do not match the reviewed pre-state (7 rows) or post-state (5 rows) exactly -- pre_match=%, post_match=%, total=%. Changed since review -- aborting, nothing touched.',
      v_pre_sessions, v_post_sessions, v_total_sessions;
  END IF;
END;
$guard$;

-- ---------------------------------------------------------------------------
-- APPLY: every statement is independently idempotent via its own WHERE clause
-- or NOT EXISTS check, so a second run of an already-applied statement is a
-- true no-op, not an error.
-- ---------------------------------------------------------------------------

-- The one student_bundles write. Also records provenance in `note`, which the
-- audit trigger picks up into student_bundle_edits.changes alongside edited_by.
UPDATE student_bundles
   SET coverage_start = '2026-08-24',
       coverage_start_confirmed_at = now(),
       note = 'Coverage start corrected 2026-07-12 -> 2026-08-24 by migration 20260826110000_mariam_bundle_session_correction.sql, authorised by Re (admin@klovers.com). Completes the session reattribution she began in the Edit-bundle dialog; applied here rather than through the UI because it moves session rows across two bundles at once.'
 WHERE id = '46623fd2-4245-48ca-b043-683284909dc0'
   AND status = 'active'
   AND coverage_start = '2026-07-12';

-- Move 13 & 20 July onto the July bundle.
UPDATE student_class_sessions
   SET bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912'
 WHERE id = 'fe4b698d-1855-447c-bac1-035487688ee0'
   AND bundle_id = '46623fd2-4245-48ca-b043-683284909dc0';

UPDATE student_class_sessions
   SET bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912'
 WHERE id = 'd0c3abe3-e7f9-4041-8b9c-7a3ac0939595'
   AND bundle_id = '46623fd2-4245-48ca-b043-683284909dc0';

-- Move 24 August onto the August bundle.
UPDATE student_class_sessions
   SET bundle_id = '46623fd2-4245-48ca-b043-683284909dc0'
 WHERE id = '553df638-5f81-4725-916d-cc1b165e4e34'
   AND bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912';

-- Remove the 3 sessions Re confirmed never happened -- generated from the weekly
-- schedule for dates with no class.
DELETE FROM student_class_sessions
 WHERE id = 'daab4e5e-9eb7-4eb0-b137-4c975f809769'
   AND session_date = '2026-08-03';

DELETE FROM student_class_sessions
 WHERE id = '797928ad-03fa-48bd-83cc-b6de799a12cf'
   AND session_date = '2026-08-10';

DELETE FROM student_class_sessions
 WHERE id = 'c049756a-34e4-4187-b195-32e975afd8d7'
   AND session_date = '2026-08-17';

-- Backfill the 6 July class -- never logged as a session row because the weekly
-- class had already been deleted by the time this correction happened. Fixed id,
-- not gen_random_uuid(), so a re-run of this file cannot insert it twice.
INSERT INTO student_class_sessions
       (id, student_id, bundle_id, class_id, session_date, start_time, outcome, counted, confirmed_at, note, entry_source)
SELECT '2f5b6e0a-0706-4e1a-8c6a-a7bc3da79216', '5249236a-5d6c-44c1-899a-7aeece38cfdc',
       'a7bc3da7-9216-441d-be1a-07730a2da912', NULL, '2026-07-06', '19:00:00',
       'attended', true, now(),
       'Backfilled by migration 20260826110000_mariam_bundle_session_correction.sql: the weekly class row was deleted before this session was ever logged. Authorised by Re (admin@klovers.com).',
       'manual'
WHERE NOT EXISTS (
  SELECT 1 FROM student_class_sessions WHERE id = '2f5b6e0a-0706-4e1a-8c6a-a7bc3da79216'
);

-- Restore the weekly class row. Fixed id for the same idempotency reason. Matches
-- the timezone convention used by every other row in this table (Asia/Kuala_Lumpur,
-- the column default) rather than inventing a different value here.
INSERT INTO teacher_student_classes
       (id, student_id, weekday, start_time, duration_minutes, timezone, effective_from, effective_to, note)
SELECT '1c1a5500-0706-4e1a-8c6a-5249236a5d6c', '5249236a-5d6c-44c1-899a-7aeece38cfdc',
       1, '19:00:00', 90, 'Asia/Kuala_Lumpur', '2026-07-06', NULL,
       'Restored by migration 20260826110000_mariam_bundle_session_correction.sql after the row was deleted. Authorised by Re (admin@klovers.com).'
WHERE NOT EXISTS (
  SELECT 1 FROM teacher_student_classes WHERE id = '1c1a5500-0706-4e1a-8c6a-5249236a5d6c'
);

-- ---------------------------------------------------------------------------
-- VERIFY: assert the exact end state before committing. Any mismatch rolls
-- back everything above.
-- ---------------------------------------------------------------------------
DO $verify$
DECLARE
  v_bundle1_used int;
  v_bundle2_used int;
  v_total        int;
  v_weekly_count int;
BEGIN
  SELECT count(*) INTO v_bundle1_used FROM student_class_sessions
   WHERE bundle_id = 'a7bc3da7-9216-441d-be1a-07730a2da912' AND counted;

  SELECT count(*) INTO v_bundle2_used FROM student_class_sessions
   WHERE bundle_id = '46623fd2-4245-48ca-b043-683284909dc0' AND counted;

  SELECT count(*) INTO v_total FROM student_class_sessions
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc';

  SELECT count(*) INTO v_weekly_count FROM teacher_student_classes
   WHERE student_id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
     AND weekday = 1 AND start_time = '19:00:00' AND duration_minutes = 90
     AND effective_from = '2026-07-06';

  IF v_bundle1_used <> 4 OR v_bundle2_used <> 1 OR v_total <> 5 OR v_weekly_count <> 1 THEN
    RAISE EXCEPTION 'mariam_correction_verify: end state mismatch -- bundle1_used=% (want 4), bundle2_used=% (want 1), total_sessions=% (want 5), weekly_rows=% (want 1). Rolling back.',
      v_bundle1_used, v_bundle2_used, v_total, v_weekly_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM student_bundles sb
    WHERE sb.id IN ('a7bc3da7-9216-441d-be1a-07730a2da912', '46623fd2-4245-48ca-b043-683284909dc0')
      AND (
        SELECT count(*) FROM student_class_sessions scs
         WHERE scs.bundle_id = sb.id AND scs.counted
      ) > sb.total_classes
  ) THEN
    RAISE EXCEPTION 'mariam_correction_verify: a negative balance exists on one of these two bundles after applying. Rolling back.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM student_bundles
     WHERE id = '46623fd2-4245-48ca-b043-683284909dc0' AND coverage_start = '2026-08-24'
  ) THEN
    RAISE EXCEPTION 'mariam_correction_verify: bundle 46623fd2 coverage_start did not end at 2026-08-24. Rolling back.';
  END IF;
END;
$verify$;

COMMIT;
