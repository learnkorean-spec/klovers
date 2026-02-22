
-- RPC: assign_student_to_group_from_slot
-- Maps a matching_slot to a schedule_package, finds/creates a group, assigns the student idempotently.
CREATE OR REPLACE FUNCTION public.assign_student_to_group_from_slot(
  _slot_id uuid,
  _user_id uuid,
  _enrollment_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _slot RECORD;
  _package RECORD;
  _group RECORD;
  _day_num int;
  _existing_group_id uuid;
  _result_status text;
  _day_map jsonb := '{"Sunday":0,"Monday":1,"Tuesday":2,"Wednesday":3,"Thursday":4,"Friday":5,"Saturday":6}'::jsonb;
BEGIN
  -- Admin only
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1) Fetch the matching_slot
  SELECT * INTO _slot FROM public.matching_slots WHERE id = _slot_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'slot_not_found');
  END IF;

  -- 2) Map slot day name to day_of_week number
  _day_num := (_day_map ->> _slot.day)::int;
  IF _day_num IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid_day', 'day', _slot.day);
  END IF;

  -- 3) Resolve schedule_package: match level + day_of_week + active
  SELECT * INTO _package
    FROM public.schedule_packages
    WHERE level = lower(replace(_slot.course_level, ' ', '_'))
      AND day_of_week = _day_num
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_package_match', 'level', _slot.course_level, 'day', _slot.day);
  END IF;

  -- 4) Idempotency: check if user already in ANY group for this package
  SELECT pg.id, pg.name INTO _existing_group_id, _result_status
    FROM public.pkg_group_members pgm
    JOIN public.pkg_groups pg ON pg.id = pgm.group_id
    WHERE pgm.user_id = _user_id
      AND pg.package_id = _package.id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'already_assigned',
      'package_id', _package.id,
      'group_id', _existing_group_id,
      'group_name', _result_status
    );
  END IF;

  -- 5) Ensure at least 1 active group exists
  IF NOT EXISTS (
    SELECT 1 FROM public.pkg_groups WHERE package_id = _package.id AND is_active = true
  ) THEN
    INSERT INTO public.pkg_groups (package_id, name, capacity, is_active)
    VALUES (
      _package.id,
      initcap(replace(_package.level, '_', ' ')) || ' — ' ||
        CASE _package.day_of_week
          WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday' ELSE 'Unknown'
        END || ' ' || to_char(_package.start_time, 'HH12:MI AM'),
      _package.capacity,
      true
    );
  END IF;

  -- 6) Pick best group with seats_left > 0 (fewest active members first)
  SELECT g.id, g.name, g.capacity, COUNT(m.user_id) AS active_count
    INTO _group
    FROM public.pkg_groups g
    LEFT JOIN public.pkg_group_members m ON m.group_id = g.id AND m.member_status = 'active'
    WHERE g.package_id = _package.id AND g.is_active = true
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
      'package_id', _package.id,
      'group_id', _group.id,
      'group_name', _group.name
    );
  ELSE
    -- All groups full → waitlist in first group
    SELECT g.id, g.name INTO _group
      FROM public.pkg_groups g
      WHERE g.package_id = _package.id AND g.is_active = true
      ORDER BY g.created_at ASC
      LIMIT 1;

    INSERT INTO public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'waitlist', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;

    -- Notify admin
    INSERT INTO public.admin_notifications (message, type, related_group_id)
    VALUES (
      'Student waitlisted in "' || _group.name || '" — all groups for ' ||
        initcap(replace(_package.level, '_', ' ')) || ' on ' ||
        CASE _package.day_of_week
          WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday' ELSE 'Unknown'
        END || ' are full. Consider adding another group.',
      'suggest_add_group',
      _group.id
    );

    RETURN jsonb_build_object(
      'status', 'waitlisted',
      'package_id', _package.id,
      'group_id', _group.id,
      'group_name', _group.name
    );
  END IF;
END;
$$;
