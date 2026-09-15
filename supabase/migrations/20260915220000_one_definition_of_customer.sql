-- One definition of "already a customer" — 15 September 2026
-- ===========================================================
--
-- Klovers has TWO kinds of student, in two tables, joined to each other by
-- nothing at all:
--
--   group students    public.enrollments
--   private students  public.teacher_students
--
-- Any outreach query written from `enrollments` alone therefore treats a
-- private student as a cold lead who has never bought anything. That is not
-- hypothetical: on 15 September Renad Elsenduony — "Rynad" on the roster, an
-- active private student since 22 August with her own Sunday class and her own
-- Meet room — was sent a letter inviting her to enrol in Level 2. Solafa had
-- been caught by hand in the same trap the day before, which means the trap was
-- known and was stepped in again anyway, because the knowledge lived in a
-- person's head and a document rather than in the database.
--
-- So the question gets one answer, in one place, and any future outreach asks
-- it instead of re-deriving it:
--
--     SELECT ... FROM leads l
--      WHERE lower(btrim(l.email)) NOT IN (SELECT email FROM app_private.customer_emails());
--
-- In `app_private` rather than `public` on purpose: PostgREST exposes `public`,
-- and this returns a list of customer email addresses. It is not a view for
-- the same reason.
--
-- NOT a name match, ever. There are three different people called "Menna" in
-- `leads` today; matching a private student by name would link her to somebody
-- else's account and nothing downstream would question it. The address is the
-- only safe key — see claude/ROSTER_AND_SITE_ARE_ONE_PERSON_2026-09-14.md.

CREATE OR REPLACE FUNCTION app_private.customer_emails()
RETURNS TABLE (email text, kind text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Group students: an enrolment that has not been deleted.
  SELECT lower(btrim(p.email)) AS email, 'group'::text AS kind
    FROM public.enrollments e
    JOIN public.profiles p ON p.user_id = e.user_id
   WHERE e.deleted_at IS NULL
     AND p.email IS NOT NULL
     AND btrim(p.email) <> ''

  UNION

  -- Private students. `status` is the roster's own word for whether she is
  -- still taught; anything other than an explicit 'inactive' counts, because a
  -- blank status on this table has always meant a live student.
  SELECT lower(btrim(ts.email)) AS email, 'private'::text AS kind
    FROM public.teacher_students ts
   WHERE ts.email IS NOT NULL
     AND btrim(ts.email) <> ''
     AND coalesce(ts.status, 'active') <> 'inactive';
$function$;

COMMENT ON FUNCTION app_private.customer_emails() IS
  'Every email address that belongs to somebody who is already a Klovers student — group (enrollments) or private (teacher_students). The single exclusion list for any outreach. Lives in app_private because it returns addresses and PostgREST exposes public.';

REVOKE ALL ON FUNCTION app_private.customer_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.customer_emails() TO service_role;
