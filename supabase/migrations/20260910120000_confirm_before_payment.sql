-- Confirming a student into a class before she has paid, and giving her the link.
--
-- Three things were in the way of what Re actually does with a student who
-- finished a trial and said yes:
--
--   1. A group class had nowhere to keep its joining link. `meeting_url` exists
--      on trial_slots and on teacher_students (private lessons) and nowhere
--      else, so there was no link to send even if something had wanted to.
--
--   2. `enforce_group_membership_guard` refused any seat without an enrollment
--      that was both APPROVED and PAID. That is the right rule for an automated
--      matcher and the wrong one for a person who has decided to let a student
--      start. The guard now accepts PENDING_PAYMENT as well -- a state that says
--      "confirmed, still owes" rather than "not confirmed".
--
--   3. `email_student_on_group_assignment` posted to
--      rahpkflknkofuuhnbfyc.supabase.co -- the retired Lovable project, with its
--      anon key baked into the function body. Every other emailer moved to this
--      project; this one did not, so no student has ever been told by it that
--      she is in a group. It now goes through app_private.invoke_edge like the
--      rest, sending the `class_link` template -- the one that already carries a
--      joining link and a calendar attachment.
--
-- What this does NOT do: it does not mark anyone paid. A student confirmed this
-- way sits at APPROVED / PENDING_PAYMENT, which is what the Today dashboard's
-- PAYMENTS card counts, so she stays visible as owing.

-- ---------------------------------------------------------------------------
-- 1. Where the link lives
-- ---------------------------------------------------------------------------

alter table public.pkg_groups
  add column if not exists meeting_url text;

comment on column public.pkg_groups.meeting_url is
  'The recurring room for this group. NULL means no link yet: a student confirmed into it is seated and sent nothing until the link is filled in, at which point she is sent it.';

alter table public.pkg_group_members
  add column if not exists class_link_sent_at timestamptz;

comment on column public.pkg_group_members.class_link_sent_at is
  'When this member was sent the group joining link. Checked before every send, so no member is ever told twice.';

-- A group with a NULL capacity silently disabled the capacity guard --
-- `_active_count >= NULL` is NULL, never true, so the group would seat forever.
-- New groups get the package capacity; the rows already in the table predate
-- that and are backfilled here.
update public.pkg_groups g
   set capacity = coalesce(p.capacity, 8)
  from public.schedule_packages p
 where p.id = g.package_id
   and g.capacity is null;

update public.pkg_groups
   set capacity = 8
 where capacity is null;

alter table public.pkg_groups
  alter column capacity set default 8;

-- One active group per package. Both the RPC below and assign_student_to_group
-- create a group when they find none, and two callers arriving together would
-- each find none and each insert one.
--
-- The old code had exactly that race, so duplicates may already exist, and
-- `if not exists` on the index does not help with duplicate DATA -- it only
-- skips when the index itself is already there. Anything past the oldest is
-- deactivated first, keeping its rows rather than deleting them. There were no
-- duplicates when this was written; this is here so the deploy cannot fail on
-- one appearing in between.
update public.pkg_groups g
   set is_active = false
 where g.is_active
   and exists (
     select 1
       from public.pkg_groups keep
      where keep.package_id = g.package_id
        and keep.is_active
        and (keep.created_at, keep.id) < (g.created_at, g.id)
   );

-- A member of a group that was just closed is not seated any more. Left as
-- 'active' she would count against nothing and show up in no roster, so she is
-- moved to the waitlist of the group she was in -- visible, recoverable, and
-- not occupying a seat in a class that no longer runs.
update public.pkg_group_members m
   set member_status = 'waitlist'
  from public.pkg_groups g
 where g.id = m.group_id
   and not g.is_active
   and m.member_status = 'active';

create unique index if not exists uq_pkg_groups_one_active_per_package
  on public.pkg_groups (package_id)
  where is_active;

-- ---------------------------------------------------------------------------
-- 2. The guard learns the difference between "not paid" and "not confirmed"
-- ---------------------------------------------------------------------------

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
  -- class_link_sent_at, say -- takes no new seat, and re-running the capacity
  -- count would lock the group again for nothing. A change of enrollment_id is
  -- not "some other way" and still gets checked.
  --
  -- This deliberately does NOT re-check `is_active`. An earlier draft did, and
  -- it made a closed group's member rows almost immutable: archiving a group and
  -- changing its link in one statement was rejected, and the error named a
  -- member row rather than the thing the admin had done. Nothing here takes a
  -- seat that was not already taken, so there is nothing for that check to
  -- protect.
  if tg_op = 'UPDATE'
     and old.member_status = 'active'
     and old.enrollment_id is not distinct from new.enrollment_id
     and old.group_id = new.group_id
  then
    return new;
  end if;

  -- Lock the group row so two concurrent assignments serialize here instead
  -- of both reading "seat available" before either commits.
  select * into _group from public.pkg_groups where id = new.group_id for update;

  if not found then
    raise exception 'Cannot assign student: group % does not exist.', new.group_id;
  end if;

  if not _group.is_active then
    raise exception 'Cannot assign student to "%": this group is not active.', coalesce(_group.name, _group.id::text);
  end if;

  if new.enrollment_id is null then
    raise exception 'Cannot assign student to "%": no enrollment is linked to this membership.', coalesce(_group.name, _group.id::text);
  end if;

  select * into _enrollment from public.enrollments where id = new.enrollment_id;

  if not found then
    raise exception 'Cannot assign student to "%": linked enrollment % does not exist.', coalesce(_group.name, _group.id::text), new.enrollment_id;
  end if;

  if _enrollment.approval_status is distinct from 'APPROVED' then
    raise exception 'Cannot assign student to "%": enrollment is not approved (status: %).', coalesce(_group.name, _group.id::text), _enrollment.approval_status;
  end if;

  -- The one changed rule. PAID is the automated matcher's path; PENDING_PAYMENT
  -- is Re deciding by hand that a student may start before the money arrives.
  -- Everything else -- UNPAID, FAILED, REFUNDED -- still cannot take a seat.
  if _enrollment.payment_status not in ('PAID', 'PENDING_PAYMENT') then
    raise exception 'Cannot assign student to "%": enrollment is neither paid nor confirmed (status: %).', coalesce(_group.name, _group.id::text), _enrollment.payment_status;
  end if;

  -- Capacity check, excluding this row itself so re-saving an already-active
  -- member doesn't double-count. A NULL capacity would make this comparison
  -- NULL and let the group grow without limit, so it falls back rather than
  -- silently passing.
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

-- ---------------------------------------------------------------------------
-- 3. Sending the link
-- ---------------------------------------------------------------------------

-- One place that decides whether a member may be told, so the two triggers
-- below cannot disagree. Returns true if it sent.
create or replace function public.fn_send_group_class_link(_group_id uuid, _user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _group   record;
  _pkg     record;
  _profile record;
  _member  record;
  _lang    text;
  _day     text;
begin
  select m.* into _member
    from public.pkg_group_members m
   where m.group_id = _group_id and m.user_id = _user_id;

  if not found or _member.member_status <> 'active' or _member.class_link_sent_at is not null then
    return false;
  end if;

  select g.* into _group from public.pkg_groups g where g.id = _group_id;
  if not found then
    return false;
  end if;

  -- A closed group sends nothing, whatever its members' rows still say.
  -- Deactivating a group does not currently waitlist the people in it, so
  -- `member_status = 'active'` alone is not proof that the class still runs --
  -- and "here is your joining link" for a class that was archived in the same
  -- statement is the worst email in the set. This returns false rather than
  -- raising: it is a reason not to send, not an error in what the admin did.
  if not coalesce(_group.is_active, false) then
    return false;
  end if;

  -- No room, no email. The `class_link` template rejects an empty
  -- class_link_url with a 400, and a student told "your class is ready" with no
  -- way in is worse than being told nothing yet.
  if _group.meeting_url is null or btrim(_group.meeting_url) = '' then
    return false;
  end if;

  select p.* into _pkg from public.schedule_packages p where p.id = _group.package_id;

  select pr.name, pr.email, pr.language
    into _profile
    from public.profiles pr
   where pr.user_id = _user_id;

  if _profile.email is null then
    return false;
  end if;

  _lang := coalesce(nullif(_profile.language, ''), 'ar');
  -- to_char(..., 'Day') blank-pads to nine characters. That padding would go
  -- straight into the email as "Sunday   ".
  _day  := btrim(to_char(date '2026-01-04' + coalesce(_pkg.day_of_week, 0), 'Day'));

  perform app_private.invoke_edge(
    'send-confirmation-email',
    jsonb_build_object(
      'template',       'class_link',
      'email',          _profile.email,
      'name',           coalesce(_profile.name, ''),
      'language',       _lang,
      'class_link_url', btrim(_group.meeting_url),
      'slot_day',       _day,
      'slot_time',      coalesce(substring(_pkg.start_time::text from 1 for 5), ''),
      'slot_timezone',  coalesce(_pkg.timezone, 'Africa/Cairo'),
      'group_name',     coalesce(_group.name, '')
    )
  );

  update public.pkg_group_members m
     set class_link_sent_at = now()
   where m.group_id = _group_id
     and m.user_id  = _user_id;

  return true;
end;
$function$;

create or replace function public.email_student_on_group_assignment()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.member_status = 'active' then
    perform public.fn_send_group_class_link(new.group_id, new.user_id);
  end if;
  return new;
end;
$function$;

-- The old trigger was INSERT only, so a student seated by an UPDATE -- which is
-- what promoting a waitlist row is -- got nothing. The `of member_status`
-- scoping matters: fn_send_group_class_link stamps class_link_sent_at on this
-- same table, and an unscoped trigger would re-enter itself.
drop trigger if exists trg_email_student_on_group_assignment on public.pkg_group_members;

create trigger trg_email_student_on_group_assignment
  after insert or update of member_status on public.pkg_group_members
  for each row
  execute function public.email_student_on_group_assignment();

-- The order this actually happens in: the group is created, students are seated,
-- and only then does Re open Meet and paste the link. Without this, everyone
-- already seated is silently never told.
create or replace function public.email_group_members_on_link_set()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _m record;
begin
  if new.meeting_url is null or btrim(new.meeting_url) = '' then
    return new;
  end if;
  if old.meeting_url is not distinct from new.meeting_url then
    return new;
  end if;

  -- A CHANGED link, not just a first one. If Re regenerates the room, everyone
  -- already in the group is holding a dead link, so their "already sent" stamp
  -- is cleared and they are sent the new one. Clearing it here rather than
  -- loosening the check inside fn_send_group_class_link keeps "never told the
  -- same link twice" true.
  --
  -- No condition on the old value. Blanking the field and filling it in again is
  -- what someone does when a room is revoked before its replacement exists, and
  -- an earlier draft that only cleared stamps when the old link was non-empty
  -- left exactly those students holding the dead one. For a first-time set the
  -- stamps are already null and this changes nothing.
  update public.pkg_group_members m
     set class_link_sent_at = null
   where m.group_id = new.id
     and m.member_status = 'active'
     and m.class_link_sent_at is not null;

  for _m in
    select m.user_id
      from public.pkg_group_members m
     where m.group_id = new.id
       and m.member_status = 'active'
       and m.class_link_sent_at is null
  loop
    perform public.fn_send_group_class_link(new.id, _m.user_id);
  end loop;

  return new;
end;
$function$;

drop trigger if exists trg_email_group_members_on_link_set on public.pkg_groups;

create trigger trg_email_group_members_on_link_set
  after update of meeting_url on public.pkg_groups
  for each row
  execute function public.email_group_members_on_link_set();

-- ---------------------------------------------------------------------------
-- 4. The button Re presses
-- ---------------------------------------------------------------------------

create or replace function public.admin_confirm_student_into_group(
  _user_id    uuid,
  _package_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _pkg        record;
  _group      record;
  _enrollment record;
  _level      text;
  _seated     integer;
  _capacity   integer;
  _existing   boolean;
begin
  if not coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false) then
    raise exception 'Only an admin can confirm a student into a group.'
      using errcode = '42501';
  end if;

  select p.* into _pkg from public.schedule_packages p where p.id = _package_id;
  if not found then
    raise exception 'No such class time.';
  end if;
  if not coalesce(_pkg.is_active, false) then
    raise exception 'That class time is not active.';
  end if;

  -- The package is the time; the group is the seat. One active group per
  -- package, created on first use -- the same rule assign_student_to_group
  -- follows, so the two paths cannot drift apart. A FOR UPDATE that matches
  -- nothing locks nothing, so the race is closed by the unique index above and
  -- caught here rather than by the lock.
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
      -- Somebody else created the group between the select and the insert.
      -- Take theirs.
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

  -- Her level, placement result first and her own guess only as a fallback.
  -- The older matcher reads profiles.level alone, which is what she picked from
  -- a dropdown at signup, before the test told her anything.
  select coalesce(nullif(pr.course_level_key, ''), nullif(pr.level, ''), '')
    into _level
    from public.profiles pr
   where pr.user_id = _user_id;

  -- Which enrollment to attach the seat to.
  --
  -- A PAID enrollment is a financial record and is not rewritten here: moving
  -- its package_id would leave whatever group it already backs holding a seat
  -- that claims to be for a different class. So a paid row is reused only if it
  -- is for this package or for no package at all; otherwise this confirmation
  -- opens its own PENDING_PAYMENT row and the paid one is left exactly as it is.
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
    -- price and duration checks: no plan has been chosen yet.
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
           -- A paid enrollment's level is left alone; it is what she bought.
           level           = case when e.payment_status = 'PAID'
                                  then e.level
                                  else coalesce(nullif(_level, ''), e.level) end,
           matched_at      = coalesce(e.matched_at, now())
     where e.id = _enrollment.id
    returning e.* into _enrollment;
  end if;

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

  _capacity := coalesce(_group.capacity, 8);

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
    'seated',         _seated,
    'capacity',       _capacity,
    'seats_left',     greatest(0, _capacity - _seated)
  );
end;
$function$;

-- Postgres grants EXECUTE on a new function to PUBLIC by default. Both of these
-- are SECURITY DEFINER, and fn_send_group_class_link sends mail with no caller
-- check of its own -- it is a helper the two triggers share, not an endpoint --
-- so left alone it would be reachable over PostgREST by anyone as
-- POST /rest/v1/rpc/fn_send_group_class_link. The triggers still reach it: they
-- run as the definer, not as the web request's role.
revoke all on function public.fn_send_group_class_link(uuid, uuid) from public;

revoke all on function public.admin_confirm_student_into_group(uuid, uuid) from public;
grant execute on function public.admin_confirm_student_into_group(uuid, uuid) to authenticated;
