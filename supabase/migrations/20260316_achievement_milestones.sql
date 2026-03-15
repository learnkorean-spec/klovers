-- Add milestone-based achievements table for tracking cumulative progress
CREATE TABLE IF NOT EXISTS achievement_milestones (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- lessons_completed, vocabulary_mastered, xp_earned, streak_days
  milestone_tier INT NOT NULL, -- 1=bronze, 2=silver, 3=gold, 4=platinum
  milestone_name TEXT NOT NULL, -- e.g., "5 Lessons Completed", "10 Lessons Completed"
  target_value INT NOT NULL, -- target value for milestone (5, 10, 25, 50, 100)
  progress_value INT DEFAULT 0, -- current progress
  is_achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, milestone_type, milestone_tier)
);

-- Create index for efficient queries
CREATE INDEX idx_achievement_milestones_user_id ON achievement_milestones(user_id);
CREATE INDEX idx_achievement_milestones_achieved ON achievement_milestones(user_id, is_achieved);

-- Enable RLS
ALTER TABLE achievement_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own milestones"
  ON achievement_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can update milestones"
  ON achievement_milestones FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can insert milestones"
  ON achievement_milestones FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Initialize milestones for existing users
INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'lessons_completed', 1, '5 Lessons Completed', 5
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;

INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'lessons_completed', 2, '10 Lessons Completed', 10
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;

INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'lessons_completed', 3, '25 Lessons Completed', 25
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;

INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'lessons_completed', 4, '50 Lessons Completed', 50
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;

INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'vocabulary_mastered', 1, '100 Words Mastered', 100
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;

INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'vocabulary_mastered', 2, '250 Words Mastered', 250
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;

INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'xp_earned', 1, '500 XP Earned', 500
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;

INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'xp_earned', 2, '2000 XP Earned', 2000
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;

INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'streak_days', 1, '7 Day Streak', 7
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;

INSERT INTO achievement_milestones (user_id, milestone_type, milestone_tier, milestone_name, target_value)
SELECT DISTINCT p.user_id, 'streak_days', 2, '30 Day Streak', 30
FROM profiles p
ON CONFLICT (user_id, milestone_type, milestone_tier) DO NOTHING;
