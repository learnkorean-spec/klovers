
-- Create admin_student_overview view: one row per user with latest enrollment data + derived_status
CREATE OR REPLACE VIEW public.admin_student_overview AS
WITH latest_enrollment AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    id AS enrollment_id,
    payment_status,
    approval_status,
    payment_method,
    payment_provider,
    sessions_total,
    sessions_remaining,
    created_at AS enrollment_created_at,
    plan_type,
    duration,
    amount,
    currency
  FROM public.enrollments
  ORDER BY user_id, created_at DESC
)
SELECT
  p.user_id,
  p.name,
  p.email,
  p.country,
  p.level,
  p.created_at AS joined_at,
  le.enrollment_id,
  le.payment_status,
  le.approval_status,
  le.payment_method,
  le.payment_provider,
  COALESCE(le.sessions_total, 0) AS sessions_total,
  COALESCE(le.sessions_remaining, 0) AS sessions_remaining,
  le.enrollment_created_at,
  le.plan_type,
  le.duration,
  le.amount,
  le.currency,
  CASE
    WHEN le.enrollment_id IS NULL THEN 'LEAD'
    WHEN le.payment_status != 'PAID' OR le.approval_status != 'APPROVED' THEN 'LEAD'
    WHEN le.sessions_remaining <= -3 THEN 'LOCKED'
    WHEN le.sessions_remaining = 0 THEN 'COMPLETED'
    ELSE 'ACTIVE'
  END AS derived_status,
  CASE
    WHEN le.payment_provider = 'stripe' THEN 'Stripe'
    WHEN le.payment_provider = 'egypt_manual' THEN 'Egypt'
    WHEN le.payment_method IN ('vodafone_cash', 'instapay', 'bank_transfer') THEN 'Egypt'
    WHEN le.payment_provider = 'manual' THEN 'Manual'
    ELSE '—'
  END AS source_label
FROM public.profiles p
LEFT JOIN latest_enrollment le ON le.user_id = p.user_id;

-- Grant access: the view inherits RLS from underlying tables via the querying user's role
-- But views bypass RLS by default, so we need to secure it.
-- We'll use security_invoker so the view respects RLS of the caller.
ALTER VIEW public.admin_student_overview SET (security_invoker = on);
