-- Allow users to update their own enrollments (for schedule preferences)
CREATE POLICY "Users can update own enrollments"
ON public.enrollments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);