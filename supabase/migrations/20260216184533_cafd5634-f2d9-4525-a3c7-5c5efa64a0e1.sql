
-- Create a trigger to prevent duplicate active enrollments per user
-- If a user already has an active enrollment (not EXPIRED/REJECTED), 
-- new enrollments are blocked
CREATE OR REPLACE FUNCTION public.prevent_duplicate_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user already has an active enrollment
  IF EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = NEW.user_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status NOT IN ('EXPIRED', 'REJECTED')
      AND approval_status NOT IN ('REJECTED')
  ) THEN
    RAISE EXCEPTION 'User already has an active enrollment. Please complete or cancel the existing one first.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_duplicate_enrollment
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_enrollment();
