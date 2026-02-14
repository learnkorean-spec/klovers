
CREATE OR REPLACE FUNCTION public.sync_student_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
BEGIN
  -- Only act when enrollment becomes APPROVED + PAID
  IF NEW.approval_status = 'APPROVED' AND NEW.payment_status = 'PAID' THEN
    -- Skip if old row was already approved+paid (avoid re-trigger on unrelated updates)
    IF OLD IS NOT NULL AND OLD.approval_status = 'APPROVED' AND OLD.payment_status = 'PAID' THEN
      RETURN NEW;
    END IF;

    -- Get profile info
    SELECT name, email, country INTO _profile
      FROM public.profiles
      WHERE user_id = NEW.user_id;

    IF _profile.email IS NULL THEN
      RETURN NEW; -- no profile found, skip
    END IF;

    -- Upsert into students table
    INSERT INTO public.students (
      full_name, email, country, status,
      course_type, package_name,
      total_classes, used_classes,
      total_paid, price_per_class,
      payment_status, notes
    ) VALUES (
      _profile.name,
      _profile.email,
      COALESCE(_profile.country, ''),
      'student',
      NEW.plan_type,
      NEW.plan_type || ' ' || NEW.duration || 'mo',
      NEW.classes_included,
      0,
      NEW.amount,
      NEW.unit_price,
      'paid',
      'Auto-created from enrollment ' || NEW.id::text
    )
    ON CONFLICT (email) DO UPDATE SET
      status = 'student',
      course_type = EXCLUDED.course_type,
      package_name = EXCLUDED.package_name,
      total_classes = public.students.total_classes + EXCLUDED.total_classes,
      total_paid = public.students.total_paid + EXCLUDED.total_paid,
      price_per_class = EXCLUDED.price_per_class,
      payment_status = 'paid',
      notes = public.students.notes || E'\n' || EXCLUDED.notes;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on enrollment updates
CREATE TRIGGER trg_sync_student_on_approval
  AFTER UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_student_on_approval();

-- Also trigger on insert (for Stripe webhook which may insert already-approved)
CREATE TRIGGER trg_sync_student_on_approval_insert
  AFTER INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_student_on_approval();
