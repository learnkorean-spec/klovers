
CREATE OR REPLACE FUNCTION public.email_student_on_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile RECORD;
  _level text;
  _lang text;
  _url text;
  _anon_key text;
BEGIN
  -- Get profile info
  SELECT name, email, country INTO _profile
    FROM public.profiles
    WHERE user_id = NEW.user_id
    LIMIT 1;

  IF _profile.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Detect language from country
  IF lower(COALESCE(_profile.country, '')) IN ('egypt', 'eg', 'مصر', 'saudi arabia', 'sa', 'iraq', 'iq', 'jordan', 'jo', 'morocco', 'ma', 'algeria', 'dz', 'tunisia', 'tn', 'libya', 'ly', 'sudan', 'sd', 'yemen', 'ye', 'syria', 'sy', 'lebanon', 'lb', 'palestine', 'ps', 'uae', 'ae', 'qatar', 'qa', 'bahrain', 'bh', 'oman', 'om', 'kuwait', 'kw') THEN
    _lang := 'ar';
  ELSE
    _lang := 'en';
  END IF;

  -- Get level
  _level := COALESCE(NEW.level, (SELECT level FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1), '');

  _url := 'https://rahpkflknkofuuhnbfyc.supabase.co/functions/v1/send-confirmation-email';
  _anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaHBrZmxrbmtvZnV1aG5iZnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzEyOTksImV4cCI6MjA4NjQwNzI5OX0.ZY416BgNYNoPgasvT6tXJ09OlYe8kSCgnl-qmxAT_oE';

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := jsonb_build_object(
      'template', 'pending_review',
      'email', _profile.email,
      'name', _profile.name,
      'language', _lang,
      'plan_type', NEW.plan_type,
      'duration', NEW.duration,
      'sessions_total', NEW.sessions_total,
      'amount', NEW.amount,
      'currency', COALESCE(NEW.currency, 'USD'),
      'level', _level,
      'timezone', COALESCE(NEW.timezone, 'Africa/Cairo')
    )
  );

  RETURN NEW;
END;
$$;

-- Drop if exists and recreate trigger
DROP TRIGGER IF EXISTS trg_email_student_on_enrollment ON public.enrollments;
CREATE TRIGGER trg_email_student_on_enrollment
  AFTER INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.email_student_on_enrollment();
