CREATE OR REPLACE FUNCTION public.submit_manual_enrollment(
  _plan_type text,
  _duration integer,
  _amount numeric,
  _tx_ref text,
  _receipt_url text,
  _payment_method text DEFAULT NULL
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _enrollment_id UUID;
  _classes INTEGER;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _plan_type NOT IN ('group', 'private') THEN
    RAISE EXCEPTION 'Invalid plan_type';
  END IF;

  IF _duration NOT IN (1, 3, 6) THEN
    RAISE EXCEPTION 'Invalid duration';
  END IF;

  _classes := CASE _duration
    WHEN 1 THEN 4
    WHEN 3 THEN 12
    WHEN 6 THEN 24
  END;

  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF _tx_ref IS NULL OR length(trim(_tx_ref)) = 0 THEN
    RAISE EXCEPTION 'Transaction reference required';
  END IF;

  IF _receipt_url IS NULL OR length(trim(_receipt_url)) = 0 THEN
    RAISE EXCEPTION 'Receipt URL required';
  END IF;

  INSERT INTO public.enrollments (
    user_id, plan_type, duration, classes_included, amount, unit_price,
    tx_ref, receipt_url, payment_provider, admin_review_required,
    status, payment_status, approval_status,
    sessions_total, sessions_remaining, payment_method
  ) VALUES (
    _user_id, _plan_type, _duration, _classes, _amount, _amount / _classes,
    trim(_tx_ref), trim(_receipt_url),
    'manual', true, 'PENDING', 'UNPAID', 'PENDING',
    _classes, _classes, _payment_method
  ) RETURNING id INTO _enrollment_id;

  RETURN _enrollment_id;
END;
$function$;