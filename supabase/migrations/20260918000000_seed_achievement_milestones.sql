-- Achievement milestones were only ever seeded once, for profiles that
-- existed on 2026-03-16 (see 20260316000001_achievement_milestones.sql).
-- Nothing since then creates rows for new profiles, so every student who
-- signed up after that migration ran has zero rows in achievement_milestones
-- and the dashboard always shows "No milestones yet".
--
-- This adds:
--   1. A trigger that seeds the 10 milestone rows whenever a new profile
--      is created, so future signups are covered automatically.
--   2. A one-time backfill using the same rows, for every profile that
--      predates the trigger (anyone who signed up between March and now).
--   3. A fix to the insert/update RLS policies: they currently check only
--      auth.role() = 'authenticated', not that the row belongs to the
--      caller, so any signed-in user could write another student's
--      milestone rows via a direct REST call. Scoped to the row's owner.

-- 1. Tighten RLS
DROP POLICY IF EXISTS "Service role can insert milestones" ON achievement_milestones;
DROP POLICY IF EXISTS "Service role can update milestones" ON achievement_milestones;

CREATE POLICY "Users can insert their own milestones"
  ON achievement_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
  ON achievement_milestones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Seed milestone rows whenever a new profile is created
CREATE OR REPLACE FUNCTION public.seed_achievement_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
  VALUES
    (NEW.user_id, 'lessons_completed', 1, '5 Lessons Completed', 5),
    (NEW.user_id, 'lessons_completed', 2, '10 Lessons Completed', 10),
    (NEW.user_id, 'lessons_completed', 3, '25 Lessons Completed', 25),
    (NEW.user_id, 'lessons_completed', 4, '50 Lessons Completed', 50),
    (NEW.user_id, 'vocabulary_mastered', 1, '100 Words Mastered', 100),
    (NEW.user_id, 'vocabulary_mastered', 2, '250 Words Mastered', 250),
    (NEW.user_id, 'xp_earned', 1, '500 XP Earned', 500),
    (NEW.user_id, 'xp_earned', 2, '2000 XP Earned', 2000),
    (NEW.user_id, 'streak_days', 1, '7 Day Streak', 7),
    (NEW.user_id, 'streak_days', 2, '30 Day Streak', 30)
  ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_achievement_milestones ON public.profiles;
CREATE TRIGGER trg_seed_achievement_milestones
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_achievement_milestones();

-- 3. Backfill every profile that predates this trigger (anyone who signed
--    up after the March 16 seed migration ran, or was missed by it)
INSERT INTO public.achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT p.user_id, m.milestone_type, m.milestone_tier, m.milestone_name, m.target_value
FROM public.profiles p
CROSS JOIN (
  VALUES
    ('lessons_completed', 1, '5 Lessons Completed', 5),
    ('lessons_completed', 2, '10 Lessons Completed', 10),
    ('lessons_completed', 3, '25 Lessons Completed', 25),
    ('lessons_completed', 4, '50 Lessons Completed', 50),
    ('vocabulary_mastered', 1, '100 Words Mastered', 100),
    ('vocabulary_mastered', 2, '250 Words Mastered', 250),
    ('xp_earned', 1, '500 XP Earned', 500),
    ('xp_earned', 2, '2000 XP Earned', 2000),
    ('streak_days', 1, '7 Day Streak', 7),
    ('streak_days', 2, '30 Day Streak', 30)
) AS m(milestone_type, milestone_tier, milestone_name, target_value)
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;
