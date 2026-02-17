
-- =============================================
-- MATCHING SLOTS TABLE
-- =============================================
CREATE TABLE public.matching_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_level TEXT NOT NULL DEFAULT '',
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Africa/Cairo',
  min_students INTEGER NOT NULL DEFAULT 3,
  max_students INTEGER NOT NULL DEFAULT 7,
  current_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','confirmed','full')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- STUDENT SLOT PREFERENCES TABLE
-- =============================================
CREATE TABLE public.student_slot_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID REFERENCES public.enrollments(id),
  selected_level TEXT NOT NULL DEFAULT '',
  slot_1_id UUID REFERENCES public.matching_slots(id),
  slot_2_id UUID REFERENCES public.matching_slots(id),
  slot_3_id UUID REFERENCES public.matching_slots(id),
  assigned_slot_id UUID REFERENCES public.matching_slots(id),
  match_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (match_status IN ('pending','matched','confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, enrollment_id)
);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.matching_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_slot_preferences ENABLE ROW LEVEL SECURITY;

-- matching_slots: authenticated can read, admins can manage
CREATE POLICY "Authenticated users can read matching_slots"
  ON public.matching_slots FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage matching_slots"
  ON public.matching_slots FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- student_slot_preferences: users own, admins manage
CREATE POLICY "Users can view own slot preferences"
  ON public.student_slot_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own slot preferences"
  ON public.student_slot_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own slot preferences"
  ON public.student_slot_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all slot preferences"
  ON public.student_slot_preferences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- AUTO MATCH STUDENT FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_match_student(_preference_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _pref RECORD;
  _slot_ids UUID[];
  _best_slot_id UUID;
  _best_count INTEGER := -1;
  _slot RECORD;
  _sid UUID;
BEGIN
  -- Get the preference record
  SELECT * INTO _pref FROM public.student_slot_preferences WHERE id = _preference_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Preference not found'; END IF;
  IF _pref.assigned_slot_id IS NOT NULL THEN RETURN _pref.assigned_slot_id; END IF;

  -- Build array of 3 ranked slot IDs
  _slot_ids := ARRAY[_pref.slot_1_id, _pref.slot_2_id, _pref.slot_3_id];

  -- Find best-fit: among valid slots, pick the one with highest current_count (closest to min)
  FOR i IN 1..3 LOOP
    _sid := _slot_ids[i];
    IF _sid IS NULL THEN CONTINUE; END IF;

    SELECT * INTO _slot FROM public.matching_slots
      WHERE id = _sid
        AND course_level = _pref.selected_level
        AND status != 'full'
        AND current_count < max_students
      FOR UPDATE;

    IF FOUND AND _slot.current_count > _best_count THEN
      _best_count := _slot.current_count;
      _best_slot_id := _slot.id;
    END IF;
  END LOOP;

  -- If no valid slot, leave pending
  IF _best_slot_id IS NULL THEN RETURN NULL; END IF;

  -- Assign student
  UPDATE public.student_slot_preferences
    SET assigned_slot_id = _best_slot_id, match_status = 'matched'
    WHERE id = _preference_id;

  -- Increment slot count
  UPDATE public.matching_slots
    SET current_count = current_count + 1
    WHERE id = _best_slot_id;

  RETURN _best_slot_id;
END;
$$;

-- =============================================
-- SLOT STATUS UPDATE TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_slot_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When slot reaches min_students and was open -> confirmed
  IF NEW.current_count >= NEW.min_students AND OLD.status = 'open' THEN
    NEW.status := 'confirmed';
    
    -- Update all matched students in this slot to confirmed
    UPDATE public.student_slot_preferences
      SET match_status = 'confirmed'
      WHERE assigned_slot_id = NEW.id AND match_status = 'matched';

    -- Notify admin
    INSERT INTO public.admin_notifications (message, type, related_group_id)
    VALUES (
      'Slot "' || NEW.day || ' ' || NEW.time || ' (' || NEW.course_level || ')" reached minimum students and is now confirmed!',
      'slot_confirmed',
      NULL
    );
  END IF;

  -- When slot reaches max -> full
  IF NEW.current_count >= NEW.max_students THEN
    NEW.status := 'full';
    
    INSERT INTO public.admin_notifications (message, type)
    VALUES (
      'Slot "' || NEW.day || ' ' || NEW.time || ' (' || NEW.course_level || ')" is now FULL.',
      'slot_full'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_slot_status
  BEFORE UPDATE ON public.matching_slots
  FOR EACH ROW
  WHEN (OLD.current_count IS DISTINCT FROM NEW.current_count)
  EXECUTE FUNCTION public.update_slot_status();

-- =============================================
-- SEED DEFAULT SLOTS (4 slots × each level)
-- =============================================
INSERT INTO public.matching_slots (course_level, day, time, timezone) VALUES
  ('Beginner 1', 'Friday', '11:00', 'Africa/Cairo'),
  ('Beginner 1', 'Friday', '13:00', 'Africa/Cairo'),
  ('Beginner 1', 'Monday', '18:00', 'Africa/Cairo'),
  ('Beginner 1', 'Thursday', '18:00', 'Africa/Cairo'),
  ('Beginner 2', 'Friday', '11:00', 'Africa/Cairo'),
  ('Beginner 2', 'Friday', '13:00', 'Africa/Cairo'),
  ('Beginner 2', 'Monday', '18:00', 'Africa/Cairo'),
  ('Beginner 2', 'Thursday', '18:00', 'Africa/Cairo'),
  ('Intermediate 1', 'Friday', '11:00', 'Africa/Cairo'),
  ('Intermediate 1', 'Friday', '13:00', 'Africa/Cairo'),
  ('Intermediate 1', 'Monday', '18:00', 'Africa/Cairo'),
  ('Intermediate 1', 'Thursday', '18:00', 'Africa/Cairo'),
  ('Intermediate 2', 'Friday', '11:00', 'Africa/Cairo'),
  ('Intermediate 2', 'Friday', '13:00', 'Africa/Cairo'),
  ('Intermediate 2', 'Monday', '18:00', 'Africa/Cairo'),
  ('Intermediate 2', 'Thursday', '18:00', 'Africa/Cairo');
