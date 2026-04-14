-- Correct Renad Elsenduony's enrollment data to match actual attendance records:
-- 8 sessions total, LE1,666 paid, 7 remaining, LE208 unit price, EGP currency
UPDATE public.enrollments
SET sessions_total = 8,
    sessions_remaining = 7,
    classes_included = 8,
    amount = 1666,
    unit_price = 208,
    currency = 'EGP',
    payment_provider = 'egypt_manual'
WHERE user_id = (
  SELECT user_id FROM public.profiles
  WHERE email = 'amany.hassana89@gmail.com'
  LIMIT 1
)
AND approval_status = 'APPROVED';

-- Also update her lead record with correct country
UPDATE public.leads
SET country = 'Egypt'
WHERE email = 'amany.hassana89@gmail.com'
  AND (country IS NULL OR country = '');

-- Enrich her profile with country if empty
UPDATE public.profiles
SET country = 'Egypt'
WHERE email = 'amany.hassana89@gmail.com'
  AND (country IS NULL OR country = '');
