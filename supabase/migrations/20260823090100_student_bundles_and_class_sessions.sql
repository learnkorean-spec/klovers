-- Bundles & credits, part 2 of 2: what a student bought, and what they have
-- actually used.
--
-- Nothing reads either table yet -- the card and the confirm strip land in the
-- UI PR -- so applying this changes nothing anyone can see.
--
-- The one decision this file is built around
-- ------------------------------------------
-- A balance is NEVER stored. It is counted:
--
--     remaining = bundle.total_classes - count(sessions WHERE counted)
--
-- This is not a stylistic preference. public.students already implements the
-- stored-counter version of this idea, and sync_student_on_approval() adds to
-- it on every enrollment update instead of setting it. One student is recorded
-- at 516 classes and 283,800 EGP against a 12-class, 6,600 EGP package -- the
-- package re-added 43 times, once per edit. The note column preserves the
-- evidence: 43 identical "Auto-created from enrollment 842de20a..." lines.
--
-- A counted ledger cannot do that. Confirming the same class twice writes the
-- same (student, date, time) twice and the unique index refuses the second.
-- Undo is deleting one row, and the number corrects itself with no reconciling
-- step that could itself be wrong.
--
-- That bug is still live and is NOT fixed here; it belongs to public.students
-- and enrollments, neither of which this migration touches.
--
-- Money
-- -----
-- Recorded in the currency it was paid in and never converted. There is no
-- exchange rate anywhere in this schema and no reporting currency. numeric(12,2)
-- because a six-month private bundle in Indonesia is 6,156,000 IDR and a
-- Bahraini one is 218.50 BHD; both must be exact.
--
-- Zero balance
-- ------------
-- Reaching zero is a badge on a card, nothing more. No status changes, no
-- schedule is paused, no class stops blocking trial availability. Confirming
-- past zero is allowed and shows as negative: refusing to record a class that
-- actually happened would make the system lie about the week that just went by.

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Refuse to adopt somebody else's table.
--
-- Same guard as 20260822160000, for the same reason: that migration used
-- CREATE TABLE IF NOT EXISTS on a name that was already taken, silently adopted
-- the wrong table and then operated on it. IF NOT EXISTS is what turns a
-- missing check into a silent adoption, so the check is explicit and loud.
--
-- Re-running our own migration stays safe: the guards pass and every CREATE
-- below is a no-op.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.student_bundles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'student_bundles'
          AND column_name  = 'total_classes'
     ) THEN
    RAISE EXCEPTION
      'name_collision: public.student_bundles already exists and is not the table this migration creates (no "total_classes" column). Refusing to adopt it. Investigate the existing table before re-running.'
      USING ERRCODE = '42P07';
  END IF;

  IF to_regclass('public.student_class_sessions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'student_class_sessions'
          AND column_name  = 'counted'
     ) THEN
    RAISE EXCEPTION
      'name_collision: public.student_class_sessions already exists and is not the table this migration creates (no "counted" column). Refusing to adopt it. Investigate the existing table before re-running.'
      USING ERRCODE = '42P07';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 1. What the student bought.
--
-- Many bundles per student over time -- that is the payment history. Exactly
-- one may be active, enforced below by a partial unique index rather than by
-- convention, so a second active bundle is refused instead of quietly splitting
-- the balance across two rows.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_bundles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  source         text NOT NULL DEFAULT 'custom',
  catalog_key    text,
  label          text NOT NULL,
  total_classes  integer NOT NULL,
  total_price    numeric(12,2) NOT NULL,
  currency       text NOT NULL,
  purchased_on   date NOT NULL DEFAULT CURRENT_DATE,
  status         text NOT NULL DEFAULT 'active',
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT student_bundles_source_check
    CHECK (source IN ('catalog', 'custom')),
  CONSTRAINT student_bundles_status_check
    CHECK (status IN ('active', 'completed', 'cancelled')),
  CONSTRAINT student_bundles_label_check
    CHECK (length(btrim(label)) > 0),
  CONSTRAINT student_bundles_total_classes_check
    CHECK (total_classes > 0 AND total_classes <= 1000),
  CONSTRAINT student_bundles_total_price_check
    CHECK (total_price >= 0),
  CONSTRAINT student_bundles_currency_check
    CHECK (currency ~ '^[A-Z]{3}$'),
  -- A catalogue bundle must say which catalogue entry it came from, and a
  -- custom one must not claim to have come from any. Editing a catalogue price
  -- in the UI flips source to 'custom', so a stored row can never claim to be
  -- a catalogue bundle it no longer matches.
  CONSTRAINT student_bundles_catalog_key_check
    CHECK (
      (source = 'catalog' AND catalog_key IS NOT NULL AND length(btrim(catalog_key)) > 0)
      OR
      (source = 'custom'  AND catalog_key IS NULL)
    )
);

COMMENT ON TABLE public.student_bundles IS
  'What an ongoing 1:1 student bought: a number of classes for a price, in the '
  'currency they paid. One active bundle per student; older ones are the '
  'payment history. Price per class is never stored -- it is total_price / '
  'total_classes, computed for display, so the two can never disagree.';
COMMENT ON COLUMN public.student_bundles.catalog_key IS
  'Which entry of the country price table this came from, as '
  '"<country>|<group|private>|<months>", e.g. "Egypt|private|3". Null for '
  'custom bundles.';
COMMENT ON COLUMN public.student_bundles.total_price IS
  'Recorded in `currency` as paid. Never converted, never normalised to USD.';

-- One active bundle per student. A partial unique index rather than a trigger:
-- it cannot be raced, and it states the rule where anyone reading the schema
-- will find it.
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_bundles_one_active
  ON public.student_bundles (student_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_student_bundles_student
  ON public.student_bundles (student_id, purchased_on DESC);

DROP TRIGGER IF EXISTS trg_student_bundles_touch ON public.student_bundles;
CREATE TRIGGER trg_student_bundles_touch
  BEFORE INSERT OR UPDATE ON public.student_bundles
  FOR EACH ROW EXECUTE FUNCTION public.tg_teacher_students_touch();

-- ---------------------------------------------------------------------------
-- 2. What they actually used.
--
-- One row per confirmed session. Written only by an explicit click -- there is
-- no trigger, cron or scheduled job anywhere in this schema that creates one.
-- A class that has not been confirmed simply has no row, which is why the
-- confirm strip can be rebuilt from the weekly schedule at any time without
-- consulting any state.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_class_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES public.teacher_students(id)       ON DELETE CASCADE,
  bundle_id     uuid NOT NULL REFERENCES public.student_bundles(id)        ON DELETE CASCADE,
  -- SET NULL, not CASCADE: deleting Solafa's Tuesday slot must not erase the
  -- twelve Tuesdays she already attended and paid for.
  class_id      uuid          REFERENCES public.teacher_student_classes(id) ON DELETE SET NULL,
  session_date  date NOT NULL,
  start_time    time NOT NULL,
  outcome       text NOT NULL DEFAULT 'attended',
  counted       boolean NOT NULL DEFAULT true,
  confirmed_at  timestamptz NOT NULL DEFAULT now(),
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- counted is determined by outcome today, but is stored rather than derived
  -- so a future outcome can be counted or not on its own terms -- a late
  -- student cancellation that is still charged, for instance. Constraining
  -- both known outcomes here means adding a third is a deliberate change to
  -- this constraint, never an accidental miscount.
  CONSTRAINT student_class_sessions_outcome_check
    CHECK (
      (outcome = 'attended'            AND counted)
      OR
      (outcome = 'cancelled_no_charge' AND NOT counted)
    ),

  -- The whole guarantee against double-charging. A second confirmation of the
  -- same class -- a double click, a re-opened catch-up dialog, a stale tab --
  -- is refused by the database, not by the UI remembering to check.
  CONSTRAINT uq_student_class_sessions_slot
    UNIQUE (student_id, session_date, start_time)
);

COMMENT ON TABLE public.student_class_sessions IS
  'One row per class confirmed as having happened (or explicitly as not having '
  'happened). The credit ledger: a bundle''s remaining balance is counted from '
  'these rows and is never stored anywhere. Written only by an admin click; no '
  'trigger or scheduled job creates one.';
COMMENT ON COLUMN public.student_class_sessions.counted IS
  'True when this session consumes a credit. Constrained to agree with outcome '
  'so the two can never diverge.';

CREATE INDEX IF NOT EXISTS idx_student_class_sessions_student_date
  ON public.student_class_sessions (student_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_class_sessions_bundle_counted
  ON public.student_class_sessions (bundle_id) WHERE counted;

DROP TRIGGER IF EXISTS trg_student_class_sessions_touch ON public.student_class_sessions;
CREATE TRIGGER trg_student_class_sessions_touch
  BEFORE INSERT OR UPDATE ON public.student_class_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_teacher_students_touch();

-- A session must belong to the same student as the bundle it draws from.
-- A foreign key cannot say this -- the two references are independent -- and
-- getting it wrong would spend one student's credits on another's class.
CREATE OR REPLACE FUNCTION public.tg_student_class_session_bundle_matches()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_bundle_student uuid;
BEGIN
  SELECT b.student_id INTO v_bundle_student
    FROM public.student_bundles b
   WHERE b.id = NEW.bundle_id;

  IF v_bundle_student IS DISTINCT FROM NEW.student_id THEN
    RAISE EXCEPTION
      'bundle_student_mismatch: bundle % belongs to student %, not %. A session cannot draw a credit from another student''s bundle.',
      NEW.bundle_id, v_bundle_student, NEW.student_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_student_class_session_bundle_matches ON public.student_class_sessions;
CREATE TRIGGER trg_student_class_session_bundle_matches
  BEFORE INSERT OR UPDATE OF bundle_id, student_id ON public.student_class_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_student_class_session_bundle_matches();

-- ---------------------------------------------------------------------------
-- 3. RLS: admin only, matching teacher_students and teacher_student_classes.
--
-- These rows carry what people paid. Nothing student-facing reads them, and the
-- trial availability engine has no reason to: a student with no credits left
-- still occupies her class time, so availability is unaffected by any of this.
-- ---------------------------------------------------------------------------
ALTER TABLE public.student_bundles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_class_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage student_bundles" ON public.student_bundles;
CREATE POLICY "Admins manage student_bundles"
  ON public.student_bundles
  FOR ALL TO authenticated
  USING      (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage student_class_sessions" ON public.student_class_sessions;
CREATE POLICY "Admins manage student_class_sessions"
  ON public.student_class_sessions
  FOR ALL TO authenticated
  USING      (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 4. The balance, counted on demand.
--
-- SECURITY INVOKER on purpose -- the opposite choice from
-- get_trial_availability_v2. That one is DEFINER because anonymous callers must
-- get computed slots without reading the calendar. This one has no anonymous
-- caller and returns what people paid, so it runs as whoever calls it and the
-- admin policies above apply unchanged. A DEFINER function here would be a
-- hole, not a feature.
--
-- Returns one row per active bundle. A student with no active bundle simply
-- does not appear, which is what keeps them out of the confirm strip.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_bundle_balances()
 RETURNS TABLE(
   student_id        uuid,
   bundle_id         uuid,
   label             text,
   source            text,
   catalog_key       text,
   total_classes     integer,
   used_classes      integer,
   remaining_classes integer,
   total_price       numeric,
   currency          text,
   purchased_on      date
 )
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT
    b.student_id,
    b.id            AS bundle_id,
    b.label,
    b.source,
    b.catalog_key,
    b.total_classes,
    COALESCE(u.used, 0)::integer                     AS used_classes,
    (b.total_classes - COALESCE(u.used, 0))::integer AS remaining_classes,
    b.total_price,
    b.currency,
    b.purchased_on
  FROM public.student_bundles b
  LEFT JOIN LATERAL (
    SELECT count(*) AS used
      FROM public.student_class_sessions s
     WHERE s.bundle_id = b.id
       AND s.counted
  ) u ON true
  WHERE b.status = 'active';
$function$;

COMMENT ON FUNCTION public.get_student_bundle_balances() IS
  'Active bundle plus counted usage per student. remaining_classes is computed '
  'here and stored nowhere; it can go negative, which is deliberate -- a class '
  'that happened after the bundle ran out is still a class that happened.';

REVOKE ALL ON FUNCTION public.get_student_bundle_balances() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_bundle_balances() TO authenticated, service_role;

COMMIT;
