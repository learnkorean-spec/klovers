-- Re, 27 Nov 2026: a class taught to a student who has already finished her
-- level (while she waits for her group to move up) is NOT free: she owes it.
--
-- 20261127170000 cleared that class back to 0 when the group moved. Now the
-- negative balance moves with her: the old (paid) enrolment goes to 0 and her
-- new level's enrolment starts at that negative number. admin_mark_enrollment_paid
-- adds classes_included to it when she pays, so a 4-class payment leaves her
-- with 3. Tested in a rolled-back transaction on Aya Arafa: extra class,
-- group moves, new Level 1 enrolment at -1, old one at 0.

create or replace function app_private.promote_if_level_finished(_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare _seat record; _needed integer; _o record; _mv jsonb; _debt integer; _results jsonb := '[]'::jsonb;
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
      _mv := app_private.move_member_to_next_level(_o.user_id);
      _results := _results || jsonb_build_array(_mv);
      select e.sessions_remaining into _debt from public.enrollments e where e.id = _o.enrollment_id;
      if coalesce(_debt, 0) < 0 and _mv->>'status' = 'moved' then
        update public.enrollments set sessions_remaining = 0 where id = _o.enrollment_id;
        update public.enrollments set sessions_remaining = _debt where id = (_mv->>'enrollment_id')::uuid;
      end if;
    end if;
  end loop;

  return jsonb_build_object('status', 'group_moved', 'moves', _results);
end;
$$;

revoke all on function app_private.promote_if_level_finished(uuid) from public, anon, authenticated;
