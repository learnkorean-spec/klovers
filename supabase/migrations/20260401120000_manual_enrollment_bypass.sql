-- Allow admin manual enrollments to bypass strict duration/amount validation.
-- When payment_provider = 'manual', skip duration & amount checks and
-- still compute unit_price if possible.

CREATE OR REPLACE FUNCTION public.validate_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected_classes INTEGER;
  min_amount NUMERIC;
BEGIN
  -- Admin manual enrollments skip strict validation
  IF NEW.payment_provider = 'manual' THEN
    -- Still compute unit_price if we can
    IF NEW.classes_included IS NOT NULL AND NEW.classes_included > 0 AND NEW.amount IS NOT NULL THEN
      NEW.unit_price := NEW.amount / NEW.classes_included;
    ELSE
      NEW.unit_price := 0;
    END IF;
    RETURN NEW;
  END IF;

  -- Validate duration and derive expected classes
  expected_classes := CASE NEW.duration
    WHEN 1 THEN 4
    WHEN 3 THEN 12
    WHEN 6 THEN 24
    ELSE NULL
  END;

  IF expected_classes IS NULL THEN
    RAISE EXCEPTION 'Invalid duration: must be 1, 3, or 6';
  END IF;

  IF NEW.classes_included != expected_classes THEN
    RAISE EXCEPTION 'Invalid classes_included for duration';
  END IF;

  -- Minimum amounts per plan/duration
  min_amount := CASE
    WHEN NEW.plan_type = 'group'   AND NEW.duration = 1 THEN 20
    WHEN NEW.plan_type = 'group'   AND NEW.duration = 3 THEN 60
    WHEN NEW.plan_type = 'group'   AND NEW.duration = 6 THEN 100
    WHEN NEW.plan_type = 'private' AND NEW.duration = 1 THEN 40
    WHEN NEW.plan_type = 'private' AND NEW.duration = 3 THEN 120
    WHEN NEW.plan_type = 'private' AND NEW.duration = 6 THEN 200
    ELSE NULL
  END;

  IF min_amount IS NULL THEN
    RAISE EXCEPTION 'Invalid plan_type: must be group or private';
  END IF;

  IF NEW.amount < min_amount THEN
    RAISE EXCEPTION 'Amount below minimum for selected plan';
  END IF;

  -- Recalculate unit_price server-side
  IF NEW.classes_included > 0 THEN
    NEW.unit_price := NEW.amount / NEW.classes_included;
  ELSE
    NEW.unit_price := 0;
  END IF;

  RETURN NEW;
END;
$$;
