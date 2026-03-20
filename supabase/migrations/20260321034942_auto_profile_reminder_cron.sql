-- Auto profile reminder cron job
-- Runs daily at 9:00 AM UTC and emails all leads with missing fields

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function that triggers the send-profile-reminders edge function
CREATE OR REPLACE FUNCTION public.auto_send_profile_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_role_key text;
  v_url text;
BEGIN
  -- Get service role key from app settings (set via: ALTER DATABASE postgres SET app.supabase_service_role_key = 'your-key')
  v_service_role_key := current_setting('app.supabase_service_role_key', true);
  v_url := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-profile-reminders';

  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE LOG 'auto_send_profile_reminders: app.supabase_service_role_key not set, skipping';
    RETURN;
  END IF;

  -- Call the edge function
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := '{}'::jsonb
  );

  RAISE LOG 'auto_send_profile_reminders: triggered at %', now();
END;
$$;

-- Schedule: run daily at 9:00 AM UTC
SELECT cron.schedule(
  'auto-profile-reminders',
  '0 9 * * *',
  'SELECT public.auto_send_profile_reminders()'
);
