-- Let a student who was placed in a class before paying (approval_status
-- APPROVED, payment_status not PAID) upload her receipt from /pay, the same
-- way a PENDING_PAYMENT student does. The row moves to UNDER_REVIEW and the
-- admin confirms it with the normal Approve button (which sets PAID).
-- Identical to the live function otherwise, including SET search_path and the
-- 'PENDING_PAYMENT' error text the client matches on.
CREATE OR REPLACE FUNCTION public.submit_egypt_payment(_enrollment_id uuid, _payment_method text, _payment_date date, _receipt_url text, _tx_ref text DEFAULT ''::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _owner UUID;
  _status TEXT;
  _pay TEXT;
  _student_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT e.user_id, e.approval_status, e.payment_status INTO _owner, _status, _pay
    FROM public.enrollments e WHERE e.id = _enrollment_id;

  -- Enrollment must exist
  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;

  -- Authorization: must be the owner OR a manual enrollment (user_id IS NULL)
  IF _owner IS NOT NULL AND _owner != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT (_status = 'PENDING_PAYMENT'
          OR (_status = 'APPROVED' AND COALESCE(_pay, '') <> 'PAID')) THEN
    RAISE EXCEPTION 'Enrollment is not in PENDING_PAYMENT status';
  END IF;

  IF _payment_method NOT IN ('vodafone_cash', 'instapay', 'bank_transfer') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  IF _receipt_url IS NULL OR length(trim(_receipt_url)) = 0 THEN
    RAISE EXCEPTION 'Receipt URL required';
  END IF;

  -- Update enrollment to UNDER_REVIEW
  UPDATE public.enrollments SET
    approval_status = 'UNDER_REVIEW',
    payment_method = _payment_method,
    payment_date = _payment_date,
    receipt_url = trim(_receipt_url),
    tx_ref = COALESCE(trim(_tx_ref), '')
  WHERE id = _enrollment_id;

  -- Get student name for notification message
  SELECT COALESCE(p.name, au.email, 'Unknown student') INTO _student_name
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE au.id = auth.uid();

  -- Notify admin (triggers trg_notify_admin_email → notify-admin-email edge function → email)
  INSERT INTO public.admin_notifications (message, type, related_user_id)
  VALUES (
    _student_name || ' submitted a payment receipt and is awaiting review.',
    'payment_submitted',
    auth.uid()
  );
END;
$function$;
