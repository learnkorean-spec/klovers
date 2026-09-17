-- The trial-day reminder: a letter about two hours before each trial class.
--
-- Until now a trial got nothing on the day. class-reminder-24h/1h read
-- pkg_group_sessions JOIN pkg_group_members and a trial is in neither table;
-- send-pre-class-reminders is gated on enrollments.first_class_date. The
-- reminder for the first class (18 Sep) had to be typed by hand.
--
-- One stamp per booking, so nobody is reminded twice. The cron runs every 15
-- minutes and the sender only writes to bookings whose class starts within the
-- next two hours, so a skipped run is caught by the next one.

alter table public.trial_bookings
  add column if not exists reminder_sent_at timestamptz;

comment on column public.trial_bookings.reminder_sent_at is
  'When the trial-day reminder (send-trial-reminder) was sent for this booking. One letter per booking.';

create or replace function public.trigger_trial_reminder()
 returns void
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public'
as $function$
begin
  perform app_private.invoke_edge('send-trial-reminder', '{"dry_run": false}'::jsonb, true, 60000);
end $function$;

revoke all on function public.trigger_trial_reminder() from public;
grant execute on function public.trigger_trial_reminder() to service_role;

-- Every 15 minutes: the sender itself decides who is inside the two-hour
-- window, and refuses to send once a class has started.
select cron.unschedule('trial-reminder-15min')
where exists (select 1 from cron.job where jobname = 'trial-reminder-15min');

select cron.schedule('trial-reminder-15min', '*/15 * * * *', $$select public.trigger_trial_reminder()$$);
