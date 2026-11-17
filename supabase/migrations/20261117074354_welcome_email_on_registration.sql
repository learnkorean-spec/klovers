-- Automated "Welcome to Klovers" email on registration.
-- Adds a marker column so the sender (send-welcome-email edge function) is
-- idempotent, and a thin cron wrapper following the same
-- app_private.invoke_edge(..., p_require_cron := true) pattern as
-- trigger_trial_followups() — never a raw net.http_post.

alter table public.profiles
  add column if not exists welcome_email_sent_at timestamptz;

-- Backfill: every profile that already existed before this feature shipped
-- is marked as already welcomed (at their own created_at), so the new cron
-- job picks up only *future* registrations and never blasts 143 existing
-- students with a "welcome to Klovers" email out of nowhere.
update public.profiles
  set welcome_email_sent_at = created_at
  where welcome_email_sent_at is null;

create or replace function public.trigger_send_welcome_email()
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
begin
  perform app_private.invoke_edge('send-welcome-email', '{}'::jsonb, true, 60000);
end
$function$;

select cron.schedule(
  'send-welcome-email-hourly',
  '12 * * * *',
  $$select public.trigger_send_welcome_email();$$
);

-- New functions get PUBLIC EXECUTE by default, which trigger_trial_followups
-- does NOT have (it's postgres + service_role only). Without this, anon/
-- authenticated could call /rest/v1/rpc/trigger_send_welcome_email directly.
revoke execute on function public.trigger_send_welcome_email() from public, anon, authenticated;
