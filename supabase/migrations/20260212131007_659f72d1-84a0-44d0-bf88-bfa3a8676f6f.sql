
-- Step 1: Add new columns (safe, additive)
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS admin_review_required boolean NOT NULL DEFAULT false;

-- Step 2: Backfill from old status column
UPDATE public.enrollments
SET
  payment_status = CASE WHEN status = 'APPROVED' THEN 'PAID' ELSE 'UNPAID' END,
  approval_status = CASE
    WHEN status = 'APPROVED' THEN 'APPROVED'
    WHEN status = 'REJECTED' THEN 'REJECTED'
    ELSE 'PENDING'
  END,
  admin_review_required = CASE WHEN status = 'PENDING' THEN true ELSE false END,
  payment_provider = CASE
    WHEN receipt_url LIKE 'stripe:%' THEN 'stripe'
    ELSE 'manual'
  END
WHERE payment_status = 'UNPAID' AND approval_status = 'PENDING';
