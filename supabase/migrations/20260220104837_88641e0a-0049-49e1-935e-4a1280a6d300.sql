
-- Add course_type column to schedule_packages (group or private)
ALTER TABLE public.schedule_packages
ADD COLUMN course_type text NOT NULL DEFAULT 'group';
