-- Fix: Use enrollment level as fallback when profile level is empty.
-- Enrich profiles with country from linked leads where profile country is missing.

-- 1) Backfill empty profile country from linked leads
UPDATE public.profiles p
SET country = l.country
FROM public.leads l
WHERE l.user_id = p.user_id
  AND (p.country IS NULL OR p.country = '')
  AND l.country IS NOT NULL
  AND l.country != '';

-- 2) Backfill empty profile level from latest enrollment
UPDATE public.profiles p
SET level = e.level
FROM public.enrollments e
WHERE e.user_id = p.user_id
  AND (p.level IS NULL OR p.level = '')
  AND e.level IS NOT NULL
  AND e.level != '';

-- 3) Zero out sessions for rejected enrollments
UPDATE public.enrollments
SET sessions_remaining = 0
WHERE approval_status = 'REJECTED'
  AND sessions_remaining > 0;

-- 4) Recreate view with enrollment level fallback
DROP VIEW IF EXISTS public.admin_student_overview;

CREATE VIEW public.admin_student_overview
WITH (security_invoker = on)
AS
SELECT
  p.user_id,
  p.email,
  p.name,
  p.country,
  CASE
    WHEN COALESCE(p.level, '') = '' THEN COALESCE(le.level, '')
    ELSE p.level
  END AS level,
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
  le.unit_price,
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
  END AS source_label,
  GREATEST(0, -COALESCE(le.sessions_remaining, 0)) AS negative_sessions,
  GREATEST(0, -COALESCE(le.sessions_remaining, 0)) * COALESCE(le.unit_price, 0) AS amount_due
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT *
  FROM public.enrollments e
  WHERE e.user_id = p.user_id
  ORDER BY e.created_at DESC
  LIMIT 1
) le ON true;
