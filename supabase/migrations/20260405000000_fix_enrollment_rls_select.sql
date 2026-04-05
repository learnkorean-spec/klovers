-- Fix CRITICAL: The old policy allowed any authenticated user to SELECT all enrollments.
-- This restricts SELECT to: own enrollments (by user_id), OR admin users,
-- OR enrollments with NULL user_id (manual pre-payment enrollments accessed by ID).

DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (
    auth.uid() = user_id
    OR user_id IS NULL
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
