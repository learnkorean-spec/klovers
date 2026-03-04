-- Create trigger function to email student when enrollment is approved
CREATE OR REPLACE FUNCTION public.email_student_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
  _preferred_day text;
  _preferred_time text;
  _tz text;
  _level text;
BEGIN
  -- Only fire when approval_status becomes APPROVED and payment is PAID
  IF NEW.approval_status = 'APPROVED' AND NEW.payment_status = 'PAID' THEN
    -- Skip if old row was already approved+paid
    IF OLD IS NOT NULL AND OLD.approval_status = 'APPROVED' AND OLD.payment_status = 'PAID' THEN
      RETURN NEW;
    END IF;

    -- Get profile info
    SELECT name, email INTO _profile
      FROM public.profiles
      WHERE user_id = NEW.user_id;

    IF _profile.email IS NULL THEN
      RETURN NEW;
    END IF;

    _preferred_day := COALESCE(NEW.preferred_day, '');
    _preferred_time := COALESCE(NEW.preferred_time, '');
    _tz := COALESCE(NEW.timezone, 'Africa/Cairo');
    _level := COALESCE(NEW.level, '');

    -- Call send-confirmation-email with template=approval
    PERFORM net.http_post(
      url := 'https://rahpkflknkofuuhnbfyc.supabase.co/functions/v1/send-confirmation-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaHBrZmxrbmtvZnV1aG5iZnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzEyOTksImV4cCI6MjA4NjQwNzI5OX0.ZY416BgNYNoPgasvT6tXJ09OlYe8kSCgnl-qmxAT_oE'
      ),
      body := jsonb_build_object(
        'template', 'approval',
        'email', _profile.email,
        'name', _profile.name,
        'plan_type', NEW.plan_type,
        'duration', NEW.duration,
        'sessions_total', NEW.sessions_total,
        'amount', NEW.amount,
        'preferred_day', _preferred_day,
        'preferred_time', _preferred_time,
        'timezone', _tz,
        'level', _level,
        'currency', COALESCE(NEW.currency, 'USD')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger (fires on UPDATE only, after sync_student_on_approval)
DROP TRIGGER IF EXISTS trg_email_student_on_approval ON public.enrollments;
CREATE TRIGGER trg_email_student_on_approval
  AFTER UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.email_student_on_approval();