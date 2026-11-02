-- Re, 2 Nov 2026 (dashboard "Today" screen): "update the confirmation for
-- classes in this [page], add if they confirmed on telegram or not so i
-- confirm next to them" -- the "To confirm" strip (PrivateClassesToConfirm /
-- My Students) only ever showed the class and the plain Confirm/Did-not-
-- happen buttons; it had no idea whether the student had already tapped
-- Yes or No on the Telegram after-class ask for that exact session.
--
-- A "Yes" tap already had somewhere to land: student_confirmed_at. A "No"
-- tap had nowhere -- telegram_confirm_private_session's negative branch only
-- ever wrote an admin_notifications row, never touched the session itself.
-- This adds the missing column and wires the function to set it, so the
-- dashboard can show "said yes" / "said no" / nothing right next to the
-- confirm buttons instead of her having to remember or go check Telegram.

alter table public.student_class_sessions
  add column if not exists student_declined_at timestamptz;

comment on column public.student_class_sessions.student_declined_at is
  'Stamped when the student taps "No" on the Telegram after-class ask (telegram_confirm_private_session). Mirrors student_confirmed_at for the opposite answer -- lets the admin dashboard show a claim either way next to the confirm buttons, not just the "yes" case.';

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
    update public.student_class_sessions
       set student_declined_at = now(),
           updated_at          = now()
     where id = p_session_id;

    insert into public.admin_notifications (message, category, type, read, related_user_id)
    values (
      format('%s says she did NOT attend her lesson on %s (via Telegram) — check it',
             coalesce(v_name, 'A student'), to_char(v_date, 'DD Mon')),
      'update', 'attendance_claim_negative', false, p_teacher_student_id
    );
  end if;
end;
$func$;
