-- Record HOW a confirmed session came to exist, so the audit trail can tell a
-- hand-picked date from one the weekly schedule proposed.
--
-- Why a column and not the note field
-- -----------------------------------
-- `note` is free text Re writes for herself ("make-up for the 12th"), so
-- overloading it with a flag would mean the audit trail is a string match
-- against something a human types. It would also take the note away from the
-- exact rows most likely to need one.
--
-- Why it cannot be inferred
-- -------------------------
-- The obvious guess is class_id IS NULL, and it is wrong. class_id is
-- ON DELETE SET NULL on purpose: deleting a weekly class must not erase the
-- sessions already paid for. So a schedule-derived session whose class was
-- later removed also has class_id NULL, and the two cases are indistinguishable
-- after the fact. Recording the origin at write time is the only honest answer.
--
-- Default is truthful for existing rows
-- -------------------------------------
-- Every row that exists today came from the confirm strip or catch-up, both of
-- which build their list from teacher_student_classes. 'schedule' is therefore
-- correct for all of them, and the default backfills them without a data step.
--
-- Nothing reads this yet — the picker lands in its own PR — so applying it
-- changes nothing anyone can see.

BEGIN;

ALTER TABLE public.student_class_sessions
  ADD COLUMN IF NOT EXISTS entry_source text NOT NULL DEFAULT 'schedule';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_class_sessions_entry_source_check'
  ) THEN
    ALTER TABLE public.student_class_sessions
      ADD CONSTRAINT student_class_sessions_entry_source_check
      CHECK (entry_source IN ('schedule', 'manual'));
  END IF;
END
$$;

COMMENT ON COLUMN public.student_class_sessions.entry_source IS
  'How this session was confirmed. "schedule" — proposed by the weekly '
  'timetable in the confirm strip or catch-up list. "manual" — a date Re picked '
  'by hand, for a make-up class on an off-day or a change made before it was '
  'recorded. Cannot be inferred from class_id, which is nulled when a weekly '
  'class is deleted.';

-- Answers "which of these did she enter by hand?" without scanning every row.
-- Partial, because 'schedule' is the overwhelming majority and needs no index.
CREATE INDEX IF NOT EXISTS idx_student_class_sessions_manual
  ON public.student_class_sessions (student_id, session_date DESC)
  WHERE entry_source = 'manual';

COMMIT;
