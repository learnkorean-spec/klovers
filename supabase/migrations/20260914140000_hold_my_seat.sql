-- A student can hold her own place before she pays.
--
-- Until now the only way into a group was Re pressing a button
-- (admin_confirm_student_into_group, 20260910120000). A student who had decided
-- and wanted to book had no route at all, so the enrolment payment form was
-- used as a waiting list -- with a made-up transaction reference, because the
-- form demands one. That is a system forcing people to lie to it in order to
-- use it, and it makes the PAYMENTS queue meaningless.
--
-- The seat is real, not a request. Eight groups exist and nobody is seated in
-- any of them, so a held seat costs nothing that a paying student wanted; the
-- friction of a second approval step costs more, in a funnel where three of
-- fifty-six people answered an email. When a group actually reaches 8 of 8,
-- revisit this with a number to justify the decision.
--
-- The enrolment is APPROVED / PENDING_PAYMENT -- she has a place and she still
-- owes for it -- so she stays in the Today dashboard's PAYMENTS count. No
-- approval letter fires: email_student_on_approval requires PAID as well.
--
-- One seat per student. A level's two days are ALTERNATIVES -- one class a week
-- (see claude/SLOTS_ARE_ALTERNATIVES_2026-09-11.md) -- so choosing a slot moves
-- her rather than adding a second. student_package_preferences is upserted on
-- user_id alone for the same reason, and this keeps the two in step.
--
-- Note on the class link: seating her sends it, via the trigger added in
-- 20260910120000, if the group has a meeting_url. That is deliberate -- it is
-- the whole point of removing the second step -- but it does mean a self-held
-- seat gets the room before any money arrives. If that ever becomes a problem,
-- changing the room re-sends the new link to the whole group automatically.

create or replace function public.hold_my_seat(_package_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _user_id    uuid;
  _pkg        record;
  _group      record;
  _enrollment record;
  _level      text;
  _seated     integer;
  _capacity   integer;
  _existing   boolean;
begin
  _user_id := auth.uid();
  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  select p.* into _pkg from public.schedule_packages p where p.id = _package_id;
  if not found then
    raise exception 'No such class time.';
  end if;
  if not coalesce(_pkg.is_active, false) then
    raise exception 'That class time is not open.';
  end if;
  if coalesce(_pkg.course_type, 'group') <> 'group' then
    raise exception 'Only a group class can be held this way.';
  end if;

  -- The package is the time; the group is the seat. One active group per
  -- package, created on first use. The unique index added in 20260910120000
  -- closes the race, so a lost insert is caught rather than duplicated.
  select g.* into _group
    from public.pkg_groups g
   where g.package_id = _package_id
     and g.is_active
   order by g.created_at
   limit 1
     for update;

  if not found then
    begin
      insert into public.pkg_groups (package_id, name, capacity)
      values (
        _package_id,
        initcap(replace(coalesce(_pkg.level, 'class'), '_', ' '))
          || ' - ' || btrim(to_char(date '2026-01-04' + coalesce(_pkg.day_of_week, 0), 'Dy'))
          || ' ' || coalesce(substring(_pkg.start_time::text from 1 for 5), 'TBA'),
        coalesce(_pkg.capacity, 8)
      )
      returning * into _group;
    exception when unique_violation then
      select g.* into _group
        from public.pkg_groups g
       where g.package_id = _package_id
         and g.is_active
       order by g.created_at
       limit 1
         for update;
      if not found then
        raise exception 'Could not open a group for this class time -- another change is in flight. Try again.';
      end if;
    end;
  end if;

  _capacity := coalesce(_group.capacity, 8);

  -- Capacity, checked before anything is written so the student gets a sentence
  -- she can act on rather than the membership guard's internal wording. Her own
  -- row is excluded: re-picking the slot she already holds is not a new seat.
  select count(*) into _seated
    from public.pkg_group_members m
   where m.group_id = _group.id
     and m.member_status = 'active'
     and m.user_id <> _user_id;

  if _seated >= _capacity then
    raise exception 'group_full'
      using hint = 'This class time is full. Pick the other day for your level.';
  end if;

  -- A student who has already PAID for a different class must not be able to
  -- move herself out of it. One seat per student means the seat she is holding
  -- would be released to take this one -- and she would end up unpaid in a class
  -- she did not buy, having lost the one she did. Moving a paying student is a
  -- decision for Re, through the admin path, where the paid enrolment is
  -- handled deliberately.
  if exists (
    select 1
      from public.enrollments e
     where e.user_id = _user_id
       and e.deleted_at is null
       and coalesce(e.enrollment_status, 'active') = 'active'
       and e.payment_status = 'PAID'
       and e.package_id is not null
       and e.package_id <> _package_id
  ) then
    raise exception 'paid_elsewhere'
      using hint = 'You have already paid for a different class time. Message us and we will move you.';
  end if;

  select coalesce(nullif(pr.course_level_key, ''), nullif(pr.level, ''), '')
    into _level
    from public.profiles pr
   where pr.user_id = _user_id;

  -- A PAID enrolment is a financial record and is never repointed here: it is
  -- reused only if it is for this package or for none, and its level is left as
  -- she bought it. Anything else opens its own PENDING_PAYMENT row.
  select e.* into _enrollment
    from public.enrollments e
   where e.user_id = _user_id
     and e.deleted_at is null
     and coalesce(e.enrollment_status, 'active') = 'active'
     and coalesce(e.plan_type, 'group') = 'group'
     and (
       e.payment_status is distinct from 'PAID'
       or e.package_id is null
       or e.package_id = _package_id
     )
   order by e.created_at desc
   limit 1;

  if not found then
    -- payment_provider 'manual' is what lets validate_enrollment() skip the
    -- price and duration checks: she has not chosen a plan yet, and this is not
    -- the moment to make her.
    insert into public.enrollments (
      user_id, plan_type, duration, classes_included, amount, currency,
      payment_provider, payment_status, approval_status,
      level, package_id, slot_id, matched_at, timezone
    ) values (
      _user_id, 'group', 1, 4, 0, 'EGP',
      'manual', 'PENDING_PAYMENT', 'APPROVED',
      nullif(_level, ''), _package_id, _package_id, now(), 'Africa/Cairo'
    )
    returning * into _enrollment;
  else
    update public.enrollments e
       set approval_status = 'APPROVED',
           payment_status  = case when e.payment_status = 'PAID' then 'PAID' else 'PENDING_PAYMENT' end,
           package_id      = _package_id,
           slot_id         = _package_id,
           level           = case when e.payment_status = 'PAID'
                                  then e.level
                                  else coalesce(nullif(_level, ''), e.level) end,
           matched_at      = coalesce(e.matched_at, now())
     where e.id = _enrollment.id
    returning e.* into _enrollment;
  end if;

  -- One seat. Choosing a slot is choosing between a level's days, not adding to
  -- them, so any other seat she holds is released first.
  delete from public.pkg_group_members m
   where m.user_id = _user_id
     and m.group_id <> _group.id;

  select exists (
    select 1 from public.pkg_group_members m
     where m.group_id = _group.id and m.user_id = _user_id
  ) into _existing;

  if _existing then
    update public.pkg_group_members m
       set member_status = 'active',
           enrollment_id = _enrollment.id
     where m.group_id = _group.id
       and m.user_id  = _user_id;
  else
    insert into public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
    values (_group.id, _user_id, 'active', _enrollment.id);
  end if;

  -- Keep the preference in step with the seat: MySchedulePage and
  -- SchedulePicker read this table, and a seat the picker does not know about
  -- shows her an empty schedule after she just booked one.
  -- The level stored here is the CLASS's level, not the profile's. They can
  -- disagree -- a student placed at level_2 whose profile still carries the
  -- level_1 she guessed at signup -- and this column carries a foreign key to
  -- course_levels, so it must be a real key and it should describe the class she
  -- actually chose.
  if _pkg.level is null or btrim(_pkg.level) = '' then
    raise exception 'That class time has no level set; it cannot be booked yet.';
  end if;

  insert into public.student_package_preferences (user_id, level, package_id, requested_at, updated_at)
  values (_user_id, _pkg.level, _package_id, now(), now())
  on conflict (user_id) do update
    set level      = excluded.level,
        package_id = excluded.package_id,
        updated_at = now();

  select count(*) into _seated
    from public.pkg_group_members m
   where m.group_id = _group.id
     and m.member_status = 'active';

  return jsonb_build_object(
    'group_id',       _group.id,
    'group_name',     _group.name,
    'has_link',       _group.meeting_url is not null and btrim(_group.meeting_url) <> '',
    'enrollment_id',  _enrollment.id,
    'payment_status', _enrollment.payment_status,
    'day_of_week',    _pkg.day_of_week,
    'start_time',     substring(_pkg.start_time::text from 1 for 5),
    'timezone',       coalesce(_pkg.timezone, 'Africa/Cairo'),
    'seated',         _seated,
    'capacity',       _capacity,
    'seats_left',     greatest(0, _capacity - _seated)
  );
end;
$function$;

revoke all on function public.hold_my_seat(uuid) from public;
grant execute on function public.hold_my_seat(uuid) to authenticated;
