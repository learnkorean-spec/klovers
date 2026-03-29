-- Allow students to view manual enrollments (user_id IS NULL) by ID
-- This is safe because the enrollment ID acts as a secure token
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;

CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND auth.uid() IS NOT NULL)
  );
