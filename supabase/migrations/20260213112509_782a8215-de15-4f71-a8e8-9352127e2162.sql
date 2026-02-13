
CREATE OR REPLACE FUNCTION public.create_egypt_order(_plan_type text, _duration integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _enrollment_id UUID;
  _classes INTEGER;
  _amount NUMERIC;
  _tx_ref TEXT;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF _plan_type NOT IN ('group', 'private') THEN RAISE EXCEPTION 'Invalid plan_type'; END IF;
  IF _duration NOT IN (1, 3, 6) THEN RAISE EXCEPTION 'Invalid duration'; END IF;

  _classes := CASE _duration WHEN 1 THEN 4 WHEN 3 THEN 12 WHEN 6 THEN 24 END;

  SELECT amount_egp INTO _amount FROM public.egp_prices
    WHERE plan_type = _plan_type AND duration = _duration;
  IF _amount IS NULL THEN RAISE EXCEPTION 'Price not found'; END IF;

  -- Generate a unique tx_ref for Egypt orders
  _tx_ref := 'EGP-' || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.enrollments (
    user_id, plan_type, duration, classes_included, amount, unit_price,
    tx_ref, receipt_url, payment_provider, admin_review_required,
    status, payment_status, approval_status,
    sessions_total, sessions_remaining,
    currency, due_at
  ) VALUES (
    _user_id, _plan_type, _duration, _classes, _amount, _amount / _classes,
    _tx_ref, '', 'egypt_manual', true,
    'PENDING_PAYMENT', 'UNPAID', 'PENDING_PAYMENT',
    _classes, _classes,
    'EGP', now() + interval '48 hours'
  ) RETURNING id INTO _enrollment_id;

  RETURN _enrollment_id;
END;
$function$;
