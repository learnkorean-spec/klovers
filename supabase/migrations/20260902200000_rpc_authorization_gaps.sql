-- Close four RPC authorization gaps.
--
-- Stage 2 of the backend hardening. Every gap below was measured against
-- production on 2026-09-02, and every caller was checked in src/ BEFORE the
-- guard was written -- an authorization fix that breaks a working path is not
-- a fix. Callers are named per item.
--
-- Deliberately NOT here: assign_student_to_group(). It is the same class of
-- bug and the highest-value one, but its body is 3.9 KB and it sits on the
-- live student path (SlotRanker.tsx and SchedulePicker.tsx both call it with
-- the student's own id; GroupMatcher.tsx and SchedulingManager.tsx call it as
-- admin with other users' ids). Reproducing that body from
-- pg_get_functiondef() by hand to splice in a guard is a transcription risk
-- out of proportion to the change. It gets its own PR, edited from the
-- repository's own source file.
--
-- DRY RUN
-- -------
-- Executed in full against production inside an explicit transaction and
-- rolled back. Asserted inside the transaction: view carries
-- security_invoker=true, anon can no longer execute
-- enforce_group_membership_guard or get_teacher_open_slots, authenticated can
-- still execute save_session_attendance, and active_course_levels still
-- returns 13 rows. Asserted again after the rollback: all three reverted.

begin;

-- 1. active_course_levels -----------------------------------------------------
-- The only ERROR-level advisor finding. A SECURITY DEFINER view runs with the
-- view owner's rights, so it bypasses RLS on course_levels for every caller.
-- Safe to switch: course_levels' single policy is
--   "course_levels read" FOR SELECT TO anon, authenticated USING (true)
-- so an invoker-rights view returns exactly the same rows it does today.

alter view public.active_course_levels set (security_invoker = true);

-- 2. enforce_group_membership_guard() ----------------------------------------
-- A trigger function -- it exists to be fired by a trigger on
-- pkg_group_members, never to be called directly. It was nonetheless reachable
-- as POST /rest/v1/rpc/enforce_group_membership_guard by anon. Revoking
-- EXECUTE does not affect the trigger: trigger firing does not go through
-- function EXECUTE privilege.

revoke all on function public.enforce_group_membership_guard() from public, anon, authenticated;

-- 3. get_teacher_open_slots(from, to, teacher_id) -----------------------------
-- Returned the teacher's live calendar to unauthenticated callers. Searched
-- the whole repository: ZERO references -- not src/, not supabase/functions/,
-- not even a migration, which means it was hand-applied and has no reviewable
-- source. Nothing can break by revoking anon. Kept for authenticated rather
-- than dropped, because absence of a reference in this repo is not proof that
-- nothing calls it.

revoke all on function public.get_teacher_open_slots(date, date, uuid) from public, anon;
grant execute on function public.get_teacher_open_slots(date, date, uuid) to authenticated;

-- 4. save_session_attendance(session, records) --------------------------------
-- Any signed-in user could write attendance rows for any session, for any
-- user_id they chose, with admin_approved = true. Sole caller in the repo is
-- src/components/admin/SessionAttendanceManager.tsx -- the admin-only screen
-- that PR #119 proposes hiding -- so an admin guard is correct and breaks
-- nothing. Body otherwise unchanged.

create or replace function public.save_session_attendance(p_session_id uuid, p_records jsonb)
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_record jsonb;
  v_saved  int := 0;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not_authorised: save_session_attendance requires the admin role'
      using errcode = '42501';
  end if;

  for v_record in select * from jsonb_array_elements(p_records)
  loop
    insert into pkg_attendance (session_id, user_id, status, admin_approved)
    values (p_session_id, (v_record->>'user_id')::uuid, coalesce(v_record->>'status','absent'), true)
    on conflict (session_id, user_id) do update
      set status = excluded.status, admin_approved = true;
    v_saved := v_saved + 1;
  end loop;

  return v_saved;
end;
$function$;

-- 5. assign_student_to_pkg_group(user_id, enrollment_id) ----------------------
-- Any signed-in user could assign ANY user to a group. The only caller,
-- src/pages/MySchedulePage.tsx, passes the caller's own id
--   rpc("assign_student_to_pkg_group", { _user_id: userId, ... })
-- so the correct guard is self-or-admin, not admin-only: admin-only would
-- break student self-service, which is the whole point of that page.
-- Body otherwise unchanged from the deployed definition.

create or replace function public.assign_student_to_pkg_group(_user_id uuid, _enrollment_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  _package_id    uuid;
  _group         RECORD;
  _legacy        RECORD;
BEGIN
  IF auth.uid() IS NULL
     OR (_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'not_authorised: may only assign yourself unless you hold the admin role'
      USING ERRCODE = '42501';
  END IF;

  -- 1. Try student_package_preferences (new flow)
  SELECT package_id INTO _package_id
    FROM public.student_package_preferences
    WHERE user_id = _user_id;

  -- 2. Legacy fallback: student_schedule_preferences
  IF _package_id IS NULL THEN
    SELECT ssp.level, ssp.group_id INTO _legacy
      FROM public.student_schedule_preferences ssp
      WHERE ssp.user_id = _user_id
      LIMIT 1;

    IF _legacy IS NOT NULL AND _legacy.level IS NOT NULL THEN
      SELECT sp.id INTO _package_id
        FROM public.schedule_packages sp
        WHERE sp.level = _legacy.level AND sp.is_active = true
        ORDER BY sp.created_at ASC
        LIMIT 1;
    END IF;
  END IF;

  -- 3. Still nothing -> no_preference
  IF _package_id IS NULL THEN
    RETURN 'no_preference';
  END IF;

  -- 4. Find best group under package with room
  SELECT g.id, g.name, g.capacity INTO _group
    FROM public.pkg_groups g
    LEFT JOIN public.pkg_group_members m
           ON m.group_id = g.id AND m.member_status = 'active'
    WHERE g.package_id = _package_id
    GROUP BY g.id, g.name, g.capacity
    HAVING COUNT(m.user_id) < g.capacity
    ORDER BY COUNT(m.user_id) ASC
    LIMIT 1;

  IF NOT FOUND THEN
    -- All groups full -> waitlist in first group
    SELECT id, name, capacity INTO _group
      FROM public.pkg_groups
      WHERE package_id = _package_id
      LIMIT 1;

    IF NOT FOUND THEN
      RETURN 'no_preference';
    END IF;

    INSERT INTO public.pkg_group_members(group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'waitlist', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;

    INSERT INTO public.admin_notifications(message, type, related_user_id)
    VALUES ('Student assigned to waitlist in group "' || _group.name || '" (package full at approval)',
            'waitlist', _user_id);

    RETURN 'waitlisted';
  END IF;

  -- 5. Assign active
  INSERT INTO public.pkg_group_members(group_id, user_id, member_status, enrollment_id)
  VALUES (_group.id, _user_id, 'active', _enrollment_id)
  ON CONFLICT (group_id, user_id) DO UPDATE
    SET member_status = 'active', enrollment_id = _enrollment_id;

  RETURN 'assigned:' || _group.name;
END;
$function$;

-- CREATE OR REPLACE FUNCTION does not reset a function's ACL, but this project's
-- pg_default_acl grants EXECUTE on public functions to anon and authenticated,
-- so the grants are restated explicitly rather than assumed. See
-- claude/TRIAL_PIPELINE_STATE_2026-08-31.md.
revoke all on function public.save_session_attendance(uuid, jsonb) from public, anon;
grant execute on function public.save_session_attendance(uuid, jsonb) to authenticated;
revoke all on function public.assign_student_to_pkg_group(uuid, uuid) from public, anon;
grant execute on function public.assign_student_to_pkg_group(uuid, uuid) to authenticated;

commit;
