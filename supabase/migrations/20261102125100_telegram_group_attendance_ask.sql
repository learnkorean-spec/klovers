-- Re, 2 Nov 2026: "group classes must be auto as well same like private" --
-- group students (Aya, etc.) were only getting the 15-minute class-link
-- reminder, never the after-class "did you attend?" self-report that private
-- students get from telegram-attendance-ask. This adds the group equivalent
-- of that whole pipeline: a candidate function, a confirm RPC, a cron
-- trigger, and (in a paired edge function + webhook commit) the actual
-- Telegram messages and button handling.
--
-- Mirrors the private flow exactly in spirit: tapping Yes/No is a CLAIM, not
-- a count. It inserts an UNAPPROVED public.pkg_attendance row (admin_approved
-- = false), which trg_pkg_attendance_approval does NOT bill -- Re still has
-- to approve it in GroupAttendanceManager for it to actually count toward
-- the student's enrollment balance, exactly like a private student's
-- Telegram tap never sets outcome/counted by itself.

create table if not exists public.telegram_group_attendance_ask_log (
  session_id uuid not null references public.pkg_group_sessions(id) on delete cascade,
  user_id uuid not null,
  asked_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create or replace function public.telegram_group_attendance_ask_candidates()
returns table(session_id uuid, user_id uuid, full_name text, chat_id bigint, language text)
language sql
stable
set search_path to 'public'
as $$
  select
    s.id,
    m.user_id,
    coalesce(nullif(btrim(p.name), ''), ''),
    tl.chat_id,
    case sp.class_language
      when 'arabic' then 'ar'
      when 'english' then 'en'
      else coalesce(nullif(p.language, ''), 'ar')
    end
  from public.pkg_group_sessions s
  join public.pkg_groups g on g.id = s.group_id
  join public.schedule_packages sp on sp.id = g.package_id
  join public.pkg_group_members m on m.group_id = g.id
                                  and coalesce(m.member_status, 'active') = 'active'
  join public.profiles p on p.user_id = m.user_id
  join public.telegram_links tl on tl.user_id = m.user_id
  where g.is_active
    and tl.chat_id is not null
    -- not already asked for this session+member
    and not exists (
      select 1 from public.telegram_group_attendance_ask_log a
      where a.session_id = s.id and a.user_id = m.user_id
    )
    -- not already decided (by Re or by a prior claim) for this session+member
    and not exists (
      select 1 from public.pkg_attendance pa
      where pa.session_id = s.id and pa.user_id = m.user_id
    )
    -- class has actually finished (own timezone, own duration), and not too
    -- stale to still be worth asking about
    and (
      ((s.session_date::timestamp + sp.start_time)
        at time zone coalesce(sp.timezone, 'Africa/Cairo'))
        + make_interval(mins => coalesce(sp.duration_min, 60))
    ) <= now()
    and (
      ((s.session_date::timestamp + sp.start_time)
        at time zone coalesce(sp.timezone, 'Africa/Cairo'))
        + make_interval(mins => coalesce(sp.duration_min, 60))
    ) >= now() - interval '30 hours';
$$;

create or replace function public.telegram_confirm_group_session(
  p_session_id uuid, p_user_id uuid, p_attended boolean
)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_name       text;
  v_date       date;
  v_group_name text;
  v_exists     boolean;
begin
  select s.session_date, g.name
    into v_date, v_group_name
    from public.pkg_group_sessions s
    join public.pkg_groups g on g.id = s.group_id
   where s.id = p_session_id;

  if v_date is null then
    raise exception 'session_not_found' using errcode = '42704';
  end if;

  select coalesce(nullif(btrim(p.name), ''), '') into v_name
    from public.profiles p where p.user_id = p_user_id;

  if p_attended then
    select exists(
      select 1 from public.pkg_attendance
       where session_id = p_session_id and user_id = p_user_id
    ) into v_exists;

    -- Only insert if Re (or an earlier claim) hasn't already recorded
    -- something for this session+member -- never overwrite her own call.
    if not v_exists then
      insert into public.pkg_attendance (session_id, user_id, status, admin_approved)
      values (p_session_id, p_user_id, 'present', false);

      insert into public.admin_notifications (message, category, type, read)
      values (
        format('%s says she attended her group class (%s) on %s (via Telegram) — confirm it for it to count',
               coalesce(nullif(v_name, ''), 'A student'), coalesce(v_group_name, 'group'), to_char(v_date, 'DD Mon')),
        'update', 'attendance_claim', false
      );
    end if;
  else
    insert into public.admin_notifications (message, category, type, read)
    values (
      format('%s says she did NOT attend her group class (%s) on %s (via Telegram) — check it',
             coalesce(nullif(v_name, ''), 'A student'), coalesce(v_group_name, 'group'), to_char(v_date, 'DD Mon')),
      'update', 'attendance_claim_negative', false
    );
  end if;
end;
$$;

create or replace function public.trigger_telegram_group_attendance_asks()
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  perform app_private.invoke_edge('telegram-group-attendance-ask', '{}'::jsonb, false, 60000);
end;
$$;

select cron.schedule(
  'telegram-group-attendance-asks',
  '*/15 * * * *',
  $$set statement_timeout = '90s'; select public.trigger_telegram_group_attendance_asks();$$
);
