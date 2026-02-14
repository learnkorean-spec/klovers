
-- Create a security definer function to get current user's email
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Fix students policies
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
CREATE POLICY "Students can view own record"
  ON public.students FOR SELECT
  USING (email = public.get_auth_email());

-- Fix attendance_log policies
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance_log;
CREATE POLICY "Students can view own attendance"
  ON public.attendance_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = attendance_log.student_id
      AND s.email = public.get_auth_email()
  ));
