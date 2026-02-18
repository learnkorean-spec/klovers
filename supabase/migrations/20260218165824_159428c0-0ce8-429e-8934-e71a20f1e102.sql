-- 1) Normalize existing enrollments.level to snake_case (e.g. "Beginner 1" -> "beginner_1")
UPDATE public.enrollments
SET level = lower(regexp_replace(level, '\s+', '_', 'g'))
WHERE level IS NOT NULL AND level <> '';

-- 2) Normalize leads.level the same way
UPDATE public.leads
SET level = lower(regexp_replace(level, '\s+', '_', 'g'))
WHERE level IS NOT NULL AND level <> '';

-- 3) Backfill enrollments.level from leads when enrollment.level is missing
--    Match by email (stored directly on enrollment via profile join)
UPDATE public.enrollments e
SET level = lower(regexp_replace(l.level, '\s+', '_', 'g'))
FROM public.leads l
JOIN public.profiles p ON lower(p.email) = lower(l.email)
WHERE (e.level IS NULL OR e.level = '')
  AND e.user_id = p.user_id
  AND l.level IS NOT NULL
  AND l.level <> '';

-- 4) Also normalize profiles.level for consistency
UPDATE public.profiles
SET level = lower(regexp_replace(level, '\s+', '_', 'g'))
WHERE level IS NOT NULL AND level <> '';
