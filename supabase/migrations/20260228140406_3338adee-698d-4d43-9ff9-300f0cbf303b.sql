
-- 1. Add enrollment_status column
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS enrollment_status text NOT NULL DEFAULT 'active';

-- 2. Add slot_id column
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS slot_id uuid NULL;

-- 3. Validation trigger for enrollment_status (not CHECK constraint per guidelines)
CREATE OR REPLACE FUNCTION public.validate_enrollment_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.enrollment_status NOT IN ('active', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'Invalid enrollment_status: %', NEW.enrollment_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_enrollment_status ON public.enrollments;
CREATE TRIGGER trg_validate_enrollment_status
  BEFORE INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.validate_enrollment_status();

-- 4. Backfill: mark rejected enrollments as cancelled
UPDATE public.enrollments
  SET enrollment_status = 'cancelled'
  WHERE approval_status = 'REJECTED' AND enrollment_status = 'active';

-- 5. Backfill: set slot_id from package_id for matched enrollments
UPDATE public.enrollments
  SET slot_id = package_id
  WHERE matched_at IS NOT NULL AND slot_id IS NULL AND package_id IS NOT NULL;

-- 6. Composite index
CREATE INDEX IF NOT EXISTS enroll_user_status_idx
  ON public.enrollments(user_id, enrollment_status, payment_status, approval_status);

-- 7. Create the admin_student_status_overview view
CREATE OR REPLACE VIEW public.admin_student_status_overview AS
WITH active_enr AS (
  SELECT DISTINCT ON (e.user_id)
    e.user_id,
    e.id as enrollment_id,
    e.created_at as enrollment_created_at,
    e.payment_status,
    e.approval_status,
    e.enrollment_status,
    e.slot_id,
    e.matched_at,
    e.plan_type,
    e.duration,
    e.amount,
    e.classes_included,
    e.sessions_remaining,
    e.sessions_total,
    e.unit_price,
    e.currency,
    e.package_id,
    e.level
  FROM public.enrollments e
  WHERE e.enrollment_status = 'active'
  ORDER BY e.user_id, e.created_at DESC
)
SELECT
  p.user_id,
  p.email,
  p.name,
  p.country,
  p.level as profile_level,
  p.created_at as profile_created_at,
  a.enrollment_id as active_enrollment_id,
  a.enrollment_created_at,
  a.payment_status,
  a.approval_status,
  a.enrollment_status,
  a.slot_id,
  a.matched_at,
  a.plan_type,
  a.duration,
  a.amount,
  a.classes_included,
  a.sessions_remaining,
  a.sessions_total,
  a.unit_price,
  a.currency,
  a.package_id,
  COALESCE(a.level, p.level) as level,
  CASE
    WHEN a.enrollment_id IS NULL THEN 'not_paid'
    WHEN a.payment_status = 'PAID' AND a.approval_status = 'APPROVED' AND a.enrollment_status = 'active' AND (a.slot_id IS NOT NULL OR a.matched_at IS NOT NULL) THEN 'attending'
    WHEN a.payment_status = 'PAID' AND a.approval_status = 'APPROVED' AND a.enrollment_status = 'active' AND a.slot_id IS NULL AND a.matched_at IS NULL THEN 'paid_approved_unassigned'
    WHEN a.payment_status = 'PAID' AND a.approval_status IN ('PENDING', 'UNDER_REVIEW', 'PENDING_PAYMENT') AND a.enrollment_status = 'active' THEN 'paid_pending'
    WHEN a.approval_status = 'REJECTED' THEN 'rejected'
    ELSE 'not_paid'
  END AS computed_status
FROM public.profiles p
LEFT JOIN active_enr a ON a.user_id = p.user_id;
