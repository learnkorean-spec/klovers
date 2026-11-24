-- Daily table backup into Supabase Storage (24 Nov 2026)
-- ======================================================
--
-- WHY
-- ---
-- The only backup was .github/workflows/database-backup.yml, and GitHub Actions
-- has been locked on this account since about 22 Nov 2026 ("account is locked
-- due to a billing issue"). Nothing has been backed up since. This one runs
-- inside Supabase and costs nothing: pg_cron calls the backup-core-tables edge
-- function, which writes one gzipped JSON file per table into a PRIVATE
-- bucket, one folder per day, and keeps the last 14 days.
--
-- WHAT IT IS, AND IS NOT
-- ----------------------
-- Data only, every public base table except logs and old one-off backups,
-- plus a minimal copy of auth.users (id, email, dates, metadata; never
-- password hashes). The schema itself lives in supabase/migrations. It does
-- not replace a pg_dump; it makes sure the rows survive.
--
-- The two export functions are SECURITY DEFINER and executable by the
-- service role only: they can read every table, so nobody else may call them.

INSERT INTO storage.buckets (id, name, public)
VALUES ('db-backups', 'db-backups', false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.fn_backup_table_list()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT c.relname::text
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relname NOT IN ('cron_health', 'stock_video_cache', 'trial_rate_limits')
     AND c.relname NOT LIKE 'blog_posts_backup_%'
   ORDER BY 1;
$function$;

CREATE OR REPLACE FUNCTION public.fn_backup_table_json(_table text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _out json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.fn_backup_table_list() t WHERE t = _table) THEN
    RAISE EXCEPTION 'not a backed-up table: %', _table;
  END IF;
  EXECUTE format('SELECT coalesce(json_agg(t), ''[]''::json) FROM public.%I t', _table) INTO _out;
  RETURN _out;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_backup_auth_users()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(json_agg(u), '[]'::json)
    FROM (SELECT id, email, phone, created_at, last_sign_in_at, email_confirmed_at,
                 raw_user_meta_data, raw_app_meta_data
            FROM auth.users) u;
$function$;

REVOKE ALL ON FUNCTION public.fn_backup_table_list() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_backup_table_json(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_backup_auth_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_backup_table_list() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_backup_table_json(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_backup_auth_users() TO service_role;

SELECT cron.unschedule('backup-core-tables-daily')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'backup-core-tables-daily');

SELECT cron.schedule(
  'backup-core-tables-daily',
  '15 1 * * *',
  $$set statement_timeout = '90s'; SELECT app_private.invoke_edge('backup-core-tables', '{}'::jsonb, false, 300000)$$
);
