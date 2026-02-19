
-- Add preferred_day and package_id columns to enrollments
ALTER TABLE public.enrollments 
  ADD COLUMN IF NOT EXISTS preferred_day text,
  ADD COLUMN IF NOT EXISTS package_id uuid;

-- Backfill preferred_day from preferred_days[1] (PostgreSQL arrays are 1-indexed)
UPDATE public.enrollments
SET preferred_day = preferred_days[1]
WHERE preferred_day IS NULL 
  AND preferred_days IS NOT NULL 
  AND array_length(preferred_days, 1) > 0;

-- Normalize levels in enrollments
UPDATE public.enrollments 
SET level = lower(replace(trim(level), ' ', '_'))
WHERE level IS NOT NULL AND level <> '' AND level <> lower(replace(trim(level), ' ', '_'));

-- Normalize levels in leads
UPDATE public.leads
SET level = lower(replace(trim(level), ' ', '_'))
WHERE level IS NOT NULL AND level <> '' AND level <> lower(replace(trim(level), ' ', '_'));

-- Backfill enrollment.level from leads where missing
UPDATE public.enrollments e
SET level = l.level
FROM public.profiles p
JOIN public.leads l ON lower(l.email) = lower(p.email)
WHERE e.user_id = p.user_id
  AND (e.level IS NULL OR e.level = '')
  AND l.level IS NOT NULL AND l.level <> '';

-- Map package_id where possible (level + day match)
UPDATE public.enrollments e
SET package_id = sp.id
FROM public.schedule_packages sp
WHERE e.package_id IS NULL
  AND e.level IS NOT NULL AND e.level <> ''
  AND sp.level = e.level
  AND sp.is_active = true
  AND e.preferred_day IS NOT NULL
  AND sp.day_of_week = CASE e.preferred_day
    WHEN 'Sunday' THEN 0 WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
    WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5
    WHEN 'Saturday' THEN 6 END;
