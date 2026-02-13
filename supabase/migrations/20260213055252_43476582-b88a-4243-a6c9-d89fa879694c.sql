
-- Add columns for Egypt manual payment flow
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_date DATE;

-- EGP pricing lookup table (server-side only)
CREATE TABLE public.egp_prices (
  plan_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  amount_egp NUMERIC NOT NULL,
  PRIMARY KEY (plan_type, duration)
);

ALTER TABLE public.egp_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read EGP prices"
  ON public.egp_prices FOR SELECT USING (true);

INSERT INTO public.egp_prices (plan_type, duration, amount_egp) VALUES
  ('group', 1, 1200),
  ('group', 3, 3300),
  ('group', 6, 6100),
  ('private', 1, 2350),
  ('private', 3, 6600),
  ('private', 6, 11750);

-- RPC: create_egypt_order
CREATE OR REPLACE FUNCTION public.create_egypt_order(
  _plan_type TEXT,
  _duration INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _enrollment_id UUID;
  _classes INTEGER;
  _amount NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF _plan_type NOT IN ('group', 'private') THEN RAISE EXCEPTION 'Invalid plan_type'; END IF;
  IF _duration NOT IN (1, 3, 6) THEN RAISE EXCEPTION 'Invalid duration'; END IF;

  _classes := CASE _duration WHEN 1 THEN 4 WHEN 3 THEN 12 WHEN 6 THEN 24 END;

  SELECT amount_egp INTO _amount FROM public.egp_prices
    WHERE plan_type = _plan_type AND duration = _duration;
  IF _amount IS NULL THEN RAISE EXCEPTION 'Price not found'; END IF;

  INSERT INTO public.enrollments (
    user_id, plan_type, duration, classes_included, amount, unit_price,
    tx_ref, receipt_url, payment_provider, admin_review_required,
    status, payment_status, approval_status,
    sessions_total, sessions_remaining,
    currency, due_at
  ) VALUES (
    _user_id, _plan_type, _duration, _classes, _amount, _amount / _classes,
    '', '', 'egypt_manual', true,
    'PENDING_PAYMENT', 'UNPAID', 'PENDING_PAYMENT',
    _classes, _classes,
    'EGP', now() + interval '48 hours'
  ) RETURNING id INTO _enrollment_id;

  RETURN _enrollment_id;
END;
$$;

-- RPC: submit_egypt_payment
CREATE OR REPLACE FUNCTION public.submit_egypt_payment(
  _enrollment_id UUID,
  _payment_method TEXT,
  _payment_date DATE,
  _receipt_url TEXT,
  _tx_ref TEXT DEFAULT ''
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner UUID;
  _status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT user_id, approval_status INTO _owner, _status
    FROM public.enrollments WHERE id = _enrollment_id;

  IF _owner IS NULL THEN RAISE EXCEPTION 'Enrollment not found'; END IF;
  IF _owner != auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _status != 'PENDING_PAYMENT' THEN RAISE EXCEPTION 'Enrollment is not in PENDING_PAYMENT status'; END IF;

  IF _payment_method NOT IN ('vodafone_cash', 'instapay', 'bank_transfer') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  IF _receipt_url IS NULL OR length(trim(_receipt_url)) = 0 THEN
    RAISE EXCEPTION 'Receipt URL required';
  END IF;

  UPDATE public.enrollments SET
    approval_status = 'UNDER_REVIEW',
    payment_method = _payment_method,
    payment_date = _payment_date,
    receipt_url = trim(_receipt_url),
    tx_ref = COALESCE(trim(_tx_ref), '')
  WHERE id = _enrollment_id;
END;
$$;
