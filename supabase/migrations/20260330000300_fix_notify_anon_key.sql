-- Fix the hardcoded anon key in the admin notification trigger function.
-- The old key was a publishable key (not a JWT), causing 401 errors.
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text;
  _anon_key text;
  _body jsonb;
BEGIN
  _url := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/notify-admin-email';

  _anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs';

  _body := jsonb_build_object(
    'record', jsonb_build_object(
      'id', NEW.id,
      'message', NEW.message,
      'type', NEW.type,
      'created_at', NEW.created_at
    )
  );

  PERFORM net.http_post(
    url := _url,
    body := _body,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    )
  );

  RETURN NEW;
END;
$$;
