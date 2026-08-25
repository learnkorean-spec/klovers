-- Bundle management: edit, void/delete, coverage_start, and an audit trail.
--
-- Triggered by real production data: a student had a 4-class bundle
-- overrun to -1 (an accidental duplicate bundle sitting at zero sessions
-- beside it) with no way to correct any of it and no way to see the -1
-- anywhere but the active bundle's own card. This migration gives Re the
-- tools; it does not touch her rows. The duplicate bundle, the -1 balance
-- and the misattributed sessions are fixed later, by her, once these ship.
--
-- Four things, in dependency order:
--   1. coverage_start -- which date a bundle starts covering, so a session
--      can be attributed to the bundle that was actually current on its
--      date instead of "whichever bundle happens to be active right now".
--      Backfilled from purchased_on for existing rows, and marked
--      unreviewed -- see the comment on coverage_start_confirmed_at below,
--      this is deliberately not allowed to look like a fact nobody checked.
--   2. voided_reason / voided_at -- so a bundle with sessions on it can be
--      voided (kept, flagged, explained) instead of deleted.
--   3. bundle_id: ON DELETE CASCADE -> ON DELETE RESTRICT -- the actual
--      guarantee behind "a bundle with sessions cannot be deleted". A
--      constraint, not a trigger: referential integrity is exactly what a
--      foreign key is for, and unlike a trigger it cannot be bypassed by
--      any write path, including one that goes around the app entirely.
--   4. student_bundle_edits -- every UPDATE on student_bundles writes what
--      changed, when, and who changed it. SECURITY DEFINER so its own
--      INSERT is not itself subject to the RLS that keeps everyone else out
--      of this table; auth.uid() is required, not best-effort, so an edit
--      with no identifiable admin is refused rather than half-logged.

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Refuse to adopt somebody else's table, same guard as every migration
--    before this one in this schema.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.student_bundles') IS NULL THEN
    RAISE EXCEPTION 'missing_table: public.student_bundles does not exist. This migration depends on 20260823090100.'
      USING ERRCODE = '42P01';
  END IF;
  IF to_regclass('public.student_class_sessions') IS NULL THEN
    RAISE EXCEPTION 'missing_table: public.student_class_sessions does not exist. This migration depends on 20260823090100.'
      USING ERRCODE = '42P01';
  END IF;
  IF to_regclass('public.student_bundle_edits') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'student_bundle_edits' AND column_name = 'changes'
     ) THEN
    RAISE EXCEPTION 'name_collision: public.student_bundle_edits already exists and is not the table this migration creates. Refusing to adopt it.'
      USING ERRCODE = '42P07';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 1. coverage_start.
--
-- One date per bundle: the first day it covers. A session's bundle is
-- resolved by matching its date into whichever bundle's coverage_start is
-- the latest one on or before that date -- read in the application, not
-- computed here; nothing in this migration changes how a session is written.
--
-- coverage_start_confirmed_at is the whole point of this addition. Today's
-- entry_source lesson: a system-filled value that looks exactly like one a
-- person chose is how the effective_from bug went unnoticed all day.
-- NULL means "backfilled from purchased_on, nobody has looked at it yet".
-- It is set the moment the bundle is saved through the edit dialog -- not
-- because the date necessarily changed, but because saving means she saw
-- the field. Nothing except this migration's own one-time backfill below
-- is allowed to leave it null.
-- ---------------------------------------------------------------------------
ALTER TABLE public.student_bundles
  ADD COLUMN IF NOT EXISTS coverage_start date,
  ADD COLUMN IF NOT EXISTS coverage_start_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS voided_reason text,
  ADD COLUMN IF NOT EXISTS voided_at timestamptz;

-- One-time backfill for rows that predate this column. Deliberately leaves
-- coverage_start_confirmed_at null -- these are exactly the values nobody
-- has reviewed, which is the fact the marker exists to preserve.
UPDATE public.student_bundles
   SET coverage_start = purchased_on
 WHERE coverage_start IS NULL;

ALTER TABLE public.student_bundles
  ALTER COLUMN coverage_start SET NOT NULL;

COMMENT ON COLUMN public.student_bundles.coverage_start IS
  'The first date this bundle covers. A session on date D belongs to whichever '
  'of a student''s bundles has the latest coverage_start on or before D. '
  'Backfilled from purchased_on for pre-existing rows -- see '
  'coverage_start_confirmed_at for whether that backfill has been reviewed.';
COMMENT ON COLUMN public.student_bundles.coverage_start_confirmed_at IS
  'NULL means coverage_start was filled in automatically and nobody has '
  'confirmed it is right -- an unreviewed system guess must never be '
  'indistinguishable from a date Re actually chose. Set to now() whenever the '
  'bundle is saved through the edit dialog, which is the only UI that shows '
  'this field. Never set by a migration or backfill.';

-- A bundle is voided (status = cancelled) if and only if it carries a reason.
-- Prevents both a silent cancel (no reason recorded) and an orphaned reason
-- on a bundle that isn't actually cancelled.
ALTER TABLE public.student_bundles
  DROP CONSTRAINT IF EXISTS student_bundles_voided_reason_check;
ALTER TABLE public.student_bundles
  ADD CONSTRAINT student_bundles_voided_reason_check
  CHECK ((status = 'cancelled') = (voided_reason IS NOT NULL));

COMMENT ON COLUMN public.student_bundles.voided_reason IS
  'Why this bundle was voided rather than deleted -- required whenever '
  'status is cancelled, and only then. A bundle with sessions on it cannot '
  'be deleted (see the bundle_id foreign key below); voiding is the '
  'alternative that keeps the row and its history visible.';

CREATE INDEX IF NOT EXISTS idx_student_bundles_student_coverage
  ON public.student_bundles (student_id, coverage_start);

-- ---------------------------------------------------------------------------
-- 2. bundle_id: CASCADE -> RESTRICT.
--
-- Found while planning this migration, not something any code relied on:
-- nothing in this codebase has ever deleted a bundle (grepped the whole
-- app -- useAddBundle only inserts, useUpdateBundle only updates, no edge
-- function touches student_bundles at all). The CASCADE has never fired.
-- But the delete button this migration exists to support was about to be
-- built directly on top of it, which would have silently destroyed a
-- bundle's confirmed-session history the first time anyone used it.
--
-- Looked up by matching the FK definition rather than assuming the
-- Postgres-generated name, consistent with this schema's rule that local
-- migration files and the live database do not always agree on names.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_conname text;
BEGIN
  SELECT c.conname INTO v_conname
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
   WHERE c.contype = 'f'
     AND c.conrelid = 'public.student_class_sessions'::regclass
     AND c.confrelid = 'public.student_bundles'::regclass
     AND a.attname = 'bundle_id';

  IF v_conname IS NULL THEN
    RAISE EXCEPTION 'missing_constraint: no foreign key from student_class_sessions.bundle_id to student_bundles was found. Investigate before proceeding.'
      USING ERRCODE = '42704';
  END IF;

  EXECUTE format('ALTER TABLE public.student_class_sessions DROP CONSTRAINT %I', v_conname);
  ALTER TABLE public.student_class_sessions
    ADD CONSTRAINT student_class_sessions_bundle_id_fkey
    FOREIGN KEY (bundle_id) REFERENCES public.student_bundles(id) ON DELETE RESTRICT;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. The audit trail.
--
-- One row per UPDATE that actually changes something, diffing only the
-- columns that changed -- old value, new value, when, and who. SECURITY
-- DEFINER so the trigger's own INSERT is not blocked by the RLS that keeps
-- everyone else out of this table (see the policy below): the only way a
-- row appears here is through this trigger firing on a real edit.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_bundle_edits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id  uuid NOT NULL REFERENCES public.student_bundles(id) ON DELETE CASCADE,
  edited_at  timestamptz NOT NULL DEFAULT now(),
  edited_by  uuid NOT NULL,
  changes    jsonb NOT NULL
);

COMMENT ON TABLE public.student_bundle_edits IS
  'Audit trail for student_bundles: one row per UPDATE that changed something, '
  'written only by trg_student_bundles_audit. changes holds {"column": '
  '{"old": ..., "new": ...}} for exactly the columns that changed -- never a '
  'full-row snapshot, so a diff is readable at a glance.';
COMMENT ON COLUMN public.student_bundle_edits.edited_by IS
  'auth.uid() at the moment of the edit. NOT NULL is enforced by the trigger '
  'raising rather than inserting when there is no authenticated caller -- an '
  'edit with no identifiable admin is refused, not recorded without one.';

CREATE INDEX IF NOT EXISTS idx_student_bundle_edits_bundle
  ON public.student_bundle_edits (bundle_id, edited_at DESC);

ALTER TABLE public.student_bundle_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read student_bundle_edits" ON public.student_bundle_edits;
CREATE POLICY "Admins read student_bundle_edits"
  ON public.student_bundle_edits
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- No INSERT/UPDATE/DELETE policy for any role: the only writer is the
-- SECURITY DEFINER trigger function below, which runs as its owner and so
-- is unaffected by RLS. Nobody -- including an admin -- can hand-edit the
-- audit trail through PostgREST.

CREATE OR REPLACE FUNCTION public.tg_student_bundles_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_changes jsonb := '{}'::jsonb;
  v_uid uuid := auth.uid();
BEGIN
  -- Only the columns an edit can actually change. created_at/updated_at are
  -- bookkeeping, not something anyone "edited"; the touch trigger already
  -- covers updated_at.
  IF NEW.label IS DISTINCT FROM OLD.label THEN
    v_changes := v_changes || jsonb_build_object('label', jsonb_build_object('old', OLD.label, 'new', NEW.label));
  END IF;
  IF NEW.source IS DISTINCT FROM OLD.source THEN
    v_changes := v_changes || jsonb_build_object('source', jsonb_build_object('old', OLD.source, 'new', NEW.source));
  END IF;
  IF NEW.catalog_key IS DISTINCT FROM OLD.catalog_key THEN
    v_changes := v_changes || jsonb_build_object('catalog_key', jsonb_build_object('old', OLD.catalog_key, 'new', NEW.catalog_key));
  END IF;
  IF NEW.total_classes IS DISTINCT FROM OLD.total_classes THEN
    v_changes := v_changes || jsonb_build_object('total_classes', jsonb_build_object('old', OLD.total_classes, 'new', NEW.total_classes));
  END IF;
  IF NEW.total_price IS DISTINCT FROM OLD.total_price THEN
    v_changes := v_changes || jsonb_build_object('total_price', jsonb_build_object('old', OLD.total_price, 'new', NEW.total_price));
  END IF;
  IF NEW.currency IS DISTINCT FROM OLD.currency THEN
    v_changes := v_changes || jsonb_build_object('currency', jsonb_build_object('old', OLD.currency, 'new', NEW.currency));
  END IF;
  IF NEW.purchased_on IS DISTINCT FROM OLD.purchased_on THEN
    v_changes := v_changes || jsonb_build_object('purchased_on', jsonb_build_object('old', OLD.purchased_on, 'new', NEW.purchased_on));
  END IF;
  IF NEW.coverage_start IS DISTINCT FROM OLD.coverage_start THEN
    v_changes := v_changes || jsonb_build_object('coverage_start', jsonb_build_object('old', OLD.coverage_start, 'new', NEW.coverage_start));
  END IF;
  IF NEW.coverage_start_confirmed_at IS DISTINCT FROM OLD.coverage_start_confirmed_at THEN
    v_changes := v_changes || jsonb_build_object('coverage_start_confirmed_at', jsonb_build_object('old', OLD.coverage_start_confirmed_at, 'new', NEW.coverage_start_confirmed_at));
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
  END IF;
  IF NEW.voided_reason IS DISTINCT FROM OLD.voided_reason THEN
    v_changes := v_changes || jsonb_build_object('voided_reason', jsonb_build_object('old', OLD.voided_reason, 'new', NEW.voided_reason));
  END IF;
  IF NEW.note IS DISTINCT FROM OLD.note THEN
    v_changes := v_changes || jsonb_build_object('note', jsonb_build_object('old', OLD.note, 'new', NEW.note));
  END IF;

  -- A save that touched nothing (e.g. re-submitting the form unchanged)
  -- writes no audit row -- there is nothing to record.
  IF v_changes = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unattributed_edit: student_bundles % changed with no authenticated caller (auth.uid() is null). An audit trail that cannot name who made a change is refused, not recorded.', NEW.id
      USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.student_bundle_edits (bundle_id, edited_by, changes)
  VALUES (NEW.id, v_uid, v_changes);

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_student_bundles_audit ON public.student_bundles;
CREATE TRIGGER trg_student_bundles_audit
  AFTER UPDATE ON public.student_bundles
  FOR EACH ROW EXECUTE FUNCTION public.tg_student_bundles_audit();

REVOKE ALL ON FUNCTION public.tg_student_bundles_audit() FROM PUBLIC;

COMMIT;
