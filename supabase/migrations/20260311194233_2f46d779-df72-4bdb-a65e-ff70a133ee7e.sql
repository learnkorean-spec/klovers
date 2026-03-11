-- Remove duplicate grammar entries
DELETE FROM lesson_grammar
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM lesson_grammar
  GROUP BY lesson_id, title
);

-- Remove duplicate dialogue entries
DELETE FROM lesson_dialogues
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM lesson_dialogues
  GROUP BY lesson_id, korean
);

-- Remove duplicate exercise entries
DELETE FROM lesson_exercises
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM lesson_exercises
  GROUP BY lesson_id, question
);

-- Remove duplicate reading entries
DELETE FROM lesson_reading
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM lesson_reading
  GROUP BY lesson_id, korean_text
);