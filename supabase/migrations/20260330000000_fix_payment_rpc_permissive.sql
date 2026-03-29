-- Make payment lookup permissive: any authenticated user with the enrollment UUID can view it.
-- Enrollment IDs are unguessable UUIDs sent only to the specific student via email.
CREATE OR REPLACE FUNCTION public.get_enrollment_for_payment(p_enrollment_id uuid)
RETURNS TABLE (
  id uuid, plan_type text, class_type text, duration integer,
  amount numeric, currency text, approval_status text,
  due_at timestamptz, classes_included integer,
  receipt_url text, payment_method text, payment_date date, user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication (but don't restrict by user_id — UUID is unguessable)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT e.id, e.plan_type, e.class_type, e.duration,
         e.amount, e.currency, e.approval_status,
         e.due_at, e.classes_included,
         e.receipt_url, e.payment_method, e.payment_date, e.user_id
  FROM enrollments e
  WHERE e.id = p_enrollment_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_enrollment_for_payment(uuid) TO authenticated;
