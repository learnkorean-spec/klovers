
-- Add index on matching_slots.package_id for performance
CREATE INDEX IF NOT EXISTS idx_matching_slots_package_id ON public.matching_slots(package_id);

-- Add composite index on schedule_packages for fast lookups
CREATE INDEX IF NOT EXISTS idx_schedule_packages_lookup ON public.schedule_packages(level, day_of_week, start_time, timezone);

-- Strict backfill: match matching_slots to schedule_packages by level + day + time + timezone
UPDATE public.matching_slots ms
SET package_id = sp.id
FROM public.schedule_packages sp
WHERE ms.package_id IS NULL
  AND lower(regexp_replace(ms.course_level, '\s+', '_', 'g')) = sp.level
  AND (
    CASE lower(ms.day)
      WHEN 'sunday' THEN 0
      WHEN 'monday' THEN 1
      WHEN 'tuesday' THEN 2
      WHEN 'wednesday' THEN 3
      WHEN 'thursday' THEN 4
      WHEN 'friday' THEN 5
      WHEN 'saturday' THEN 6
      ELSE NULL
    END
  ) = sp.day_of_week
  AND (ms.time::time) = sp.start_time
  AND COALESCE(ms.timezone, 'Africa/Cairo') = COALESCE(sp.timezone, 'Africa/Cairo');
