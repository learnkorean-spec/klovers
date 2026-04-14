-- ============================================================
-- Add new schedule slots (2026-04-15)
-- 3 group packages + 2 trial session slots
-- Safe: idempotent inserts, no existing records modified
-- ============================================================

-- ── Section 1: New group schedule packages ──────────────────

-- Level 1 — Tuesday 18:00
INSERT INTO public.schedule_packages (level, day_of_week, start_time, duration_min, timezone, capacity, course_type, is_active)
SELECT 'l1', 2, '18:00'::time, 90, 'Africa/Cairo', 5, 'group', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedule_packages
  WHERE level = 'l1' AND day_of_week = 2 AND start_time = '18:00'::time
    AND course_type = 'group'
);

-- Hangul (Foundation) — Thursday 18:00
INSERT INTO public.schedule_packages (level, day_of_week, start_time, duration_min, timezone, capacity, course_type, is_active)
SELECT 'hangul', 4, '18:00'::time, 90, 'Africa/Cairo', 5, 'group', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedule_packages
  WHERE level = 'hangul' AND day_of_week = 4 AND start_time = '18:00'::time
    AND course_type = 'group'
);

-- Level 1 — Friday 10:00
INSERT INTO public.schedule_packages (level, day_of_week, start_time, duration_min, timezone, capacity, course_type, is_active)
SELECT 'l1', 5, '10:00'::time, 90, 'Africa/Cairo', 5, 'group', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedule_packages
  WHERE level = 'l1' AND day_of_week = 5 AND start_time = '10:00'::time
    AND course_type = 'group'
);

-- ── Section 2: Auto-create pkg_groups for new packages ──────

SELECT public.ensure_pkg_groups_for_packages();

-- ── Section 3: Trial session slots (30-min, via teacher_availability) ──

DO $$
DECLARE
  _teacher_id uuid;
BEGIN
  -- Find an existing teacher_id from current availability records
  SELECT ta.teacher_id INTO _teacher_id
  FROM public.teacher_availability ta
  WHERE ta.is_available = true
  LIMIT 1;

  -- Fallback: use an admin or teacher from user_roles
  IF _teacher_id IS NULL THEN
    SELECT ur.user_id INTO _teacher_id
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'teacher')
    LIMIT 1;
  END IF;

  IF _teacher_id IS NULL THEN
    RAISE EXCEPTION 'No teacher_id found — cannot create trial slots';
  END IF;

  -- Trial slot: Wednesday 17:30 (5:30 PM)
  INSERT INTO public.teacher_availability (teacher_id, day_of_week, start_time, is_available)
  VALUES (_teacher_id, 3, '17:30', true)
  ON CONFLICT (teacher_id, day_of_week, start_time) DO NOTHING;

  -- Trial slot: Sunday 18:30 (6:30 PM) — after L2 Private ends at 18:30
  INSERT INTO public.teacher_availability (teacher_id, day_of_week, start_time, is_available)
  VALUES (_teacher_id, 0, '18:30', true)
  ON CONFLICT (teacher_id, day_of_week, start_time) DO NOTHING;
END $$;
