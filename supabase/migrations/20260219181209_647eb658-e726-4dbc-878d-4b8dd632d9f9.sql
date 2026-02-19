
-- 1) Create schedule_resubmission_requests table
CREATE TABLE public.schedule_resubmission_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT now() + interval '48 hours',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_resubmission_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage resubmission requests"
ON public.schedule_resubmission_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read by token"
ON public.schedule_resubmission_requests FOR SELECT
USING (true);

CREATE POLICY "Anyone can update by token"
ON public.schedule_resubmission_requests FOR UPDATE
USING (true);

-- 2) Normalize levels in enrollments
UPDATE public.enrollments
SET level = lower(replace(trim(level), ' ', '_'))
WHERE level IS NOT NULL AND level != '' AND level != lower(replace(trim(level), ' ', '_'));

-- 3) Normalize levels in leads
UPDATE public.leads
SET level = lower(replace(trim(level), ' ', '_'))
WHERE level IS NOT NULL AND level != '' AND level != lower(replace(trim(level), ' ', '_'));

-- 4) Normalize levels in profiles
UPDATE public.profiles
SET level = lower(replace(trim(level), ' ', '_'))
WHERE level IS NOT NULL AND level != '' AND level != lower(replace(trim(level), ' ', '_'));

-- 5) Backfill enrollments.level from leads where enrollment.level is null/empty
UPDATE public.enrollments e
SET level = lower(replace(trim(l.level), ' ', '_'))
FROM public.profiles p
JOIN public.leads l ON lower(trim(l.email)) = lower(trim(p.email))
WHERE e.user_id = p.user_id
  AND (e.level IS NULL OR trim(e.level) = '')
  AND l.level IS NOT NULL AND trim(l.level) != '';

-- 6) Backfill preferred_days from preferred_days array (already stored correctly)
-- No action needed - preferred_days is already an array
