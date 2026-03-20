-- User Learning Goals table for personalized target tracking
CREATE TABLE IF NOT EXISTS user_learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- daily_vocab, weekly_lessons, monthly_xp, streak_days
  goal_name TEXT NOT NULL, -- User-friendly goal name
  target_value INT NOT NULL, -- Target number (e.g., 50 words, 200 XP)
  time_period TEXT NOT NULL, -- daily, weekly, monthly
  current_progress INT DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, completed, abandoned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  target_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, goal_type, time_period)
);

-- Create indexes for efficient queries
CREATE INDEX idx_user_goals_user_id ON user_learning_goals(user_id);
CREATE INDEX idx_user_goals_active ON user_learning_goals(user_id, status);
CREATE INDEX idx_user_goals_date ON user_learning_goals(target_date);

-- Enable RLS
ALTER TABLE user_learning_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goals"
  ON user_learning_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
  ON user_learning_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON user_learning_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON user_learning_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Initialize suggested goals for existing users with some activity
INSERT INTO user_learning_goals (user_id, goal_type, goal_name, target_value, time_period, target_date)
SELECT DISTINCT p.user_id, 'daily_vocab', 'Learn 10 new words daily', 10, 'daily', NOW() + INTERVAL '30 days'
FROM profiles p
ON CONFLICT (user_id, goal_type, time_period) DO NOTHING;

INSERT INTO user_learning_goals (user_id, goal_type, goal_name, target_value, time_period, target_date)
SELECT DISTINCT p.user_id, 'weekly_lessons', 'Complete 3 lessons this week', 3, 'weekly', NOW() + INTERVAL '7 days'
FROM profiles p
ON CONFLICT (user_id, goal_type, time_period) DO NOTHING;

INSERT INTO user_learning_goals (user_id, goal_type, goal_name, target_value, time_period, target_date)
SELECT DISTINCT p.user_id, 'monthly_xp', 'Earn 1000 XP this month', 1000, 'monthly', NOW() + INTERVAL '30 days'
FROM profiles p
ON CONFLICT (user_id, goal_type, time_period) DO NOTHING;

INSERT INTO user_learning_goals (user_id, goal_type, goal_name, target_value, time_period, target_date)
SELECT DISTINCT p.user_id, 'streak_days', 'Maintain a 7-day learning streak', 7, 'daily', NOW() + INTERVAL '7 days'
FROM profiles p
ON CONFLICT (user_id, goal_type, time_period) DO NOTHING;
