-- The teaching roster and the account system had nothing joining them.
--
-- public.teacher_students is the list of people actually being taught —
-- five rows, the ones whose classes appear in teacher_student_classes and
-- student_class_sessions. Its columns are: id, full_name, subject, status,
-- note, country, currency, meeting_url, created_at, updated_at.
--
-- There is no email. There is no account reference. Nothing in the schema
-- says that "Mariam" on the roster is the same person as Mariam Harb who
-- has a profile, an enrolment and a trial booking. The only place that
-- connection existed was in the owner's memory.
--
-- What that cost, concretely: Mariam paid 2350 EGP by InstaPay around
-- 6 July 2026 and started private lessons the same day. Her enrolment was
-- never marked, so for two months the system said PENDING_PAYMENT / UNPAID
-- while she sat in eighteen delivered sessions. Nobody noticed, because
-- the roster that proved she was a student and the record that said she
-- had not paid were unreachable from each other.
--
-- One nullable column closes it.
--
-- Nullable on purpose. Not every person on the roster has signed up on the
-- site — the roster predates the account system and is maintained by hand.
-- Requiring an account would mean inventing one for people who never asked
-- for it. A NULL here means "not linked yet", which is the truth.
--
-- Unique where set, so the same account cannot be attached to two roster
-- rows. A partial index rather than a plain UNIQUE constraint, because
-- NULLs must stay free to repeat.
--
-- ON DELETE SET NULL rather than CASCADE. Deleting an auth user must never
-- delete the teaching record of the classes they attended; the roster row
-- and its session history outlive the login.

ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'teacher_students_user_id_fkey'
       AND conrelid = 'public.teacher_students'::regclass
  ) THEN
    ALTER TABLE public.teacher_students
      ADD CONSTRAINT teacher_students_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$mig$;

CREATE UNIQUE INDEX IF NOT EXISTS teacher_students_user_id_key
  ON public.teacher_students (user_id)
  WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.teacher_students.user_id IS
  'The site account this taught student signs in with, when they have one. '
  'NULL means not linked — the roster is maintained by hand and predates '
  'the account system, so an unlinked row is normal, not an error.';

-- The one link we can establish today with evidence rather than a guess.
--
-- Mariam Harb, harbmariam84@gmail.com:
--   enrolment created 4 Jul 2026, due 6 Jul, private plan, 2350 EGP
--   roster class effective from 6 Jul 2026, Mon 18:00 Bangkok, 90 min
--   eighteen sessions delivered from 6 Jul onward
--   Egypt / Korean / EGP on both sides
--
-- Matched on the roster row's id, not on the name, so a second "Mariam"
-- added later cannot silently take this link.

UPDATE public.teacher_students
   SET user_id = (SELECT p.user_id FROM public.profiles p
                   WHERE p.email = 'harbmariam84@gmail.com'
                   LIMIT 1),
       updated_at = now()
 WHERE id = '5249236a-5d6c-44c1-899a-7aeece38cfdc'
   AND user_id IS NULL;
