
-- 1) app_settings table
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings"
  ON public.app_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage app_settings"
  ON public.app_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.app_settings (key, value) VALUES ('app_reset_version', '1');

-- 2) Add reset_version to profiles
ALTER TABLE public.profiles ADD COLUMN reset_version text DEFAULT NULL;

-- 3) Factory reset RPC
CREATE OR REPLACE FUNCTION public.factory_reset_data()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid;
  _new_version text;
BEGIN
  _admin_id := auth.uid();
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Increment reset version
  UPDATE public.app_settings
    SET value = (value::int + 1)::text, updated_at = now()
    WHERE key = 'app_reset_version'
    RETURNING value INTO _new_version;

  -- Truncate operational tables (order matters for FK)
  DELETE FROM public.pkg_class_charges;
  DELETE FROM public.pkg_attendance;
  DELETE FROM public.pkg_group_sessions;
  DELETE FROM public.pkg_group_members;
  DELETE FROM public.student_slot_preferences;
  DELETE FROM public.admin_attendance_log;
  DELETE FROM public.attendance_requests;
  DELETE FROM public.attendance_log;
  DELETE FROM public.batch_members;
  DELETE FROM public.group_attendance;
  DELETE FROM public.group_sessions;
  DELETE FROM public.student_schedule_preferences;
  DELETE FROM public.student_package_preferences;
  DELETE FROM public.schedule_resubmission_requests;
  DELETE FROM public.email_sends;
  DELETE FROM public.email_campaigns;
  DELETE FROM public.admin_notifications;
  DELETE FROM public.enrollments;
  DELETE FROM public.leads;
  DELETE FROM public.admin_audit_log;

  -- Reset matching slots
  UPDATE public.matching_slots SET current_count = 0, status = 'open';

  -- Clear non-admin profiles (keep admin profiles intact)
  DELETE FROM public.profiles
    WHERE user_id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

  -- Reset admin profiles' operational fields
  UPDATE public.profiles
    SET level = '', credits = 0, reset_version = _new_version
    WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

  -- Log reset
  INSERT INTO public.system_reset_log (admin_id, reset_type, details)
    VALUES (_admin_id, 'factory', 'Factory reset to version ' || _new_version);

  RETURN 'Reset complete. Version: ' || _new_version;
END;
$$;
