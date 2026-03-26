-- Schedule payment-reminder edge function via pg_cron
-- Runs every day at 09:00 UTC (11:00 Cairo / Egypt time)
-- The edge function itself filters which students need reminders

select cron.schedule(
  'payment-reminder-daily',
  '0 9 * * *',
  $$
  select
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/payment-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
