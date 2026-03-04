
CREATE OR REPLACE FUNCTION public.notify_new_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _name text;
  _email text;
BEGIN
  SELECT name, email INTO _name, _email
    FROM public.profiles
    WHERE user_id = NEW.user_id
    LIMIT 1;

  INSERT INTO public.admin_notifications (message, type, related_user_id)
  VALUES (
    'New enrollment: ' || COALESCE(_name, 'Unknown') || ' (' || COALESCE(_email, '') || ') — ' ||
    NEW.plan_type || ' · ' || NEW.duration || 'mo · ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'USD') ||
    ' · Status: ' || NEW.approval_status,
    'new_enrollment',
    NEW.user_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_enrollment
  AFTER INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_enrollment();
