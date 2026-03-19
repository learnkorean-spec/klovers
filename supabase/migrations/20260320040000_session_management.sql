-- Session Management System
-- Adds: session generator, attendance marking helpers, upcoming sessions query

-- ── 1. Generate sessions for a group ─────────────────────────────────
-- Generates weekly session dates for a group based on its package day_of_week
-- Call: SELECT * FROM generate_group_sessions('group-uuid', '2026-03-24', 8);
CREATE OR REPLACE FUNCTION generate_group_sessions(
  p_group_id   uuid,
  p_start_date date DEFAULT CURRENT_DATE,
  p_weeks      int  DEFAULT 8
)
RETURNS TABLE (session_date date, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_of_week  int;
  v_first_date   date;
  v_current_date date;
  v_days_ahead   int;
  v_week         int;
BEGIN
  -- Get the day_of_week from the linked schedule_package
  SELECT sp.day_of_week INTO v_day_of_week
  FROM pkg_groups pg
  JOIN schedule_packages sp ON sp.id = pg.package_id
  WHERE pg.id = p_group_id;

  IF v_day_of_week IS NULL THEN
    RAISE EXCEPTION 'Group not found or not linked to a package';
  END IF;

  -- Find the first occurrence of the target day on or after start_date
  v_days_ahead := (v_day_of_week - EXTRACT(DOW FROM p_start_date)::int + 7) % 7;
  v_first_date := p_start_date + v_days_ahead;

  -- Insert session for each week
  FOR v_week IN 0..(p_weeks - 1) LOOP
    v_current_date := v_first_date + (v_week * 7);

    INSERT INTO pkg_group_sessions (group_id, session_date)
    VALUES (p_group_id, v_current_date)
    ON CONFLICT (group_id, session_date) DO NOTHING;

    RETURN QUERY SELECT v_current_date, NOT EXISTS (
      SELECT 1 FROM pkg_group_sessions
      WHERE group_id = p_group_id AND session_date = v_current_date - 0
      AND created_at < now() - interval '1 second'
    );
  END LOOP;
END;
$$;

-- Simpler version — just inserts, returns count
CREATE OR REPLACE FUNCTION generate_sessions_for_group(
  p_group_id   uuid,
  p_start_date date DEFAULT CURRENT_DATE,
  p_weeks      int  DEFAULT 8
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_of_week  int;
  v_first_date   date;
  v_current_date date;
  v_days_ahead   int;
  v_week         int;
  v_created      int := 0;
BEGIN
  SELECT sp.day_of_week INTO v_day_of_week
  FROM pkg_groups pg
  JOIN schedule_packages sp ON sp.id = pg.package_id
  WHERE pg.id = p_group_id;

  IF v_day_of_week IS NULL THEN
    RETURN 0;
  END IF;

  v_days_ahead := (v_day_of_week - EXTRACT(DOW FROM p_start_date)::int + 7) % 7;
  v_first_date := p_start_date + v_days_ahead;

  FOR v_week IN 0..(p_weeks - 1) LOOP
    v_current_date := v_first_date + (v_week * 7);
    INSERT INTO pkg_group_sessions (group_id, session_date)
    VALUES (p_group_id, v_current_date)
    ON CONFLICT (group_id, session_date) DO NOTHING;
    IF FOUND THEN v_created := v_created + 1; END IF;
  END LOOP;

  RETURN v_created;
END;
$$;

-- ── 2. Get upcoming sessions for a student ────────────────────────────
CREATE OR REPLACE FUNCTION get_student_upcoming_sessions(p_user_id uuid)
RETURNS TABLE (
  session_id   uuid,
  session_date date,
  group_id     uuid,
  group_name   text,
  day_of_week  int,
  start_time   text,
  duration_min int,
  timezone     text,
  level        text,
  attendance_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pgs.id            AS session_id,
    pgs.session_date,
    pg.id             AS group_id,
    pg.name           AS group_name,
    sp.day_of_week,
    sp.start_time,
    sp.duration_min,
    sp.timezone,
    sp.level,
    pa.status         AS attendance_status
  FROM pkg_group_members pgm
  JOIN pkg_groups pg       ON pg.id = pgm.group_id
  JOIN schedule_packages sp ON sp.id = pg.package_id
  JOIN pkg_group_sessions pgs ON pgs.group_id = pg.id
  LEFT JOIN pkg_attendance pa ON pa.session_id = pgs.id AND pa.user_id = p_user_id
  WHERE pgm.user_id = p_user_id
    AND pgm.member_status = 'active'
    AND pgs.session_date >= CURRENT_DATE
  ORDER BY pgs.session_date ASC
  LIMIT 10;
END;
$$;

-- ── 3. Get session roster for admin attendance marking ────────────────
CREATE OR REPLACE FUNCTION get_session_roster(p_session_id uuid)
RETURNS TABLE (
  user_id       uuid,
  full_name     text,
  email         text,
  attendance_status text,
  admin_approved boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pgm.user_id,
    COALESCE(p.full_name, u.email)  AS full_name,
    u.email,
    COALESCE(pa.status, 'unmarked') AS attendance_status,
    COALESCE(pa.admin_approved, false) AS admin_approved
  FROM pkg_group_sessions pgs
  JOIN pkg_group_members pgm ON pgm.group_id = pgs.group_id
  JOIN auth.users u          ON u.id = pgm.user_id
  LEFT JOIN profiles p       ON p.user_id = pgm.user_id
  LEFT JOIN pkg_attendance pa ON pa.session_id = pgs.id AND pa.user_id = pgm.user_id
  WHERE pgs.id = p_session_id
    AND pgm.member_status = 'active'
  ORDER BY COALESCE(p.full_name, u.email);
END;
$$;

-- ── 4. Bulk save attendance for a session ─────────────────────────────
CREATE OR REPLACE FUNCTION save_session_attendance(
  p_session_id uuid,
  p_records    jsonb  -- [{ user_id, status }]
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record jsonb;
  v_saved  int := 0;
BEGIN
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    INSERT INTO pkg_attendance (session_id, user_id, status, admin_approved)
    VALUES (
      p_session_id,
      (v_record->>'user_id')::uuid,
      COALESCE(v_record->>'status', 'absent'),
      true
    )
    ON CONFLICT (session_id, user_id)
    DO UPDATE SET
      status         = EXCLUDED.status,
      admin_approved = true;
    v_saved := v_saved + 1;
  END LOOP;
  RETURN v_saved;
END;
$$;

-- ── 5. Get sessions for a group (admin view) ──────────────────────────
CREATE OR REPLACE FUNCTION get_group_sessions(
  p_group_id uuid,
  p_from     date DEFAULT CURRENT_DATE - 30,
  p_to       date DEFAULT CURRENT_DATE + 60
)
RETURNS TABLE (
  session_id        uuid,
  session_date      date,
  marked_count      int,
  present_count     int,
  total_members     int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pgs.id AS session_id,
    pgs.session_date,
    COUNT(pa.user_id)::int                                     AS marked_count,
    COUNT(pa.user_id) FILTER (WHERE pa.status = 'present')::int AS present_count,
    COUNT(pgm.user_id)::int                                    AS total_members
  FROM pkg_group_sessions pgs
  LEFT JOIN pkg_attendance  pa  ON pa.session_id = pgs.id
  LEFT JOIN pkg_group_members pgm ON pgm.group_id = pgs.group_id AND pgm.member_status = 'active'
  WHERE pgs.group_id = p_group_id
    AND pgs.session_date BETWEEN p_from AND p_to
  GROUP BY pgs.id, pgs.session_date
  ORDER BY pgs.session_date DESC;
END;
$$;
