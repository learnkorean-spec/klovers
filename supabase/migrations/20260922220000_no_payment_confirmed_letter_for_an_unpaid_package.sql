-- A brand-new package is not a payment.
--
-- email_student_on_bundle_payment fired on INSERT of any active bundle and sent
-- the student the "payment confirmed" letter. That was survivable only because
-- every private package in this system had been entered already paid -- the
-- money came first, the row second.
--
-- Re is about to do the opposite: create an unpaid package for Solafa and for
-- Renad, then press "Ask for payment" so each of them gets the letter asking
-- for the money. With the trigger as it was, the moment that package row was
-- saved the student would have been emailed that her payment was confirmed --
-- before she had sent a piastre, and before the payment ask went out at all.
--
-- The letter says "payment confirmed", so it goes out only when there is a
-- payment to confirm. The UPDATE branch is unchanged in effect: it already
-- required paid_on to have just been filled in, and the new guard above it
-- says the same thing once.

create or replace function public.email_student_on_bundle_payment()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  _student RECORD;
  _should_send boolean := false;
BEGIN
  IF NEW.payment_confirmation_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  -- The letter says "payment confirmed", so it goes out only when there is a
  -- payment to confirm.
  IF NEW.paid_on IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    _should_send := true;
  ELSIF TG_OP = 'UPDATE' AND OLD.paid_on IS NULL THEN
    _should_send := true;
  END IF;

  IF NOT _should_send THEN
    RETURN NEW;
  END IF;

  SELECT full_name, email INTO _student
    FROM public.teacher_students
    WHERE id = NEW.student_id;

  IF _student.email IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM app_private.invoke_edge(
    'send-confirmation-email',
    jsonb_build_object(
      'template',       'payment_confirmed',
      'email',          _student.email,
      'name',           _student.full_name,
      'plan_type',      'private',
      'sessions_total', NEW.total_classes,
      'amount',         NEW.total_price,
      'currency',       COALESCE(NEW.currency, 'EGP'),
      'level',          COALESCE(NEW.label, ''),
      'tx_ref',         '',
      'payment_date',   TO_CHAR(COALESCE(NEW.paid_on, NEW.purchased_on, CURRENT_DATE), 'DD Mon YYYY'),
      'language',       'ar'
    ),
    false,
    5000
  );

  UPDATE public.student_bundles
    SET payment_confirmation_sent_at = NOW()
    WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;
