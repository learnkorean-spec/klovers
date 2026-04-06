-- Phase 1a: Enrollment data integrity — indexes, constraints, normalization
-- Prevents duplicate enrollments, speeds up admin queries, normalizes status values.

-- 1. Unique constraint on tx_ref (prevents duplicate webhook insertions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollment_tx_ref_unique
  ON public.enrollments (tx_ref)
  WHERE tx_ref IS NOT NULL AND tx_ref != '';

-- 2. Prevent same-day duplicate paid enrollments for same user+plan
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollment_no_duplicate_paid
  ON public.enrollments (user_id, plan_type, duration, (created_at::date))
  WHERE payment_status = 'PAID';

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_enrollment_provider_txref
  ON public.enrollments (payment_provider, tx_ref);

CREATE INDEX IF NOT EXISTS idx_enrollment_approval_created
  ON public.enrollments (approval_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrollment_stripe_pi
  ON public.enrollments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_slot_prefs_enrollment
  ON public.student_slot_preferences (enrollment_id);

-- 4. Normalize existing payment_status to UPPER
UPDATE public.enrollments
  SET payment_status = UPPER(payment_status)
  WHERE payment_status IS DISTINCT FROM UPPER(payment_status);

-- 5. CHECK constraint to enforce UPPER going forward
ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS chk_payment_status_upper;
ALTER TABLE public.enrollments
  ADD CONSTRAINT chk_payment_status_upper
  CHECK (payment_status = UPPER(payment_status));
