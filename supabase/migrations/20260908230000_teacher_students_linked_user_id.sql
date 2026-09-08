-- Link a private (1:1) student to their platform account.
--
-- WHY
-- ---
-- teacher_students and profiles/enrollments have been two disconnected worlds.
-- The private tracker holds the weekly rule, the bundles and every session;
-- the platform holds the account, the payment and the enrollment. Nothing in
-- the schema joined them, so the same person can be a paid-up private student
-- on one side and an untouched enrollment row on the other, and no query
-- anywhere could tell that the two are one person. This adds the missing edge.
--
-- Nullable by design: most private students never had a platform account, and
-- neither the availability engine nor the bundle balances may start caring.
-- Nothing in the application reads this column yet -- it is the join the data
-- needs first; surfacing it in the admin UI is a separate change.

ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS linked_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname  = 'teacher_students_linked_user_id_fkey'
      AND conrelid = 'public.teacher_students'::regclass
  ) THEN
    ALTER TABLE public.teacher_students
      ADD CONSTRAINT teacher_students_linked_user_id_fkey
      FOREIGN KEY (linked_user_id)
      REFERENCES public.profiles (user_id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- One platform account belongs to at most one private student. Partial, so any
-- number of rows stay unlinked. It is also the covering index the daily
-- self-check requires of every foreign key -- adding the constraint without it
-- would have failed that assertion tomorrow morning.
CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_students_linked_user_id
  ON public.teacher_students (linked_user_id)
  WHERE linked_user_id IS NOT NULL;

COMMENT ON COLUMN public.teacher_students.linked_user_id IS
  'profiles.user_id of the same person''s platform account, when they have one. NULL means this student exists only in the private tracker.';

-- ---------------------------------------------------------------------------
-- Backfill: the one pair confirmed by hand today.
--
-- Identified by id on both sides rather than by name or email: the two records
-- spell the person differently, which is precisely why nothing had matched
-- them automatically and why this pairing is a human decision, not a rule.
-- ---------------------------------------------------------------------------
UPDATE public.teacher_students
SET linked_user_id = '2199e215-ac9d-41cd-b326-5ac462b61e6c'
WHERE id = '4338d1c2-deb8-4443-a659-4783668cebf5'
  AND linked_user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = '2199e215-ac9d-41cd-b326-5ac462b61e6c'
  );

-- ---------------------------------------------------------------------------
-- Close the superseded balance on that account's manual enrollment.
--
-- The enrollment (Feb 2026, 8 classes) still carried 7 remaining. The teaching
-- that actually happened runs from 2026-06-14 onwards and is counted, session
-- by session, against a bundle in student_bundles. Leaving 7 on the enrollment
-- means two systems each claiming to hold this student's credit, and the
-- platform's number is the wrong one.
--
-- Safe against the email triggers on this table, verified before writing:
--   * email_student_on_approval  -- returns early, approval_email_sent_at set
--   * email_student_on_payment   -- returns early, OLD.payment_status = PAID
--   * sync_student_on_approval   -- returns early, no billing field changes
-- No customer email can be sent by this statement. The 13 frozen cron jobs are
-- untouched.
-- ---------------------------------------------------------------------------
UPDATE public.enrollments
SET sessions_remaining = 0,
    admin_notes = trim(BOTH E'\n' FROM
      COALESCE(admin_notes, '') || E'\n' ||
      '2026-09-08: remaining balance closed. This account is linked to a private student record; teaching from 2026-06-14 is counted in student_bundles, so the balance here was superseded rather than owed.')
WHERE id = '8ae92fe5-a124-4389-bea6-e37eba7ba370'
  AND sessions_remaining <> 0;
