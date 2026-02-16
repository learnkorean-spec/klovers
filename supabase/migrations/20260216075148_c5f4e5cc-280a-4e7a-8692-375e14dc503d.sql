
CREATE OR REPLACE FUNCTION public.revert_attendance_request(_request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _status text;
  _enrollment_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  SELECT status, enrollment_id INTO _status, _enrollment_id
    FROM public.attendance_requests
    WHERE id = _request_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance request not found';
  END IF;

  -- If it was approved, restore the session that was deducted
  IF _status = 'APPROVED' THEN
    UPDATE public.enrollments
      SET sessions_remaining = sessions_remaining + 1
      WHERE id = _enrollment_id;
  END IF;

  -- Reset back to PENDING
  UPDATE public.attendance_requests
    SET status = 'PENDING',
        reviewed_at = NULL,
        reviewed_by = NULL
    WHERE id = _request_id;
END;
$$;
