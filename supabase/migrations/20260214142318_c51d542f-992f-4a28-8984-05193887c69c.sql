
-- Add group_name column to students table
ALTER TABLE public.students ADD COLUMN group_name TEXT DEFAULT '';

-- Create student_groups table
CREATE TABLE public.student_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;

-- Admins can manage groups
CREATE POLICY "Admins can manage student_groups"
  ON public.student_groups
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read groups
CREATE POLICY "Authenticated users can read student_groups"
  ON public.student_groups
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
