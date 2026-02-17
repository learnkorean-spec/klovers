
-- Function to auto-match a student to a matching_slot based on their profile level and enrollment preferred_days
-- Called by admin before/during approval
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
  _best_count INTEGER := -1;
  _slot RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get enrollment with preferences
  SELECT e.id, e.user_id, e.preferred_days, e.preferred_time, e.plan_type
    INTO _enrollment
    FROM public.enrollments e
    WHERE e.id = _enrollment_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;

  -- Get student's level from profile
  SELECT p.level INTO _level
    FROM public.profiles p
    WHERE p.user_id = _enrollment.user_id;

  IF _level IS NULL OR _level = '' THEN
    RETURN NULL; -- No level set, can't match
  END IF;

  -- Find best-fit slot: matching level, not full, preferring slots whose day matches student's preferred_days
  -- Priority: 1) matching day with highest count, 2) any day with highest count
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
    EXIT; -- Take the first (best) match
  END LOOP;

  IF _best_slot_id IS NULL THEN
    RETURN NULL; -- No available slot
  END IF;

  -- Create or update student_slot_preferences
  INSERT INTO public.student_slot_preferences (user_id, enrollment_id, selected_level, slot_1_id, assigned_slot_id, match_status)
  VALUES (_enrollment.user_id, _enrollment_id, _level, _best_slot_id, _best_slot_id, 'matched')
  ON CONFLICT ON CONSTRAINT student_slot_preferences_enrollment_id_key
  DO UPDATE SET assigned_slot_id = _best_slot_id, match_status = 'matched', slot_1_id = _best_slot_id;

  -- Increment slot count (triggers update_slot_status)
  UPDATE public.matching_slots
    SET current_count = current_count + 1
    WHERE id = _best_slot_id;

  RETURN _best_slot_id;
END;
$$;

-- Add unique constraint on enrollment_id for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_slot_preferences_enrollment_id_key'
  ) THEN
    ALTER TABLE public.student_slot_preferences
      ADD CONSTRAINT student_slot_preferences_enrollment_id_key UNIQUE (enrollment_id);
  END IF;
END $$;
