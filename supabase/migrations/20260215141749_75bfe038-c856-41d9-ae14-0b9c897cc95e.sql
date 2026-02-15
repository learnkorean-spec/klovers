
-- 1) Create admin_attendance_log table
CREATE TABLE public.admin_attendance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  status text NOT NULL DEFAULT 'ATTENDED',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, session_date)
);

ALTER TABLE public.admin_attendance_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_attendance_log"
  ON public.admin_attendance_log
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) Create admin_add_attendance RPC
CREATE OR REPLACE FUNCTION public.admin_add_attendance(
  p_enrollment_id uuid,
  p_session_date date,
  p_note text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _enrollment RECORD;
  _remaining integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id, user_id, sessions_remaining
    INTO _enrollment
    FROM public.enrollments
    WHERE id = p_enrollment_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  IF _enrollment.sessions_remaining <= -3 THEN
    RAISE EXCEPTION 'LOCKED (-3). Renew required.';
  END IF;

  -- Insert attendance record
  INSERT INTO public.admin_attendance_log (user_id, enrollment_id, session_date, created_by)
  VALUES (_enrollment.user_id, p_enrollment_id, p_session_date, auth.uid());

  -- Decrement sessions_remaining
  UPDATE public.enrollments
    SET sessions_remaining = sessions_remaining - 1
    WHERE id = p_enrollment_id
    RETURNING sessions_remaining INTO _remaining;

  RETURN _remaining;
END;
$$;

-- 3) Create function to remove admin attendance
CREATE OR REPLACE FUNCTION public.admin_remove_attendance(
  p_enrollment_id uuid,
  p_session_date date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _remaining integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.admin_attendance_log
    WHERE enrollment_id = p_enrollment_id AND session_date = p_session_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance record not found';
  END IF;

  UPDATE public.enrollments
    SET sessions_remaining = sessions_remaining + 1
    WHERE id = p_enrollment_id
    RETURNING sessions_remaining INTO _remaining;

  RETURN _remaining;
END;
$$;

-- 4) Update admin_student_overview view with amount_due fields
DROP VIEW IF EXISTS public.admin_student_overview;

CREATE VIEW public.admin_student_overview
WITH (security_invoker = on)
AS
SELECT
  p.user_id,
  p.email,
  p.name,
  p.country,
  p.level,
  p.created_at AS joined_at,
  le.id AS enrollment_id,
  le.payment_status,
  le.approval_status,
  le.payment_method,
  le.payment_provider,
  le.plan_type,
  le.duration,
  le.amount,
  le.currency,
  le.sessions_total,
  COALESCE(le.sessions_remaining, 0) AS sessions_remaining,
  le.created_at AS enrollment_created_at,
  le.unit_price,
  CASE
    WHEN le.id IS NULL
         OR le.payment_status IS DISTINCT FROM 'PAID'
         OR le.approval_status IS DISTINCT FROM 'APPROVED'
      THEN 'LEAD'
    WHEN le.sessions_remaining <= -3 THEN 'LOCKED'
    WHEN le.sessions_remaining = 0  THEN 'COMPLETED'
    ELSE 'ACTIVE'
  END AS derived_status,
  CASE
    WHEN le.payment_provider = 'stripe'       THEN 'Stripe'
    WHEN le.payment_provider = 'egypt_manual'  THEN 'Egypt'
    WHEN le.payment_provider = 'manual'        THEN 'Manual'
    ELSE '—'
  END AS source_label,
  GREATEST(0, -COALESCE(le.sessions_remaining, 0)) AS negative_sessions,
  GREATEST(0, -COALESCE(le.sessions_remaining, 0)) * COALESCE(le.unit_price, 0) AS amount_due
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT *
  FROM public.enrollments e
  WHERE e.user_id = p.user_id
  ORDER BY e.created_at DESC
  LIMIT 1
) le ON true;
