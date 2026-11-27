-- Closes the gap in "a group moves up together" (20261127150000).
--
-- A student who finishes her level before her classmates waits in the group.
-- If an extra class is then confirmed for her, handle_pkg_attendance_approval
-- charges it past her package (remaining goes to -1) and
-- roll_enrolment_if_overdrawn used to answer that by opening a renewal of the
-- SAME level and emailing a payment ask. For a student about to move up that is
-- wrong, so:
--   1. roll_enrolment_if_overdrawn does nothing for a student who has finished
--      her level and has a next level to go to (the only change to it is the
--      new early return; the rest is the live body, unchanged).
--   2. When the group moves, an extra class she was charged while waiting is
--      cleared back to 0: a free class, not a debt on a paid enrolment.
-- Tested in a rolled-back transaction on Aya Arafa: extra class left her at -1
-- with no renewal and no payment ask, then the group moved and she cleared to 0.

create or replace function public.roll_enrolment_if_overdrawn(p_enrollment_id uuid, p_from date DEFAULT NULL::date)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  _old record;
  _new uuid;
  _over int;
begin
  select * into _old from public.enrollments where id = p_enrollment_id;
  if _old.id is null then return null; end if;
  if _old.deleted_at is not null then return null; end if;
  if coalesce(_old.enrollment_status,'active') <> 'active' then return null; end if;
  if _old.sessions_remaining >= 0 then return null; end if;
  if coalesce(_old.classes_included,0) <= 0 then return null; end if;

  -- Paused seat? A member who is not active is not carrying on.
  if not exists (
    select 1 from public.pkg_group_members m
     where m.user_id = _old.user_id and m.member_status = 'active'
  ) then
    return null;
  end if;

  -- Finished her level and waiting for her group to move up: an extra class is
  -- not a renewal.
  if exists (
    select 1
      from public.pkg_group_members m
      join public.pkg_groups g on g.id = m.group_id
      join public.schedule_packages sp on sp.id = g.package_id
     where m.user_id = _old.user_id and m.member_status = 'active'
       and app_private.next_level_key(sp.level) is not null
       and coalesce(app_private.level_done_count(m.user_id, m.group_id), 0)
           >= app_private.level_class_count(sp.level)
  ) then
    return null;
  end if;

  _over := abs(_old.sessions_remaining);

  update public.enrollments
     set enrollment_status = 'expired',
         sessions_remaining = 0
   where id = _old.id;

  insert into public.enrollments
    (user_id, plan_type, duration, classes_included, amount, unit_price,
     currency, level, package_id, slot_id, timezone,
     assigned_day, assigned_time, assigned_timezone,
     payment_provider, payment_method,
     status, approval_status, payment_status, enrollment_status,
     sessions_total, sessions_remaining,
     matched_at, first_class_date, admin_notes)
  values
    (_old.user_id, _old.plan_type, _old.duration, _old.classes_included,
     _old.amount, _old.unit_price, _old.currency, _old.level,
     _old.package_id, _old.slot_id, _old.timezone,
     _old.assigned_day, _old.assigned_time, _old.assigned_timezone,
     _old.payment_provider, _old.payment_method,
     _old.status, 'APPROVED', 'PENDING_PAYMENT', 'active',
     _old.classes_included, _old.classes_included - _over,
     now(), coalesce(p_from::timestamptz, now()),
     'Opened automatically: the previous period ran out and a class was taught past it.')
  returning id into _new;

  -- Her seat follows her to the new period.
  update public.pkg_group_members
     set enrollment_id = _new
   where user_id = _old.user_id
     and member_status = 'active'
     and enrollment_id = _old.id;

  perform public.send_enrolment_payment_ask(_new);
  return _new;
end
$function$;

create or replace function app_private.promote_if_level_finished(_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare _seat record; _needed integer; _o record; _results jsonb := '[]'::jsonb;
begin
  select m.group_id, sp.level into _seat
    from public.pkg_group_members m
    join public.pkg_groups g on g.id = m.group_id
    join public.schedule_packages sp on sp.id = g.package_id
   where m.user_id = _user_id and m.member_status = 'active'
   order by m.joined_at desc limit 1;
  if not found then return jsonb_build_object('status', 'no_seat'); end if;

  _needed := app_private.level_class_count(_seat.level);
  if _needed is null or app_private.next_level_key(_seat.level) is null then
    return jsonb_build_object('status', 'top_level');
  end if;

  if coalesce(app_private.level_done_count(_user_id, _seat.group_id), 0) < _needed then
    return jsonb_build_object('status', 'not_finished');
  end if;

  if exists (
    select 1
      from public.pkg_group_members m
      join public.enrollments e on e.id = m.enrollment_id
     where m.group_id = _seat.group_id and m.member_status = 'active'
       and m.user_id <> _user_id and e.payment_status = 'PAID'
       and coalesce(app_private.level_done_count(m.user_id, m.group_id), 0) < _needed
  ) then
    delete from public.pkg_attendance a
     using public.pkg_group_sessions s
     where a.session_id = s.id and s.group_id = _seat.group_id
       and a.user_id = _user_id and s.session_date >= current_date
       and a.admin_approved is not true;
    return jsonb_build_object('status', 'waiting_for_group');
  end if;

  for _o in
    select m.user_id, m.enrollment_id from public.pkg_group_members m
     where m.group_id = _seat.group_id and m.member_status = 'active'
     order by m.joined_at
  loop
    if coalesce(app_private.level_done_count(_o.user_id, _seat.group_id), 0) >= _needed then
      _results := _results || jsonb_build_array(app_private.move_member_to_next_level(_o.user_id));
      -- An extra class taught while she waited is a free one, not a debt.
      update public.enrollments set sessions_remaining = 0
       where id = _o.enrollment_id and sessions_remaining < 0;
    end if;
  end loop;

  return jsonb_build_object('status', 'group_moved', 'moves', _results);
end;
$$;

revoke all on function app_private.promote_if_level_finished(uuid) from public, anon, authenticated;
