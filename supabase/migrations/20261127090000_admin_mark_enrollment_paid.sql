-- A deliberate "mark paid" for a group enrollment that has a seat but is still
-- PENDING_PAYMENT (admin_confirm_student_into_group() seats a student and
-- leaves it that way, which is why paid students showed as unpaid).
--
-- Never set enrollments.payment_status = 'PAID' with a bare UPDATE: the
-- existing triggers react to that change, so this is the one place it is done
-- on purpose, by an admin, with an amount:
--   * email_student_on_payment   -> may send the "payment confirmed" email
--     (only if neither payment_email_sent_at nor approval_email_sent_at is set)
--   * email_student_on_approval  -> may send the approval email (only when the
--     row is matched and approval_email_sent_at is not set)
--   * notify_payment_received    -> admin notification
--   * sync_student_on_approval   -> upserts a `students` row (only when matched)
-- The caller is told this before it calls (see PaymentsBoard.tsx).
--
-- Only an active, APPROVED, manual / egypt_manual, still-unpaid enrollment.
-- Stripe rows are paid by the webhook, never by hand.
--
-- Classes: an unfunded row (sessions_total = 0) gets classes_included added to
-- sessions_remaining, not assigned, so classes already taught while it was
-- unpaid (remaining can already be negative) stay counted. A row that already
-- has sessions_total keeps its numbers.

CREATE OR REPLACE FUNCTION public.admin_mark_enrollment_paid(
  _enrollment_id uuid,
  _amount numeric,
  _paid_on date DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _e record;
  _new_total integer;
  _new_remaining integer;
BEGIN
  IF NOT coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false) THEN
    RAISE EXCEPTION 'Only an admin can mark an enrollment paid.'
      USING errcode = '42501';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Enter the amount that was paid.';
  END IF;

  SELECT * INTO _e
    FROM public.enrollments e
   WHERE e.id = _enrollment_id
   FOR UPDATE;

  IF NOT FOUND OR _e.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Enrollment not found.';
  END IF;
  IF coalesce(_e.enrollment_status, 'active') <> 'active' THEN
    RAISE EXCEPTION 'This enrollment is % and cannot be marked paid.', _e.enrollment_status;
  END IF;
  IF _e.approval_status IS DISTINCT FROM 'APPROVED' THEN
    RAISE EXCEPTION 'Only an approved enrollment can be marked paid (status: %).', _e.approval_status;
  END IF;
  IF _e.payment_status NOT IN ('PENDING_PAYMENT', 'UNPAID') THEN
    RAISE EXCEPTION 'Already % - nothing to mark.', _e.payment_status;
  END IF;
  IF _e.payment_provider NOT IN ('manual', 'egypt_manual') THEN
    RAISE EXCEPTION 'Payments by % are recorded by the payment provider, not by hand.', _e.payment_provider;
  END IF;
  IF coalesce(_e.classes_included, 0) <= 0 THEN
    RAISE EXCEPTION 'This enrollment has no classes included; fix it in Enrollments first.';
  END IF;

  IF coalesce(_e.sessions_total, 0) = 0 THEN
    _new_total := _e.classes_included;
    _new_remaining := coalesce(_e.sessions_remaining, 0) + _e.classes_included;
  ELSE
    _new_total := _e.sessions_total;
    _new_remaining := _e.sessions_remaining;
  END IF;

  UPDATE public.enrollments
     SET payment_status     = 'PAID',
         amount             = _amount,
         unit_price         = _amount / _e.classes_included,
         payment_date       = coalesce(_paid_on, (now() AT TIME ZONE 'Africa/Cairo')::date),
         sessions_total     = _new_total,
         sessions_remaining = _new_remaining
   WHERE id = _enrollment_id;

  RETURN jsonb_build_object(
    'enrollment_id',      _enrollment_id,
    'amount',             _amount,
    'currency',           _e.currency,
    'sessions_total',     _new_total,
    'sessions_remaining', _new_remaining
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_mark_enrollment_paid(uuid, numeric, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mark_enrollment_paid(uuid, numeric, date) TO authenticated, service_role;
