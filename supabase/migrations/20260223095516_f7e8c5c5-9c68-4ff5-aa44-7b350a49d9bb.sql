
-- A) Add package_id to matching_slots linking to schedule_packages
ALTER TABLE public.matching_slots
  ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.schedule_packages(id) ON DELETE SET NULL;

-- Backfill matching_slots.package_id by matching level/day/time to schedule_packages
UPDATE public.matching_slots ms
SET package_id = sp.id
FROM public.schedule_packages sp
WHERE ms.package_id IS NULL
  AND sp.level = lower(replace(ms.course_level, ' ', '_'))
  AND sp.day_of_week = (
    CASE ms.day
      WHEN 'Sunday' THEN 0 WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
      WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5
      WHEN 'Saturday' THEN 6
    END
  )
  AND sp.is_active = true;

-- C) Create unified assign_student_to_group RPC
-- Takes a package_id + user_id + optional enrollment_id
-- Finds/creates group, assigns student, prevents duplicates
CREATE OR REPLACE FUNCTION public.assign_student_to_group(_package_id uuid, _user_id uuid, _enrollment_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _package RECORD;
  _group RECORD;
  _existing RECORD;
  _day_name text;
BEGIN
  -- 1) Validate package exists
  SELECT * INTO _package FROM public.schedule_packages WHERE id = _package_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'package_not_found');
  END IF;

  -- 2) Idempotency: check if user already in ANY active group for this package
  SELECT pg.id, pg.name INTO _existing
    FROM public.pkg_group_members pgm
    JOIN public.pkg_groups pg ON pg.id = pgm.group_id
    WHERE pgm.user_id = _user_id
      AND pg.package_id = _package_id
      AND pg.is_active = true;

  IF FOUND THEN
    -- Update enrollment_id if provided and not set
    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.pkg_group_members
        SET enrollment_id = _enrollment_id, member_status = 'active'
        WHERE group_id = _existing.id AND user_id = _user_id;
    END IF;
    RETURN jsonb_build_object(
      'status', 'already_assigned',
      'group_id', _existing.id,
      'group_name', _existing.name
    );
  END IF;

  -- 3) Day name for group naming
  _day_name := CASE _package.day_of_week
    WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday' ELSE 'Unknown'
  END;

  -- 4) Ensure at least 1 active group exists for this package
  IF NOT EXISTS (
    SELECT 1 FROM public.pkg_groups WHERE package_id = _package_id AND is_active = true
  ) THEN
    INSERT INTO public.pkg_groups (package_id, name, capacity, is_active)
    VALUES (
      _package_id,
      initcap(replace(_package.level, '_', ' ')) || ' — ' || _day_name || ' ' || to_char(_package.start_time, 'HH12:MI AM'),
      _package.capacity,
      true
    );
  END IF;

  -- 5) Find group with seats available (fewest active members first)
  SELECT g.id, g.name, g.capacity, COUNT(m.user_id) AS active_count
    INTO _group
    FROM public.pkg_groups g
    LEFT JOIN public.pkg_group_members m ON m.group_id = g.id AND m.member_status = 'active'
    WHERE g.package_id = _package_id AND g.is_active = true
    GROUP BY g.id, g.name, g.capacity
    HAVING COUNT(m.user_id) < g.capacity
    ORDER BY COUNT(m.user_id) ASC
    LIMIT 1;

  IF FOUND THEN
    -- Assign active
    INSERT INTO public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'active', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO UPDATE SET member_status = 'active', enrollment_id = _enrollment_id;

    RETURN jsonb_build_object(
      'status', 'assigned',
      'group_id', _group.id,
      'group_name', _group.name
    );
  ELSE
    -- All groups full → waitlist in first group
    SELECT g.id, g.name INTO _group
      FROM public.pkg_groups g
      WHERE g.package_id = _package_id AND g.is_active = true
      ORDER BY g.created_at ASC
      LIMIT 1;

    INSERT INTO public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'waitlist', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;

    -- Notify admin
    INSERT INTO public.admin_notifications (message, type, related_group_id)
    VALUES (
      'Student waitlisted in "' || _group.name || '" — all groups for ' ||
        initcap(replace(_package.level, '_', ' ')) || ' on ' || _day_name || ' are full. Consider adding another group.',
      'suggest_add_group',
      _group.id
    );

    RETURN jsonb_build_object(
      'status', 'waitlisted',
      'group_id', _group.id,
      'group_name', _group.name
    );
  END IF;
END;
$$;
