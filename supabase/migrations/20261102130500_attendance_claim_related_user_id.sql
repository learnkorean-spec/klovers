-- Re, 2 Nov 2026: "when they confirm must be confirmed on dashboard, with
-- adding a way that admin can edit and fix" -- a Telegram attendance claim
-- (private or group) only ever showed up as a plain text line in
-- admin_notifications; fixing it meant hunting down the right student/group
-- and the right session by hand in a different screen. This is step one:
-- stamp related_user_id on the notification (teacher_students.id for a
-- private student, profiles.user_id for a group member) so the dashboard can
-- find the exact pending item and offer one-tap fix buttons right there
-- (AttendanceClaimPanel, added in the matching frontend commit).

create or replace function public.telegram_confirm_private_session(p_session_id uuid, p_teacher_student_id uuid, p_attended boolean)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $func$
declare
  v_name    text;
  v_date    date;
  v_already timestamptz;
begin
  select ts.full_name, s.session_date, s.student_confirmed_at
    into v_name, v_date, v_already
    from public.student_class_sessions s
    join public.teacher_students ts on ts.id = s.student_id
   where s.id = p_session_id
     and s.student_id = p_teacher_student_id;

  if v_date is null then
    raise exception 'session_not_found' using errcode = '42704';
  end if;

  if p_attended then
    if v_already is null then
      update public.student_class_sessions
         set student_confirmed_at = now(),
             updated_at           = now()
       where id = p_session_id;

      insert into public.admin_notifications (message, category, type, read, related_user_id)
      values (
        format('%s says she attended her lesson on %s (via Telegram) — confirm it for it to count',
               coalesce(v_name, 'A student'), to_char(v_date, 'DD Mon')),
        'update', 'attendance_claim', false, p_teacher_student_id
      );
    end if;
  else
    insert into public.admin_notifications (message, category, type, read, related_user_id)
    values (
      format('%s says she did NOT attend her lesson on %s (via Telegram) — check it',
             coalesce(v_name, 'A student'), to_char(v_date, 'DD Mon')),
      'update', 'attendance_claim_negative', false, p_teacher_student_id
    );
  end if;
end;
$func$;

create or replace function public.telegram_confirm_group_session(
  p_session_id uuid, p_user_id uuid, p_attended boolean
)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $func$
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

    if not v_exists then
      insert into public.pkg_attendance (session_id, user_id, status, admin_approved)
      values (p_session_id, p_user_id, 'present', false);

      insert into public.admin_notifications (message, category, type, read, related_user_id)
      values (
        format('%s says she attended her group class (%s) on %s (via Telegram) — confirm it for it to count',
               coalesce(nullif(v_name, ''), 'A student'), coalesce(v_group_name, 'group'), to_char(v_date, 'DD Mon')),
        'update', 'attendance_claim', false, p_user_id
      );
    end if;
  else
    insert into public.admin_notifications (message, category, type, read, related_user_id)
    values (
      format('%s says she did NOT attend her group class (%s) on %s (via Telegram) — check it',
             coalesce(nullif(v_name, ''), 'A student'), coalesce(v_group_name, 'group'), to_char(v_date, 'DD Mon')),
      'update', 'attendance_claim_negative', false, p_user_id
    );
  end if;
end;
$func$;
