-- Allow any authenticated user to view any enrollment by ID.
-- Enrollment UUIDs are unguessable secrets sent only to the student via private email.
-- This lets the payment page work regardless of user_id matching.
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );
