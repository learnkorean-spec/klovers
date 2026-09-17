-- 20260918000000_seed_achievement_milestones.sql seeds the 10 milestone rows
-- per student (on signup going forward, backfilled for everyone else) and
-- fixes the RLS gap that let any signed-in user write another student's
-- rows. It does not touch progress_value / is_achieved.
--
-- Nothing else in the app updates those columns either. useMilestones.ts
-- used to export `updateMilestoneProgress` for the client to call after
-- finishing a lesson or game, but nothing in the codebase ever calls it
-- (grep the whole src/ tree — the only reference is the definition and
-- export). So even with rows seeded, every milestone would sit at 0/target
-- forever: visible now, but permanently stuck, which is a worse bug because
-- it looks intentional ("0/500 XP earned") instead of missing.
--
-- This moves progress computation server-side, the same way game XP already
-- is (lib/gameXpApi.ts / award_game_xp): a small SECURITY DEFINER function
-- per milestone_type, each fired by a trigger on the table that actually
-- owns that number, so a student's progress updates itself the moment the
-- underlying activity happens and can't be inflated from the client.
--
--   xp_earned          <- SUM(xp_earned) from student_xp
--   lessons_completed  <- COUNT(chapter_completed) from student_lesson_progress
--   vocabulary_mastered<- COUNT(vocab_done) from student_lesson_progress
--                          (same proxy the "First 100 Words" badge already
--                          uses in useGamification.ts's checkBadges — kept
--                          consistent rather than inventing a second,
--                          disagreeing definition of "words mastered")
--   streak_days         <- longest_streak from student_streaks, not
--                          current_streak: an unmet milestone's progress bar
--                          should not visibly go backwards just because a
--                          streak broke. (is_achieved, once true, is never
--                          revisited by these functions either way — see the
--                          `is_achieved = false` guard on every UPDATE below.)

-- xp_earned
CREATE OR REPLACE FUNCTION public.recompute_xp_milestones(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total int;
BEGIN
  SELECT COALESCE(SUM(xp_earned), 0) INTO v_total FROM public.student_xp WHERE user_id = p_user_id;

  UPDATE public.achievement_milestones
  SET progress_value = LEAST(v_total, target_value),
      is_achieved = v_total >= target_value,
      achieved_at = CASE WHEN v_total >= target_value THEN COALESCE(achieved_at, now()) ELSE achieved_at END,
      updated_at = now()
  WHERE user_id = p_user_id
    AND milestone_type = 'xp_earned'
    AND is_achieved = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_xp_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.recompute_xp_milestones(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_student_xp_milestones ON public.student_xp;
CREATE TRIGGER trg_student_xp_milestones
  AFTER INSERT ON public.student_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recompute_xp_milestones();

-- lessons_completed + vocabulary_mastered
CREATE OR REPLACE FUNCTION public.recompute_lesson_milestones(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lessons int;
  v_vocab int;
BEGIN
  SELECT count(*) FILTER (WHERE chapter_completed), count(*) FILTER (WHERE vocab_done)
    INTO v_lessons, v_vocab
    FROM public.student_lesson_progress WHERE user_id = p_user_id;

  UPDATE public.achievement_milestones
  SET progress_value = LEAST(v_lessons, target_value),
      is_achieved = v_lessons >= target_value,
      achieved_at = CASE WHEN v_lessons >= target_value THEN COALESCE(achieved_at, now()) ELSE achieved_at END,
      updated_at = now()
  WHERE user_id = p_user_id AND milestone_type = 'lessons_completed' AND is_achieved = false;

  UPDATE public.achievement_milestones
  SET progress_value = LEAST(v_vocab, target_value),
      is_achieved = v_vocab >= target_value,
      achieved_at = CASE WHEN v_vocab >= target_value THEN COALESCE(achieved_at, now()) ELSE achieved_at END,
      updated_at = now()
  WHERE user_id = p_user_id AND milestone_type = 'vocabulary_mastered' AND is_achieved = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_lesson_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.recompute_lesson_milestones(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_progress_milestones ON public.student_lesson_progress;
CREATE TRIGGER trg_lesson_progress_milestones
  AFTER INSERT OR UPDATE ON public.student_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recompute_lesson_milestones();

-- streak_days
CREATE OR REPLACE FUNCTION public.recompute_streak_milestones(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_longest int;
BEGIN
  SELECT COALESCE(longest_streak, 0) INTO v_longest FROM public.student_streaks WHERE user_id = p_user_id;

  UPDATE public.achievement_milestones
  SET progress_value = LEAST(v_longest, target_value),
      is_achieved = v_longest >= target_value,
      achieved_at = CASE WHEN v_longest >= target_value THEN COALESCE(achieved_at, now()) ELSE achieved_at END,
      updated_at = now()
  WHERE user_id = p_user_id AND milestone_type = 'streak_days' AND is_achieved = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_streak_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.recompute_streak_milestones(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_student_streaks_milestones ON public.student_streaks;
CREATE TRIGGER trg_student_streaks_milestones
  AFTER INSERT OR UPDATE ON public.student_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recompute_streak_milestones();

-- One-time catch-up: every student who already has activity recorded gets
-- their real progress reflected immediately, rather than waiting for their
-- next XP award / lesson / streak update to trigger a recompute.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.achievement_milestones LOOP
    PERFORM public.recompute_xp_milestones(r.user_id);
    PERFORM public.recompute_lesson_milestones(r.user_id);
    PERFORM public.recompute_streak_milestones(r.user_id);
  END LOOP;
END $$;
