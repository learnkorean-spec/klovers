-- A group moves up together. Re, 27 Nov 2026: when the Hangul group finishes,
-- the group goes to Level 1 as a group, after the LAST student finishes, not
-- each student the moment her own classes run out.
--
-- The per-student move from 20261127120000 is kept, renamed
-- move_member_to_next_level. promote_if_level_finished is now the group-level
-- decision the charge trigger calls:
--   * this student not finished        -> nothing
--   * finished, but a PAID classmate has not -> she waits in the group, and her
--     future unconfirmed class rows are removed so no extra class is pre-filled
--     and charged to her past her package (that would open a renewal and send
--     a payment ask)
--   * everyone paid has finished       -> every finished member moves together
-- Unpaid members never hold the group back.
--
-- Do not confirm a waiting student's attendance for an extra class: it is
-- charged past her package and the existing roll_enrolment_if_overdrawn opens a
-- renewal for it.

alter function app_private.promote_if_level_finished(uuid) rename to move_member_to_next_level;

create or replace function app_private.level_done_count(_user_id uuid, _group_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare _m record; _needed integer; _done integer;
begin
  select m.joined_at, m.enrollment_id, sp.level into _m
    from public.pkg_group_members m
    join public.pkg_groups g on g.id = m.group_id
    join public.schedule_packages sp on sp.id = g.package_id
   where m.user_id = _user_id and m.group_id = _group_id and m.member_status = 'active';
  if not found then return null; end if;
  _needed := app_private.level_class_count(_m.level);
  if _needed is null then return null; end if;

  select count(*) into _done
    from public.pkg_class_charges c
    join public.pkg_group_sessions s on s.id = c.session_id
    join public.pkg_groups g on g.id = s.group_id
    join public.schedule_packages sp on sp.id = g.package_id
   where c.user_id = _user_id and c.charge_type = 'paid_session'
     and sp.level = _m.level and c.created_at >= _m.joined_at;

  return greatest(_done, coalesce((
    select e.classes_included - e.sessions_remaining
      from public.enrollments e
     where e.id = _m.enrollment_id and e.classes_included >= _needed
  ), 0));
end;
$$;

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
    select m.user_id from public.pkg_group_members m
     where m.group_id = _seat.group_id and m.member_status = 'active'
     order by m.joined_at
  loop
    if coalesce(app_private.level_done_count(_o.user_id, _seat.group_id), 0) >= _needed then
      _results := _results || jsonb_build_array(app_private.move_member_to_next_level(_o.user_id));
    end if;
  end loop;

  return jsonb_build_object('status', 'group_moved', 'moves', _results);
end;
$$;

revoke all on function app_private.promote_if_level_finished(uuid) from public, anon, authenticated;
revoke all on function app_private.move_member_to_next_level(uuid) from public, anon, authenticated;
revoke all on function app_private.level_done_count(uuid, uuid) from public, anon, authenticated;
