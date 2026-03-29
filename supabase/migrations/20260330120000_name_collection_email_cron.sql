-- Daily cron: send name-collection emails to leads with missing names
-- Runs at 11:00 UTC = 1:00 PM Cairo time

select cron.schedule(
  'name-collection-email-daily',
  '0 11 * * *',
  $$
  select
    net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/send-name-collection-email',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body    := '{}'::jsonb
    ) as request_id;
  $$
);
