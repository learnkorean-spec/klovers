
-- RPC to revert an approved enrollment: deducts credits and resets status
CREATE OR REPLACE FUNCTION public.revert_enrollment(_enrollment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _enrollment RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  SELECT id, user_id, classes_included, approval_status
    INTO _enrollment
    FROM public.enrollments
    WHERE id = _enrollment_id;

  IF _enrollment IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  IF _enrollment.approval_status != 'APPROVED' THEN
    RAISE EXCEPTION 'Can only revert APPROVED enrollments';
  END IF;

  -- Deduct the credits that were added on approval
  UPDATE public.profiles
    SET credits = GREATEST(credits - _enrollment.classes_included, 0)
    WHERE user_id = _enrollment.user_id;

  -- Reset enrollment status
  UPDATE public.enrollments
    SET approval_status = 'PENDING',
        status = 'PENDING',
        payment_status = 'UNPAID',
        reviewed_at = NULL,
        reviewed_by = NULL
    WHERE id = _enrollment_id;
END;
$function$;
