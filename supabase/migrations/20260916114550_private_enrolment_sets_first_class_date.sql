-- A private course is full at one student, so nothing ever "fills".
--
-- first_class_date had exactly one writer: tg_activate_group_when_full, which
-- fires when a group reaches its minimum. A private enrolment never joins a
-- group, so its first_class_date stayed null forever — and both payment letters
-- are gated on `first_class_date IS NOT NULL`:
--
--   send_payment_ask_emails      -> the day before the first class
--   send_payment_final_alert     -> three days after it
--
-- So a private student was never asked to pay. The one private enrolment on
-- record paid because she was chased by hand; had she not been, nothing in the
-- system would have noticed.
--
-- Here the equivalent of "the group filled" is "Re approved her and said which
-- day". That is what this trigger watches for.

CREATE OR REPLACE FUNCTION public.tg_private_sets_first_class_date()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _day   text;
  _dow   integer;
  _tz    text;
  _base  date;
  _start date;
BEGIN
  IF COALESCE(NEW.plan_type, '') <> 'private'      THEN RETURN NEW; END IF;
  IF NEW.approval_status IS DISTINCT FROM 'APPROVED' THEN RETURN NEW; END IF;
  IF NEW.first_class_date IS NOT NULL              THEN RETURN NEW; END IF;
  IF NEW.deleted_at IS NOT NULL                    THEN RETURN NEW; END IF;
  -- Already paid: the letters are moot and back-dating her class would be wrong.
  IF NEW.payment_status = 'PAID'                   THEN RETURN NEW; END IF;

  _day := COALESCE(NULLIF(btrim(NEW.assigned_day), ''),
                   NULLIF(btrim(NEW.preferred_day), ''));
  IF _day IS NULL THEN RETURN NEW; END IF;   -- no day agreed yet; nothing to date

  _dow := CASE lower(_day)
            WHEN 'sunday'    THEN 0
            WHEN 'monday'    THEN 1
            WHEN 'tuesday'   THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday'  THEN 4
            WHEN 'friday'    THEN 5
            WHEN 'saturday'  THEN 6
            ELSE NULL
          END;
  IF _dow IS NULL THEN RETURN NEW; END IF;

  _tz := COALESCE(NULLIF(NEW.assigned_timezone, ''), NULLIF(NEW.timezone, ''), 'Africa/Cairo');

  _base := (now() AT TIME ZONE _tz)::date;

  -- preferred_start is free text: a date on some rows, "ASAP" on others.
  IF NEW.preferred_start ~ '^\d{4}-\d{2}-\d{2}$' THEN
    _base := GREATEST(_base, NEW.preferred_start::date);
  END IF;

  _start := (_base + ((_dow - EXTRACT(DOW FROM _base)::int + 7) % 7))::date;

  NEW.first_class_date := _start;
  NEW.due_at := ((_start + 3)::timestamp + time '23:00') AT TIME ZONE 'Africa/Cairo';

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_private_sets_first_class_date ON public.enrollments;

CREATE TRIGGER trg_private_sets_first_class_date
  BEFORE INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_private_sets_first_class_date();
