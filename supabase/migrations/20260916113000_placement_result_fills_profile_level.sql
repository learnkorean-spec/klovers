-- A placement result fills an empty profile level.
--
-- placement_tests.level is written as hangul / l1 / l2 / l3 (level_1 /
-- level_2 in April rows). profiles.level and profiles.course_level_key use
-- hangul / level_1 / level_2 / level_3. Nothing carried a result across, so
-- on 16 Sep 2026 nine students who had sat the test had no profile level;
-- they were filled by hand the same day.
--
-- Rule (Re, 16 Sep): fill the gap, never overwrite. A profile that already
-- has a level keeps it - some are Re's deliberate overrides (e.g. a student
-- tested l2 and placed in Level 1 on purpose).

BEGIN;

CREATE OR REPLACE FUNCTION public.placement_level_key(p_level text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_level ~ '^l[0-9]$' THEN 'level_' || substr(p_level, 2)
    WHEN p_level = 'hangul' OR p_level ~ '^level_[0-9]$' THEN p_level
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.fill_profile_level_from_placement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text := public.placement_level_key(NEW.level);
BEGIN
  IF NEW.user_id IS NULL OR v_key IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
     SET level            = COALESCE(level, v_key),
         course_level_key = COALESCE(course_level_key, v_key)
   WHERE user_id = NEW.user_id
     AND (level IS NULL OR course_level_key IS NULL);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fill_profile_level_from_placement() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_placement_fills_profile_level ON public.placement_tests;
CREATE TRIGGER trg_placement_fills_profile_level
  AFTER INSERT OR UPDATE OF level, user_id ON public.placement_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_profile_level_from_placement();

-- Backfill, same rule: latest result per student, empty fields only.
WITH latest AS (
  SELECT DISTINCT ON (user_id) user_id, public.placement_level_key(level) AS key
    FROM public.placement_tests
   WHERE user_id IS NOT NULL
   ORDER BY user_id, created_at DESC
)
UPDATE public.profiles p
   SET level            = COALESCE(p.level, l.key),
       course_level_key = COALESCE(p.course_level_key, l.key)
  FROM latest l
 WHERE l.user_id = p.user_id
   AND l.key IS NOT NULL
   AND (p.level IS NULL OR p.course_level_key IS NULL);

-- Verify before commit.
DO $$
DECLARE
  v_gaps int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'trg_placement_fills_profile_level'
       AND tgrelid = 'public.placement_tests'::regclass
  ) THEN
    RAISE EXCEPTION 'Verify failed: trigger not created';
  END IF;

  SELECT count(*) INTO v_gaps
    FROM public.profiles p
   WHERE (p.level IS NULL OR p.course_level_key IS NULL)
     AND EXISTS (
       SELECT 1 FROM public.placement_tests t
        WHERE t.user_id = p.user_id
          AND public.placement_level_key(t.level) IS NOT NULL
     );
  IF v_gaps > 0 THEN
    RAISE EXCEPTION 'Verify failed: % tested profile(s) still missing a level', v_gaps;
  END IF;
END $$;

COMMIT;
