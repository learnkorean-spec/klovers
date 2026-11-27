-- Automatic level progression: when a student has been charged for every class
-- of her level, she is moved into the next level's group and that group is
-- opened if it does not exist yet.
--
-- Level lengths mirror src/constants/levels.ts: Hangul is 4 classes, l1..l5 are
-- 24. l6 is the top of the ladder, so nothing follows it.
--
-- "Finished" is the larger of two counts: paid_session charges since she joined
-- her current seat (so a retaken level is not counted twice), and the classes
-- already taken off the seat's own enrolment when that enrolment is the whole
-- level (Hangul is a 4-class enrolment).
--
-- It runs as a DEFERRED constraint trigger, i.e. at commit, AFTER
-- handle_pkg_attendance_approval has taken the class off her enrollment. That
-- trigger looks up her ACTIVE seat to find which enrollment to debit; moving the
-- seat first would make it debit the new level's enrollment instead.
--
-- It never blocks attendance: any failure inside is caught and becomes a
-- warning. The new enrollment is PENDING_PAYMENT, so she shows as unpaid on the
-- Payments & classes board until Re marks it paid there.

create or replace function app_private.next_level_key(_level text)
returns text
language sql
immutable
set search_path = public
as $$
  select case _level
    when 'hangul' then 'l1'
    when 'l1' then 'l2'
    when 'l2' then 'l3'
    when 'l3' then 'l4'
    when 'l4' then 'l5'
    when 'l5' then 'l6'
    else null
  end
$$;

create or replace function app_private.level_class_count(_level text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case when _level = 'hangul' then 4
              when _level in ('l1','l2','l3','l4','l5','l6') then 24
              else null end
$$;

create or replace function app_private.promote_if_level_finished(_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _seat      record;
  _next      text;
  _needed    integer;
  _done      integer;
  _pkg       record;
  _group     record;
  _enroll    uuid;
  _name      text;
  _old_name  text;
begin
  -- Her current seat in a group class, newest first.
  select m.group_id, m.joined_at, m.enrollment_id, g.name as group_name, sp.level, sp.day_of_week
    into _seat
    from public.pkg_group_members m
    join public.pkg_groups g on g.id = m.group_id
    join public.schedule_packages sp on sp.id = g.package_id
   where m.user_id = _user_id
     and m.member_status = 'active'
   order by m.joined_at desc
   limit 1;
  if not found then return jsonb_build_object('status', 'no_seat'); end if;

  _next   := app_private.next_level_key(_seat.level);
  _needed := app_private.level_class_count(_seat.level);
  if _next is null or _needed is null then
    return jsonb_build_object('status', 'top_level');
  end if;

  select count(*) into _done
    from public.pkg_class_charges c
    join public.pkg_group_sessions s on s.id = c.session_id
    join public.pkg_groups g on g.id = s.group_id
    join public.schedule_packages sp on sp.id = g.package_id
   where c.user_id = _user_id
     and c.charge_type = 'paid_session'
     and sp.level = _seat.level
     and c.created_at >= _seat.joined_at;
  -- A class can be on her enrolment without a charge dated after she joined (a
  -- seat re-made mid-period, as Aya Arafa's was: one of her four classes is
  -- older than her seat). So the enrolment's own count counts too, when that
  -- enrolment is the whole level.
  select greatest(_done, coalesce((
           select e.classes_included - e.sessions_remaining
             from public.enrollments e
            where e.id = _seat.enrollment_id
              and e.classes_included >= _needed
         ), 0))
    into _done;

  if _done < _needed then
    return jsonb_build_object('status', 'not_finished', 'done', _done, 'needed', _needed);
  end if;

  select coalesce(nullif(pr.name, ''), pr.email, _user_id::text) into _name
    from public.profiles pr where pr.user_id = _user_id;

  -- Already has a seat at the next level (or beyond): nothing to do.
  if exists (
    select 1
      from public.pkg_group_members m
      join public.pkg_groups g on g.id = m.group_id
      join public.schedule_packages sp on sp.id = g.package_id
     where m.user_id = _user_id and m.member_status = 'active'
       and sp.level = _next
  ) then
    return jsonb_build_object('status', 'already_moved');
  end if;

  -- An open class time at the next level with a free seat. Same weekday first,
  -- then the fullest group, so a half-full group fills before a new one opens.
  select p.* into _pkg
    from public.schedule_packages p
   where p.level = _next
     and coalesce(p.is_active, false)
     and coalesce(p.course_type, 'group') = 'group'
     and coalesce((
           select count(*) from public.pkg_group_members m
             join public.pkg_groups g on g.id = m.group_id
            where g.package_id = p.id and g.is_active and m.member_status = 'active'
         ), 0) < coalesce(p.capacity, 8)
   order by (p.day_of_week = _seat.day_of_week) desc,
            coalesce((
              select count(*) from public.pkg_group_members m
                join public.pkg_groups g on g.id = m.group_id
               where g.package_id = p.id and g.is_active and m.member_status = 'active'
            ), 0) desc,
            p.start_time
   limit 1;

  if not found then
    -- Tell Re once; do not move her anywhere.
    if not exists (
      select 1 from public.admin_notifications n
       where n.type = 'level_ready' and n.related_user_id = _user_id
         and n.message like '%' || upper(_next) || '%'
         and n.created_at > now() - interval '30 days'
    ) then
      insert into public.admin_notifications (message, type, category, related_user_id)
      values (_name || ' finished ' || upper(_seat.level) || ' (' || _needed
              || ' classes) but there is no open ' || upper(_next)
              || ' class time with a free seat. Open one and confirm her into it.',
              'level_ready', 'update', _user_id);
    end if;
    return jsonb_build_object('status', 'no_open_class_time', 'next_level', _next);
  end if;

  -- The group for that class time: one active group per package, created on
  -- first use (same rule as admin_confirm_student_into_group).
  select g.* into _group
    from public.pkg_groups g
   where g.package_id = _pkg.id and g.is_active
   order by g.created_at
   limit 1
     for update;
  if not found then
    begin
      insert into public.pkg_groups (package_id, name, capacity)
      values (
        _pkg.id,
        initcap(replace(coalesce(_pkg.level, 'class'), '_', ' '))
          || ' - ' || btrim(to_char(date '2026-01-04' + coalesce(_pkg.day_of_week, 0), 'Dy'))
          || ' ' || coalesce(substring(_pkg.start_time::text from 1 for 5), 'TBA'),
        coalesce(_pkg.capacity, 8)
      )
      returning * into _group;
    exception when unique_violation then
      select g.* into _group
        from public.pkg_groups g
       where g.package_id = _pkg.id and g.is_active
       order by g.created_at limit 1 for update;
      if not found then
        return jsonb_build_object('status', 'group_race');
      end if;
    end;
  end if;

  -- A fresh enrollment for the new level. manual + amount 0 is the same shape
  -- admin_confirm_student_into_group makes; it stays PENDING_PAYMENT until Re
  -- marks it paid on the Payments & classes board.
  insert into public.enrollments (
    user_id, plan_type, duration, classes_included, amount, currency,
    payment_provider, payment_status, approval_status,
    level, package_id, slot_id, matched_at, timezone
  ) values (
    _user_id, 'group', 1, 4, 0, 'EGP',
    'manual', 'PENDING_PAYMENT', 'APPROVED',
    _next, _pkg.id, _pkg.id, now(), 'Africa/Cairo'
  )
  returning id into _enroll;

  -- Close the old seat and the classes still pre-filled for it.
  update public.pkg_group_members
     set member_status = 'completed'
   where user_id = _user_id and group_id = _seat.group_id and member_status = 'active';

  delete from public.pkg_attendance a
   using public.pkg_group_sessions s
   where a.session_id = s.id
     and s.group_id = _seat.group_id
     and a.user_id = _user_id
     and s.session_date >= current_date
     and a.admin_approved is not true;

  -- Open the new seat.
  insert into public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
  values (_group.id, _user_id, 'active', _enroll)
  on conflict (group_id, user_id)
  do update set member_status = 'active', enrollment_id = excluded.enrollment_id;

  update public.profiles
     set level = _next, course_level_key = _next
   where user_id = _user_id;

  -- related_group_id is not set: its foreign key points at student_groups, not
  -- pkg_groups, so a pkg group id would be rejected.
  insert into public.admin_notifications (message, type, category, related_user_id)
  values (_name || ' finished ' || upper(_seat.level) || ' and was moved to ' || coalesce(_group.name, upper(_next))
          || '. Her new enrolment is unpaid until you mark it paid.',
          'level_up', 'update', _user_id);

  return jsonb_build_object(
    'status', 'moved', 'from_level', _seat.level, 'to_level', _next,
    'group_id', _group.id, 'enrollment_id', _enroll
  );
end;
$$;

revoke all on function app_private.promote_if_level_finished(uuid) from public, anon, authenticated;
revoke all on function app_private.next_level_key(text) from public, anon, authenticated;
revoke all on function app_private.level_class_count(text) from public, anon, authenticated;

create or replace function app_private.tg_promote_after_charge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.charge_type = 'paid_session' then
    begin
      perform app_private.promote_if_level_finished(new.user_id);
    exception when others then
      -- Attendance must never fail because of this.
      raise warning 'level progression skipped for %: %', new.user_id, sqlerrm;
    end;
  end if;
  return null;
end;
$$;

revoke all on function app_private.tg_promote_after_charge() from public, anon, authenticated;

drop trigger if exists trg_promote_after_charge on public.pkg_class_charges;
create constraint trigger trg_promote_after_charge
  after insert on public.pkg_class_charges
  deferrable initially deferred
  for each row
  execute function app_private.tg_promote_after_charge();
