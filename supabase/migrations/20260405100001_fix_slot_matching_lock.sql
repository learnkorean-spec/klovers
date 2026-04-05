-- Phase 1b: Fix race condition in match_enrollment_to_slot
-- Add FOR UPDATE on enrollment row to prevent concurrent slot assignments.

CREATE OR REPLACE FUNCTION public.match_enrollment_to_slot(_enrollment_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _enrollment RECORD;
  _level TEXT;
  _best_slot_id UUID;
  _slot RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock enrollment row to prevent concurrent matching
  SELECT e.id, e.user_id, e.preferred_days, e.preferred_time, e.plan_type
    INTO _enrollment
    FROM public.enrollments e
    WHERE e.id = _enrollment_id
    FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;

  -- Get student's level from profile
  SELECT p.level INTO _level
    FROM public.profiles p
    WHERE p.user_id = _enrollment.user_id;

  IF _level IS NULL OR _level = '' THEN
    RETURN NULL;
  END IF;

  -- Find best-fit slot: matching level, not full, preferring student's preferred days
  FOR _slot IN
    SELECT ms.*,
      CASE WHEN _enrollment.preferred_days IS NOT NULL AND ms.day = ANY(_enrollment.preferred_days) THEN 1 ELSE 0 END AS day_match
    FROM public.matching_slots ms
    WHERE ms.course_level = _level
      AND ms.status != 'full'
      AND ms.current_count < ms.max_students
    ORDER BY
      CASE WHEN _enrollment.preferred_days IS NOT NULL AND ms.day = ANY(_enrollment.preferred_days) THEN 0 ELSE 1 END,
      ms.current_count DESC
    FOR UPDATE
  LOOP
    _best_slot_id := _slot.id;
    EXIT;
  END LOOP;

  IF _best_slot_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Create or update student_slot_preferences
  INSERT INTO public.student_slot_preferences (user_id, enrollment_id, selected_level, slot_1_id, assigned_slot_id, match_status)
  VALUES (_enrollment.user_id, _enrollment_id, _level, _best_slot_id, _best_slot_id, 'matched')
  ON CONFLICT ON CONSTRAINT student_slot_preferences_enrollment_id_key
  DO UPDATE SET assigned_slot_id = _best_slot_id, match_status = 'matched', slot_1_id = _best_slot_id;

  -- Increment slot count
  UPDATE public.matching_slots
    SET current_count = current_count + 1
    WHERE id = _best_slot_id;

  RETURN _best_slot_id;
END;
$$;
