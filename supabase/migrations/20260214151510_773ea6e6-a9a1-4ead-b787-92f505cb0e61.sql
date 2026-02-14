
-- Group Sessions table
CREATE TABLE public.group_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, session_date)
);

ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group_sessions"
ON public.group_sessions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view group_sessions"
ON public.group_sessions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Group Attendance table
CREATE TABLE public.group_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'absent' CHECK (status IN ('present','absent','late','excused')),
  source text NOT NULL DEFAULT 'system' CHECK (source IN ('student','admin','system')),
  admin_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.group_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group_attendance"
ON public.group_attendance FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own attendance"
ON public.group_attendance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can update own attendance"
ON public.group_attendance FOR UPDATE
USING (auth.uid() = user_id);

-- RPC: Approve attendance and deduct class
CREATE OR REPLACE FUNCTION public.approve_group_attendance(_attendance_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _att RECORD;
  _student_email TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT ga.*, gs.group_id INTO _att
    FROM public.group_attendance ga
    JOIN public.group_sessions gs ON gs.id = ga.session_id
    WHERE ga.id = _attendance_id
    FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Attendance record not found'; END IF;
  IF _att.admin_approved THEN RETURN; END IF; -- idempotent

  -- Mark approved
  UPDATE public.group_attendance
    SET admin_approved = true, status = 'present', source = 'admin'
    WHERE id = _attendance_id;

  -- Find student email from profiles
  SELECT email INTO _student_email FROM public.profiles WHERE user_id = _att.user_id;
  IF _student_email IS NULL THEN RETURN; END IF;

  -- Deduct 1 class from the students table
  UPDATE public.students
    SET used_classes = used_classes + 1
    WHERE email = _student_email AND used_classes < total_classes;
END;
$$;
