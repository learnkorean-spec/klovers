-- Remove duplicate vocabulary entries, keeping only the first one per lesson+korean combo
DELETE FROM lesson_vocabulary
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM lesson_vocabulary
  GROUP BY lesson_id, korean
);