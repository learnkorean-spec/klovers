-- Fix admin notification trigger URL: old project rahpkflknkofuuhnbfyc → new project ewtdgpbybkceokfohhyg

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
  _anon_key := current_setting('app.supabase_anon_key', true);

  -- Fallback to hardcoded publishable key if setting not configured
  IF _anon_key IS NULL OR _anon_key = '' THEN
    _anon_key := 'sb_publishable_do5UbZuz93WnJYXp1ZQg5g_j6K4DiFh';
  END IF;

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

-- Recreate trigger (in case it was dropped)
DROP TRIGGER IF EXISTS trg_notify_admin_email ON public.admin_notifications;
CREATE TRIGGER trg_notify_admin_email
  AFTER INSERT ON public.admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_notification();
