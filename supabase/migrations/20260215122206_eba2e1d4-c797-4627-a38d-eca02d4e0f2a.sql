
-- Update existing leads that already have matching students to 'enrolled'
UPDATE public.leads l
SET status = 'enrolled'
WHERE EXISTS (SELECT 1 FROM public.students s WHERE s.email = l.email)
  AND l.status != 'enrolled';

-- Create trigger function to auto-mark leads as enrolled when a matching student is created/updated
CREATE OR REPLACE FUNCTION public.auto_mark_lead_enrolled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET status = 'enrolled'
  WHERE email = NEW.email
    AND status != 'enrolled';
  RETURN NEW;
END;
$$;

-- Trigger on student insert
CREATE TRIGGER trg_auto_mark_lead_on_student_insert
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_mark_lead_enrolled();

-- Trigger on student update (in case email changes)
CREATE TRIGGER trg_auto_mark_lead_on_student_update
  AFTER UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_mark_lead_enrolled();
