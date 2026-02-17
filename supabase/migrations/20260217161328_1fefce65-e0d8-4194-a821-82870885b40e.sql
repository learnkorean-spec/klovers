
-- ============================================================
-- Phase 1: Tables
-- ============================================================

-- 1.1 admin_audit_log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  enrollment_id uuid,
  action text NOT NULL,
  field text,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit log"
  ON public.admin_audit_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 1.2 system_reset_log
CREATE TABLE public.system_reset_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  reset_type text NOT NULL DEFAULT 'full',
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_reset_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reset log"
  ON public.system_reset_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Phase 2: RPCs
-- ============================================================

-- 2.1 reassign_student_slot
CREATE OR REPLACE FUNCTION public.reassign_student_slot(
  _enrollment_id uuid,
  _new_slot_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid;
  _enrollment RECORD;
  _old_slot_id uuid;
  _new_slot RECORD;
  _user_id uuid;
  _level text;
BEGIN
  _admin_id := auth.uid();
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get enrollment
  SELECT e.id, e.user_id INTO _enrollment
    FROM public.enrollments e
    WHERE e.id = _enrollment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;
  _user_id := _enrollment.user_id;

  -- Get student level
  SELECT p.level INTO _level FROM public.profiles p WHERE p.user_id = _user_id;
  IF _level IS NULL OR _level = '' THEN _level := ''; END IF;

  -- Check new slot capacity
  SELECT * INTO _new_slot FROM public.matching_slots WHERE id = _new_slot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF _new_slot.current_count >= _new_slot.max_students THEN
    RAISE EXCEPTION 'Slot is full';
  END IF;

  -- Get old assigned slot
  SELECT assigned_slot_id INTO _old_slot_id
    FROM public.student_slot_preferences
    WHERE enrollment_id = _enrollment_id;

  -- Decrement old slot count if exists
  IF _old_slot_id IS NOT NULL THEN
    UPDATE public.matching_slots
      SET current_count = GREATEST(current_count - 1, 0)
      WHERE id = _old_slot_id;
  END IF;

  -- Increment new slot count
  UPDATE public.matching_slots
    SET current_count = current_count + 1
    WHERE id = _new_slot_id;

  -- Upsert preference
  INSERT INTO public.student_slot_preferences (
    user_id, enrollment_id, selected_level, assigned_slot_id, match_status, slot_1_id
  ) VALUES (
    _user_id, _enrollment_id, _level, _new_slot_id, 'matched', _new_slot_id
  )
  ON CONFLICT ON CONSTRAINT student_slot_preferences_enrollment_id_key
  DO UPDATE SET assigned_slot_id = _new_slot_id, match_status = 'matched';

  -- Audit log
  INSERT INTO public.admin_audit_log (admin_id, enrollment_id, action, field, old_value, new_value)
  VALUES (_admin_id, _enrollment_id, 'reassign_slot', 'assigned_slot_id',
    COALESCE(_old_slot_id::text, 'none'), _new_slot_id::text);
END;
$$;

-- 2.2 unmatch_student_slot
CREATE OR REPLACE FUNCTION public.unmatch_student_slot(
  _enrollment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid;
  _old_slot_id uuid;
BEGIN
  _admin_id := auth.uid();
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT assigned_slot_id INTO _old_slot_id
    FROM public.student_slot_preferences
    WHERE enrollment_id = _enrollment_id
    FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'No preference record for this enrollment'; END IF;

  -- Decrement old slot
  IF _old_slot_id IS NOT NULL THEN
    UPDATE public.matching_slots
      SET current_count = GREATEST(current_count - 1, 0)
      WHERE id = _old_slot_id;
  END IF;

  -- Clear assignment
  UPDATE public.student_slot_preferences
    SET assigned_slot_id = NULL, match_status = 'pending'
    WHERE enrollment_id = _enrollment_id;

  -- Audit
  INSERT INTO public.admin_audit_log (admin_id, enrollment_id, action, field, old_value, new_value)
  VALUES (_admin_id, _enrollment_id, 'unmatch', 'assigned_slot_id',
    COALESCE(_old_slot_id::text, 'none'), 'none');
END;
$$;

-- 2.3 update_student_preferences
CREATE OR REPLACE FUNCTION public.update_student_preferences(
  _enrollment_id uuid,
  _preferred_days text[],
  _timezone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid;
  _old_days text[];
  _old_tz text;
  _valid_days text[] := ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  _d text;
BEGIN
  _admin_id := auth.uid();
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate days
  IF _preferred_days IS NOT NULL THEN
    FOREACH _d IN ARRAY _preferred_days LOOP
      IF NOT (_d = ANY(_valid_days)) THEN
        RAISE EXCEPTION 'Invalid day: %', _d;
      END IF;
    END LOOP;
  END IF;

  -- Get old values
  SELECT preferred_days, timezone INTO _old_days, _old_tz
    FROM public.enrollments WHERE id = _enrollment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;

  -- Update
  UPDATE public.enrollments
    SET preferred_days = _preferred_days, timezone = _timezone
    WHERE id = _enrollment_id;

  -- Audit
  IF _old_days IS DISTINCT FROM _preferred_days THEN
    INSERT INTO public.admin_audit_log (admin_id, enrollment_id, action, field, old_value, new_value)
    VALUES (_admin_id, _enrollment_id, 'update_preferences', 'preferred_days',
      COALESCE(array_to_string(_old_days, ','), 'none'),
      COALESCE(array_to_string(_preferred_days, ','), 'none'));
  END IF;

  IF _old_tz IS DISTINCT FROM _timezone THEN
    INSERT INTO public.admin_audit_log (admin_id, enrollment_id, action, field, old_value, new_value)
    VALUES (_admin_id, _enrollment_id, 'update_preferences', 'timezone',
      COALESCE(_old_tz, 'none'), COALESCE(_timezone, 'none'));
  END IF;
END;
$$;

-- 2.4 reset_platform_data
CREATE OR REPLACE FUNCTION public.reset_platform_data(
  _reset_password text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid;
  _stored_hash text;
BEGIN
  _admin_id := auth.uid();

  -- Must be admin
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Get stored password hash from vault
  SELECT decrypted_secret INTO _stored_hash
    FROM vault.decrypted_secrets
    WHERE name = 'RESET_PASSWORD_HASH'
    LIMIT 1;

  IF _stored_hash IS NULL THEN
    RAISE EXCEPTION 'Reset password not configured';
  END IF;

  -- Compare using crypt (bcrypt)
  IF crypt(_reset_password, _stored_hash) != _stored_hash THEN
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
$$;
