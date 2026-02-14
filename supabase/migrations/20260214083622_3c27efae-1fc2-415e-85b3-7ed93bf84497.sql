
-- Students management table
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  country text DEFAULT '',
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'student', 'inactive')),
  course_type text DEFAULT '',
  package_name text DEFAULT '',
  total_classes integer NOT NULL DEFAULT 0,
  used_classes integer NOT NULL DEFAULT 0,
  remaining_classes integer GENERATED ALWAYS AS (total_classes - used_classes) STORED,
  total_paid numeric NOT NULL DEFAULT 0,
  price_per_class numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'manual')),
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Attendance log
CREATE TABLE public.attendance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marked_at timestamp with time zone NOT NULL DEFAULT now(),
  marked_by uuid NOT NULL,
  notes text DEFAULT ''
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_log ENABLE ROW LEVEL SECURITY;

-- Students RLS: admins full access, students can view own by email
CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view own record" ON public.students FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Attendance log RLS
CREATE POLICY "Admins can manage attendance_log" ON public.attendance_log FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view own attendance" ON public.attendance_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance_log.student_id AND s.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Updated_at trigger
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: mark attendance (admin only, increments used_classes)
CREATE OR REPLACE FUNCTION public.mark_student_attendance(_student_id uuid, _notes text DEFAULT '')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _remaining integer;
  _used integer;
  _total integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT total_classes, used_classes INTO _total, _used
    FROM public.students WHERE id = _student_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found'; END IF;

  IF _used >= _total THEN
    RAISE EXCEPTION 'No remaining classes';
  END IF;

  UPDATE public.students SET used_classes = used_classes + 1 WHERE id = _student_id;

  INSERT INTO public.attendance_log (student_id, marked_by, notes)
    VALUES (_student_id, auth.uid(), _notes);

  RETURN _total - _used - 1;
END;
$$;
