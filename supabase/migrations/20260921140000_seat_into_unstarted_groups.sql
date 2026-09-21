-- Seating a student into a group that has not started yet.
--
-- `enforce_group_membership_guard` refused any assignment to a group with
-- is_active = false. That read as a safety rail and behaved as a deadlock:
--
--   * GroupsToStart deliberately lists inactive groups ("Groups now load
--     regardless of is_active") because a group that was never activated is
--     exactly the one still waiting to be started;
--   * its "Start this group" button both activates AND starts the group in
--     one call to activate_pkg_group;
--   * but starting is what gives seated students their first_class_date, so
--     the sensible order is fill the group, then start it;
--   * and this guard made the fill step impossible. "Add student" on
--     "Hangul - Arabic track - Wednesday 15:00 Cairo" failed with
--     "this group is not active", with no way from that screen to make it
--     active other than starting it empty first.
--
-- is_active is not a "has started" flag -- eight groups here are active with
-- no start_date at all -- so refusing on it never meant what the message
-- said. What it should refuse is a class that ran and was then switched off:
-- deactivated AFTER starting. That is an archived group, and seating someone
-- into it is a mistake. A group that is inactive and has never started is a
-- group being prepared, and seating someone into it is the whole point.
--
-- Everything else in the guard is untouched: the enrolment must still exist,
-- be APPROVED, be PAID or PENDING_PAYMENT, and the group must still have a
-- free seat.

create or replace function public.enforce_group_membership_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _group        record;
  _enrollment   record;
  _active_count integer;
  _capacity     integer;
begin
  if new.member_status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.member_status = 'active'
     and old.enrollment_id is not distinct from new.enrollment_id
     and old.group_id = new.group_id
  then
    return new;
  end if;

  select * into _group from public.pkg_groups where id = new.group_id for update;

  if not found then
    raise exception 'Cannot assign student: group % does not exist.', new.group_id;
  end if;

  -- See the note at the top: inactive AND already started = archived, and
  -- still refused. Inactive and never started = being filled before it is
  -- started, which is allowed.
  if not _group.is_active and _group.start_date is not null then
    raise exception 'Cannot assign student to "%": this group ran and was then deactivated. Reactivate it first if the class is coming back.', coalesce(_group.name, _group.id::text);
  end if;

  -- Resolve rather than refuse. Same preference order as
  -- assign_student_to_group: her enrolment for this very package first, then
  -- the most recent live, approved, payable group enrolment.
  if new.enrollment_id is null then
    select e.id into new.enrollment_id
      from public.enrollments e
     where e.user_id = new.user_id
       and e.deleted_at is null
       and coalesce(e.enrollment_status, 'active') = 'active'
       and coalesce(e.plan_type, 'group') = 'group'
       and e.approval_status = 'APPROVED'
       and e.payment_status in ('PAID', 'PENDING_PAYMENT')
     order by (e.package_id = _group.package_id) desc, e.created_at desc
     limit 1;
  end if;

  if new.enrollment_id is null then
    raise exception 'Cannot assign student to "%": she has no approved enrolment for a seat to hang on. Confirm her into the class from the Enrollments screen, which opens one.', coalesce(_group.name, _group.id::text);
  end if;

  select * into _enrollment from public.enrollments where id = new.enrollment_id;

  if not found then
    raise exception 'Cannot assign student to "%": linked enrollment % does not exist.', coalesce(_group.name, _group.id::text), new.enrollment_id;
  end if;

  if _enrollment.approval_status is distinct from 'APPROVED' then
    raise exception 'Cannot assign student to "%": enrollment is not approved (status: %).', coalesce(_group.name, _group.id::text), _enrollment.approval_status;
  end if;

  if _enrollment.payment_status not in ('PAID', 'PENDING_PAYMENT') then
    raise exception 'Cannot assign student to "%": enrollment is neither paid nor confirmed (status: %).', coalesce(_group.name, _group.id::text), _enrollment.payment_status;
  end if;

  _capacity := coalesce(_group.capacity, 8);

  select count(*) into _active_count
    from public.pkg_group_members
   where group_id = new.group_id
     and member_status = 'active'
     and user_id <> new.user_id;

  if _active_count >= _capacity then
    raise exception 'Cannot assign student to "%": group is full (%/% seats taken).', coalesce(_group.name, _group.id::text), _active_count, _capacity;
  end if;

  return new;
end;
$function$;
