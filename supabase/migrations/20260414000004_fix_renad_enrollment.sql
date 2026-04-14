-- Link Renad's lead to her profile
UPDATE public.leads
SET user_id = (
  SELECT user_id FROM public.profiles
  WHERE email = 'amany.hassana89@gmail.com'
  LIMIT 1
)
WHERE email = 'amany.hassana89@gmail.com'
  AND user_id IS NULL;

-- Fix Renad Elsenduony's enrollment data:
-- 12 sessions total, $50 paid, 8 remaining
UPDATE public.enrollments
SET sessions_total = 12,
    sessions_remaining = 8,
    amount = 50,
    unit_price = 50.0 / 12,
    currency = 'USD'
WHERE user_id = (
  SELECT user_id FROM public.profiles
  WHERE email = 'amany.hassana89@gmail.com'
  LIMIT 1
)
AND approval_status = 'APPROVED';
