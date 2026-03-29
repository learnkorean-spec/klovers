-- Fix: approval email trigger was calling OLD Lovable project (rahpkflknkofuuhnbfyc)
-- Now uses current project URL and anon key directly

CREATE OR REPLACE FUNCTION public.email_student_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
BEGIN
  -- Only fire when approval_status becomes APPROVED and payment is PAID
  IF NEW.approval_status = 'APPROVED' AND NEW.payment_status = 'PAID' THEN
    -- Skip if already was approved+paid (prevent duplicate sends on unrelated updates)
    IF OLD IS NOT NULL AND OLD.approval_status = 'APPROVED' AND OLD.payment_status = 'PAID' THEN
      RETURN NEW;
    END IF;

    -- Get profile from THIS project's profiles table
    SELECT name, email INTO _profile
      FROM public.profiles
      WHERE user_id = NEW.user_id;

    IF _profile.email IS NULL THEN
      RETURN NEW;
    END IF;

    PERFORM net.http_post(
      url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
      ),
      body := jsonb_build_object(
        'template',       'approval',
        'email',          _profile.email,
        'name',           _profile.name,
        'plan_type',      NEW.plan_type,
        'duration',       NEW.duration,
        'sessions_total', NEW.sessions_total,
        'amount',         NEW.amount,
        'preferred_day',  COALESCE(NEW.preferred_day, ''),
        'preferred_time', COALESCE(NEW.preferred_time, ''),
        'timezone',       COALESCE(NEW.timezone, 'Africa/Cairo'),
        'level',          COALESCE(NEW.level, ''),
        'currency',       COALESCE(NEW.currency, 'EGP'),
        'language',       CASE WHEN COALESCE(NEW.timezone,'') NOT LIKE 'Asia/%' AND COALESCE(NEW.timezone,'') NOT LIKE 'Europe/%' AND COALESCE(NEW.timezone,'') NOT LIKE 'America/%' THEN 'ar' ELSE 'en' END
      )
    );
  END IF;

  RETURN NEW;
END;
$$;
