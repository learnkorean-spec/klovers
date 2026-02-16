CREATE POLICY "Users can view own admin attendance"
ON public.admin_attendance_log
FOR SELECT
USING (auth.uid() = user_id);