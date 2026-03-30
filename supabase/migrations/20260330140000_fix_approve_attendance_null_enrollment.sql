-- Fix approve_attendance_request to handle NULL enrollment_id
-- The bug: if attendance_requests.enrollment_id is NULL, the UPDATE on
-- enrollments matches nothing and sessions_remaining never decrements.
-- Fix: fall back to the user's latest active enrollment when enrollment_id is NULL.

CREATE OR REPLACE FUNCTION public.approve_attendance_request(_request_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _status        text;
  _enrollment_id uuid;
  _user_id       uuid;
  _remaining     integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  SELECT status, enrollment_id, user_id
    INTO _status, _enrollment_id, _user_id
    FROM public.attendance_requests
    WHERE id = _request_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance request not found';
  END IF;

  -- Idempotent: already processed → return current remaining
  IF _status != 'PENDING' THEN
    IF _enrollment_id IS NOT NULL THEN
      SELECT sessions_remaining INTO _remaining FROM public.enrollments WHERE id = _enrollment_id;
    ELSE
      SELECT sessions_remaining INTO _remaining
        FROM public.enrollments
        WHERE user_id = _user_id AND approval_status = 'APPROVED' AND payment_status = 'PAID'
        ORDER BY created_at DESC LIMIT 1;
    END IF;
    RETURN COALESCE(_remaining, 0);
  END IF;

  -- Fallback: find enrollment by user_id when enrollment_id is missing
  IF _enrollment_id IS NULL THEN
    SELECT id INTO _enrollment_id
      FROM public.enrollments
      WHERE user_id = _user_id
        AND approval_status = 'APPROVED'
        AND payment_status  = 'PAID'
        AND sessions_remaining > -3
      ORDER BY created_at DESC
      LIMIT 1;

    -- Backfill enrollment_id on the request so future calls are fast
    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.attendance_requests
        SET enrollment_id = _enrollment_id
        WHERE id = _request_id;
    END IF;
  END IF;

  -- Guard: -3 floor
  IF _enrollment_id IS NOT NULL THEN
    SELECT sessions_remaining INTO _remaining
      FROM public.enrollments WHERE id = _enrollment_id FOR UPDATE;

    IF _remaining <= -3 THEN
      RAISE EXCEPTION 'Negative limit reached (-3). Renewal required.';
    END IF;
  END IF;

  -- Mark approved
  UPDATE public.attendance_requests
    SET status      = 'APPROVED',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = _request_id;

  -- Decrement sessions
  IF _enrollment_id IS NOT NULL THEN
    UPDATE public.enrollments
      SET sessions_remaining = sessions_remaining - 1
      WHERE id = _enrollment_id
      RETURNING sessions_remaining INTO _remaining;
  END IF;

  RETURN COALESCE(_remaining, 0);
END;
$function$;
