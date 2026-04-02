-- Class reminder automation
-- Two cron jobs:
--   1. Daily at 08:00 UTC (10:00 Cairo) → 24h reminder for tomorrow's sessions
--   2. Every 30 min → 1h reminder for sessions starting in 50–70 min

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Helper: students in tomorrow's sessions ────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_sessions_for_reminder_24h()
RETURNS TABLE (
  session_id   uuid,
  session_date date,
  group_name   text,
  start_time   text,
  duration_min int,
  level        text,
  user_id      uuid,
  name         text,
  email        text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    pgs.id            AS session_id,
    pgs.session_date,
    pg.name           AS group_name,
    sp.start_time::text,
    sp.duration_min,
    sp.level,
    p.user_id,
    p.name,
    p.email
  FROM pkg_group_sessions pgs
  JOIN pkg_groups pg          ON pg.id = pgs.group_id
  JOIN schedule_packages sp   ON sp.id = pg.package_id
  JOIN pkg_group_members pgm  ON pgm.group_id = pg.id AND pgm.member_status = 'active'
  JOIN profiles p             ON p.user_id = pgm.user_id
  WHERE pgs.session_date = (CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::date + 1
    AND p.email IS NOT NULL;
$$;

-- ── Helper: students whose session starts in 50–70 min ────────────────────
CREATE OR REPLACE FUNCTION public.get_sessions_for_reminder_1h()
RETURNS TABLE (
  session_id   uuid,
  session_date date,
  group_name   text,
  start_time   text,
  duration_min int,
  level        text,
  user_id      uuid,
  name         text,
  email        text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    pgs.id            AS session_id,
    pgs.session_date,
    pg.name           AS group_name,
    sp.start_time::text,
    sp.duration_min,
    sp.level,
    p.user_id,
    p.name,
    p.email
  FROM pkg_group_sessions pgs
  JOIN pkg_groups pg          ON pg.id = pgs.group_id
  JOIN schedule_packages sp   ON sp.id = pg.package_id
  JOIN pkg_group_members pgm  ON pgm.group_id = pg.id AND pgm.member_status = 'active'
  JOIN profiles p             ON p.user_id = pgm.user_id
  WHERE pgs.session_date = (NOW() AT TIME ZONE 'Africa/Cairo')::date
    AND (
      (pgs.session_date + sp.start_time::time) AT TIME ZONE 'Africa/Cairo'
      BETWEEN NOW() + INTERVAL '50 minutes' AND NOW() + INTERVAL '70 minutes'
    )
    AND p.email IS NOT NULL;
$$;

-- ── DB functions that trigger the edge function ────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_class_reminder_24h()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key text := current_setting('app.supabase_service_role_key', true);
BEGIN
  IF v_key IS NULL OR v_key = '' THEN
    RAISE LOG 'trigger_class_reminder_24h: service key not set, skipping';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-class-reminders',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || v_key),
    body    := '{"type":"24h"}'::jsonb
  );
  RAISE LOG 'trigger_class_reminder_24h fired at %', now();
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_class_reminder_1h()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key text := current_setting('app.supabase_service_role_key', true);
BEGIN
  IF v_key IS NULL OR v_key = '' THEN
    RAISE LOG 'trigger_class_reminder_1h: service key not set, skipping';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-class-reminders',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || v_key),
    body    := '{"type":"1h"}'::jsonb
  );
  RAISE LOG 'trigger_class_reminder_1h fired at %', now();
END;
$$;

-- ── Cron schedules ─────────────────────────────────────────────────────────
-- 24h reminder: daily at 08:00 UTC (10:00 Cairo)
SELECT cron.unschedule('class-reminder-24h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'class-reminder-24h'
);
SELECT cron.schedule(
  'class-reminder-24h',
  '0 8 * * *',
  'SELECT public.trigger_class_reminder_24h()'
);

-- 1h reminder: every 30 min (window is 50–70 min, so each session fires once)
SELECT cron.unschedule('class-reminder-1h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'class-reminder-1h'
);
SELECT cron.schedule(
  'class-reminder-1h',
  '*/30 * * * *',
  'SELECT public.trigger_class_reminder_1h()'
);
