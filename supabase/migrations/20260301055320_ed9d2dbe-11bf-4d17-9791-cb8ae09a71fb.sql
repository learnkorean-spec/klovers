
CREATE OR REPLACE FUNCTION public.validate_enrollment_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.payment_status NOT IN ('UNPAID','PENDING','PAID','FAILED','REFUNDED','PENDING_PAYMENT','UNDER_REVIEW','pending','paid','failed','refunded') THEN
    RAISE EXCEPTION 'Invalid payment_status: %', NEW.payment_status;
  END IF;
  IF NEW.approval_status NOT IN ('PENDING','APPROVED','REJECTED','PENDING_PAYMENT','pending','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid approval_status: %', NEW.approval_status;
  END IF;
  IF NEW.enrollment_status NOT IN ('active','cancelled','expired') THEN
    RAISE EXCEPTION 'Invalid enrollment_status: %', NEW.enrollment_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
