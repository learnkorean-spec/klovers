-- Phase 4: Add enrollment cancellation RPC and admin_notes column.

-- Add admin notes column
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';

-- Cancel enrollment RPC: deducts credits, removes from groups, creates notification
CREATE OR REPLACE FUNCTION public.cancel_enrollment(_enrollment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _enrollment RECORD;
  _student_name TEXT;
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

  -- 1. Update enrollment status
  UPDATE public.enrollments SET
    enrollment_status = 'cancelled',
    approval_status = 'CANCELLED',
    updated_at = NOW()
  WHERE id = _enrollment_id;

  -- 2. Deduct remaining credits from profile
  IF _enrollment.user_id IS NOT NULL AND _enrollment.sessions_remaining > 0 THEN
    UPDATE public.profiles SET
      credits = GREATEST(0, COALESCE(credits, 0) - _enrollment.sessions_remaining)
    WHERE user_id = _enrollment.user_id;
  END IF;

  -- 3. Remove from groups
  DELETE FROM public.pkg_group_members
    WHERE enrollment_id = _enrollment_id;

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
$$;
