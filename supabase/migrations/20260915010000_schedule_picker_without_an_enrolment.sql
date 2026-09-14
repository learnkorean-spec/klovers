-- The schedule picker could not save a class time for any student who has no
-- enrolment yet.
--
-- Reported by Re, 14 Sep 2026, from naira's phone:
--
--     Could not save this class time
--     Cannot assign student to "Level 1 · Monday 15:00 Cairo":
--     no enrollment is linked to this membership.
--
-- WHY
--
-- `SchedulePicker.tsx` calls
--
--     rpc('assign_student_to_group', { _package_id, _user_id })
--
-- and has never passed `_enrollment_id`. The membership row it inserts
-- therefore carries `enrollment_id = NULL`, which is precisely what
-- `enforce_group_membership_guard` (20260828140321) exists to refuse. The call
-- has been failing for every student who was not already seated since that
-- guard shipped; until PR #384 stopped the picker swallowing its errors on
-- 14 Sep it failed in silence, and the student was shown a green
-- confirmation box on top of a write that never happened. naira is the first
-- person to see the real reason.
--
-- WHAT THIS CHANGES
--
-- The picker's job is already settled (`SCHEDULE_PICKER_TOLD_A_LIE`, 14 Sep):
-- it records a choice. Holding a seat belongs to `hold_my_seat()` -- the
-- "Hold my place" button -- or to payment, both of which open the enrolment
-- first. So:
--
--   * when the caller passes no `_enrollment_id`, one is resolved from the
--     student's own approved, live, group enrolment (her enrolment for THIS
--     package first) instead of inserting a NULL and hitting the guard;
--   * a student who has no such enrolment is not seated at all: nothing is
--     written and the function returns `{"status":"no_enrollment"}`, so the
--     picker saves her preference and shows her no error;
--   * an ADMIN assigning somebody else still gets a hard error in that case,
--     because a silent no-op on an admin screen is the swallowed failure this
--     codebase has already been bitten by three times. The admin path that
--     *should* be used there is `admin_confirm_student_into_group`, which
--     opens the enrolment deliberately.
--
-- Everything else in the function -- the authorisation guard from
-- 20260902210000, idempotency, group creation, capacity, the waitlist and its
-- admin notification -- is unchanged.
--
-- REHEARSED ON PRODUCTION before this file was written: the whole function was
-- replaced inside a `DO` block, called as a real signed-in student with no
-- enrolment, and the block then raised to roll everything back --
--
--     DRY_RUN_OK result={"status": "no_enrollment"}
--     members_before=2 members_after=2
--
-- so the refusal is proven not to write a row, and the schema was left as it
-- was (Postgres DDL is transactional).

create or replace function public.assign_student_to_group(_package_id uuid, _user_id uuid, _enrollment_id uuid default null::uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
DECLARE
  _package RECORD;
  _group RECORD;
  _existing RECORD;
  _day_name text;
BEGIN
  -- AUTHORIZATION GUARD (added 2026-09-02)
  -- Callers:
  --   student : SlotRanker.tsx, SchedulePicker.tsx  -> _user_id = session.user.id
  --   admin   : GroupMatcher.tsx, SchedulingManager.tsx -> other users' ids
  IF auth.uid() IS NULL
     OR (_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'not_authorised: may only assign yourself unless you hold the admin role'
      USING ERRCODE = '42501';
  END IF;

  -- 1) Validate package exists
  SELECT * INTO _package FROM public.schedule_packages WHERE id = _package_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'package_not_found');
  END IF;

  -- 2) A seat has to hang on an enrolment. No caller in src/ passes one, so it
  --    is resolved here rather than left NULL for the guard to reject. Her
  --    enrolment for this very package is preferred, then the most recent.
  IF _enrollment_id IS NULL THEN
    SELECT e.id INTO _enrollment_id
      FROM public.enrollments e
     WHERE e.user_id = _user_id
       AND e.deleted_at IS NULL
       AND coalesce(e.enrollment_status, 'active') = 'active'
       AND coalesce(e.plan_type, 'group') = 'group'
       AND e.approval_status = 'APPROVED'
       AND e.payment_status IN ('PAID', 'PENDING_PAYMENT')
     ORDER BY (e.package_id = _package_id) DESC, e.created_at DESC
     LIMIT 1;
  END IF;

  -- 3) No enrolment: record nothing. For a student choosing her own time this
  --    is the normal state and not an error -- the picker keeps her preference
  --    and "Hold my place" (hold_my_seat) opens the enrolment when she books.
  --    For an admin acting on someone else it is a real failure and says so.
  IF _enrollment_id IS NULL THEN
    IF _user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Cannot seat this student: she has no approved enrolment for a seat to hang on. Confirm her into the class from the admin screen, which opens one.';
    END IF;
    RETURN jsonb_build_object('status', 'no_enrollment');
  END IF;

  -- 4) Idempotency: already in an active group for this package
  SELECT pg.id, pg.name INTO _existing
    FROM public.pkg_group_members pgm
    JOIN public.pkg_groups pg ON pg.id = pgm.group_id
    WHERE pgm.user_id = _user_id
      AND pg.package_id = _package_id
      AND pg.is_active = true;

  IF FOUND THEN
    UPDATE public.pkg_group_members
      SET enrollment_id = _enrollment_id, member_status = 'active'
      WHERE group_id = _existing.id AND user_id = _user_id;
    RETURN jsonb_build_object(
      'status', 'already_assigned',
      'group_id', _existing.id,
      'group_name', _existing.name
    );
  END IF;

  -- 5) Day name for group naming
  _day_name := CASE _package.day_of_week
    WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday' ELSE 'Unknown'
  END;

  -- 6) Ensure at least 1 active group exists for this package
  IF NOT EXISTS (
    SELECT 1 FROM public.pkg_groups WHERE package_id = _package_id AND is_active = true
  ) THEN
    INSERT INTO public.pkg_groups (package_id, name, capacity, is_active)
    VALUES (
      _package_id,
      initcap(replace(_package.level, '_', ' ')) || ' — ' || _day_name || ' ' || to_char(_package.start_time, 'HH12:MI AM'),
      _package.capacity,
      true
    );
  END IF;

  -- 7) Find group with seats available (fewest active members first)
  SELECT g.id, g.name, g.capacity, COUNT(m.user_id) AS active_count
    INTO _group
    FROM public.pkg_groups g
    LEFT JOIN public.pkg_group_members m ON m.group_id = g.id AND m.member_status = 'active'
    WHERE g.package_id = _package_id AND g.is_active = true
    GROUP BY g.id, g.name, g.capacity
    HAVING COUNT(m.user_id) < g.capacity
    ORDER BY COUNT(m.user_id) ASC
    LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'active', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO UPDATE SET member_status = 'active', enrollment_id = _enrollment_id;

    RETURN jsonb_build_object(
      'status', 'assigned',
      'group_id', _group.id,
      'group_name', _group.name
    );
  ELSE
    -- All groups full → waitlist in first group
    SELECT g.id, g.name INTO _group
      FROM public.pkg_groups g
      WHERE g.package_id = _package_id AND g.is_active = true
      ORDER BY g.created_at ASC
      LIMIT 1;

    INSERT INTO public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'waitlist', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;

    INSERT INTO public.admin_notifications (message, type, related_group_id)
    VALUES (
      'Student waitlisted in "' || _group.name || '" — all groups for ' ||
        initcap(replace(_package.level, '_', ' ')) || ' on ' || _day_name || ' are full. Consider adding another group.',
      'suggest_add_group',
      _group.id
    );

    RETURN jsonb_build_object(
      'status', 'waitlisted',
      'group_id', _group.id,
      'group_name', _group.name
    );
  END IF;
END;
$function$;

-- The picker is a student-facing path; it must stay callable by a signed-in
-- student and by nobody else. (The function's own guard is what enforces
-- self-or-admin; this only restores the grants a CREATE OR REPLACE keeps.)
revoke all on function public.assign_student_to_group(uuid, uuid, uuid) from public;
grant execute on function public.assign_student_to_group(uuid, uuid, uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'assign_student_to_group'
       and pg_get_functiondef(p.oid) like '%no_enrollment%'
  ) then
    raise exception 'assign_student_to_group was not replaced';
  end if;
end
$$;
