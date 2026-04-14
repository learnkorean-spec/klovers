-- Fix: slot-rejected students still had approval_status = 'APPROVED',
-- causing them to appear as "Enrolled" in dashboard stats.
-- Set them to 'REJECTED' so derived_status becomes 'LEAD'.

UPDATE public.enrollments
SET approval_status = 'REJECTED'
WHERE slot_rejection_reason IS NOT NULL
  AND approval_status = 'APPROVED';
