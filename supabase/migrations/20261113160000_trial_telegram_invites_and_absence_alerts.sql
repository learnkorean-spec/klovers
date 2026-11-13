-- Trial -> Telegram -> enrolment, connected (Re, 13 Nov 2026):
--   "the people attend the trial and i dont have thier number after that i
--    lost them ... add them to telegram and do the group ... all not
--    connected steps"
--   "i have telegram and many groups, how to fill this gap and use the
--    telegram bot as well and groups"
--
-- Everything here is NEW objects. Nothing existing is altered or replaced:
-- no column is added to trial_bookings (its public INSERT policy lists every
-- column an anonymous booker may not set, so a new column there would be
-- writable by anyone until the policy was rewritten too), and no existing
-- function, trigger or policy is touched.
--
--   1. trial_telegram        one row per trial booking: her personal bot link,
--                            the chat she linked from, the group invite link
--                            she was sent, and when she actually joined.
--   2. telegram_chats        every group the bot knows about, with whether it
--                            is allowed to create invite links there.
--   3. telegram_absence_alert_log + telegram_repeated_absence_candidates()
--                            "missed 3 group classes in a row" alert.
--   4. telegram_trial_nudge_candidates()
--                            attended the trial, linked to the bot, still not
--                            enrolled two days later.
--   5. admin_trial_funnel_status()
--                            what the "Who came" panel shows per student.
--   4b. telegram_trial_reminder_candidates()
--                            her trial starts within 75 minutes: the bot
--                            sends the class link too, next to the email.
--   6. cron every 15 minutes -> telegram-followups edge function.

-- 1. ------------------------------------------------------------------------
create table if not exists public.trial_telegram (
  booking_id            uuid primary key references public.trial_bookings(id) on delete cascade,
  -- Deep-link payload: https://t.me/<bot>?start=<link_code>. The leading "t"
  -- keeps it visibly apart from telegram_links.link_code (enrolled students).
  link_code             text not null unique default ('t' || replace(gen_random_uuid()::text, '-', '')),
  chat_id               bigint,
  tg_user_id            bigint,
  tg_username           text,
  tg_first_name         text,
  linked_at             timestamptz,
  invite_chat_id        bigint,
  invite_link           text,
  invite_sent_at        timestamptz,
  invite_sent_via       text check (invite_sent_via in ('telegram', 'whatsapp')),
  joined_at             timestamptz,
  enroll_nudge_sent_at  timestamptz,
  trial_reminder_sent_at timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists trial_telegram_chat_id_idx on public.trial_telegram (chat_id);
create unique index if not exists trial_telegram_invite_link_key
  on public.trial_telegram (invite_link) where invite_link is not null;

alter table public.trial_telegram enable row level security;

drop policy if exists "Admins manage trial_telegram" on public.trial_telegram;
create policy "Admins manage trial_telegram" on public.trial_telegram
  for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));

-- 2. ------------------------------------------------------------------------
create table if not exists public.telegram_chats (
  chat_id        bigint primary key,
  title          text,
  chat_type      text,
  -- The bot's own membership as Telegram reports it: administrator, member,
  -- left, kicked. Only "administrator" with can_invite may create links.
  bot_status     text,
  can_invite     boolean not null default false,
  first_seen_at  timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.telegram_chats enable row level security;

drop policy if exists "Admins manage telegram_chats" on public.telegram_chats;
create policy "Admins manage telegram_chats" on public.telegram_chats
  for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));

-- Seed with the groups the bot is already in (students who ran /start inside
-- their class group). Group chat ids are negative; tg_first_name holds the
-- group title for those rows (see telegram-webhook). Admin rights are unknown
-- until the edge function asks Telegram, so can_invite stays false here.
insert into public.telegram_chats (chat_id, title, chat_type)
select distinct on (tl.chat_id) tl.chat_id, tl.tg_first_name, 'group'
from public.telegram_links tl
where tl.chat_id is not null and tl.chat_id < 0
order by tl.chat_id, tl.linked_at desc nulls last
on conflict (chat_id) do nothing;

-- 3. ------------------------------------------------------------------------
create table if not exists public.telegram_absence_alert_log (
  user_id          uuid not null,
  group_id         uuid not null,
  last_session_id  uuid not null,
  alerted_at       timestamptz not null default now(),
  primary key (user_id, group_id, last_session_id)
);

alter table public.telegram_absence_alert_log enable row level security;

drop policy if exists "Admins read telegram_absence_alert_log" on public.telegram_absence_alert_log;
create policy "Admins read telegram_absence_alert_log" on public.telegram_absence_alert_log
  for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

-- A session counts as MISSED only on a real signal, never on the unapproved
-- 'absent' placeholder fn_generate_group_sessions seeds for every member of
-- every session (that row exists before class even starts):
--   * Re approved an 'absent' mark in GroupAttendanceManager, or
--   * the bot asked her "did you attend?" more than 24h ago and there is
--     still no 'present' row from her or from Re.
-- Alerted once per streak: the log is keyed on the most recent missed
-- session, so a 4th miss alerts again and an attended class resets it.
create or replace function public.telegram_repeated_absence_candidates()
returns table (user_id uuid, group_id uuid, full_name text, group_name text, last_session_id uuid, last_session_date date)
language sql
stable
security definer
set search_path to 'public'
as $$
  with past as (
    select s.id as session_id, s.group_id, s.session_date,
           (((s.session_date::timestamp + sp.start_time)
              at time zone coalesce(sp.timezone, 'Africa/Cairo'))
             + make_interval(mins => coalesce(sp.duration_min, 60))) as ends_at
    from public.pkg_group_sessions s
    join public.pkg_groups g on g.id = s.group_id and g.is_active
    join public.schedule_packages sp on sp.id = g.package_id
  ),
  ranked as (
    select m.user_id, m.group_id, p.session_id, p.session_date,
           row_number() over (partition by m.user_id, m.group_id order by p.ends_at desc) as rn,
           (
             exists (
               select 1 from public.pkg_attendance pa
               where pa.session_id = p.session_id and pa.user_id = m.user_id
                 and pa.status = 'absent' and pa.admin_approved is true
             )
             or (
               exists (
                 select 1 from public.telegram_group_attendance_ask_log a
                 where a.session_id = p.session_id and a.user_id = m.user_id
                   and a.asked_at < now() - interval '24 hours'
               )
               and not exists (
                 select 1 from public.pkg_attendance pa
                 where pa.session_id = p.session_id and pa.user_id = m.user_id
                   and pa.status = 'present'
               )
             )
           ) as missed
    from public.pkg_group_members m
    join past p on p.group_id = m.group_id
    where coalesce(m.member_status, 'active') = 'active'
      and p.ends_at <= now()
      and p.ends_at >= now() - interval '60 days'
      and (m.joined_at is null or p.ends_at >= m.joined_at)
  ),
  streak as (
    select r.user_id, r.group_id,
           (array_agg(r.session_id order by r.rn))[1]   as last_session_id,
           (array_agg(r.session_date order by r.rn))[1] as last_session_date
    from ranked r
    where r.rn <= 3
    group by r.user_id, r.group_id
    having count(*) = 3 and bool_and(r.missed)
  )
  select st.user_id, st.group_id,
         coalesce(nullif(btrim(pr.name), ''), pr.email, 'A student'),
         g.name, st.last_session_id, st.last_session_date
  from streak st
  join public.pkg_groups g on g.id = st.group_id
  left join public.profiles pr on pr.user_id = st.user_id
  where not exists (
    select 1 from public.telegram_absence_alert_log l
    where l.user_id = st.user_id and l.group_id = st.group_id
      and l.last_session_id = st.last_session_id
  );
$$;

revoke all on function public.telegram_repeated_absence_candidates() from public, anon, authenticated;
grant execute on function public.telegram_repeated_absence_candidates() to service_role;

-- 4. ------------------------------------------------------------------------
-- Attended the trial, pressed Start on the bot, marked "Came" between 2 and
-- 14 days ago, and there is still no enrolment under this booking or under
-- her email. One nudge per booking, ever (enroll_nudge_sent_at).
create or replace function public.telegram_trial_nudge_candidates()
returns table (booking_id uuid, name text, chat_id bigint, class_language text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select b.id, b.name, tt.chat_id, b.class_language
  from public.trial_telegram tt
  join public.trial_bookings b on b.id = tt.booking_id
  where tt.chat_id is not null
    and tt.enroll_nudge_sent_at is null
    and b.attended is true
    and b.attendance_marked_at <= now() - interval '48 hours'
    and b.attendance_marked_at >= now() - interval '14 days'
    and not exists (
      select 1 from public.enrollments e
      where e.trial_booking_id = b.id and e.deleted_at is null
    )
    and not exists (
      select 1 from public.enrollments e
      join public.profiles p on p.user_id = e.user_id
      where lower(p.email) = lower(b.email) and e.deleted_at is null
    );
$$;

revoke all on function public.telegram_trial_nudge_candidates() from public, anon, authenticated;
grant execute on function public.telegram_trial_nudge_candidates() to service_role;

-- 4b. -----------------------------------------------------------------------
-- Her trial starts within the next 75 minutes, she is linked to the bot, the
-- booking is still live, and the bot has not already sent her the class link.
-- This is in ADDITION to the email reminder (send-trial-reminder), not
-- instead of it: the email is the letter that gets lost.
create or replace function public.telegram_trial_reminder_candidates()
returns table (booking_id uuid, name text, chat_id bigint, class_language text, meeting_url text, starts_at timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
  select b.id, b.name, tt.chat_id, b.class_language, b.meeting_url, b.starts_at
  from public.trial_telegram tt
  join public.trial_bookings b on b.id = tt.booking_id
  where tt.chat_id is not null
    and tt.trial_reminder_sent_at is null
    and b.meeting_url is not null
    and coalesce(b.status, '') not in ('cancelled', 'no_show')
    and b.is_tba is not true
    and b.starts_at > now()
    and b.starts_at <= now() + interval '75 minutes';
$$;

revoke all on function public.telegram_trial_reminder_candidates() from public, anon, authenticated;
grant execute on function public.telegram_trial_reminder_candidates() to service_role;

-- 5. ------------------------------------------------------------------------
-- One call for the "Who came" panel: for each booking, how far she got.
-- Admin-only (checked inside, since it is SECURITY DEFINER).
create or replace function public.admin_trial_funnel_status(p_booking_ids uuid[])
returns table (
  booking_id      uuid,
  tg_linked       boolean,
  invite_sent_at  timestamptz,
  invite_sent_via text,
  invite_chat     text,
  joined_at       timestamptz,
  signed_up       boolean,
  enrolled        boolean,
  paid            boolean
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin only' using errcode = '42501';
  end if;

  return query
  select b.id,
         (tt.chat_id is not null),
         tt.invite_sent_at,
         tt.invite_sent_via,
         tc.title,
         tt.joined_at,
         exists (select 1 from public.profiles p where lower(p.email) = lower(b.email)),
         exists (
           select 1 from public.enrollments e
           where e.deleted_at is null
             and (e.trial_booking_id = b.id
                  or e.user_id in (select p.user_id from public.profiles p where lower(p.email) = lower(b.email)))
         ),
         exists (
           select 1 from public.enrollments e
           where e.deleted_at is null and e.payment_status = 'PAID'
             and (e.trial_booking_id = b.id
                  or e.user_id in (select p.user_id from public.profiles p where lower(p.email) = lower(b.email)))
         )
  from public.trial_bookings b
  left join public.trial_telegram tt on tt.booking_id = b.id
  left join public.telegram_chats tc on tc.chat_id = tt.invite_chat_id
  where b.id = any (p_booking_ids);
end;
$$;

revoke all on function public.admin_trial_funnel_status(uuid[]) from public, anon;
grant execute on function public.admin_trial_funnel_status(uuid[]) to authenticated, service_role;

-- 6. ------------------------------------------------------------------------
create or replace function public.trigger_telegram_followups()
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  perform app_private.invoke_edge('telegram-followups', '{}'::jsonb, false, 60000);
end;
$$;

revoke all on function public.trigger_telegram_followups() from public, anon, authenticated;

select cron.schedule(
  'telegram-followups',
  '*/15 * * * *',
  $$set statement_timeout = '90s'; select public.trigger_telegram_followups();$$
);
