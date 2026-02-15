
-- Create student_packages table for multiple packages per student
CREATE TABLE public.student_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL DEFAULT '',
  total_classes INTEGER NOT NULL DEFAULT 0,
  used_classes INTEGER NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  price_per_class NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_packages ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage student_packages"
ON public.student_packages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Students can view own packages
CREATE POLICY "Students can view own packages"
ON public.student_packages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = student_packages.student_id
  AND s.email = get_auth_email()
));

-- Migrate existing package data from students table
INSERT INTO public.student_packages (student_id, package_name, total_classes, used_classes, total_paid, price_per_class, payment_status)
SELECT id, COALESCE(package_name, ''), total_classes, used_classes, total_paid, price_per_class, payment_status
FROM public.students
WHERE total_classes > 0 OR total_paid > 0;

-- Add package_id to attendance_log for per-package tracking
ALTER TABLE public.attendance_log ADD COLUMN package_id UUID REFERENCES public.student_packages(id) ON DELETE SET NULL;

-- Link existing attendance records to the migrated packages
UPDATE public.attendance_log al
SET package_id = sp.id
FROM public.student_packages sp
WHERE al.student_id = sp.student_id AND al.package_id IS NULL;

-- Ensure students email is unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_email_key'
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_email_key UNIQUE (email);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
