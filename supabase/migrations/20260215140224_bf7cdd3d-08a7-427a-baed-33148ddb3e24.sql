
-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_created ON public.enrollments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_approval ON public.enrollments (payment_status, approval_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_method ON public.enrollments (payment_method);

-- Drop and recreate the view with correct column order
DROP VIEW IF EXISTS public.admin_student_overview;

CREATE VIEW public.admin_student_overview
WITH (security_invoker = on)
AS
SELECT
  p.user_id,
  p.email,
  p.name,
  p.country,
  p.level,
  p.created_at AS joined_at,
  le.id AS enrollment_id,
  le.payment_status,
  le.approval_status,
  le.payment_method,
  le.payment_provider,
  le.plan_type,
  le.duration,
  le.amount,
  le.currency,
  le.sessions_total,
  COALESCE(le.sessions_remaining, 0) AS sessions_remaining,
  le.created_at AS enrollment_created_at,
  CASE
    WHEN le.id IS NULL
         OR le.payment_status IS DISTINCT FROM 'PAID'
         OR le.approval_status IS DISTINCT FROM 'APPROVED'
      THEN 'LEAD'
    WHEN le.sessions_remaining <= -3 THEN 'LOCKED'
    WHEN le.sessions_remaining = 0  THEN 'COMPLETED'
    ELSE 'ACTIVE'
  END AS derived_status,
  CASE
    WHEN le.payment_provider = 'stripe'       THEN 'Stripe'
    WHEN le.payment_provider = 'egypt_manual'  THEN 'Egypt'
    WHEN le.payment_provider = 'manual'        THEN 'Manual'
    ELSE '—'
  END AS source_label
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT *
  FROM public.enrollments e
  WHERE e.user_id = p.user_id
  ORDER BY e.created_at DESC
  LIMIT 1
) le ON true;
