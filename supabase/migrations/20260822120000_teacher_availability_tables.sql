-- Phase 2 of the trial redesign (docs/TRIAL_REDESIGN_PLAN.md).
--
-- Adds the storage for rule-based teacher availability. Nothing reads these
-- objects yet: no function, view, edge function or page references them, so
-- merging and applying this changes nothing a student or admin can see. The
-- engine that reads them arrives in Phase 3, the admin screen in Phase 4.
--
-- The model
-- --------
-- Instead of one row per bookable class (today's trial_slots, hand-entered and
-- rolled forward monthly by cron), availability is described by rules:
--
--   teacher_availability_rules       the recurring week — 12 rows describe it
--   teacher_availability_exceptions  one-off changes on a specific date
--
-- Bookable 30-minute slots are then computed on demand as
--   available rules − blocked rules − exceptions − existing bookings − lead time
-- rather than materialised (~134/week, which is not worth storing).
--
-- Precedence, stated once so it is never ambiguous: exceptions beat rules, and
-- within either level 'blocked' beats 'available'.
--
-- All times here are the teacher's own local time. Malaysia has no daylight
-- saving, so a rule of 19:00-24:00 means the same instant range all year; the
-- student's side is converted from trial_bookings.starts_at, which is absolute.

BEGIN;

-- ---------------------------------------------------------------------------
-- Shared trigger: validate the timezone and maintain updated_at.
--
-- The timezone check is a trigger rather than a CHECK constraint because a
-- CHECK cannot contain a subquery, and any function reading pg_timezone_names
-- is STABLE at best -- marking such a function IMMUTABLE to satisfy a CHECK
-- would be a lie that breaks whenever the zone database is updated.
--
-- This exists because the previous system stored 'Asia/Ho_Chi_Minh' for a
-- teacher in Malaysia for months (see docs/TRIAL_SYSTEM_AUDIT.md). A free-text
-- timezone with no validation is how that happened; this makes the equivalent
-- mistake impossible to store at all, not merely discouraged in the UI.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_teacher_availability_touch()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = NEW.timezone) THEN
    RAISE EXCEPTION 'invalid_timezone: % is not a recognised IANA timezone name', NEW.timezone
      USING ERRCODE = '22023';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 1. The recurring week.
--
-- Re's entire schedule is 12 rows: seven 'available' 08:00-24:00 (one per day)
-- and five 'blocked' 10:00-19:00 (Mon-Fri, her regular classes). Those rows are
-- seeded in Phase 3 alongside the engine that reads them, not here.
--
-- effective_from / effective_to mean a change of hours adds rows rather than
-- overwriting them, so past availability stays reconstructable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_availability_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday         smallint NOT NULL,
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  kind            text NOT NULL,
  timezone        text NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  effective_from  date NOT NULL DEFAULT CURRENT_DATE,
  effective_to    date,
  class_language  text,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_availability_rules_weekday_check
    CHECK (weekday BETWEEN 0 AND 6),
  CONSTRAINT teacher_availability_rules_kind_check
    CHECK (kind IN ('available', 'blocked')),
  -- 24:00:00 is a valid `time` in Postgres and is how "midnight at the end of
  -- the day" is expressed, so end_time > start_time holds for 08:00-24:00.
  CONSTRAINT teacher_availability_rules_window_check
    CHECK (end_time > start_time),
  CONSTRAINT teacher_availability_rules_effective_check
    CHECK (effective_to IS NULL OR effective_to >= effective_from),
  -- NULL means the rule applies to both languages. Trials are one pool; the
  -- student picks their language at booking.
  CONSTRAINT teacher_availability_rules_language_check
    CHECK (class_language IS NULL OR class_language IN ('english', 'arabic'))
);

COMMENT ON TABLE public.teacher_availability_rules IS
  'Recurring weekly availability for trials, in the teacher''s own timezone. '
  'kind=available opens a window, kind=blocked closes one. Exceptions override.';

CREATE INDEX IF NOT EXISTS idx_teacher_availability_rules_lookup
  ON public.teacher_availability_rules (weekday, kind, effective_from);

DROP TRIGGER IF EXISTS trg_teacher_availability_rules_touch ON public.teacher_availability_rules;
CREATE TRIGGER trg_teacher_availability_rules_touch
  BEFORE INSERT OR UPDATE ON public.teacher_availability_rules
  FOR EACH ROW EXECUTE FUNCTION public.tg_teacher_availability_touch();

-- ---------------------------------------------------------------------------
-- 2. One-off changes to a specific date.
--
-- "Blocked Thursday evening, dentist" or "open Tuesday afternoon this week".
-- Always wins over the recurring week.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_availability_exceptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_date  date NOT NULL,
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  kind            text NOT NULL,
  timezone        text NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  reason          text,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_availability_exceptions_kind_check
    CHECK (kind IN ('available', 'blocked')),
  CONSTRAINT teacher_availability_exceptions_window_check
    CHECK (end_time > start_time)
);

COMMENT ON TABLE public.teacher_availability_exceptions IS
  'Date-specific overrides to teacher_availability_rules, in the teacher''s own '
  'timezone. Always take precedence over the recurring week; blocked beats available.';

CREATE INDEX IF NOT EXISTS idx_teacher_availability_exceptions_date
  ON public.teacher_availability_exceptions (exception_date);

DROP TRIGGER IF EXISTS trg_teacher_availability_exceptions_touch ON public.teacher_availability_exceptions;
CREATE TRIGGER trg_teacher_availability_exceptions_touch
  BEFORE INSERT OR UPDATE ON public.teacher_availability_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_teacher_availability_touch();

-- ---------------------------------------------------------------------------
-- 3. RLS.
--
-- Admin-only, deliberately. The student-facing availability function in Phase 3
-- will be SECURITY DEFINER and return computed slots, so anon never needs to
-- read the teacher's raw working hours -- her calendar is not public data.
-- ---------------------------------------------------------------------------
ALTER TABLE public.teacher_availability_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_availability_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage teacher_availability_rules" ON public.teacher_availability_rules;
CREATE POLICY "Admins manage teacher_availability_rules"
  ON public.teacher_availability_rules
  FOR ALL TO authenticated
  USING      (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage teacher_availability_exceptions" ON public.teacher_availability_exceptions;
CREATE POLICY "Admins manage teacher_availability_exceptions"
  ON public.teacher_availability_exceptions
  FOR ALL TO authenticated
  USING      (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 4. trial_bookings: an absolute instant, and real overlap protection.
--
-- starts_at replaces the (trial_date + start_time text + timezone) triple as
-- the source of truth. A timestamptz is a single unambiguous moment, which is
-- what removes the entire class of bug fixed in migration 20260822103000: there
-- is no separate zone left to get wrong.
--
-- The old columns stay populated through the transition and are dropped in
-- Phase 8, once nothing reads them.
--
-- meeting_url is per booking because trials become 1:1. The orphaned
-- send-trial-emails function hard-codes one Google Meet room for every student,
-- which for group classes was the point and for 1:1 would put students in each
-- other's lessons.
-- ---------------------------------------------------------------------------
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS starts_at   timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS slot_range  tstzrange;

COMMENT ON COLUMN public.trial_bookings.starts_at IS
  'Absolute start of the trial. Source of truth from Phase 6; supersedes '
  'trial_date + start_time + timezone, which are dropped in Phase 8.';

-- slot_range is maintained by a trigger rather than being a GENERATED column:
-- `timestamptz + interval` is STABLE, not IMMUTABLE (interval arithmetic can
-- depend on the session TimeZone), and Postgres rejects a non-immutable
-- generation expression. Verified against pg_proc.provolatile before writing.
CREATE OR REPLACE FUNCTION public.tg_trial_bookings_set_slot_range()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NEW.starts_at IS NULL THEN
    NEW.slot_range := NULL;
  ELSE
    NEW.slot_range := tstzrange(
      NEW.starts_at,
      NEW.starts_at + make_interval(mins => COALESCE(NEW.duration_min, 30)),
      '[)'
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_trial_bookings_set_slot_range ON public.trial_bookings;
CREATE TRIGGER trg_trial_bookings_set_slot_range
  BEFORE INSERT OR UPDATE OF starts_at, duration_min ON public.trial_bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_trial_bookings_set_slot_range();

-- Backfill historical rows so starts_at is meaningful from day one.
-- Guards: skip TBA rows, skip the 2099-12-31 sentinel, and require start_time
-- to actually look like a time -- it is a text column and has held 'TBA'.
-- This UPDATE does not touch status, so check_trial_slot_capacity returns
-- early and trg_trial_bookings_validate_slot does not fire at all (it is
-- scoped to UPDATE OF day_of_week, start_time, trial_date, status, is_tba).
UPDATE public.trial_bookings
   SET starts_at = (trial_date + start_time::time) AT TIME ZONE COALESCE(timezone, 'Asia/Kuala_Lumpur')
 WHERE starts_at  IS NULL
   AND is_tba      = false
   AND trial_date IS NOT NULL
   AND trial_date <> DATE '2099-12-31'
   AND start_time ~ '^[0-9]{1,2}:[0-9]{2}$';

-- The overlap guard. For 1:1 trials this is the whole game: today's protection
-- is `HAVING count(bookings) < capacity` inside a read query, which two students
-- clicking at the same moment can race past. An exclusion constraint makes
-- overlap impossible at the database level regardless of timing.
--
-- Only rows with a slot_range and an active status participate, so the 59
-- pending TBA rows (no date, so no range) are unaffected. Verified before
-- writing: zero dated active bookings exist, so nothing currently conflicts.
--
-- No btree_gist needed: the constraint uses only a range operator, and tstzrange
-- has native gist support. btree_gist would only be required to combine a
-- scalar equality (a teacher_id, if this ever becomes multi-teacher).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.trial_bookings'::regclass
       AND conname  = 'trial_bookings_no_overlap'
  ) THEN
    ALTER TABLE public.trial_bookings
      ADD CONSTRAINT trial_bookings_no_overlap
      EXCLUDE USING gist (slot_range WITH &&)
      WHERE (slot_range IS NOT NULL AND status IN ('pending', 'confirmed'));
  END IF;
END
$$;

COMMIT;
