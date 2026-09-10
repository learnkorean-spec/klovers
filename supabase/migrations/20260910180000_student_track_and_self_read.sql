-- Two things, one migration, because neither is useful without the other.
--
-- 1. profiles.track — 'korean' or 'english'. Klovers teaches both; the product
--    only knew about Korean. The column is DERIVED from the teaching roster's
--    own `subject`, never typed in twice: a trigger keeps it in step, so
--    linking a student to their account is still the only manual act.
--
-- 2. Self-read on the four private-teaching tables. Until now they were
--    admin-only, which means a private student signing in could not see one
--    thing about her own lessons — not her times, not her bundle, not what she
--    had left. That is true of every private student today, not only the
--    English one: Mariam has an account, was sent to /dashboard this morning,
--    and would have found nothing there about the lessons she is actually
--    taking.
--
-- The policies are SELECT-only and scoped to rows the student owns. Nothing
-- here lets a student write, and nothing lets one student see another.

-- ---------------------------------------------------------------------------
-- 1. The track column
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT 'korean';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_track_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_track_check CHECK (track IN ('korean', 'english'));

COMMENT ON COLUMN public.profiles.track IS
  'Which language this student is LEARNING. Derived from teacher_students.subject '
  'by trg_sync_profile_track; do not set it by hand.';

-- Keep it derived. A student is linked to their account in exactly one place,
-- and this makes that one act enough.
CREATE OR REPLACE FUNCTION public.sync_profile_track_from_roster()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- A link moved to a different account: the account it left goes back to the
  -- default rather than keeping a track it no longer has a roster row for.
  IF TG_OP = 'UPDATE'
     AND OLD.user_id IS NOT NULL
     AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    UPDATE public.profiles SET track = 'korean' WHERE user_id = OLD.user_id;
  END IF;

  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
       SET track = CASE WHEN NEW.subject = 'english' THEN 'english' ELSE 'korean' END
     WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_track ON public.teacher_students;
CREATE TRIGGER trg_sync_profile_track
AFTER INSERT OR UPDATE OF user_id, subject ON public.teacher_students
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_track_from_roster();

-- Derived means derived: a student must not be able to flip their own track by
-- posting to their profile row. Same shape as the credits and status guards
-- already in this function; admins and the service role are unaffected.
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.role() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    RAISE EXCEPTION 'Cannot modify credits';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Cannot modify status';
  END IF;
  IF NEW.track IS DISTINCT FROM OLD.track THEN
    RAISE EXCEPTION 'Cannot modify track';
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill from the roster. Runs as the migration role, so the guard above
-- returns early and does not fight it.
UPDATE public.profiles p
   SET track = CASE WHEN ts.subject = 'english' THEN 'english' ELSE 'korean' END
  FROM public.teacher_students ts
 WHERE ts.user_id = p.user_id
   AND p.track IS DISTINCT FROM
       CASE WHEN ts.subject = 'english' THEN 'english' ELSE 'korean' END;

-- ---------------------------------------------------------------------------
-- 2. Self-read
-- ---------------------------------------------------------------------------

-- Asked from inside a policy on a child table. SECURITY DEFINER so the lookup
-- does not itself depend on the policy being added to teacher_students below —
-- a policy that reads the table it is guarding is how these become fragile.
CREATE OR REPLACE FUNCTION public.is_own_teacher_student(_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.teacher_students ts
     WHERE ts.id = _student_id
       AND ts.user_id = auth.uid()
  );
$$;

-- A SECURITY DEFINER function left executable by PUBLIC is reachable
-- unauthenticated over PostgREST. Signed-in callers only.
REVOKE ALL ON FUNCTION public.is_own_teacher_student(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_own_teacher_student(uuid) TO authenticated;

DROP POLICY IF EXISTS "Students read their own roster row" ON public.teacher_students;
CREATE POLICY "Students read their own roster row"
ON public.teacher_students FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students read their own class times" ON public.teacher_student_classes;
CREATE POLICY "Students read their own class times"
ON public.teacher_student_classes FOR SELECT TO authenticated
USING (public.is_own_teacher_student(student_id));

DROP POLICY IF EXISTS "Students read their own bundles" ON public.student_bundles;
CREATE POLICY "Students read their own bundles"
ON public.student_bundles FOR SELECT TO authenticated
USING (public.is_own_teacher_student(student_id));

DROP POLICY IF EXISTS "Students read their own sessions" ON public.student_class_sessions;
CREATE POLICY "Students read their own sessions"
ON public.student_class_sessions FOR SELECT TO authenticated
USING (public.is_own_teacher_student(student_id));

-- ---------------------------------------------------------------------------
-- Verify, rather than assume
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  _policies integer;
  _linked   integer;
  _wrong    integer;
BEGIN
  SELECT count(*) INTO _policies
    FROM pg_policies
   WHERE schemaname = 'public'
     AND policyname IN (
       'Students read their own roster row',
       'Students read their own class times',
       'Students read their own bundles',
       'Students read their own sessions');
  IF _policies <> 4 THEN
    RAISE EXCEPTION 'expected 4 self-read policies, found %', _policies;
  END IF;

  -- Every linked roster row must agree with its profile.
  SELECT count(*) INTO _linked FROM public.teacher_students WHERE user_id IS NOT NULL;
  SELECT count(*) INTO _wrong
    FROM public.teacher_students ts
    JOIN public.profiles p ON p.user_id = ts.user_id
   WHERE p.track IS DISTINCT FROM
         CASE WHEN ts.subject = 'english' THEN 'english' ELSE 'korean' END;
  IF _wrong <> 0 THEN
    RAISE EXCEPTION 'track backfill disagrees with the roster on % of % linked rows', _wrong, _linked;
  END IF;

  RAISE NOTICE 'track synced for % linked student(s); 4 self-read policies in place', _linked;
END;
$$;
