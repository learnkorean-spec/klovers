CREATE OR REPLACE FUNCTION public.reset_platform_data(_reset_password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _admin_id uuid;
  _stored_password text;
BEGIN
  _admin_id := auth.uid();

  -- Must be admin
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Get stored password from vault
  SELECT decrypted_secret INTO _stored_password
    FROM vault.decrypted_secrets
    WHERE name = 'RESET_PASSWORD_HASH'
    LIMIT 1;

  IF _stored_password IS NULL THEN
    RAISE EXCEPTION 'Reset password not configured';
  END IF;

  -- Compare directly (secret is stored encrypted in vault)
  IF trim(_reset_password) != trim(_stored_password) THEN
    RAISE EXCEPTION 'Invalid reset password';
  END IF;

  -- Execute reset in transaction
  DELETE FROM public.student_slot_preferences;
  DELETE FROM public.admin_attendance_log;
  DELETE FROM public.attendance_requests;
  DELETE FROM public.batch_members;
  DELETE FROM public.attendance_log;
  DELETE FROM public.enrollments;
  DELETE FROM public.student_schedule_preferences;
  DELETE FROM public.group_attendance;
  DELETE FROM public.group_sessions;

  -- Reset slots
  UPDATE public.matching_slots SET current_count = 0, status = 'open';

  -- Delete non-admin profiles
  DELETE FROM public.profiles
    WHERE user_id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

  -- Clear audit log
  DELETE FROM public.admin_audit_log;

  -- Log the reset
  INSERT INTO public.system_reset_log (admin_id, reset_type, details)
  VALUES (_admin_id, 'full', 'Full platform reset executed');

  RETURN 'Reset completed successfully';
END;
$function$;