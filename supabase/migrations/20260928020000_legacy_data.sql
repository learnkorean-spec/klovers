-- Legacy Data: historical Klovers students, sessions and money, 2022-2025.
--
-- Why separate legacy_* tables and not the live 1:1 tables
-- ---------------------------------------------------------
-- The live system (teacher_students -> student_bundles -> student_class_sessions)
-- has behaviour attached that must never fire for history:
--   * trg_auto_send_bundle_payment_ask emails the student when an unpaid bundle
--     is inserted;
--   * trg_roll_bundle_when_overdrawn opens new bundles by itself;
--   * a linked student can read her own rows (is_own_teacher_student), so old
--     years would appear on her dashboard;
--   * student_class_sessions.session_date / start_time are NOT NULL, and the
--     legacy records have no dates -- storing them there would mean inventing
--     dates.
-- profiles cannot hold a person without an auth account (user_id NOT NULL).
-- So history lives here: admin-only, read-mostly, never emailed, never shown to
-- students, and linked to a real account only by an explicit admin action.
--
-- What is deliberately NOT here
-- -----------------------------
--   * No auth users, no emails, no fake addresses. auth_user_id is NULL until an
--     admin links a registered account.
--   * No dates. A monthly record carries the month as written in the source and
--     the calendar year the admin chose for that month at import time.
--   * No "paid" derived from attendance. session_charges = counted sessions x
--     price; recorded_paid comes only from a payment column in the source.
--   * No stored balance computed by us. source_balance is the balance the old
--     sheet itself stated, shown as such.
--
-- Import flow (all through the admin-only functions below)
--   workbook -> parsed once in the admin's browser -> fn_legacy_stage_batch
--   (dry run, report) -> admin approves -> fn_legacy_commit_batch.
--   Every row has a deterministic source_key; commit inserts ON CONFLICT DO
--   NOTHING, so running the same import twice adds nothing.
--
-- Rollback: fn_legacy_rollback_batch removes exactly one batch's rows. Dropping
-- the legacy_* objects removes the feature; no existing table is altered.

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Refuse to adopt somebody else's objects.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'legacy_import_batches', 'legacy_import_staging', 'legacy_students',
    'legacy_year_aggregates', 'legacy_monthly_records', 'legacy_issues'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = t AND column_name = 'legacy_marker'
       ) THEN
      RAISE EXCEPTION
        'name_collision: public.% already exists and is not a table this migration creates. Refusing to adopt it.', t
        USING ERRCODE = '42P07';
    END IF;
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 1. Import batches.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legacy_import_batches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_marker   boolean NOT NULL DEFAULT true,
  source_file     text NOT NULL,
  file_sha256     text NOT NULL,
  month_year_map  jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'staged',
  summary         jsonb NOT NULL DEFAULT '{}'::jsonb,
  commit_result   jsonb,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  committed_by    uuid,
  committed_at    timestamptz,
  rolled_back_by  uuid,
  rolled_back_at  timestamptz,
  CONSTRAINT legacy_import_batches_status_check
    CHECK (status IN ('staged', 'committed', 'rolled_back', 'discarded')),
  CONSTRAINT legacy_import_batches_sha_check
    CHECK (file_sha256 ~ '^[0-9a-f]{64}$')
);

-- One live (staged or committed) batch per file. A second upload of the same
-- workbook replaces the staged one or is refused if it is already committed.
CREATE UNIQUE INDEX IF NOT EXISTS legacy_import_batches_live_file_uidx
  ON public.legacy_import_batches (file_sha256)
  WHERE status IN ('staged', 'committed');

COMMENT ON TABLE public.legacy_import_batches IS
  'One row per upload of a legacy workbook. staged = dry run only; committed = rows written; '
  'rolled_back / discarded = removed. month_year_map is the calendar year the admin chose for each month label.';

-- ---------------------------------------------------------------------------
-- 2. Staging: the parsed workbook, waiting for approval.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legacy_import_staging (
  batch_id       uuid NOT NULL REFERENCES public.legacy_import_batches(id) ON DELETE CASCADE,
  legacy_marker  boolean NOT NULL DEFAULT true,
  entity         text NOT NULL,
  source_key     text NOT NULL,
  payload        jsonb NOT NULL,
  PRIMARY KEY (batch_id, entity, source_key),
  CONSTRAINT legacy_import_staging_entity_check
    CHECK (entity IN ('student', 'aggregate', 'monthly', 'issue'))
);

-- ---------------------------------------------------------------------------
-- 3. Legacy students. Identity only; no auth, no email.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legacy_students (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_marker         boolean NOT NULL DEFAULT true,
  display_name          text NOT NULL,
  name_key              text NOT NULL,
  original_names        text[] NOT NULL DEFAULT '{}',
  auth_user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_at             timestamptz,
  linked_by             uuid,
  note                  text,
  source_type           text NOT NULL DEFAULT 'legacy_import',
  source_file           text,
  source_sheet          text,
  source_row            integer,
  original_student_name text,
  import_batch_id       uuid REFERENCES public.legacy_import_batches(id) ON DELETE RESTRICT,
  imported_at           timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT legacy_students_name_check CHECK (length(btrim(display_name)) > 0),
  CONSTRAINT legacy_students_name_key_check CHECK (length(name_key) > 0),
  CONSTRAINT legacy_students_link_check
    CHECK ((auth_user_id IS NULL) = (linked_at IS NULL))
);

-- name_key is the normalised Master Student Summary name. Exact match only --
-- no fuzzy merging. "Naila" and "Naira" are two keys and stay two students.
CREATE UNIQUE INDEX IF NOT EXISTS legacy_students_name_key_uidx
  ON public.legacy_students (name_key);
-- One registered account can be linked to at most one legacy student.
CREATE UNIQUE INDEX IF NOT EXISTS legacy_students_auth_user_uidx
  ON public.legacy_students (auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS legacy_students_batch_idx
  ON public.legacy_students (import_batch_id);

COMMENT ON TABLE public.legacy_students IS
  'Historical students 2022-2025. May exist with no account and no email. auth_user_id is set only by '
  'fn_legacy_link_account (an explicit admin action), never by name matching.';

-- ---------------------------------------------------------------------------
-- 4. Yearly aggregates -- where only a yearly total exists.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legacy_year_aggregates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_marker      boolean NOT NULL DEFAULT true,
  source_key         text NOT NULL,
  legacy_student_id  uuid NOT NULL REFERENCES public.legacy_students(id) ON DELETE RESTRICT,
  year               smallint NOT NULL,
  kind               text NOT NULL,
  counted_sessions   integer NOT NULL DEFAULT 0,
  session_value      numeric(12,2) NOT NULL DEFAULT 0,
  price_per_session  numeric(12,2),
  price_source       text NOT NULL,
  late_unresolved    integer NOT NULL DEFAULT 0,
  recorded_paid      numeric(12,2),
  currency           text NOT NULL DEFAULT 'EGP',
  source_type        text NOT NULL DEFAULT 'legacy_import',
  source_file        text,
  source_sheet       text,
  source_row         integer,
  import_batch_id    uuid REFERENCES public.legacy_import_batches(id) ON DELETE RESTRICT,
  imported_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT legacy_year_aggregates_year_check CHECK (year BETWEEN 2015 AND 2100),
  -- yearly_total counts toward totals. master_check is the Master sheet's own
  -- total for a year that also has detailed monthly records: kept for
  -- validation, never added to totals (that would count the same sessions twice).
  CONSTRAINT legacy_year_aggregates_kind_check CHECK (kind IN ('yearly_total', 'master_check')),
  CONSTRAINT legacy_year_aggregates_price_source_check
    CHECK (price_source IN ('explicit', 'legacy_default', 'mixed')),
  CONSTRAINT legacy_year_aggregates_nonneg_check
    CHECK (counted_sessions >= 0 AND session_value >= 0 AND late_unresolved >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS legacy_year_aggregates_source_key_uidx
  ON public.legacy_year_aggregates (source_key);
CREATE INDEX IF NOT EXISTS legacy_year_aggregates_student_idx
  ON public.legacy_year_aggregates (legacy_student_id, year);

-- ---------------------------------------------------------------------------
-- 5. Monthly records -- detailed source rows (one student, one month).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legacy_monthly_records (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_marker          boolean NOT NULL DEFAULT true,
  source_key             text NOT NULL,
  legacy_student_id      uuid NOT NULL REFERENCES public.legacy_students(id) ON DELETE RESTRICT,
  record_kind            text NOT NULL,
  month_label            text NOT NULL,
  month                  smallint,
  year                   smallint,
  price_per_class        numeric(12,2),
  price_source           text,
  present_count          integer,
  late_count             integer NOT NULL DEFAULT 0,
  session_charges        numeric(12,2),
  source_session_charges numeric(12,2),
  recorded_paid          numeric(12,2),
  source_balance         numeric(12,2),
  raw_statuses           text[] NOT NULL DEFAULT '{}',
  currency               text NOT NULL DEFAULT 'EGP',
  excluded               boolean NOT NULL DEFAULT false,
  exclude_reason         text,
  original_student_name  text,
  origin_file            text,
  origin_row             integer,
  source_type            text NOT NULL DEFAULT 'legacy_import',
  source_file            text,
  source_sheet           text,
  source_row             integer,
  import_batch_id        uuid REFERENCES public.legacy_import_batches(id) ON DELETE RESTRICT,
  imported_at            timestamptz NOT NULL DEFAULT now(),
  -- session_month: attendance + price for that month. finance_only: a payment
  -- row with no attendance (the 2024 finance workbook).
  CONSTRAINT legacy_monthly_records_kind_check CHECK (record_kind IN ('session_month', 'finance_only')),
  CONSTRAINT legacy_monthly_records_month_check CHECK (month IS NULL OR month BETWEEN 1 AND 12),
  CONSTRAINT legacy_monthly_records_year_check CHECK (year IS NULL OR year BETWEEN 2015 AND 2100),
  CONSTRAINT legacy_monthly_records_price_source_check
    CHECK (price_source IS NULL OR price_source IN ('explicit', 'legacy_default')),
  CONSTRAINT legacy_monthly_records_excluded_check
    CHECK (NOT excluded OR exclude_reason IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS legacy_monthly_records_source_key_uidx
  ON public.legacy_monthly_records (source_key);
CREATE INDEX IF NOT EXISTS legacy_monthly_records_student_idx
  ON public.legacy_monthly_records (legacy_student_id, year, month);

COMMENT ON COLUMN public.legacy_monthly_records.session_charges IS
  'present_count x price_per_class, recalculated. Session VALUE, not money received.';
COMMENT ON COLUMN public.legacy_monthly_records.recorded_paid IS
  'Amount the source sheet records as paid. The only payment figure; never derived from attendance.';
COMMENT ON COLUMN public.legacy_monthly_records.source_balance IS
  'Balance as the old sheet stated it. Shown as a source figure, not recomputed.';

-- ---------------------------------------------------------------------------
-- 6. Review queue.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legacy_issues (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_marker      boolean NOT NULL DEFAULT true,
  dedupe_key         text NOT NULL,
  category           text NOT NULL,
  status             text NOT NULL DEFAULT 'open',
  legacy_student_id  uuid REFERENCES public.legacy_students(id) ON DELETE RESTRICT,
  student_label      text,
  year               smallint,
  month_label        text,
  source_file        text,
  source_sheet       text,
  source_row         integer,
  problem            text NOT NULL,
  suggested_action   text,
  resolution_note    text,
  resolved_by        uuid,
  resolved_at        timestamptz,
  import_batch_id    uuid REFERENCES public.legacy_import_batches(id) ON DELETE RESTRICT,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT legacy_issues_category_check CHECK (category IN (
    'ambiguous_student', 'unknown_attendance_value', 'missing_price', 'broken_source_formula',
    'potential_duplicate', 'unlinked_account', 'finance_conflict', 'other')),
  CONSTRAINT legacy_issues_status_check CHECK (status IN ('open', 'resolved', 'ignored'))
);
CREATE UNIQUE INDEX IF NOT EXISTS legacy_issues_dedupe_uidx ON public.legacy_issues (dedupe_key);
CREATE INDEX IF NOT EXISTS legacy_issues_status_idx ON public.legacy_issues (status, category);

-- ---------------------------------------------------------------------------
-- 7. updated_at for legacy_students.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_legacy_students_touch()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_legacy_students_touch ON public.legacy_students;
CREATE TRIGGER trg_legacy_students_touch
  BEFORE UPDATE ON public.legacy_students
  FOR EACH ROW EXECUTE FUNCTION public.tg_legacy_students_touch();

-- ---------------------------------------------------------------------------
-- 8. RLS: admin only. No anon, no student, no public read.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'legacy_import_batches', 'legacy_import_staging', 'legacy_students',
    'legacy_year_aggregates', 'legacy_monthly_records', 'legacy_issues'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins manage %s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "Admins manage %s" ON public.%I FOR ALL TO authenticated '
      'USING (public.has_role((SELECT auth.uid()), ''admin''::public.app_role)) '
      'WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::public.app_role))', t, t);
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 9. Read models (security_invoker: the caller's RLS applies, so admin only).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.legacy_facts
WITH (security_invoker = true) AS
  SELECT a.legacy_student_id, a.year, a.counted_sessions AS sessions,
         a.session_value AS value, a.recorded_paid AS paid, a.late_unresolved AS late,
         'aggregate'::text AS origin
    FROM public.legacy_year_aggregates a
   WHERE a.kind = 'yearly_total'
  UNION ALL
  SELECT m.legacy_student_id, m.year, COALESCE(m.present_count, 0),
         COALESCE(m.session_charges, 0), m.recorded_paid, m.late_count,
         'monthly'::text
    FROM public.legacy_monthly_records m
   WHERE NOT m.excluded;

CREATE OR REPLACE VIEW public.legacy_student_summary
WITH (security_invoker = true) AS
  SELECT s.id, s.display_name, s.name_key, s.original_names, s.auth_user_id, s.linked_at,
         p.name  AS linked_name,
         p.email AS linked_email,
         COALESCE((SELECT array_agg(DISTINCT f.year ORDER BY f.year)
                     FROM public.legacy_facts f
                    WHERE f.legacy_student_id = s.id AND f.year IS NOT NULL
                      AND (f.sessions > 0 OR COALESCE(f.paid, 0) > 0)), '{}') AS years_active,
         COALESCE(SUM(f.sessions) FILTER (WHERE f.year = 2022), 0)::int AS sessions_2022,
         COALESCE(SUM(f.sessions) FILTER (WHERE f.year = 2023), 0)::int AS sessions_2023,
         COALESCE(SUM(f.sessions) FILTER (WHERE f.year = 2024), 0)::int AS sessions_2024,
         COALESCE(SUM(f.sessions) FILTER (WHERE f.year = 2025), 0)::int AS sessions_2025,
         COALESCE(SUM(f.sessions), 0)::int AS total_sessions,
         COALESCE(SUM(f.value), 0)::numeric(12,2) AS historical_value,
         SUM(f.paid)::numeric(12,2) AS recorded_paid,
         COALESCE(SUM(f.late), 0)::int AS late_unresolved,
         (SELECT count(*) FROM public.legacy_issues i
           WHERE i.legacy_student_id = s.id AND i.status = 'open')::int AS open_issues
    FROM public.legacy_students s
    LEFT JOIN public.legacy_facts f ON f.legacy_student_id = s.id
    LEFT JOIN public.profiles p ON p.user_id = s.auth_user_id
   GROUP BY s.id, p.name, p.email;

CREATE OR REPLACE VIEW public.legacy_year_summary
WITH (security_invoker = true) AS
  SELECT f.year,
         count(DISTINCT f.legacy_student_id) FILTER (WHERE f.sessions > 0)::int AS unique_students,
         COALESCE(SUM(f.sessions), 0)::int AS counted_sessions,
         COALESCE(SUM(f.value), 0)::numeric(12,2) AS historical_value,
         SUM(f.paid)::numeric(12,2) AS recorded_paid,
         COALESCE(SUM(f.late), 0)::int AS late_unresolved,
         (SELECT count(*) FROM public.legacy_issues i
           WHERE i.year = f.year AND i.status = 'open')::int AS unresolved_records
    FROM public.legacy_facts f
   GROUP BY f.year;

REVOKE ALL ON public.legacy_facts, public.legacy_student_summary, public.legacy_year_summary FROM anon;
GRANT SELECT ON public.legacy_facts, public.legacy_student_summary, public.legacy_year_summary TO authenticated;

-- ---------------------------------------------------------------------------
-- 10. Admin guard used by every function below.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_legacy_require_admin()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = '42501';
  END IF;
  RETURN v_uid;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 11. Stage (dry run). Writes only to staging + the batch row.
--
-- p_payload = { students:[], aggregates:[], monthly:[], issues:[], meta:{} },
-- produced by src/lib/legacy/normalizeLegacyWorkbook.ts. Every element carries
-- its own source_key (issues: dedupe_key).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_legacy_stage_batch(
  p_source_file    text,
  p_file_sha256    text,
  p_month_year_map jsonb,
  p_payload        jsonb
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid     uuid := public.fn_legacy_require_admin();
  v_batch   uuid;
  v_done    uuid;
  v_report  jsonb;
BEGIN
  IF p_file_sha256 IS NULL OR p_file_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'bad_file_hash' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_done FROM public.legacy_import_batches
   WHERE file_sha256 = p_file_sha256 AND status = 'committed';
  IF v_done IS NOT NULL THEN
    RETURN jsonb_build_object('already_committed', true, 'batch_id', v_done);
  END IF;

  -- An earlier dry run of the same file is replaced, not duplicated.
  UPDATE public.legacy_import_batches SET status = 'discarded'
   WHERE file_sha256 = p_file_sha256 AND status = 'staged';
  DELETE FROM public.legacy_import_staging s
   USING public.legacy_import_batches b
   WHERE s.batch_id = b.id AND b.status = 'discarded';

  INSERT INTO public.legacy_import_batches (source_file, file_sha256, month_year_map, created_by)
  VALUES (p_source_file, p_file_sha256, COALESCE(p_month_year_map, '{}'::jsonb), v_uid)
  RETURNING id INTO v_batch;

  INSERT INTO public.legacy_import_staging (batch_id, entity, source_key, payload)
  SELECT v_batch, 'student', e->>'name_key', e
    FROM jsonb_array_elements(COALESCE(p_payload->'students', '[]')) e
  ON CONFLICT DO NOTHING;
  INSERT INTO public.legacy_import_staging (batch_id, entity, source_key, payload)
  SELECT v_batch, 'aggregate', e->>'source_key', e
    FROM jsonb_array_elements(COALESCE(p_payload->'aggregates', '[]')) e
  ON CONFLICT DO NOTHING;
  INSERT INTO public.legacy_import_staging (batch_id, entity, source_key, payload)
  SELECT v_batch, 'monthly', e->>'source_key', e
    FROM jsonb_array_elements(COALESCE(p_payload->'monthly', '[]')) e
  ON CONFLICT DO NOTHING;
  INSERT INTO public.legacy_import_staging (batch_id, entity, source_key, payload)
  SELECT v_batch, 'issue', e->>'dedupe_key', e
    FROM jsonb_array_elements(COALESCE(p_payload->'issues', '[]')) e
  ON CONFLICT DO NOTHING;

  -- Same exact name as a registered account or a current 1:1 student: raised
  -- for review only. Nothing is linked by name.
  INSERT INTO public.legacy_import_staging (batch_id, entity, source_key, payload)
  SELECT v_batch, 'issue', 'account_candidate:' || st.source_key,
         jsonb_build_object(
           'dedupe_key', 'account_candidate:' || st.source_key,
           'category', 'unlinked_account',
           'name_key', st.source_key,
           'student_label', st.payload->>'display_name',
           'problem', 'Same name as ' || cand.what || '. Not linked automatically.',
           'suggested_action', 'Open the student and use Link Account only if this is the same person.')
    FROM public.legacy_import_staging st
    CROSS JOIN LATERAL (
      SELECT string_agg(x, '; ') AS what FROM (
        SELECT 'registered account "' || p.name || '"' AS x
          FROM public.profiles p
         WHERE lower(btrim(p.name)) = st.source_key
        UNION ALL
        SELECT 'current 1:1 student "' || ts.full_name || '"'
          FROM public.teacher_students ts
         WHERE lower(btrim(ts.full_name)) = st.source_key
      ) q
    ) cand
   WHERE st.batch_id = v_batch AND st.entity = 'student' AND cand.what IS NOT NULL
  ON CONFLICT DO NOTHING;

  WITH
  stg AS (SELECT * FROM public.legacy_import_staging WHERE batch_id = v_batch),
  facts AS (
    SELECT (payload->>'year')::int AS year, payload->>'name_key' AS name_key,
           COALESCE((payload->>'counted_sessions')::int, 0) AS sessions,
           COALESCE((payload->>'session_value')::numeric, 0) AS value,
           (payload->>'recorded_paid')::numeric AS paid
      FROM stg WHERE entity = 'aggregate' AND payload->>'kind' = 'yearly_total'
    UNION ALL
    SELECT (payload->>'year')::int, payload->>'name_key',
           COALESCE((payload->>'present_count')::int, 0),
           COALESCE((payload->>'session_charges')::numeric, 0),
           (payload->>'recorded_paid')::numeric
      FROM stg WHERE entity = 'monthly' AND NOT COALESCE((payload->>'excluded')::boolean, false)
  )
  SELECT jsonb_build_object(
    'batch_id', v_batch,
    'students_detected',      (SELECT count(*) FROM stg WHERE entity = 'student'),
    'existing_legacy_students', (SELECT count(*) FROM stg JOIN public.legacy_students ls ON ls.name_key = stg.source_key WHERE stg.entity = 'student'),
    'new_legacy_students',    (SELECT count(*) FROM stg WHERE entity = 'student'
                                 AND NOT EXISTS (SELECT 1 FROM public.legacy_students ls WHERE ls.name_key = stg.source_key)),
    'existing_students_matched', (SELECT count(*) FROM stg WHERE entity = 'issue' AND payload->>'category' = 'unlinked_account'),
    'ambiguous_students',     (SELECT count(*) FROM stg WHERE entity = 'issue' AND payload->>'category' IN ('ambiguous_student', 'potential_duplicate')),
    'yearly_aggregates',      (SELECT count(*) FROM stg WHERE entity = 'aggregate' AND payload->>'kind' = 'yearly_total'),
    'master_check_rows',      (SELECT count(*) FROM stg WHERE entity = 'aggregate' AND payload->>'kind' = 'master_check'),
    'monthly_records',        (SELECT count(*) FROM stg WHERE entity = 'monthly'),
    'excluded_rows',          (SELECT count(*) FROM stg WHERE entity = 'monthly' AND COALESCE((payload->>'excluded')::boolean, false)),
    'explicit_prices',        (SELECT count(*) FROM stg WHERE entity = 'monthly' AND payload->>'price_source' = 'explicit'),
    'fallback_prices',        (SELECT count(*) FROM stg WHERE (entity = 'monthly' AND payload->>'price_source' = 'legacy_default')
                                                         OR (entity = 'aggregate' AND payload->>'price_source' = 'legacy_default')),
    'payment_rows',           (SELECT count(*) FROM stg WHERE entity = 'monthly' AND COALESCE((payload->>'recorded_paid')::numeric, 0) > 0
                                 AND NOT COALESCE((payload->>'excluded')::boolean, false)),
    'unresolved_records',     (SELECT count(*) FROM stg WHERE entity = 'issue'),
    'issues_by_category',     (SELECT COALESCE(jsonb_object_agg(c, n), '{}') FROM (
                                 SELECT payload->>'category' c, count(*) n FROM stg WHERE entity = 'issue' GROUP BY 1) q),
    'duplicates_merged_in_file', COALESCE((p_payload->'meta'->>'duplicates_merged')::int, 0),
    'duplicates_already_in_db', (
        (SELECT count(*) FROM stg JOIN public.legacy_year_aggregates a ON a.source_key = stg.source_key WHERE stg.entity = 'aggregate')
      + (SELECT count(*) FROM stg JOIN public.legacy_monthly_records m ON m.source_key = stg.source_key WHERE stg.entity = 'monthly')
      + (SELECT count(*) FROM stg JOIN public.legacy_issues i ON i.dedupe_key = stg.source_key WHERE stg.entity = 'issue')),
    'totals_by_year', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                          'year', year, 'students', students, 'sessions', sessions,
                          'value', value, 'recorded_paid', paid) ORDER BY year NULLS LAST), '[]')
                         FROM (SELECT year,
                                      count(DISTINCT name_key) FILTER (WHERE sessions > 0) students,
                                      sum(sessions) sessions, sum(value) value, sum(paid) paid
                                 FROM facts GROUP BY year) y),
    'month_year_map', p_month_year_map
  ) INTO v_report;

  UPDATE public.legacy_import_batches SET summary = v_report WHERE id = v_batch;
  RETURN v_report;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 12. Commit. Idempotent: every insert is ON CONFLICT DO NOTHING on a
-- deterministic key, so nothing already imported is duplicated or overwritten.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_legacy_commit_batch(p_batch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid    uuid := public.fn_legacy_require_admin();
  v_batch  public.legacy_import_batches%ROWTYPE;
  v_s int; v_a int; v_m int; v_i int;
  v_result jsonb;
BEGIN
  SELECT * INTO v_batch FROM public.legacy_import_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'batch_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_batch.status = 'committed' THEN
    RETURN jsonb_build_object('already_committed', true, 'batch_id', p_batch_id, 'result', v_batch.commit_result);
  END IF;
  IF v_batch.status <> 'staged' THEN
    RAISE EXCEPTION 'batch_not_staged: %', v_batch.status USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.legacy_students
    (display_name, name_key, original_names, source_file, source_sheet, source_row,
     original_student_name, import_batch_id)
  SELECT e.payload->>'display_name', e.source_key,
         COALESCE(ARRAY(SELECT jsonb_array_elements_text(e.payload->'original_names')), '{}'),
         v_batch.source_file, e.payload->>'source_sheet', (e.payload->>'source_row')::int,
         e.payload->>'original_student_name', p_batch_id
    FROM public.legacy_import_staging e
   WHERE e.batch_id = p_batch_id AND e.entity = 'student'
  ON CONFLICT (name_key) DO NOTHING;
  GET DIAGNOSTICS v_s = ROW_COUNT;

  INSERT INTO public.legacy_year_aggregates
    (source_key, legacy_student_id, year, kind, counted_sessions, session_value, price_per_session,
     price_source, late_unresolved, recorded_paid, source_file, source_sheet, source_row, import_batch_id)
  SELECT e.source_key, ls.id, (e.payload->>'year')::smallint, e.payload->>'kind',
         COALESCE((e.payload->>'counted_sessions')::int, 0),
         COALESCE((e.payload->>'session_value')::numeric, 0),
         (e.payload->>'price_per_session')::numeric,
         e.payload->>'price_source',
         COALESCE((e.payload->>'late_unresolved')::int, 0),
         (e.payload->>'recorded_paid')::numeric,
         v_batch.source_file, e.payload->>'source_sheet', (e.payload->>'source_row')::int, p_batch_id
    FROM public.legacy_import_staging e
    JOIN public.legacy_students ls ON ls.name_key = e.payload->>'name_key'
   WHERE e.batch_id = p_batch_id AND e.entity = 'aggregate'
  ON CONFLICT (source_key) DO NOTHING;
  GET DIAGNOSTICS v_a = ROW_COUNT;

  INSERT INTO public.legacy_monthly_records
    (source_key, legacy_student_id, record_kind, month_label, month, year, price_per_class,
     price_source, present_count, late_count, session_charges, source_session_charges,
     recorded_paid, source_balance, raw_statuses, excluded, exclude_reason,
     original_student_name, origin_file, origin_row, source_file, source_sheet, source_row,
     import_batch_id)
  SELECT e.source_key, ls.id, e.payload->>'record_kind', e.payload->>'month_label',
         (e.payload->>'month')::smallint, (e.payload->>'year')::smallint,
         (e.payload->>'price_per_class')::numeric, e.payload->>'price_source',
         (e.payload->>'present_count')::int, COALESCE((e.payload->>'late_count')::int, 0),
         (e.payload->>'session_charges')::numeric, (e.payload->>'source_session_charges')::numeric,
         (e.payload->>'recorded_paid')::numeric, (e.payload->>'source_balance')::numeric,
         COALESCE(ARRAY(SELECT jsonb_array_elements_text(e.payload->'raw_statuses')), '{}'),
         COALESCE((e.payload->>'excluded')::boolean, false), e.payload->>'exclude_reason',
         e.payload->>'original_student_name', e.payload->>'origin_file',
         (e.payload->>'origin_row')::int, v_batch.source_file, e.payload->>'source_sheet',
         (e.payload->>'source_row')::int, p_batch_id
    FROM public.legacy_import_staging e
    JOIN public.legacy_students ls ON ls.name_key = e.payload->>'name_key'
   WHERE e.batch_id = p_batch_id AND e.entity = 'monthly'
  ON CONFLICT (source_key) DO NOTHING;
  GET DIAGNOSTICS v_m = ROW_COUNT;

  INSERT INTO public.legacy_issues
    (dedupe_key, category, legacy_student_id, student_label, year, month_label, source_file,
     source_sheet, source_row, problem, suggested_action, import_batch_id)
  SELECT e.source_key, e.payload->>'category', ls.id,
         COALESCE(e.payload->>'student_label', ls.display_name),
         (e.payload->>'year')::smallint, e.payload->>'month_label', v_batch.source_file,
         e.payload->>'source_sheet', (e.payload->>'source_row')::int,
         e.payload->>'problem', e.payload->>'suggested_action', p_batch_id
    FROM public.legacy_import_staging e
    LEFT JOIN public.legacy_students ls ON ls.name_key = e.payload->>'name_key'
   WHERE e.batch_id = p_batch_id AND e.entity = 'issue'
  ON CONFLICT (dedupe_key) DO NOTHING;
  GET DIAGNOSTICS v_i = ROW_COUNT;

  v_result := jsonb_build_object(
    'students_inserted', v_s, 'aggregates_inserted', v_a,
    'monthly_inserted', v_m, 'issues_inserted', v_i,
    'students_skipped',   (SELECT count(*) FROM public.legacy_import_staging WHERE batch_id = p_batch_id AND entity = 'student') - v_s,
    'aggregates_skipped', (SELECT count(*) FROM public.legacy_import_staging WHERE batch_id = p_batch_id AND entity = 'aggregate') - v_a,
    'monthly_skipped',    (SELECT count(*) FROM public.legacy_import_staging WHERE batch_id = p_batch_id AND entity = 'monthly') - v_m,
    'issues_skipped',     (SELECT count(*) FROM public.legacy_import_staging WHERE batch_id = p_batch_id AND entity = 'issue') - v_i);

  UPDATE public.legacy_import_batches
     SET status = 'committed', committed_by = v_uid, committed_at = now(), commit_result = v_result
   WHERE id = p_batch_id;

  INSERT INTO public.admin_audit_log (admin_id, action, field, old_value, new_value)
  VALUES (v_uid, 'legacy_import_commit', 'legacy_import_batches', p_batch_id::text, v_result::text);

  RETURN v_result;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 13. Roll back one batch (or discard a dry run). Only that batch's rows go.
-- Refuses when one of its students is linked to an account, unless p_force.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_legacy_rollback_batch(p_batch_id uuid, p_force boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid    uuid := public.fn_legacy_require_admin();
  v_status text;
  v_linked int;
  v_i int; v_m int; v_a int; v_s int;
BEGIN
  SELECT status INTO v_status FROM public.legacy_import_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'batch_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_status = 'staged' THEN
    DELETE FROM public.legacy_import_staging WHERE batch_id = p_batch_id;
    UPDATE public.legacy_import_batches SET status = 'discarded' WHERE id = p_batch_id;
    RETURN jsonb_build_object('discarded', true);
  END IF;
  IF v_status <> 'committed' THEN
    RAISE EXCEPTION 'batch_not_committed: %', v_status USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO v_linked FROM public.legacy_students
   WHERE import_batch_id = p_batch_id AND auth_user_id IS NOT NULL;
  IF v_linked > 0 AND NOT p_force THEN
    RAISE EXCEPTION 'batch_has_linked_students: %', v_linked USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.legacy_issues          WHERE import_batch_id = p_batch_id; GET DIAGNOSTICS v_i = ROW_COUNT;
  DELETE FROM public.legacy_monthly_records WHERE import_batch_id = p_batch_id; GET DIAGNOSTICS v_m = ROW_COUNT;
  DELETE FROM public.legacy_year_aggregates WHERE import_batch_id = p_batch_id; GET DIAGNOSTICS v_a = ROW_COUNT;
  -- A student stays if another batch still has rows for her.
  DELETE FROM public.legacy_students s
   WHERE s.import_batch_id = p_batch_id
     AND NOT EXISTS (SELECT 1 FROM public.legacy_monthly_records m WHERE m.legacy_student_id = s.id)
     AND NOT EXISTS (SELECT 1 FROM public.legacy_year_aggregates a WHERE a.legacy_student_id = s.id)
     AND NOT EXISTS (SELECT 1 FROM public.legacy_issues i WHERE i.legacy_student_id = s.id);
  GET DIAGNOSTICS v_s = ROW_COUNT;

  DELETE FROM public.legacy_import_staging WHERE batch_id = p_batch_id;
  UPDATE public.legacy_import_batches
     SET status = 'rolled_back', rolled_back_by = v_uid, rolled_back_at = now()
   WHERE id = p_batch_id;

  INSERT INTO public.admin_audit_log (admin_id, action, field, old_value, new_value)
  VALUES (v_uid, 'legacy_import_rollback', 'legacy_import_batches', p_batch_id::text,
          jsonb_build_object('students', v_s, 'aggregates', v_a, 'monthly', v_m, 'issues', v_i)::text);

  RETURN jsonb_build_object('students_deleted', v_s, 'aggregates_deleted', v_a,
                            'monthly_deleted', v_m, 'issues_deleted', v_i);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 14. Account linking. Explicit admin action; audited; one account -> one student.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_legacy_search_accounts(p_query text)
 RETURNS TABLE (user_id uuid, name text, email text, linked_legacy_student_id uuid, linked_legacy_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_q text := btrim(COALESCE(p_query, ''));
BEGIN
  PERFORM public.fn_legacy_require_admin();
  IF length(v_q) < 2 THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT p.user_id, p.name, p.email, ls.id, ls.display_name
      FROM public.profiles p
      LEFT JOIN public.legacy_students ls ON ls.auth_user_id = p.user_id
     WHERE p.name ILIKE '%' || v_q || '%' OR p.email ILIKE '%' || v_q || '%'
     ORDER BY p.name
     LIMIT 25;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_legacy_link_account(p_legacy_student_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid     uuid := public.fn_legacy_require_admin();
  v_current uuid;
  v_other   text;
BEGIN
  SELECT auth_user_id INTO v_current FROM public.legacy_students WHERE id = p_legacy_student_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'legacy_student_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_current IS NOT NULL THEN
    RAISE EXCEPTION 'already_linked' USING ERRCODE = '23505';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'account_not_found' USING ERRCODE = 'P0002';
  END IF;
  SELECT display_name INTO v_other FROM public.legacy_students WHERE auth_user_id = p_user_id;
  IF v_other IS NOT NULL THEN
    RAISE EXCEPTION 'account_already_linked_to: %', v_other USING ERRCODE = '23505';
  END IF;

  UPDATE public.legacy_students
     SET auth_user_id = p_user_id, linked_at = now(), linked_by = v_uid
   WHERE id = p_legacy_student_id;

  UPDATE public.legacy_issues
     SET status = 'resolved', resolved_by = v_uid, resolved_at = now(),
         resolution_note = COALESCE(resolution_note, 'Linked to a registered account.')
   WHERE legacy_student_id = p_legacy_student_id AND category = 'unlinked_account' AND status = 'open';

  INSERT INTO public.admin_audit_log (admin_id, action, field, old_value, new_value)
  VALUES (v_uid, 'legacy_link_account', 'legacy_students.auth_user_id',
          p_legacy_student_id::text, p_user_id::text);
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_legacy_unlink_account(p_legacy_student_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid     uuid := public.fn_legacy_require_admin();
  v_current uuid;
BEGIN
  SELECT auth_user_id INTO v_current FROM public.legacy_students WHERE id = p_legacy_student_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'legacy_student_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_current IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.legacy_students
     SET auth_user_id = NULL, linked_at = NULL, linked_by = NULL
   WHERE id = p_legacy_student_id;
  INSERT INTO public.admin_audit_log (admin_id, action, field, old_value, new_value)
  VALUES (v_uid, 'legacy_unlink_account', 'legacy_students.auth_user_id',
          v_current::text, p_legacy_student_id::text);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 15. Resolve / ignore / reopen an issue without touching raw rows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_legacy_set_issue_status(p_issue_id uuid, p_status text, p_note text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := public.fn_legacy_require_admin();
  v_old text;
BEGIN
  IF p_status NOT IN ('open', 'resolved', 'ignored') THEN
    RAISE EXCEPTION 'bad_status' USING ERRCODE = '22023';
  END IF;
  SELECT status INTO v_old FROM public.legacy_issues WHERE id = p_issue_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'issue_not_found' USING ERRCODE = 'P0002';
  END IF;
  UPDATE public.legacy_issues
     SET status = p_status,
         resolution_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
         resolved_by = CASE WHEN p_status = 'open' THEN NULL ELSE v_uid END,
         resolved_at = CASE WHEN p_status = 'open' THEN NULL ELSE now() END
   WHERE id = p_issue_id;
  INSERT INTO public.admin_audit_log (admin_id, action, field, old_value, new_value)
  VALUES (v_uid, 'legacy_issue_status', 'legacy_issues:' || p_issue_id::text, v_old, p_status);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 16. Execute rights: signed-in callers only; every function checks admin.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.fn_legacy_require_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_legacy_stage_batch(text, text, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_legacy_commit_batch(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_legacy_rollback_batch(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_legacy_search_accounts(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_legacy_link_account(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_legacy_unlink_account(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_legacy_set_issue_status(uuid, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fn_legacy_require_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_legacy_stage_batch(text, text, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_legacy_commit_batch(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_legacy_rollback_batch(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_legacy_search_accounts(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_legacy_link_account(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_legacy_unlink_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_legacy_set_issue_status(uuid, text, text) TO authenticated;

COMMIT;
