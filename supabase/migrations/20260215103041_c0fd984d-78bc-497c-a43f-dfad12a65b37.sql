
-- 1) Replace approve_attendance_request with -3 floor guard
CREATE OR REPLACE FUNCTION public.approve_attendance_request(_request_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _status text;
  _enrollment_id uuid;
  _remaining integer;
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

  -- Idempotent: if already processed, just return current remaining
  IF _status != 'PENDING' THEN
    SELECT sessions_remaining INTO _remaining
      FROM public.enrollments WHERE id = _enrollment_id;
    RETURN COALESCE(_remaining, 0);
  END IF;

  -- Check the -3 floor on the enrollment
  SELECT sessions_remaining INTO _remaining
    FROM public.enrollments WHERE id = _enrollment_id FOR UPDATE;

  IF _remaining <= -3 THEN
    RAISE EXCEPTION 'Negative limit reached (-3). Renew required.';
  END IF;

  UPDATE public.attendance_requests
    SET status = 'APPROVED',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = _request_id;

  UPDATE public.enrollments
    SET sessions_remaining = sessions_remaining - 1
    WHERE id = _enrollment_id
    RETURNING sessions_remaining INTO _remaining;

  RETURN COALESCE(_remaining, 0);
END;
$function$;

-- 2) Harden RLS on attendance_requests INSERT
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance_requests;

CREATE POLICY "Users can insert own attendance"
  ON public.attendance_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = attendance_requests.enrollment_id
        AND e.user_id = auth.uid()
        AND e.payment_status = 'PAID'
        AND e.approval_status = 'APPROVED'
    )
  );
