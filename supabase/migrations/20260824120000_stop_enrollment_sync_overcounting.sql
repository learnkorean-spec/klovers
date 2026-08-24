-- Stops sync_student_on_approval() from re-adding a student's classes and
-- payment on every edit to an already-counted enrollment.
--
-- The bug
-- -------
-- The AFTER UPDATE trigger fires unconditionally whenever an enrollment is
-- APPROVED + PAID + matched, with no check on what actually changed. Every
-- save of an already-qualifying enrollment - even one that only touches an
-- unrelated field like level or notes - re-runs the same
-- "total_classes = total_classes + EXCLUDED.total_classes" arithmetic,
-- adding the enrollment's classes_included and amount again. One row
-- measured 2026-08-23 had fired 43 times: 516 stored classes against 36
-- actually purchased.
--
-- The fix
-- -------
-- Track what this specific enrollment last contributed (its own prior
-- classes_included/amount, not the student's running total). Two changes:
--
-- 1. Skip the whole body when the enrollment was already counted and none
--    of classes_included, amount, unit_price, plan_type or duration changed
--    since - the case that used to re-fire on every unrelated save.
-- 2. When not skipped, add the DELTA between the new and prior value rather
--    than the new value outright - so a genuine correction (e.g. an upsell
--    from 12 to 16 classes) adds exactly 4, not 16 again on top of the 12
--    already counted.
--
-- OLD is only ever referenced inside the TG_OP = 'UPDATE' branch. Postgres
-- does not guarantee AND/OR short-circuit evaluation, so referencing
-- OLD.<field> anywhere reachable during an INSERT-fired call - even behind
-- what looks like a guarding condition - can raise "record old is not
-- assigned yet". Local variables carry the OLD-derived values everywhere
-- after that branch instead.
--
-- What this does NOT do
-- ----------------------
-- No repair of existing students rows - all of them stay exactly as they
-- are today, correct or not; that is a separate decision, not made yet.
-- No change to the legacy students table's structure. No change to
-- teacher_students, student_bundles, or anything in the newer system -
-- confirmed zero foreign keys and zero shared functions between it and the
-- legacy students table, both at the original investigation and re-checked
-- just before writing this migration.

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_student_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _profile         RECORD;
  _was_qualifying  boolean := false;
  _old_classes     integer := 0;
  _old_paid        numeric := 0;
  _old_unit_price  numeric;
  _old_plan_type   text;
  _old_duration    integer;
  _billing_changed boolean;
BEGIN
  IF NEW.approval_status <> 'APPROVED'
     OR NEW.payment_status <> 'PAID'
     OR NEW.matched_at IS NULL
  THEN
    RETURN NEW;
  END IF;

  -- OLD only exists for the UPDATE-fired trigger. This branch is the only
  -- place it is touched anywhere in the function.
  IF TG_OP = 'UPDATE' THEN
    _was_qualifying := OLD.approval_status = 'APPROVED'
                        AND OLD.payment_status = 'PAID'
                        AND OLD.matched_at IS NOT NULL;
    IF _was_qualifying THEN
      _old_classes    := COALESCE(OLD.classes_included, 0);
      _old_paid       := COALESCE(OLD.amount, 0);
      _old_unit_price := OLD.unit_price;
      _old_plan_type  := OLD.plan_type;
      _old_duration   := OLD.duration;
    END IF;
  END IF;

  _billing_changed := NEW.classes_included IS DISTINCT FROM _old_classes
                    OR NEW.amount           IS DISTINCT FROM _old_paid
                    OR NEW.unit_price       IS DISTINCT FROM _old_unit_price
                    OR NEW.plan_type        IS DISTINCT FROM _old_plan_type
                    OR NEW.duration         IS DISTINCT FROM _old_duration;

  -- Already counted once, and nothing that changes what this enrollment
  -- owes the student has changed since - the case that used to re-fire on
  -- every unrelated save.
  IF _was_qualifying AND NOT _billing_changed THEN
    RETURN NEW;
  END IF;

  SELECT name, email, country INTO _profile
    FROM public.profiles
    WHERE user_id = NEW.user_id;

  IF _profile.email IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.students (
    full_name, email, country, status,
    course_type, package_name,
    total_classes, used_classes,
    total_paid, price_per_class,
    payment_status, notes
  ) VALUES (
    _profile.name,
    _profile.email,
    COALESCE(_profile.country, ''),
    'student',
    NEW.plan_type,
    NEW.plan_type || ' ' || NEW.duration || 'mo',
    NEW.classes_included,
    0,
    NEW.amount,
    NEW.unit_price,
    'paid',
    'Auto-created from enrollment ' || NEW.id::text
  )
  ON CONFLICT (email) DO UPDATE SET
    status        = 'student',
    course_type   = EXCLUDED.course_type,
    package_name  = EXCLUDED.package_name,
    -- Add only the change since this enrollment's own last contribution
    -- (zero the first time), never the full new value again.
    total_classes = public.students.total_classes + (NEW.classes_included - _old_classes),
    total_paid    = public.students.total_paid    + (NEW.amount - _old_paid),
    price_per_class = EXCLUDED.price_per_class,
    payment_status  = 'paid',
    notes = public.students.notes || E'\n' || EXCLUDED.notes;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.sync_student_on_approval() IS
  'Creates/updates the legacy students row when an enrollment is approved '
  'and paid. Adds only the delta between an enrollment''s new and '
  'previously-counted classes_included/amount, and skips entirely when '
  'already counted and nothing billing-relevant changed - stops the '
  'per-edit over-counting fixed 2026-08-24. No historical row repair.';

COMMIT;
