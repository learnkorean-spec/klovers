
-- 1) Add level column to enrollments if not exists
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS level text;

-- 2) Backfill: set level from profiles where enrollment.level is null and profile.level is non-empty
UPDATE public.enrollments e
SET level = p.level
FROM public.profiles p
WHERE e.level IS NULL
  AND e.user_id = p.user_id
  AND p.level IS NOT NULL
  AND p.level <> '';

-- 3) Trigger: when enrollment.level is inserted/updated with a non-empty value,
--    push it to profiles.level (one-way: enrollment -> profile)
CREATE OR REPLACE FUNCTION public.sync_enrollment_level_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only proceed if level is being set to a non-empty value
  IF NEW.level IS NOT NULL AND NEW.level <> '' THEN
    UPDATE public.profiles
    SET level = NEW.level
    WHERE user_id = NEW.user_id
      AND (level IS NULL OR level = '' OR level IS DISTINCT FROM NEW.level);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_enrollment_level ON public.enrollments;

CREATE TRIGGER trg_sync_enrollment_level
AFTER INSERT OR UPDATE OF level ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.sync_enrollment_level_to_profile();
