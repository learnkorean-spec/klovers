
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_admin_on_new_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text;
  _body jsonb;
BEGIN
  _url := 'https://rahpkflknkofuuhnbfyc.supabase.co/functions/v1/notify-admin-email';

  _body := jsonb_build_object(
    'record', jsonb_build_object(
      'id', NEW.id,
      'message', NEW.message,
      'type', NEW.type,
      'created_at', NEW.created_at
    )
  );

  PERFORM extensions.http_post(
    url := _url,
    body := _body::text,
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaHBrZmxrbmtvZnV1aG5iZnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzEyOTksImV4cCI6MjA4NjQwNzI5OX0.ZY416BgNYNoPgasvT6tXJ09OlYe8kSCgnl-qmxAT_oE"}'::jsonb
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_email ON public.admin_notifications;
CREATE TRIGGER trg_notify_admin_email
  AFTER INSERT ON public.admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_notification();
