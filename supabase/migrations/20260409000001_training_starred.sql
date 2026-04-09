CREATE TABLE training_starred (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starred INTEGER[] NOT NULL DEFAULT '{}',
  collections JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE training_starred ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own starred"
  ON training_starred FOR ALL USING (auth.uid() = user_id);
