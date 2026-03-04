CREATE OR REPLACE FUNCTION public.validate_enrollment_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.approval_status NOT IN (
    'PENDING','APPROVED','REJECTED','PENDING_PAYMENT','UNDER_REVIEW',
    'pending','approved','rejected','pending_payment','under_review'
  ) THEN
    RAISE EXCEPTION 'Invalid approval_status: %', NEW.approval_status;
  END IF;
  RETURN NEW;
END;
$function$;