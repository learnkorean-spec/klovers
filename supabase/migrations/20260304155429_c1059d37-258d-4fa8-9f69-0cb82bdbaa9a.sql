
-- Trigger function: email student on new enrollment
CREATE OR REPLACE FUNCTION public.email_student_on_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _url text;
  _anon_key text;
BEGIN
  _url := current_setting('app.settings.supabase_url', true);
  _anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- Use pg_net to call the edge function
  PERFORM net.http_post(
    url := 'https://rahpkflknkofuuhnbfyc.supabase.co/functions/v1/send-student-lifecycle-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaHBrZmxrbmtvZnV1aG5iZnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzEyOTksImV4cCI6MjA4NjQwNzI5OX0.ZY416BgNYNoPgasvT6tXJ09OlYe8kSCgnl-qmxAT_oE'
    ),
    body := jsonb_build_object(
      'type', 'enrollment_created',
      'user_id', NEW.user_id,
      'plan_type', NEW.plan_type,
      'duration', NEW.duration,
      'amount', NEW.amount,
      'currency', COALESCE(NEW.currency, 'USD'),
      'preferred_days', COALESCE(NEW.preferred_days, ARRAY[]::text[]),
      'level', COALESCE(NEW.level, '')
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_email_student_on_enrollment
  AFTER INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.email_student_on_enrollment();

-- Trigger function: email student when assigned to a group
CREATE OR REPLACE FUNCTION public.email_student_on_group_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only fire for 'active' assignments (not waitlist)
  IF NEW.member_status != 'active' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://rahpkflknkofuuhnbfyc.supabase.co/functions/v1/send-student-lifecycle-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaHBrZmxrbmtvZnV1aG5iZnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzEyOTksImV4cCI6MjA4NjQwNzI5OX0.ZY416BgNYNoPgasvT6tXJ09OlYe8kSCgnl-qmxAT_oE'
    ),
    body := jsonb_build_object(
      'type', 'group_assigned',
      'user_id', NEW.user_id,
      'group_id', NEW.group_id
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_email_student_on_group_assignment
  AFTER INSERT ON public.pkg_group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.email_student_on_group_assignment();
