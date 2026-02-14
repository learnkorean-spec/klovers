
-- Drop restrictive policies
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
DROP POLICY IF EXISTS "Admins can manage attendance_log" ON public.attendance_log;
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance_log;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own record"
  ON public.students FOR SELECT
  USING (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);

CREATE POLICY "Admins can manage attendance_log"
  ON public.attendance_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own attendance"
  ON public.attendance_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = attendance_log.student_id
      AND s.email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
  ));
