
DROP POLICY "Active enrollment insert attendance" ON public.attendance_requests;

CREATE POLICY "Users can insert own attendance"
  ON public.attendance_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = attendance_requests.enrollment_id
      AND e.user_id = auth.uid()
    )
  );
