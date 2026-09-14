-- trial_bookings carries two columns that both mean "we have written to her
-- about this booking", and nothing kept them in step.
--
--   email_sent_at             the invitation / letter went out
--   attendance_email_sent_at  we asked whether she is coming
--
-- They are written by different senders. send-trial-invitations stamps the
-- first; send-attendance-confirmations stamps the second; the 14 Sep backlog
-- letter (send-trial-choose-letter, since retired) stamped the first. Every
-- reader treats either one as "contacted", but each sender only looks at its
-- own, so a person could be mailed twice and still read as never asked:
--
--   * send-attendance-confirmations skips only on attendance_email_sent_at
--   * the admin per-row resend guard reads only attendance_email_sent_at
--   * AdminToday, useWeekReview and TrialAttendanceRoster split
--     "asked" from "never asked" on attendance_email_sent_at alone
--
-- On 14 Sep that produced the concrete failure this fixes: five bookings held
-- one stamp and not the other.
--
-- WHAT THIS DOES NOT DO
-- ---------------------
-- It does not overwrite a stamp that is already set. Fifty-two rows carry both
-- columns with genuinely different timestamps -- the attendance ask and the
-- backlog letter went out hours apart -- and those are two real events. Making
-- them equal would destroy history to satisfy a tidiness rule. The rule here is
-- only: if one is set and the other is null, the null one catches up.

-- ---------------------------------------------------------------- backfill --
update public.trial_bookings
   set attendance_email_sent_at = email_sent_at
 where email_sent_at is not null
   and attendance_email_sent_at is null;

update public.trial_bookings
   set email_sent_at = attendance_email_sent_at
 where attendance_email_sent_at is not null
   and email_sent_at is null;

-- ----------------------------------------------------------------- trigger --
create or replace function public.sync_trial_contact_stamps()
returns trigger
language plpgsql
as $function$
begin
  -- Fill the empty one from the set one. Never the other way round: a value
  -- already recorded is a fact about when something was actually sent.
  if new.email_sent_at is not null and new.attendance_email_sent_at is null then
    new.attendance_email_sent_at := new.email_sent_at;
  elsif new.attendance_email_sent_at is not null and new.email_sent_at is null then
    new.email_sent_at := new.attendance_email_sent_at;
  end if;

  return new;
end;
$function$;

comment on function public.sync_trial_contact_stamps() is
  'Keeps trial_bookings.email_sent_at and attendance_email_sent_at in step: a '
  'null one is filled from its non-null partner, an existing value is never '
  'overwritten. Added 2026-09-14 because each sender checked only its own '
  'column, so a student could be written to twice and still read as never '
  'contacted.';

drop trigger if exists trg_sync_trial_contact_stamps on public.trial_bookings;

create trigger trg_sync_trial_contact_stamps
  before insert or update of email_sent_at, attendance_email_sent_at
  on public.trial_bookings
  for each row
  execute function public.sync_trial_contact_stamps();

-- Supabase's ALTER DEFAULT PRIVILEGES grants EXECUTE on every new function to
-- anon, authenticated and service_role, and `revoke from public` does not
-- remove those. A trigger function should be callable by nobody over the API.
-- See claude/REVOKE_FROM_PUBLIC_IS_NOT_ENOUGH_2026-09-14.md.
revoke all on function public.sync_trial_contact_stamps() from public;
revoke all on function public.sync_trial_contact_stamps() from anon;
revoke all on function public.sync_trial_contact_stamps() from authenticated;

-- ------------------------------------------------------------------ verify --
do $$
declare
  v_out_of_step integer;
begin
  select count(*) into v_out_of_step
    from public.trial_bookings
   where (email_sent_at is null) <> (attendance_email_sent_at is null);

  if v_out_of_step > 0 then
    raise exception
      'sync_trial_contact_stamps: % booking(s) still have one stamp set and the other null',
      v_out_of_step;
  end if;
end $$;
