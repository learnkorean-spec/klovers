-- Lets Re drag private students into whatever order she wants on "My ongoing
-- students" and Student Admin, instead of being stuck with alphabetical.
-- NULL = never manually ordered yet; such rows sort after any that have been
-- given a position (see the app-side ORDER BY), so new students land at the
-- bottom until she drags them somewhere.
ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS sort_order integer;

COMMENT ON COLUMN public.teacher_students.sort_order IS
  'Manual display order set by dragging in the admin UI. NULL = not yet ordered, sorts after any explicit value.';
