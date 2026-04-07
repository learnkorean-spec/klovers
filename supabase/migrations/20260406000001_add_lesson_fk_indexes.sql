-- Add indexes on lesson_id foreign keys in all lesson content tables.
-- Without these, every lesson page load performs a full table scan.
CREATE INDEX IF NOT EXISTS idx_lesson_vocabulary_lesson_id ON lesson_vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_grammar_lesson_id ON lesson_grammar(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_dialogues_lesson_id ON lesson_dialogues(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_lesson_id ON lesson_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_reading_lesson_id ON lesson_reading(lesson_id);
