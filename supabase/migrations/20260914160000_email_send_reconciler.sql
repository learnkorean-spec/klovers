-- Email send reconciler — 14 Sep 2026
--
-- Context: `app_private.invoke_edge` is fire-and-forget over pg_net. Every
-- sender that uses it therefore stamps its `*_sent_at` claim BEFORE it can know
-- whether the letter went out. That ordering is deliberate and stays (a lost
-- email beats a duplicate), but until today it had no counterpart: a failure was
-- permanent AND invisible.
--
-- It was not hypothetical. Between 2026-09-07 and 2026-09-14 the Vault held no
-- usable service credential, so every database-driven letter came back 401 and
-- was thrown away. `placement_tests.result_email_sent_at` was stamped for a real
-- student on 12 Sep; `email_logs` has no row for it. Nothing raised a flag.
--
-- This migration adds the missing half: an hourly pass that asks, of every claim
-- older than fifteen minutes, "is there a matching row in email_logs?" and
-- raises ONE admin notification for the ones where the answer is no.
--
-- It deliberately does not retry. A retry loop over a claim of unknown outcome
-- is how a student receives the same letter nine times; a human deciding to
-- re-send one letter is cheap. The job's product is knowledge, not action.

-- ---------------------------------------------------------------------------
-- 1. Misses already reported.
--
-- The row IS the de-duplication: a claim is reported once, ever. Without it the
-- job would re-raise the same notification every hour until the underlying row
-- is deleted, which trains the reader to ignore it — the failure mode that made
-- the original problem invisible in the first place.
-- ---------------------------------------------------------------------------
create table if not exists app_private.email_claim_misses (
  claim_key   text primary key,
  template    text not null,
  to_email    text,
  claimed_at  timestamptz,
  detected_at timestamptz not null default now()
);

comment on table app_private.email_claim_misses is
  'One row per send-claim found with no matching email_logs entry. Presence means "already reported", not "still broken".';

-- ---------------------------------------------------------------------------
-- 2. The reconciler.
--
-- Window: claims older than 15 minutes (so a letter still in flight is never
-- flagged) and newer than 7 days (so a one-off historical gap does not become a
-- permanent scan).
--
-- Match rule: same recipient, same template, logged within [claim - 2 min,
-- claim + 30 min]. The lower bound is slack for clock skew between the database
-- and the edge function; the upper bound is generous because `send-confirmation-
-- email` writes its log row only after Resend answers.
-- ---------------------------------------------------------------------------
create or replace function public.check_email_send_claims()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_new     integer := 0;
  v_recent  integer;
  v_sample  text;
begin
  with claimed as (
    select 'placement_tests:' || pt.id::text as claim_key,
           'placement_result'::text          as template,
           p.email                           as to_email,
           pt.result_email_sent_at           as claimed_at
      from public.placement_tests pt
      join public.profiles p on p.user_id = pt.user_id
     where pt.result_email_sent_at is not null

    union all

    select 'pkg_group_members:' || m.group_id::text || ':' || m.user_id::text,
           'class_link',
           p.email,
           m.class_link_sent_at
      from public.pkg_group_members m
      join public.profiles p on p.user_id = m.user_id
     where m.class_link_sent_at is not null

    union all

    select 'enrollment_approval:' || e.id::text,
           'approval',
           p.email,
           e.approval_email_sent_at
      from public.enrollments e
      join public.profiles p on p.user_id = e.user_id
     where e.approval_email_sent_at is not null

    union all

    select 'enrollment_payment:' || e.id::text,
           'payment_confirmed',
           p.email,
           e.payment_email_sent_at
      from public.enrollments e
      join public.profiles p on p.user_id = e.user_id
     where e.payment_email_sent_at is not null
  ),
  in_window as (
    select * from claimed
     where to_email is not null
       and claimed_at < now() - interval '15 minutes'
       and claimed_at > now() - interval '7 days'
  ),
  missing as (
    select w.*
      from in_window w
     where not exists (
             select 1
               from public.email_logs l
              where lower(l.to_email) = lower(w.to_email)
                and l.template = w.template
                and l.created_at between w.claimed_at - interval '2 minutes'
                                     and w.claimed_at + interval '30 minutes'
           )
       and not exists (
             select 1 from app_private.email_claim_misses s
              where s.claim_key = w.claim_key
           )
  ),
  inserted as (
    insert into app_private.email_claim_misses (claim_key, template, to_email, claimed_at)
    select claim_key, template, to_email, claimed_at from missing
    on conflict (claim_key) do nothing
    returning claim_key, template
  )
  select count(*), min(template) into v_new, v_sample from inserted;

  if v_new > 0 then
    -- admin_notifications carries its own email trigger, so one notification per
    -- six hours regardless of how many claims failed in that period. The row in
    -- email_claim_misses is the complete record; the notification is only the
    -- thing that makes someone go and read it.
    select count(*) into v_recent
      from public.admin_notifications
     where type = 'email_lost'
       and created_at > now() - interval '6 hours';

    if v_recent = 0 then
      insert into public.admin_notifications (message, type)
      values (
        v_new || ' letter(s) were marked as sent but never reached the mail provider'
        || ' (first: ' || coalesce(v_sample, '?') || ').'
        || ' See app_private.email_claim_misses — each needs re-sending by hand.',
        'email_lost'
      );
    end if;
  end if;

  return v_new;
end;
$function$;

comment on function public.check_email_send_claims() is
  'Hourly: finds *_sent_at claims with no matching email_logs row and reports them once. Does not retry.';

revoke all on function public.check_email_send_claims() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Seed the table with what is ALREADY unmatched, so the first scheduled run
--    reports only new failures.
--
-- Without this the first run would raise one notification for a backlog going
-- back months — including claims whose letters predate email_logs entirely
-- (the table was added 2026-04-24) — and the first thing the new alert would
-- teach its reader is that it cries wolf.
-- ---------------------------------------------------------------------------
insert into app_private.email_claim_misses (claim_key, template, to_email, claimed_at, detected_at)
select claim_key, template, to_email, claimed_at, now()
  from (
    select 'placement_tests:' || pt.id::text as claim_key, 'placement_result'::text as template,
           p.email as to_email, pt.result_email_sent_at as claimed_at
      from public.placement_tests pt join public.profiles p on p.user_id = pt.user_id
     where pt.result_email_sent_at is not null
    union all
    select 'pkg_group_members:' || m.group_id::text || ':' || m.user_id::text, 'class_link',
           p.email, m.class_link_sent_at
      from public.pkg_group_members m join public.profiles p on p.user_id = m.user_id
     where m.class_link_sent_at is not null
    union all
    select 'enrollment_approval:' || e.id::text, 'approval', p.email, e.approval_email_sent_at
      from public.enrollments e join public.profiles p on p.user_id = e.user_id
     where e.approval_email_sent_at is not null
    union all
    select 'enrollment_payment:' || e.id::text, 'payment_confirmed', p.email, e.payment_email_sent_at
      from public.enrollments e join public.profiles p on p.user_id = e.user_id
     where e.payment_email_sent_at is not null
  ) pre
 where pre.to_email is not null
   and not exists (
         select 1 from public.email_logs l
          where lower(l.to_email) = lower(pre.to_email)
            and l.template = pre.template
            and l.created_at between pre.claimed_at - interval '2 minutes'
                                 and pre.claimed_at + interval '30 minutes'
       )
on conflict (claim_key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. The pg_net failure watchdog was looking at a window that does not exist.
--
-- `log_pgnet_email_failures` runs once a day and scans the last 25 hours of
-- net._http_response. That table is purged after roughly SIX hours — measured
-- on 2026-09-14: oldest row 03:35, newest 09:15, 20 rows. So the watchdog could
-- only ever be shown the six hours before it ran, and about eighteen hours of
-- every day were unwatched. The 401 that killed the 12 Sep placement letter
-- happened at 14:24 UTC and was gone long before the 11:00 sweep the next day.
--
-- Hourly with a 90-minute window (overlapping on purpose, since pgnet_seen
-- de-duplicates) covers the whole day instead of a quarter of it.
-- ---------------------------------------------------------------------------
create or replace function public.log_pgnet_email_failures()
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_new     integer := 0;
  v_recent  integer;
begin
  with fresh as (
    select r.id, r.status_code, r.error_msg, r.content, r.created
      from net._http_response r
     where r.created > now() - interval '90 minutes'
       and (r.status_code >= 400 or r.error_msg is not null or r.timed_out)
       and not exists (select 1 from app_private.pgnet_seen s where s.response_id = r.id)
  ), marked as (
    insert into app_private.pgnet_seen (response_id)
    select id from fresh
    on conflict do nothing
    returning response_id
  )
  insert into public.cron_health (job_name, status, detail, created_at)
  select 'pg_net',
         'error',
         'HTTP ' || coalesce(f.status_code::text, '-') || ' ' ||
         left(coalesce(f.error_msg, f.content, ''), 300),
         f.created
    from fresh f;

  get diagnostics v_new = row_count;

  if v_new > 0 then
    select count(*) into v_recent
      from public.admin_notifications
     where type = 'pgnet_failure'
       and created_at > now() - interval '6 hours';

    if v_recent = 0 then
      insert into public.admin_notifications (message, type)
      values (v_new || ' outbound HTTP call(s) from the database failed in the last 90 minutes. '
              || 'See public.cron_health where job_name = ''pg_net''.',
              'pgnet_failure');
    end if;
  end if;
end $function$;

-- ---------------------------------------------------------------------------
-- 5. Schedules.
-- ---------------------------------------------------------------------------
do $$
begin
  -- hourly instead of daily, for the reason in section 4
  perform cron.alter_job(jobid, schedule := '45 * * * *')
     from cron.job where jobname = 'log-pgnet-email-failures';

  -- :50 so it runs after the watchdog, and after the hourly senders at :00-:35
  if exists (select 1 from cron.job where jobname = 'email-claim-reconciler') then
    perform cron.unschedule('email-claim-reconciler');
  end if;

  perform cron.schedule('email-claim-reconciler', '50 * * * *',
                        'select public.check_email_send_claims()');
end $$;

-- ---------------------------------------------------------------------------
-- 6. `btrim(text)` strips spaces. `String.prototype.trim()` strips all
--    whitespace. That difference is a whole lost letter.
--
-- `fn_send_group_class_link` accepts a meeting_url as non-empty when
-- btrim() leaves anything behind — but a value of one tab or one newline
-- survives btrim and is empty to the template, which answers
-- 400 "class_link_url is required for the class_link template" and then, because
-- the claim is already stamped, never sends again. A 400 of exactly that shape
-- was observed at 2026-09-14 10:25 UTC, minutes after the credential was fixed,
-- while meeting links were being pasted in.
--
-- Both sides now use the same definition of blank.
-- ---------------------------------------------------------------------------
create or replace function public.fn_send_group_class_link(_group_id uuid, _user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _group   record;
  _pkg     record;
  _profile record;
  _member  record;
  _lang    text;
  _day     text;
  _url     text;
begin
  select m.* into _member
    from public.pkg_group_members m
   where m.group_id = _group_id and m.user_id = _user_id;

  if not found or _member.member_status <> 'active' or _member.class_link_sent_at is not null then
    return false;
  end if;

  select g.* into _group from public.pkg_groups g where g.id = _group_id;
  if not found then
    return false;
  end if;

  -- A closed group sends nothing, whatever its members' rows still say.
  if not coalesce(_group.is_active, false) then
    return false;
  end if;

  -- No room, no email — and "blank" here means what the template means by it.
  _url := regexp_replace(coalesce(_group.meeting_url, ''), '^\s+|\s+$', '', 'g');
  if _url = '' then
    return false;
  end if;

  select p.* into _pkg from public.schedule_packages p where p.id = _group.package_id;

  select pr.name, pr.email, pr.language
    into _profile
    from public.profiles pr
   where pr.user_id = _user_id;

  if _profile.email is null then
    return false;
  end if;

  _lang := coalesce(nullif(_profile.language, ''), 'ar');
  -- to_char(..., 'Day') blank-pads to nine characters.
  _day  := btrim(to_char(date '2026-01-04' + coalesce(_pkg.day_of_week, 0), 'Day'));

  perform app_private.invoke_edge(
    'send-confirmation-email',
    jsonb_build_object(
      'template',       'class_link',
      'email',          _profile.email,
      'name',           coalesce(_profile.name, ''),
      'language',       _lang,
      'class_link_url', _url,
      'slot_day',       _day,
      'slot_time',      coalesce(substring(_pkg.start_time::text from 1 for 5), ''),
      'slot_timezone',  coalesce(_pkg.timezone, 'Africa/Cairo'),
      'group_name',     coalesce(_group.name, '')
    )
  );

  update public.pkg_group_members m
     set class_link_sent_at = now()
   where m.group_id = _group_id
     and m.user_id  = _user_id;

  return true;
end;
$function$;

-- Same definition of blank on the trigger that decides a link "changed".
create or replace function public.email_group_members_on_link_set()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _m record;
begin
  if regexp_replace(coalesce(new.meeting_url, ''), '^\s+|\s+$', '', 'g') = '' then
    return new;
  end if;
  if old.meeting_url is not distinct from new.meeting_url then
    return new;
  end if;

  -- A CHANGED link, not just a first one: everyone already in the group is
  -- holding a dead link, so their "already sent" stamp is cleared and they are
  -- sent the new one.
  update public.pkg_group_members m
     set class_link_sent_at = null
   where m.group_id = new.id
     and m.member_status = 'active'
     and m.class_link_sent_at is not null;

  for _m in
    select m.user_id
      from public.pkg_group_members m
     where m.group_id = new.id
       and m.member_status = 'active'
       and m.class_link_sent_at is null
  loop
    perform public.fn_send_group_class_link(new.id, _m.user_id);
  end loop;

  return new;
end;
$function$;
