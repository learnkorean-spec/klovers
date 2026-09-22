-- Weekly report cron — replacement for the per-event admin emails dropped in
-- 20260922100000_stop_admin_notification_emails.sql.
--
-- send-weekly-report authorises itself with isCronOrAdmin (it carries every
-- new signup's name/email/country, so it can't be verify_jwt=false AND
-- unauthenticated the way funnel-digest is). That means the trigger can't
-- use funnel-digest's net.http_post-with-the-raw-service-role-key shape:
-- isCronOrAdmin's cron path checks the Vault-stored CRON_SECRET, not the
-- service role key, and a service-role JWT sent as a bearer would fall into
-- isCronOrAdmin's human-admin branch and fail auth.getUser(). So this
-- follows 20260916000000_trial_guide_letter.sql's trigger_trial_guide()
-- shape instead: app_private.invoke_edge(p_require_cron := true) sends the
-- Vault secret correctly.

create or replace function public.trigger_weekly_report()
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
begin
  perform app_private.invoke_edge('send-weekly-report', '{}'::jsonb, true, 60000);
end $function$;

revoke all on function public.trigger_weekly_report() from public;

-- Run hourly at :20 (offset from the other digest crons at :00/:05/:40). The
-- function only actually sends at Saturday 08:00 Cairo.
do $$
begin
  perform cron.unschedule('weekly-report-hourly');
exception when others then
  null;
end $$;

select cron.schedule(
  'weekly-report-hourly',
  '20 * * * *',
  $$select public.trigger_weekly_report()$$
);
