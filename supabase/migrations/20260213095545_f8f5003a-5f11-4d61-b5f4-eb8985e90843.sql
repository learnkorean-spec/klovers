
-- 1) Add enrollment_id column to attendance_requests (nullable first for backfill)
ALTER TABLE public.attendance_requests ADD COLUMN enrollment_id uuid;

-- 2) Backfill: set enrollment_id to the latest enrollment for each user
UPDATE public.attendance_requests ar
SET enrollment_id = (
  SELECT e.id FROM public.enrollments e
  WHERE e.user_id = ar.user_id
  ORDER BY e.created_at DESC
  LIMIT 1
);

-- 3) For any remaining NULLs (users with no enrollment), delete those orphan rows
DELETE FROM public.attendance_requests WHERE enrollment_id IS NULL;

-- 4) Make NOT NULL
ALTER TABLE public.attendance_requests ALTER COLUMN enrollment_id SET NOT NULL;

-- 5) Add FK constraint
ALTER TABLE public.attendance_requests
  ADD CONSTRAINT attendance_requests_enrollment_id_fkey
  FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id);

-- 6) Add unique constraint to prevent duplicate date per user
ALTER TABLE public.attendance_requests
  ADD CONSTRAINT attendance_requests_user_date_unique UNIQUE (user_id, request_date);

-- 7) Drop ALL existing RLS policies on attendance_requests and recreate
DROP POLICY IF EXISTS "Active users can insert attendance" ON public.attendance_requests;
DROP POLICY IF EXISTS "Admins can update attendance" ON public.attendance_requests;
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance_requests;
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance_requests;

-- SELECT: user own + admin all
CREATE POLICY "Users can view own attendance"
  ON public.attendance_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance"
  ON public.attendance_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERT: only if user has an ACTIVE enrollment matching the enrollment_id
CREATE POLICY "Active enrollment insert attendance"
  ON public.attendance_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
        AND e.user_id = auth.uid()
        AND e.approval_status = 'APPROVED'
        AND e.payment_status = 'PAID'
        AND e.sessions_remaining > 0
    )
  );

-- UPDATE: admin only
CREATE POLICY "Admins can update attendance"
  ON public.attendance_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 8) Create approve_attendance_request RPC
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

  -- Lock the row
  SELECT status, enrollment_id INTO _status, _enrollment_id
    FROM public.attendance_requests
    WHERE id = _request_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance request not found';
  END IF;

  -- Idempotent: if not PENDING, just return current sessions_remaining
  IF _status != 'PENDING' THEN
    SELECT sessions_remaining INTO _remaining
      FROM public.enrollments WHERE id = _enrollment_id;
    RETURN COALESCE(_remaining, 0);
  END IF;

  -- Approve the request
  UPDATE public.attendance_requests
    SET status = 'APPROVED',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = _request_id;

  -- Decrement sessions_remaining (floor at 0)
  UPDATE public.enrollments
    SET sessions_remaining = GREATEST(sessions_remaining - 1, 0)
    WHERE id = _enrollment_id AND sessions_remaining > 0
    RETURNING sessions_remaining INTO _remaining;

  RETURN COALESCE(_remaining, 0);
END;
$$;

-- 9) Create reject_attendance_request RPC
CREATE OR REPLACE FUNCTION public.reject_attendance_request(_request_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  SELECT status INTO _status
    FROM public.attendance_requests
    WHERE id = _request_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance request not found';
  END IF;

  IF _status != 'PENDING' THEN
    RETURN; -- idempotent
  END IF;

  UPDATE public.attendance_requests
    SET status = 'REJECTED',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = _request_id;
END;
$$;
