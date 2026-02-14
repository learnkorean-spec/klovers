
-- Add negative balance tracking columns to enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS negative_since TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS reminder_count INT NOT NULL DEFAULT 0;

-- Create trigger function to manage negative_since transitions
CREATE OR REPLACE FUNCTION public.track_negative_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Transition from >=0 to <0: set negative_since
  IF OLD.sessions_remaining >= 0 AND NEW.sessions_remaining < 0 THEN
    NEW.negative_since := now();
  END IF;

  -- Transition from <0 to >=0: reset tracking
  IF OLD.sessions_remaining < 0 AND NEW.sessions_remaining >= 0 THEN
    NEW.negative_since := NULL;
    NEW.last_reminder_at := NULL;
    NEW.reminder_count := 0;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_track_negative_balance
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  WHEN (OLD.sessions_remaining IS DISTINCT FROM NEW.sessions_remaining)
  EXECUTE FUNCTION public.track_negative_balance();

-- Replace approve_attendance_request to allow negative sessions_remaining
CREATE OR REPLACE FUNCTION public.approve_attendance_request(_request_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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

  IF _status != 'PENDING' THEN
    SELECT sessions_remaining INTO _remaining
      FROM public.enrollments WHERE id = _enrollment_id;
    RETURN COALESCE(_remaining, 0);
  END IF;

  UPDATE public.attendance_requests
    SET status = 'APPROVED',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = _request_id;

  -- Allow negative: no floor at 0
  UPDATE public.enrollments
    SET sessions_remaining = sessions_remaining - 1
    WHERE id = _enrollment_id
    RETURNING sessions_remaining INTO _remaining;

  RETURN COALESCE(_remaining, 0);
END;
$$;
