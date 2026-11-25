-- cancel_enrollment() was broken twice over (found 26 Nov 2026):
--   1. It wrote approval_status = 'CANCELLED', which validate_enrollment_status()
--      rejects ('CANCELLED' is not in its allowed list), so every call raised.
--   2. It wrote enrollments.updated_at, a column that does not exist.
-- The cancellation marker is enrollment_status = 'cancelled' (allowed by the
-- validator), so approval_status is now left alone instead of widening the
-- validator.
--
-- Also: removing the seat deleted pkg_group_members but left the pre-filled
-- 'absent' pkg_attendance rows for future sessions, which is why removed
-- students kept showing in the group. Future, not-yet-approved attendance rows
-- for the groups she is leaving are now deleted too. Approved rows (history)
-- and past sessions are untouched. pkg_attendance has no DELETE trigger.
--
-- Everything else is the live definition, unchanged: SECURITY DEFINER,
-- SET search_path TO 'public', admin check, credits deduction, notification.

CREATE OR REPLACE FUNCTION public.cancel_enrollment(_enrollment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _enrollment RECORD;
  _student_name TEXT;
  _group_ids uuid[];
BEGIN
  -- Only admins can cancel
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock and fetch enrollment
  SELECT e.id, e.user_id, e.sessions_remaining, e.enrollment_status
    INTO _enrollment
    FROM public.enrollments e
    WHERE e.id = _enrollment_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  IF _enrollment.enrollment_status = 'cancelled' THEN
    RAISE EXCEPTION 'Enrollment is already cancelled';
  END IF;

  -- 1. Update enrollment status (approval_status is left as it was)
  UPDATE public.enrollments SET
    enrollment_status = 'cancelled'
  WHERE id = _enrollment_id;

  -- 2. Deduct remaining credits from profile
  IF _enrollment.user_id IS NOT NULL AND _enrollment.sessions_remaining > 0 THEN
    UPDATE public.profiles SET
      credits = GREATEST(0, COALESCE(credits, 0) - _enrollment.sessions_remaining)
    WHERE user_id = _enrollment.user_id;
  END IF;

  -- 3. Remove from groups, and clear the future placeholder attendance rows
  SELECT COALESCE(array_agg(m.group_id), '{}'::uuid[])
    INTO _group_ids
    FROM public.pkg_group_members m
    WHERE m.enrollment_id = _enrollment_id;

  DELETE FROM public.pkg_group_members
    WHERE enrollment_id = _enrollment_id;

  IF _enrollment.user_id IS NOT NULL AND cardinality(_group_ids) > 0 THEN
    DELETE FROM public.pkg_attendance a
      USING public.pkg_group_sessions s
      WHERE a.session_id = s.id
        AND a.user_id = _enrollment.user_id
        AND s.group_id = ANY (_group_ids)
        AND s.session_date >= CURRENT_DATE
        AND NOT a.admin_approved;
  END IF;

  -- 4. Get student name for notification
  SELECT COALESCE(p.name, au.email, 'Unknown')
    INTO _student_name
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE au.id = _enrollment.user_id;

  -- 5. Create admin notification
  INSERT INTO public.admin_notifications (message, type, related_user_id)
  VALUES (
    'Enrollment ' || _enrollment_id || ' for ' || _student_name || ' has been cancelled.',
    'enrollment_cancelled',
    _enrollment.user_id
  );
END;
$function$;
