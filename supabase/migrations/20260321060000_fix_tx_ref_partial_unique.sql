-- Fix: Replace UNIQUE constraint on tx_ref with partial unique index
-- Only enforce uniqueness when tx_ref is non-empty (prevents duplicate constraint errors
-- when multiple manual enrollments are submitted without a transaction reference)
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_tx_ref_unique;

CREATE UNIQUE INDEX IF NOT EXISTS enrollments_tx_ref_nonempty_unique
  ON public.enrollments (tx_ref)
  WHERE tx_ref IS NOT NULL AND tx_ref != '';
