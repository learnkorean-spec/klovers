CREATE POLICY "Users can delete own pending attendance"
  ON public.attendance_requests
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'PENDING');