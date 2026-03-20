-- Create vocabulary_review_history table for Spaced Repetition System (SRS)
CREATE TABLE IF NOT EXISTS vocabulary_review_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  lesson_vocabulary_id UUID NOT NULL REFERENCES lesson_vocabulary(id) ON DELETE CASCADE,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_count INT NOT NULL DEFAULT 0,
  difficulty_factor NUMERIC(4,2) NOT NULL DEFAULT 2.5, -- SM-2 algorithm factor
  interval_days INT NOT NULL DEFAULT 1, -- Days until next review
  last_reviewed_at TIMESTAMPTZ,
  quality_last_review INT, -- 0-5 rating from last review (0=complete blackout, 5=perfect response)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure each user has only one review history per vocabulary item
  UNIQUE(user_id, lesson_vocabulary_id)
);

-- Index for querying cards due for review
CREATE INDEX IF NOT EXISTS idx_user_next_review ON vocabulary_review_history (user_id, next_review_date);

-- Enable RLS for vocabulary_review_history
ALTER TABLE vocabulary_review_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own review history
CREATE POLICY "Users can view their own review history"
  ON vocabulary_review_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own review history
CREATE POLICY "Users can insert their own review history"
  ON vocabulary_review_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own review history
CREATE POLICY "Users can update their own review history"
  ON vocabulary_review_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own review history
CREATE POLICY "Users can delete their own review history"
  ON vocabulary_review_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to initialize review history when user starts learning a lesson
CREATE OR REPLACE FUNCTION initialize_vocabulary_review_history()
RETURNS TRIGGER AS $$
BEGIN
  -- When a vocabulary item is reviewed for the first time, create a review history record
  -- This is called when a user marks vocabulary as "studied" in a lesson
  INSERT INTO vocabulary_review_history (user_id, lesson_vocabulary_id, next_review_date)
  VALUES (NEW.user_id, NEW.lesson_vocabulary_id, CURRENT_DATE + INTERVAL '1 day')
  ON CONFLICT (user_id, lesson_vocabulary_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vocabulary_review_user_due ON vocabulary_review_history(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_vocabulary_review_vocab ON vocabulary_review_history(lesson_vocabulary_id);
