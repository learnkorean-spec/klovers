
-- XP ledger: every XP-earning event
CREATE TABLE public.student_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id integer REFERENCES public.textbook_lessons(id) ON DELETE SET NULL,
  activity_type text NOT NULL, -- vocab, grammar, dialogue, exercise, chapter, bonus, challenge
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Per-section completion tracking
CREATE TABLE public.student_lesson_progress (
  user_id uuid NOT NULL,
  lesson_id integer NOT NULL REFERENCES public.textbook_lessons(id) ON DELETE CASCADE,
  vocab_done boolean NOT NULL DEFAULT false,
  grammar_done boolean NOT NULL DEFAULT false,
  dialogue_done boolean NOT NULL DEFAULT false,
  exercises_done boolean NOT NULL DEFAULT false,
  reading_done boolean NOT NULL DEFAULT false,
  chapter_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (user_id, lesson_id)
);

-- Badges earned
CREATE TABLE public.student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

-- Daily streak tracking
CREATE TABLE public.student_streaks (
  user_id uuid PRIMARY KEY,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  streak_3_earned boolean NOT NULL DEFAULT false,
  streak_7_earned boolean NOT NULL DEFAULT false,
  streak_14_earned boolean NOT NULL DEFAULT false,
  streak_30_earned boolean NOT NULL DEFAULT false
);

-- RLS
ALTER TABLE public.student_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own XP" ON public.student_xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own XP" ON public.student_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage XP" ON public.student_xp FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own progress" ON public.student_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own progress" ON public.student_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.student_lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage progress" ON public.student_lesson_progress FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own badges" ON public.student_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON public.student_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage badges" ON public.student_badges FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own streaks" ON public.student_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own streaks" ON public.student_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.student_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage streaks" ON public.student_streaks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Leaderboard view (public, anonymized)
CREATE OR REPLACE VIEW public.xp_leaderboard AS
SELECT
  sx.user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(sx.xp_earned), 0)::integer AS total_xp
FROM public.student_xp sx
LEFT JOIN public.profiles p ON p.user_id = sx.user_id
GROUP BY sx.user_id, p.name, p.avatar_url
ORDER BY total_xp DESC
LIMIT 50;
