-- Update enrollment functions to save student preferences

-- Create function to save student preference during enrollment
CREATE OR REPLACE FUNCTION save_student_preference(
  p_user_id uuid,
  p_preferred_day_of_week int,
  p_preferred_start_time text,
  p_level text DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO student_package_preferences (user_id, preferred_day_of_week, preferred_start_time, level)
  VALUES (p_user_id, p_preferred_day_of_week, p_preferred_start_time, p_level)
  ON CONFLICT (user_id)
  DO UPDATE SET
    preferred_day_of_week = p_preferred_day_of_week,
    preferred_start_time = p_preferred_start_time,
    level = COALESCE(p_level, student_package_preferences.level),
    updated_at = now();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update the submit_enrollment function to accept preferred day/time parameters
-- This is a utility function that can be called after enrollment is created
CREATE OR REPLACE FUNCTION submit_enrollment_with_preference(
  p_user_id uuid,
  p_plan_type text,
  p_duration int,
  p_classes_included int,
  p_amount numeric,
  p_unit_price numeric,
  p_payment_provider text,
  p_level text,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_preferred_day_of_week int DEFAULT NULL,
  p_preferred_start_time text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_enrollment_id uuid;
  v_payment_status text;
BEGIN
  -- Determine payment status
  v_payment_status := CASE p_payment_provider
    WHEN 'stripe' THEN 'PAID'
    ELSE 'PAID'
  END;

  -- Create enrollment
  INSERT INTO enrollments (
    user_id, plan_type, duration, classes_included, amount, unit_price,
    payment_provider, stripe_payment_intent_id, level, payment_status, approval_status
  ) VALUES (
    p_user_id, p_plan_type, p_duration, p_classes_included, p_amount, p_unit_price,
    p_payment_provider, p_stripe_payment_intent_id, p_level, v_payment_status, 'APPROVED'
  )
  RETURNING id INTO v_enrollment_id;

  -- Save student preference if provided
  IF p_preferred_day_of_week IS NOT NULL AND p_preferred_start_time IS NOT NULL THEN
    PERFORM save_student_preference(p_user_id, p_preferred_day_of_week, p_preferred_start_time, p_level);
  END IF;

  RETURN json_build_object(
    'enrollment_id', v_enrollment_id,
    'success', true
  );
END;
$$ LANGUAGE plpgsql;
