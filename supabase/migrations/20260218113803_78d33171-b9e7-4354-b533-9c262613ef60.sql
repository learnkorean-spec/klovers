
-- ============================================================
-- Migration: Fix double-decrement + legacy fallback in assign RPC
-- ============================================================

-- ============================================================
-- A) Replace handle_pkg_attendance_approval trigger function
--    with idempotent "insert-first then decrement" logic
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_pkg_attendance_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _enrollment_id uuid;
  _charge_type   text;
  _inserted_rows integer := 0;
BEGIN
  -- Only act when admin_approved transitions to true
  IF NOT (NEW.admin_approved = true AND (OLD.admin_approved IS DISTINCT FROM true)) THEN
    RETURN NEW;
  END IF;

  -- Determine charge type
  IF NEW.status = 'excused' THEN
    _charge_type := 'waived_emergency';
  ELSE
    _charge_type := 'paid_session';
  END IF;

  -- Try to insert charge row (idempotent – ON CONFLICT DO NOTHING)
  INSERT INTO public.pkg_class_charges(session_id, user_id, charge_type)
  VALUES (NEW.session_id, NEW.user_id, _charge_type)
  ON CONFLICT (session_id, user_id) DO NOTHING;

  GET DIAGNOSTICS _inserted_rows = ROW_COUNT;

  -- Only decrement if this is the FIRST time the row was inserted AND it's a paid session
  IF _inserted_rows = 1 AND _charge_type = 'paid_session' THEN
    -- Find the most-recent active/paid enrollment for this user
    SELECT id INTO _enrollment_id
      FROM public.enrollments
      WHERE user_id = NEW.user_id
        AND approval_status = 'APPROVED'
        AND payment_status = 'PAID'
      ORDER BY created_at DESC
      LIMIT 1;

    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.enrollments
        SET sessions_remaining = GREATEST(sessions_remaining - 1, 0)
        WHERE id = _enrollment_id;
    END IF;
  END IF;
  -- If _inserted_rows = 0 → charge already existed → DO NOTHING (idempotent)
  -- If charge_type = 'waived_emergency' → no decrement regardless

  RETURN NEW;
END;
$$;

-- Re-bind trigger (drop + recreate to be safe)
DROP TRIGGER IF EXISTS trg_pkg_attendance_approval ON public.pkg_attendance;

CREATE TRIGGER trg_pkg_attendance_approval
  AFTER UPDATE ON public.pkg_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pkg_attendance_approval();

-- ============================================================
-- B) Replace assign_student_to_pkg_group RPC with legacy fallback
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_student_to_pkg_group(
  _user_id       uuid,
  _enrollment_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _package_id    uuid;
  _group         RECORD;
  _status        text;
  -- legacy fallback fields
  _legacy        RECORD;
  _preferred_day int;
BEGIN
  -- 1. Try student_package_preferences (new flow)
  SELECT package_id INTO _package_id
    FROM public.student_package_preferences
    WHERE user_id = _user_id;

  -- 2. Legacy fallback: student_schedule_preferences
  IF _package_id IS NULL THEN
    SELECT ssp.level,
           ssp.group_id
      INTO _legacy
      FROM public.student_schedule_preferences ssp
      WHERE ssp.user_id = _user_id
      LIMIT 1;

    IF _legacy IS NOT NULL AND _legacy.level IS NOT NULL THEN
      -- Map legacy group → schedule_package by level match
      -- Try to find an active schedule_package for the same level
      SELECT sp.id INTO _package_id
        FROM public.schedule_packages sp
        WHERE sp.level     = _legacy.level
          AND sp.is_active = true
        ORDER BY sp.created_at ASC
        LIMIT 1;
    END IF;
  END IF;

  -- 3. Still nothing → no_preference
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
    -- All groups full → waitlist in first group
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
    VALUES (
      'Student assigned to waitlist in group "' || _group.name || '" (package full at approval)',
      'waitlist',
      _user_id
    );

    RETURN 'waitlisted';
  END IF;

  -- 5. Assign active
  INSERT INTO public.pkg_group_members(group_id, user_id, member_status, enrollment_id)
  VALUES (_group.id, _user_id, 'active', _enrollment_id)
  ON CONFLICT (group_id, user_id) DO UPDATE
    SET member_status = 'active', enrollment_id = _enrollment_id;

  RETURN 'assigned:' || _group.name;
END;
$$;

/*
-- ============================================================
-- TEST SNIPPETS (run manually in SQL editor to verify)
-- ============================================================

-- TEST A: Double-approve should decrement only once
-- Setup: create enrollment with sessions_remaining=5, pkg_attendance row status='present'
-- Step 1: UPDATE pkg_attendance SET admin_approved=true WHERE session_id=X AND user_id=Y;
-- Step 2: UPDATE pkg_attendance SET admin_approved=false WHERE session_id=X AND user_id=Y;
-- Step 3: UPDATE pkg_attendance SET admin_approved=true WHERE session_id=X AND user_id=Y;
-- Expected: sessions_remaining went from 5→4 after step 1, stayed at 4 after step 3.
-- Also: pkg_class_charges has exactly ONE row for (session_id, user_id).

-- TEST B: Excused should never decrement
-- UPDATE pkg_attendance SET status='excused', admin_approved=true WHERE ...;
-- Expected: sessions_remaining unchanged; pkg_class_charges has waived_emergency row.

-- TEST C: Legacy fallback
-- DELETE FROM student_package_preferences WHERE user_id=Y;
-- INSERT INTO student_schedule_preferences(user_id, level, ...) VALUES (Y, 'beginner_1', ...);
-- SELECT assign_student_to_pkg_group(Y, enrollment_id);
-- Expected: NOT 'no_preference' if an active schedule_package exists for 'beginner_1'.
-- ============================================================
*/
