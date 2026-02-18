
-- ============================================================
-- Schedule Packages System
-- ============================================================

-- 1. schedule_packages
CREATE TABLE IF NOT EXISTS public.schedule_packages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level         text NOT NULL,
  day_of_week   int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun,1=Mon,...
  start_time    time NOT NULL DEFAULT '18:00',
  duration_min  int NOT NULL DEFAULT 90,
  timezone      text NOT NULL DEFAULT 'Africa/Cairo',
  capacity      int NOT NULL DEFAULT 5,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedule_packages"
  ON public.schedule_packages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read schedule_packages"
  ON public.schedule_packages FOR SELECT
  USING (true);

-- 2. groups (package-linked groups)
CREATE TABLE IF NOT EXISTS public.pkg_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id  uuid NOT NULL REFERENCES public.schedule_packages(id) ON DELETE CASCADE,
  name        text NOT NULL,
  capacity    int NOT NULL DEFAULT 5,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pkg_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pkg_groups"
  ON public.pkg_groups FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read pkg_groups"
  ON public.pkg_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3. group_members (package groups membership)
CREATE TABLE IF NOT EXISTS public.pkg_group_members (
  group_id      uuid NOT NULL REFERENCES public.pkg_groups(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  member_status text NOT NULL DEFAULT 'active',
  joined_at     timestamptz NOT NULL DEFAULT now(),
  enrollment_id uuid,
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.pkg_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pkg_group_members"
  ON public.pkg_group_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own pkg_group_members"
  ON public.pkg_group_members FOR SELECT
  USING (auth.uid() = user_id);

-- 4. student_package_preferences (replaces student_schedule_preferences for new flow)
CREATE TABLE IF NOT EXISTS public.student_package_preferences (
  user_id      uuid PRIMARY KEY,
  level        text NOT NULL DEFAULT '',
  package_id   uuid REFERENCES public.schedule_packages(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_package_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student_package_preferences"
  ON public.student_package_preferences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own package preference"
  ON public.student_package_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. pkg_group_sessions (new attendance sessions)
CREATE TABLE IF NOT EXISTS public.pkg_group_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid NOT NULL REFERENCES public.pkg_groups(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, session_date)
);

ALTER TABLE public.pkg_group_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pkg_group_sessions"
  ON public.pkg_group_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view pkg_group_sessions"
  ON public.pkg_group_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 6. pkg_attendance
CREATE TABLE IF NOT EXISTS public.pkg_attendance (
  session_id     uuid NOT NULL REFERENCES public.pkg_group_sessions(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL,
  status         text NOT NULL DEFAULT 'absent' CHECK (status IN ('present','absent','no_show','excused')),
  admin_approved boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

ALTER TABLE public.pkg_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pkg_attendance"
  ON public.pkg_attendance FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own pkg_attendance"
  ON public.pkg_attendance FOR SELECT
  USING (auth.uid() = user_id);

-- 7. pkg_class_charges
CREATE TABLE IF NOT EXISTS public.pkg_class_charges (
  session_id  uuid NOT NULL REFERENCES public.pkg_group_sessions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  charge_type text NOT NULL DEFAULT 'paid_session' CHECK (charge_type IN ('paid_session','waived_emergency')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

ALTER TABLE public.pkg_class_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pkg_class_charges"
  ON public.pkg_class_charges FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own pkg_class_charges"
  ON public.pkg_class_charges FOR SELECT
  USING (auth.uid() = user_id);

-- 8. Function: assign student to group after approval
CREATE OR REPLACE FUNCTION public.assign_student_to_pkg_group(
  _user_id     uuid,
  _enrollment_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _package_id uuid;
  _group      RECORD;
  _member_count int;
  _status     text;
BEGIN
  -- Get student's preferred package
  SELECT package_id INTO _package_id
    FROM public.student_package_preferences
    WHERE user_id = _user_id;

  IF _package_id IS NULL THEN
    RETURN 'no_preference';
  END IF;

  -- Find best group under that package with room
  SELECT g.id, g.name, g.capacity INTO _group
    FROM public.pkg_groups g
    LEFT JOIN public.pkg_group_members m ON m.group_id = g.id AND m.member_status = 'active'
    WHERE g.package_id = _package_id
    GROUP BY g.id, g.name, g.capacity
    HAVING COUNT(m.user_id) < g.capacity
    ORDER BY COUNT(m.user_id) ASC
    LIMIT 1;

  IF NOT FOUND THEN
    -- All groups full → waitlist in first group
    SELECT id, name, capacity INTO _group
      FROM public.pkg_groups WHERE package_id = _package_id LIMIT 1;

    IF NOT FOUND THEN
      RETURN 'no_group';
    END IF;

    INSERT INTO public.pkg_group_members(group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'waitlist', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;

    INSERT INTO public.admin_notifications(message, type, related_user_id)
    VALUES (
      'Student assigned to waitlist in group "' || _group.name || '" (package full at approval)',
      'waitlist',
      _user_id
    );
    RETURN 'waitlisted';
  END IF;

  -- Assign active
  INSERT INTO public.pkg_group_members(group_id, user_id, member_status, enrollment_id)
  VALUES (_group.id, _user_id, 'active', _enrollment_id)
  ON CONFLICT (group_id, user_id) DO UPDATE SET member_status = 'active', enrollment_id = _enrollment_id;

  RETURN 'assigned:' || _group.name;
END;
$$;

-- 9. Function: handle pkg_attendance approval billing
CREATE OR REPLACE FUNCTION public.handle_pkg_attendance_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _enrollment_id uuid;
BEGIN
  -- Only act when admin_approved transitions to true
  IF NEW.admin_approved = true AND (OLD.admin_approved IS DISTINCT FROM true) THEN

    -- Find enrollment for this user
    SELECT id INTO _enrollment_id
      FROM public.enrollments
      WHERE user_id = NEW.user_id
        AND approval_status = 'APPROVED'
        AND payment_status = 'PAID'
      ORDER BY created_at DESC
      LIMIT 1;

    IF _enrollment_id IS NULL THEN
      RETURN NEW;
    END IF;

    IF NEW.status IN ('present', 'absent', 'no_show') THEN
      -- Decrement sessions_remaining (min 0)
      UPDATE public.enrollments
        SET sessions_remaining = GREATEST(sessions_remaining - 1, 0)
        WHERE id = _enrollment_id;

      -- Record charge (idempotent)
      INSERT INTO public.pkg_class_charges(session_id, user_id, charge_type)
      VALUES (NEW.session_id, NEW.user_id, 'paid_session')
      ON CONFLICT (session_id, user_id) DO NOTHING;

    ELSIF NEW.status = 'excused' THEN
      -- Waived — no deduction
      INSERT INTO public.pkg_class_charges(session_id, user_id, charge_type)
      VALUES (NEW.session_id, NEW.user_id, 'waived_emergency')
      ON CONFLICT (session_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pkg_attendance_approval
  AFTER UPDATE ON public.pkg_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pkg_attendance_approval();
