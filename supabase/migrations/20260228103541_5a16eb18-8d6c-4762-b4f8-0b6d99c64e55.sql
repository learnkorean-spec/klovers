
-- Function to sync enrollment + profile data to leads table
CREATE OR REPLACE FUNCTION public.sync_enrollment_to_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email TEXT;
  _country TEXT;
  _schedule TEXT;
BEGIN
  -- Get email from profiles
  SELECT email, country INTO _email, _country
    FROM public.profiles
    WHERE user_id = NEW.user_id
    LIMIT 1;

  IF _email IS NULL THEN
    -- Fallback: try auth email
    SELECT au.email INTO _email FROM auth.users au WHERE au.id = NEW.user_id;
  END IF;

  IF _email IS NULL THEN RETURN NEW; END IF;

  -- Build schedule string from preferred_days
  _schedule := '';
  IF NEW.preferred_days IS NOT NULL AND array_length(NEW.preferred_days, 1) > 0 THEN
    _schedule := array_to_string(NEW.preferred_days, '/');
  END IF;
  IF NEW.preferred_time IS NOT NULL AND NEW.preferred_time != '' THEN
    _schedule := _schedule || ' ' || NEW.preferred_time;
  END IF;

  -- Update existing lead record with enrollment data
  UPDATE public.leads SET
    plan_type = COALESCE(NULLIF(NEW.plan_type, ''), leads.plan_type),
    duration = COALESCE(NULLIF(NEW.duration || 'mo', 'mo'), leads.duration),
    schedule = COALESCE(NULLIF(trim(_schedule), ''), leads.schedule),
    timezone = COALESCE(NULLIF(NEW.timezone, ''), leads.timezone),
    level = COALESCE(NULLIF(NEW.level, ''), leads.level),
    country = COALESCE(NULLIF(_country, ''), leads.country)
  WHERE lower(trim(leads.email)) = lower(trim(_email));

  RETURN NEW;
END;
$function$;

-- Trigger on enrollments insert/update
DROP TRIGGER IF EXISTS trg_sync_enrollment_to_lead ON public.enrollments;
CREATE TRIGGER trg_sync_enrollment_to_lead
  AFTER INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_enrollment_to_lead();

-- Function to sync profile country to leads
CREATE OR REPLACE FUNCTION public.sync_profile_country_to_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.country IS NOT NULL AND NEW.country != '' THEN
    UPDATE public.leads SET
      country = NEW.country
    WHERE lower(trim(leads.email)) = lower(trim(NEW.email))
      AND (leads.country IS NULL OR leads.country = '');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_profile_country_to_lead ON public.profiles;
CREATE TRIGGER trg_sync_profile_country_to_lead
  AFTER INSERT OR UPDATE OF country ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_country_to_lead();

-- Backfill existing data: sync enrollment data to leads for all existing enrollments
UPDATE public.leads l SET
  plan_type = COALESCE(NULLIF(e.plan_type, ''), l.plan_type),
  duration = COALESCE(NULLIF(e.duration || 'mo', 'mo'), l.duration),
  schedule = COALESCE(
    NULLIF(trim(COALESCE(array_to_string(e.preferred_days, '/'), '') || ' ' || COALESCE(e.preferred_time, '')), ''),
    l.schedule
  ),
  timezone = COALESCE(NULLIF(e.timezone, ''), l.timezone),
  level = COALESCE(NULLIF(e.level, ''), l.level),
  country = COALESCE(NULLIF(p.country, ''), l.country)
FROM public.enrollments e
JOIN public.profiles p ON p.user_id = e.user_id
WHERE lower(trim(l.email)) = lower(trim(p.email))
  AND e.created_at = (
    SELECT MAX(e2.created_at) FROM public.enrollments e2 WHERE e2.user_id = e.user_id
  );
