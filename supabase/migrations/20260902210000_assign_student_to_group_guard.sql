-- assign_student_to_group(): add the missing authorization guard.
--
-- WHY
-- ---
-- This function is SECURITY DEFINER and callable by every signed-in user, with
-- no check of any kind on _user_id. Any authenticated account could assign ANY
-- user to ANY package. It is the highest-value of the unguarded RPCs found on
-- 2026-09-02, because unlike the others it sits on the live student path and is
-- called by students directly.
--
-- WHY IT WAS NOT IN PR #203
-- -------------------------
-- Its body is ~3.6 KB. Retyping it out of pg_get_functiondef() to splice in a
-- guard is a transcription risk out of proportion to a five-line change. This
-- migration instead takes the body from the repository's own source file,
-- supabase/migrations/20260223095516_f7e8c5c5-9c68-4ff5-aa44-7b350a49d9bb.sql,
-- which was verified to be byte-identical to what is deployed:
--
--   md5(prosrc) on production      = 1fa2443e2c0d84b5df2e5e0f4877b906
--   md5(repo body, CRLF endings)   = 1fa2443e2c0d84b5df2e5e0f4877b906
--
-- So the body below is the deployed body, unmodified, plus the guard. Nothing
-- else in this function changes: not the signature, not the return type, not
-- the idempotency check, not the group-selection order, not the waitlist path,
-- not the admin notification.
--
-- THE RULE IS SELF-OR-ADMIN, NOT ADMIN-ONLY
-- -----------------------------------------
-- Callers were checked in src/ before this was written:
--   SlotRanker.tsx        rpc(assign_student_to_group, { _user_id: session.user.id })
--   SchedulePicker.tsx    rpc(assign_student_to_group, { _user_id: session.user.id })
--   GroupMatcher.tsx      rpc(assign_student_to_group, { _user_id: member.user_id })   [admin]
--   SchedulingManager.tsx rpc(assign_student_to_group, { _user_id: userId })           [admin]
-- An admin-only guard would have closed the hole and broken student
-- self-service, which is what those first two components exist to do.
--
-- ROLLBACK
-- --------
-- Re-run 20260223095516_f7e8c5c5-9c68-4ff5-aa44-7b350a49d9bb.sql's CREATE OR
-- REPLACE block, which restores the unguarded body exactly.

begin;

CREATE OR REPLACE FUNCTION public.assign_student_to_group(_package_id uuid, _user_id uuid, _enrollment_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _package RECORD;
  _group RECORD;
  _existing RECORD;
  _day_name text;
BEGIN
  -- AUTHORIZATION GUARD (added 2026-09-02, the only change to this function)
  -- Callers, established from src/ before writing this:
  --   student : SlotRanker.tsx, SchedulePicker.tsx  -> _user_id = session.user.id
  --   admin   : GroupMatcher.tsx, SchedulingManager.tsx -> other users' ids
  -- So the rule is self-or-admin. Admin-only would break student self-service.
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

  -- 2) Idempotency: check if user already in ANY active group for this package
  SELECT pg.id, pg.name INTO _existing
    FROM public.pkg_group_members pgm
    JOIN public.pkg_groups pg ON pg.id = pgm.group_id
    WHERE pgm.user_id = _user_id
      AND pg.package_id = _package_id
      AND pg.is_active = true;

  IF FOUND THEN
    -- Update enrollment_id if provided and not set
    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.pkg_group_members
        SET enrollment_id = _enrollment_id, member_status = 'active'
        WHERE group_id = _existing.id AND user_id = _user_id;
    END IF;
    RETURN jsonb_build_object(
      'status', 'already_assigned',
      'group_id', _existing.id,
      'group_name', _existing.name
    );
  END IF;

  -- 3) Day name for group naming
  _day_name := CASE _package.day_of_week
    WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday' ELSE 'Unknown'
  END;

  -- 4) Ensure at least 1 active group exists for this package
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

  -- 5) Find group with seats available (fewest active members first)
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
    -- Assign active
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

    -- Notify admin
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
$$;

-- pg_default_acl on this database grants EXECUTE on public functions to anon
-- and authenticated, and CREATE OR REPLACE does not reset an ACL, so the intent
-- is restated explicitly rather than assumed.
revoke all on function public.assign_student_to_group(uuid, uuid, uuid) from public, anon;
grant execute on function public.assign_student_to_group(uuid, uuid, uuid) to authenticated;

commit;
