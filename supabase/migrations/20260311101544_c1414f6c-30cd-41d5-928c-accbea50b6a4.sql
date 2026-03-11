
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can read by token" ON public.schedule_resubmission_requests;

-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Anyone can update pending requests" ON public.schedule_resubmission_requests;

-- Create a secure RPC to validate a token (no auth required, returns single row or null)
CREATE OR REPLACE FUNCTION public.validate_resubmission_token(_token text)
RETURNS TABLE (
  id uuid,
  enrollment_id uuid,
  user_id uuid,
  email text,
  status text,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.enrollment_id, r.user_id, r.email, r.status, r.expires_at
  FROM public.schedule_resubmission_requests r
  WHERE r.token = _token
  LIMIT 1;
$$;

-- Create a secure RPC to complete a resubmission (validates token, updates atomically)
CREATE OR REPLACE FUNCTION public.complete_schedule_resubmission(
  _token text,
  _level text,
  _package_id uuid,
  _preferred_day text,
  _preferred_time text,
  _timezone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req RECORD;
BEGIN
  -- Fetch and validate the request
  SELECT * INTO _req
  FROM public.schedule_resubmission_requests
  WHERE token = _token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  IF _req.status != 'pending' THEN
    RAISE EXCEPTION 'Request already completed';
  END IF;

  IF _req.expires_at < now() THEN
    RAISE EXCEPTION 'Token has expired';
  END IF;

  -- Validate inputs
  IF _level IS NULL OR length(trim(_level)) = 0 THEN
    RAISE EXCEPTION 'Level is required';
  END IF;

  IF _package_id IS NULL THEN
    RAISE EXCEPTION 'Package selection is required';
  END IF;

  -- Update enrollment with schedule data
  UPDATE public.enrollments
  SET level = _level,
      preferred_days = ARRAY[_preferred_day],
      preferred_time = _preferred_time,
      timezone = _timezone
  WHERE id = _req.enrollment_id;

  -- Update profile level
  UPDATE public.profiles
  SET level = _level
  WHERE user_id = _req.user_id;

  -- Save package preference
  INSERT INTO public.student_package_preferences (user_id, level, package_id, updated_at)
  VALUES (_req.user_id, _level, _package_id, now())
  ON CONFLICT (user_id) DO UPDATE
  SET level = _level, package_id = _package_id, updated_at = now();

  -- Mark request as completed
  UPDATE public.schedule_resubmission_requests
  SET status = 'completed'
  WHERE id = _req.id;
END;
$$;

-- Keep admin SELECT/INSERT policies (admins create these requests)
-- Add admin-only SELECT policy
CREATE POLICY "Admins can read resubmission requests"
ON public.schedule_resubmission_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin-only UPDATE policy
CREATE POLICY "Admins can update resubmission requests"
ON public.schedule_resubmission_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
