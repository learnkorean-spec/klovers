
-- Add database-level constraints to prevent abuse on the leads table
ALTER TABLE public.leads 
  ADD CONSTRAINT leads_name_length CHECK (length(name) > 0 AND length(name) <= 100);

ALTER TABLE public.leads 
  ADD CONSTRAINT leads_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.leads 
  ADD CONSTRAINT leads_email_length CHECK (length(email) <= 254);

ALTER TABLE public.leads 
  ADD CONSTRAINT leads_level_length CHECK (level IS NULL OR length(level) <= 50);

ALTER TABLE public.leads 
  ADD CONSTRAINT leads_goal_length CHECK (goal IS NULL OR length(goal) <= 500);

ALTER TABLE public.leads 
  ADD CONSTRAINT leads_country_length CHECK (country IS NULL OR length(country) <= 100);

ALTER TABLE public.leads 
  ADD CONSTRAINT leads_status_length CHECK (length(status) <= 50);
