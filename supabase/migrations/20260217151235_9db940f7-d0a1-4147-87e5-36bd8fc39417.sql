
-- Drop the trigger that prevents multiple enrollments per user
DROP TRIGGER IF EXISTS check_duplicate_enrollment ON public.enrollments;

-- Drop the function too
DROP FUNCTION IF EXISTS public.prevent_duplicate_enrollment();
