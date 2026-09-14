-- "Hold my place - pay later" could not write a row.
--
-- Live on production the moment a student pressed it:
--
--   null value in column "tx_ref" of relation "enrollments"
--   violates not-null constraint
--
-- hold_my_seat() (20260914140000) inserts an enrolment for a student who has
-- not paid yet, and its INSERT lists neither tx_ref, nor receipt_url, nor
-- unit_price. All three are NOT NULL with no default, so the insert died on
-- tx_ref and would have died on receipt_url and unit_price in turn. Nobody
-- could book.
--
-- The rehearsal for that migration ran against a local Postgres with the real
-- production TRIGGERS loaded - and triggers are not constraints. A NOT NULL
-- with no default is invisible to a test that only exercises trigger logic.
--
-- WHY THE FIX IS AT THE COLUMN AND NOT IN THE FUNCTION
--
-- tx_ref, receipt_url and unit_price are facts about a PAYMENT. Until today
-- every enrolment row was created by a payment flow, so requiring them cost
-- nothing. hold_my_seat changed that: an enrolment may now legitimately be
-- created BEFORE any money exists, which is the entire point of holding a
-- place. A row in that state has no transaction reference and no receipt, and
-- there is nothing dishonest about saying so.
--
-- Patching the one INSERT would leave the next path that creates a
-- pre-payment enrolment to rediscover this the same way - in production, in
-- front of a student. Defaulting the columns fixes every path at once, and
-- takes nothing away from the payment flows, which all pass these values
-- explicitly and will continue to override the default.
--
-- The NOT NULL stays. "Empty" and "unknown" are different answers and the
-- column should keep being able to tell them apart.

ALTER TABLE public.enrollments ALTER COLUMN tx_ref      SET DEFAULT '';
ALTER TABLE public.enrollments ALTER COLUMN receipt_url SET DEFAULT '';
ALTER TABLE public.enrollments ALTER COLUMN unit_price  SET DEFAULT 0;

COMMENT ON COLUMN public.enrollments.tx_ref IS
  'The payment''s transaction reference. Empty means no payment has been made '
  'yet - a seat held through hold_my_seat() before paying. Never NULL: empty '
  'and unknown are different answers.';

COMMENT ON COLUMN public.enrollments.receipt_url IS
  'Where the uploaded receipt lives. Empty means none has been uploaded yet.';

COMMENT ON COLUMN public.enrollments.unit_price IS
  'Price per class in this row''s currency. 0 on a held seat, where no plan has '
  'been chosen and there is no price yet.';

-- ---------------------------------------------------------------------------
-- Verify by doing the thing that failed, rather than by inspecting metadata
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  _user uuid;
  _id   uuid;
BEGIN
  SELECT user_id INTO _user FROM public.profiles WHERE user_id IS NOT NULL LIMIT 1;
  IF _user IS NULL THEN
    RAISE WARNING 'no profile to rehearse the insert with - defaults set, not exercised';
    RETURN;
  END IF;

  -- Exactly the column list hold_my_seat() uses. If this raises, the fix is
  -- incomplete and the migration must not be recorded as applied.
  INSERT INTO public.enrollments (
    user_id, plan_type, duration, classes_included, amount, currency,
    payment_provider, payment_status, approval_status,
    level, package_id, slot_id, matched_at, timezone
  ) VALUES (
    _user, 'group', 1, 4, 0, 'EGP',
    'manual', 'PENDING_PAYMENT', 'APPROVED',
    NULL, NULL, NULL, now(), 'Africa/Cairo'
  )
  RETURNING id INTO _id;

  -- It was only ever a rehearsal. Leaving it behind would put a phantom row in
  -- the PAYMENTS queue, which is the class of thing this codebase has had to
  -- clean up by hand before.
  DELETE FROM public.enrollments WHERE id = _id;

  RAISE NOTICE 'hold-my-seat insert shape now succeeds; rehearsal row removed';
END;
$$;
