
-- Fix security definer view issue: set security_invoker = true
ALTER VIEW public.admin_student_status_overview SET (security_invoker = true);
