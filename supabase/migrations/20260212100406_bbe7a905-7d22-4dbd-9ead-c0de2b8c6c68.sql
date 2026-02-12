
-- 1. Trigger to prevent users from modifying credits or status on their own profile
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow admins to update anything
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Block non-admin users from changing credits or status
  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    RAISE EXCEPTION 'Cannot modify credits';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Cannot modify status';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_fields();

-- 2. Remove "Users can insert own enrollments" policy
-- Only the service_role (webhook/admin) should create enrollments
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.enrollments;

-- 3. Replace attendance insert policy: only ACTIVE users with credits > 0
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance_requests;

CREATE POLICY "Active users can insert attendance"
ON public.attendance_requests
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.status = 'ACTIVE'
      AND p.credits > 0
  )
);
