-- Add slot rejection tracking to enrollments.
-- These track CLASS ASSIGNMENT rejections (no slot available),
-- separate from full enrollment rejections (payment issue).
-- The enrollment stays APPROVED+PAID — only the slot is rejected.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS slot_rejection_reason text,
  ADD COLUMN IF NOT EXISTS slot_rejection_at timestamptz;
