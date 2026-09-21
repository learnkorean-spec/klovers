-- A seat inserted with enrollment_id NULL used to be refused outright
-- ("no enrollment is linked to this membership"). The admin "Add student"
-- list (GroupsToStart.tsx) builds its candidate pool from enrolments that are
-- still unmatched (matched_at IS NULL), so a student who HAS an approved paid
-- enrolment but was unseated (matched_at left set) fell into the accounts-only
-- pool and was offered with enrollment_id = null -- and could never be seated.
-- Aya Arafa, the one paying group student, is exactly that case.
--
-- The guard now resolves the enrolment itself, by the same rule
-- assign_student_to_group uses (this group's package first, then most recent),
-- and only refuses when there genuinely is none. Every other rule -- group
-- exists, group active, approval, payment, capacity -- is unchanged.
--
-- Applied to production 2026-09-21 before being committed here.
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
  -- Only guard rows that occupy a real seat. Waitlist rows pass through untouched.
  if new.member_status <> 'active' then
    return new;
  end if;

  -- An already-seated member being edited in some other way -- stamping
  -- class_link_sent_at, say -- takes no new seat.
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

  if not _group.is_active then
    raise exception 'Cannot assign student to "%": this group is not active.', coalesce(_group.name, _group.id::text);
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

  -- PAID is the automated matcher's path; PENDING_PAYMENT is Re deciding by
  -- hand that a student may start before the money arrives. Everything else --
  -- UNPAID, FAILED, REFUNDED -- still cannot take a seat.
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
