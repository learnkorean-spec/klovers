-- Backfill RPC: auto-fix enrollments with missing level/schedule data
CREATE OR REPLACE FUNCTION public.backfill_missing_enrollments()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fixed_count integer := 0;
  remaining_count integer := 0;
  r RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1) Fill level from leads by email match
  UPDATE public.enrollments e
  SET level = lower(replace(l.level, ' ', '_'))
  FROM public.leads l
  WHERE (e.level IS NULL OR e.level = '')
    AND l.email IS NOT NULL
    AND lower(l.email) = (SELECT lower(p.email) FROM public.profiles p WHERE p.user_id = e.user_id LIMIT 1)
    AND l.level IS NOT NULL AND l.level != '';
  GET DIAGNOSTICS fixed_count = ROW_COUNT;

  -- 2) Fill level from profiles if still missing
  UPDATE public.enrollments e
  SET level = p.level
  FROM public.profiles p
  WHERE (e.level IS NULL OR e.level = '')
    AND e.user_id = p.user_id
    AND p.level IS NOT NULL AND p.level != '';

  fixed_count := fixed_count + (SELECT count(*)::int FROM (SELECT 1) x WHERE TRUE);

  -- 3) Fill preferred_day from preferred_days[0] when missing
  UPDATE public.enrollments
  SET preferred_day = preferred_days[1]
  WHERE (preferred_day IS NULL OR preferred_day = '')
    AND preferred_days IS NOT NULL
    AND array_length(preferred_days, 1) > 0;

  -- 4) Fill package_id from student_package_preferences
  UPDATE public.enrollments e
  SET package_id = spp.package_id
  FROM public.student_package_preferences spp
  WHERE (e.package_id IS NULL)
    AND e.user_id = spp.user_id
    AND spp.package_id IS NOT NULL;

  -- 5) Normalize level strings to snake_case
  UPDATE public.enrollments
  SET level = lower(replace(level, ' ', '_'))
  WHERE level IS NOT NULL AND level != '' AND level ~ '[A-Z ]';

  -- Count remaining unfixed
  SELECT count(*)::int INTO remaining_count
  FROM public.enrollments
  WHERE approval_status NOT IN ('REJECTED')
    AND (level IS NULL OR level = '' OR preferred_day IS NULL OR preferred_day = '');

  RETURN jsonb_build_object('fixed', fixed_count, 'remaining', remaining_count);
END;
$$;
