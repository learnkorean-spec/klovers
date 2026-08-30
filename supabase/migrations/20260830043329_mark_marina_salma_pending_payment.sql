-- Corrects 2 of the 4 enrollments surfaced by the group-membership-guard
-- investigation as APPROVED/PAID with no group seat. Founder's decision,
-- reached after reviewing each by name, not by pattern:
--
--   4d2d9f54-1848-4ba5-b3ba-07235aa81fa2  mm245718@gmail.com       (Marina)
--   e50c8646-7187-48ee-a3d1-e4f2c64c72f2  salmashalabyprof@gmail.com (Salma)
--
-- Both were marked APPROVED/PAID but payment was never actually received.
-- Corrected to PENDING_PAYMENT/UNPAID -- a status pair already in real use
-- elsewhere in this table (1 existing row), not invented here.
--
-- The other 2 rows from that same investigation are explicitly NOT touched:
--   8ae92fe5-a124-4389-bea6-e37eba7ba370  amany.hassana89@gmail.com (Reinad)
--     -- already a real, currently-studying student.
--   efc1f8ce-f486-44ca-9e82-71fe36d2b151  ayaaraffaa@gmail.com (Aya)
--     -- did pay; her APPROVED/PAID stands.
--
-- enrollment_status stays 'active' -- Marina and Salma are waiting, not
-- cancelled.
--
-- Evidence preserved, not deleted: receipt_url, tx_ref, amount, reviewed_at,
-- and reviewed_by are all left exactly as they are. Only approval_status,
-- payment_status, and admin_notes change. Note for the record: receipt_url
-- is already empty ('') on both rows before this migration runs -- there
-- was never an uploaded receipt file for either, only the tx_ref values
-- below, which this migration does not touch.
--
-- Downstream effect, intentional: the guard trigger added in
-- 20260828140321 (enforce_group_membership_guard) reads payment_status
-- directly off this table. Correcting the field here is what makes the
-- guard correct for these two students too -- no separate change needed
-- there.

BEGIN;

SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.enrollments
     WHERE id = '4d2d9f54-1848-4ba5-b3ba-07235aa81fa2'
       AND approval_status = 'APPROVED' AND payment_status = 'PAID'
       AND enrollment_status = 'active' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Guard failed: Marina''s enrollment (4d2d9f54...) is not in the expected APPROVED/PAID/active state -- refusing to change it';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.enrollments
     WHERE id = 'e50c8646-7187-48ee-a3d1-e4f2c64c72f2'
       AND approval_status = 'APPROVED' AND payment_status = 'PAID'
       AND enrollment_status = 'active' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Guard failed: Salma''s enrollment (e50c8646...) is not in the expected APPROVED/PAID/active state -- refusing to change it';
  END IF;
END $$;

UPDATE public.enrollments
   SET approval_status = 'PENDING_PAYMENT',
       payment_status  = 'UNPAID',
       admin_notes     = 'Payment not received — confirmed by Re, 2026-08-29. Receipt on file retained as evidence, not deleted.'
 WHERE id IN ('4d2d9f54-1848-4ba5-b3ba-07235aa81fa2', 'e50c8646-7187-48ee-a3d1-e4f2c64c72f2');

DO $$
BEGIN
  IF (
    SELECT count(*) FROM public.enrollments
     WHERE id IN ('4d2d9f54-1848-4ba5-b3ba-07235aa81fa2', 'e50c8646-7187-48ee-a3d1-e4f2c64c72f2')
       AND approval_status = 'PENDING_PAYMENT'
       AND payment_status = 'UNPAID'
       AND enrollment_status = 'active'
  ) <> 2 THEN
    RAISE EXCEPTION 'Verify failed: both rows did not land on PENDING_PAYMENT/UNPAID/active';
  END IF;

  -- Evidence columns must be byte-identical to what this migration found --
  -- proof nothing besides the 3 intended columns changed.
  IF (
    SELECT count(*) FROM public.enrollments
     WHERE id = '4d2d9f54-1848-4ba5-b3ba-07235aa81fa2'
       AND receipt_url = '' AND tx_ref = 'EGP-6487d7921f2c4f0aadd2a135de0fbf5d'
       AND amount = 1200 AND reviewed_by = 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416'
  ) <> 1 THEN
    RAISE EXCEPTION 'Verify failed: Marina''s evidence columns changed -- this migration must not touch them';
  END IF;
  IF (
    SELECT count(*) FROM public.enrollments
     WHERE id = 'e50c8646-7187-48ee-a3d1-e4f2c64c72f2'
       AND receipt_url = '' AND tx_ref = 'EGP-176d75d0dbe84a8cb002435365bd9c4c'
       AND amount = 1200 AND reviewed_by = 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416'
  ) <> 1 THEN
    RAISE EXCEPTION 'Verify failed: Salma''s evidence columns changed -- this migration must not touch them';
  END IF;
END $$;

COMMIT;
