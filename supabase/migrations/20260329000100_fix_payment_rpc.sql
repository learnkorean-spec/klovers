-- Fix the payment lookup function
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
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
BEGIN
  -- Get calling user's email from auth.users
  SELECT u.email INTO v_user_email
  FROM auth.users u
  WHERE u.id = v_user_id;

  RETURN QUERY
  SELECT e.id, e.plan_type, e.class_type, e.duration,
         e.amount, e.currency, e.approval_status,
         e.due_at, e.classes_included,
         e.receipt_url, e.payment_method, e.payment_date, e.user_id
  FROM enrollments e
  WHERE e.id = p_enrollment_id
    AND (
      e.user_id = v_user_id
      OR e.user_id IS NULL
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = e.user_id
          AND p.email = v_user_email
      )
    );
END;
$$;
