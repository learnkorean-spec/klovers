-- Phase 4, data half: model Re's ongoing students, and derive her availability
-- blocks from their classes rather than from hand-written rules.
--
-- Why
-- ---
-- 20260822150000 seeded nine blocked rules carrying a class name in `note`.
-- That works for the engine but is the wrong shape for a human: the classes
-- belong to students, a student can have several classes, and editing "Solafa
-- moved to 21:00" meant editing four unrelated rows with no way to know they
-- were the same person.
--
-- After this migration a class belongs to a student, and the availability engine
-- reads student classes as a third source of blocks. Nothing is copied or synced
-- between the two, so editing a class changes availability by construction --
-- there is no sync job that can drift.
--
-- Not the `students` table
-- ------------------------
-- public.students already exists and is the billing and enrolment record (9 live
-- rows, read by StudentManager and GroupAttendanceManager). It is NOT touched by
-- this migration. These are the teacher's private students, hence the
-- teacher_ prefix matching teacher_availability_rules. Merging the two is a
-- later, separate decision.
--
-- Deliberately thin
-- -----------------
-- `students` carries only what the calendar needs today: who they are, what they
-- study, whether they are active. Contact details, levels, invoices and a link
-- to an auth user are a later phase; they hang off `students.id` when that
-- happens, so nothing here has to be restructured to grow.
--
-- Duration, not end time
-- ----------------------
-- A class stores start_time + duration_minutes rather than start/end. That is
-- what lets Rynad's Sunday 23:00-00:30 be ONE row: 23:00 + 90 minutes simply
-- runs past midnight. The previous representation needed two rows because
-- end_time > start_time cannot express a wrap, which made "one class" a display
-- problem the UI had to paper over. Now it is one row and the engine splits the
-- spill when it evaluates.

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Refuse to adopt somebody else's table.
--
-- This migration previously used CREATE TABLE IF NOT EXISTS on a table named
-- `students`. A `students` table already existed -- the billing and enrolment
-- record, 9 live rows -- so the create silently skipped and the migration went
-- on to comment on, add triggers to, and enable RLS on the wrong table before
-- failing at the first column that did not exist. The transaction rolled it all
-- back, but only because the file happens to manage its own transaction.
--
-- IF NOT EXISTS is what turned a missing check into a silent adoption. These
-- guards make a name collision fail loudly and immediately instead: if a table
-- of our name exists without the column we expect, it is not ours, and we stop.
--
-- Re-running our own migration is still safe -- the guards pass, and the
-- CREATE TABLE IF NOT EXISTS below is a no-op.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.teacher_students') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'teacher_students'
          AND column_name  = 'subject'
     ) THEN
    RAISE EXCEPTION
      'name_collision: public.teacher_students already exists and is not the table this migration creates (no "subject" column). Refusing to adopt it. Investigate the existing table before re-running.'
      USING ERRCODE = '42P07';
  END IF;

  IF to_regclass('public.teacher_student_classes') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'teacher_student_classes'
          AND column_name  = 'duration_minutes'
     ) THEN
    RAISE EXCEPTION
      'name_collision: public.teacher_student_classes already exists and is not the table this migration creates (no "duration_minutes" column). Refusing to adopt it. Investigate the existing table before re-running.'
      USING ERRCODE = '42P07';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 1. Students.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_students (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  subject     text NOT NULL,
  status      text NOT NULL DEFAULT 'active',
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_students_full_name_check CHECK (length(btrim(full_name)) > 0),
  -- What the student is learning. Distinct from trial_slots.class_language,
  -- which is the language a trial is *conducted* in -- a student can learn
  -- Korean through Arabic. Conflating the two would have been expensive later.
  CONSTRAINT teacher_students_subject_check CHECK (subject IN ('korean', 'english')),
  CONSTRAINT teacher_students_status_check  CHECK (status IN ('active', 'paused', 'ended'))
);

COMMENT ON TABLE public.teacher_students IS
  'Re''s ongoing 1:1 students. Deliberately minimal: contact details, levels and '
  'billing are a later phase and hang off this id without restructuring.';
COMMENT ON COLUMN public.teacher_students.subject IS
  'What the student learns (korean|english). NOT the language of instruction — '
  'that is trial_slots.class_language and is a separate concept.';

CREATE OR REPLACE FUNCTION public.tg_teacher_students_touch()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_teacher_students_touch ON public.teacher_students;
CREATE TRIGGER trg_teacher_students_touch
  BEFORE INSERT OR UPDATE ON public.teacher_students
  FOR EACH ROW EXECUTE FUNCTION public.tg_teacher_students_touch();

-- ---------------------------------------------------------------------------
-- 2. Their weekly classes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_student_classes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid NOT NULL REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  weekday          smallint NOT NULL,
  start_time       time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 90,
  timezone         text NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  effective_from   date NOT NULL DEFAULT CURRENT_DATE,
  effective_to     date,
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_student_classes_weekday_check
    CHECK (weekday BETWEEN 0 AND 6),
  -- Capped at 24h so a typo cannot block days at a time. A class may run past
  -- midnight; it may not run past the following midnight.
  CONSTRAINT teacher_student_classes_duration_check
    CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  CONSTRAINT teacher_student_classes_effective_check
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE public.teacher_student_classes IS
  'One row per weekly class. start_time + duration_minutes rather than '
  'start/end, so a class crossing midnight stays a single row.';

CREATE INDEX IF NOT EXISTS idx_teacher_student_classes_weekday
  ON public.teacher_student_classes (weekday, effective_from);
CREATE INDEX IF NOT EXISTS idx_teacher_student_classes_student
  ON public.teacher_student_classes (student_id);

-- Reuses the Phase 2 trigger: validates the timezone against pg_timezone_names
-- and stamps updated_at.
DROP TRIGGER IF EXISTS trg_teacher_student_classes_touch ON public.teacher_student_classes;
CREATE TRIGGER trg_teacher_student_classes_touch
  BEFORE INSERT OR UPDATE ON public.teacher_student_classes
  FOR EACH ROW EXECUTE FUNCTION public.tg_teacher_availability_touch();

-- ---------------------------------------------------------------------------
-- 3. RLS: admin only, like the availability tables.
--
-- Student names must never be reachable from a booking page. The engine is
-- SECURITY DEFINER and returns instants only, so it can read these rows on an
-- anonymous caller's behalf without exposing any of them.
-- ---------------------------------------------------------------------------
ALTER TABLE public.teacher_students               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage teacher_students" ON public.teacher_students;
CREATE POLICY "Admins manage teacher_students"
  ON public.teacher_students
  FOR ALL TO authenticated
  USING      (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage teacher_student_classes" ON public.teacher_student_classes;
CREATE POLICY "Admins manage teacher_student_classes"
  ON public.teacher_student_classes
  FOR ALL TO authenticated
  USING      (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 4. Move the five real students across.
--
-- Subjects confirmed by Re on 2026-08-22. Menna was labelled "(English)" in the
-- previous seed; that label was outdated and she is a Korean student.
-- ---------------------------------------------------------------------------
INSERT INTO public.teacher_students (full_name, subject, status)
SELECT v.full_name, v.subject, 'active'
FROM (VALUES
  ('Menna',  'korean'),
  ('Rynad',  'korean'),
  ('Mariam', 'korean'),
  ('Namy',   'korean'),
  ('Solafa', 'english')
) AS v(full_name, subject)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teacher_students s WHERE lower(s.full_name) = lower(v.full_name)
);

INSERT INTO public.teacher_student_classes
  (student_id, weekday, start_time, duration_minutes, timezone)
SELECT s.id, v.weekday, v.start_time, v.duration_minutes, 'Asia/Kuala_Lumpur'
FROM (VALUES
  -- weekday: 0 = Sunday .. 6 = Saturday
  ('Menna',  6, TIME '16:00', 90),
  -- One row. 23:00 + 90 minutes ends 00:30 on Monday.
  ('Rynad',  0, TIME '23:00', 90),
  ('Mariam', 1, TIME '19:00', 90),
  ('Namy',   2, TIME '19:00', 60),
  ('Solafa', 1, TIME '22:00', 90),
  ('Solafa', 2, TIME '22:00', 90),
  ('Solafa', 3, TIME '22:00', 90),
  ('Solafa', 4, TIME '22:00', 90)
) AS v(full_name, weekday, start_time, duration_minutes)
JOIN public.teacher_students s ON lower(s.full_name) = lower(v.full_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teacher_student_classes sc
   WHERE sc.student_id = s.id
     AND sc.weekday    = v.weekday
     AND sc.start_time = v.start_time
     AND sc.effective_to IS NULL
);

-- Retire the nine hand-seeded rules these replace. Matched on the exact notes
-- written by 20260822150000 so nothing else can be caught; the base Mon-Fri
-- 10:00-19:00 rules ('Regular classes') are untouched.
DELETE FROM public.teacher_availability_rules
 WHERE kind = 'blocked'
   AND note IN (
     'Menna (English)',
     'Rynad (part 1 of 2, continues Mon 00:00)',
     'Rynad (part 2 of 2, continues from Sun 23:00)',
     'Solafa (English)',
     'Mariam',
     'Namy'
   );

-- ---------------------------------------------------------------------------
-- 5. Teach the engine about student classes.
--
-- Reproduced from the live definition (pg_get_functiondef, read immediately
-- before writing) with one added EXISTS and one clause in the WHERE. Every
-- other clause is preserved: STABLE, SECURITY DEFINER, and
-- SET search_path TO 'public', 'pg_catalog'.
--
-- A student class is treated exactly like a blocked rule, which means an
-- 'available' exception can still override it. That is deliberate: when Rynad
-- cancels one Sunday, Re opens that evening with an exception rather than
-- editing the recurring class.
--
-- The midnight spill is handled by checking two branches -- a class starting on
-- this day, and one starting yesterday that runs past midnight into it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_trial_availability_v2(
  p_from     date DEFAULT NULL::date,
  p_to       date DEFAULT NULL::date,
  p_language text DEFAULT NULL::text
)
 RETURNS TABLE(starts_at timestamp with time zone, ends_at timestamp with time zone, duration_min integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  WITH cfg AS (
    SELECT
      s.slot_minutes                AS slot_min,
      s.booking_lead_minutes        AS lead_min,
      s.buffer_minutes              AS buffer_min,
      s.max_horizon_days            AS horizon_days,
      public.fn_teacher_timezone()  AS tz
    FROM public.trial_settings s
    ORDER BY s.id
    LIMIT 1
  ),
  bounds AS (
    SELECT
      c.*,
      (now() AT TIME ZONE c.tz)::date AS today_local,
      GREATEST(COALESCE(p_from, (now() AT TIME ZONE c.tz)::date),
               (now() AT TIME ZONE c.tz)::date) AS d_from,
      LEAST(COALESCE(p_to, (now() AT TIME ZONE c.tz)::date + c.horizon_days),
            (now() AT TIME ZONE c.tz)::date + c.horizon_days) AS d_to
    FROM cfg c
  ),
  -- Full-day grid, then filter. Generating candidates per available window
  -- would be fussier and would miss slots opened by an 'available' exception
  -- that falls outside every rule window. 48 candidates a day at 60 days is
  -- ~2900 rows before filtering, which is nothing.
  grid AS (
    SELECT
      b.*,
      d::date AS slot_day,
      (d::date + make_interval(mins => b.slot_min * g)) AS local_start,
      (d::date + make_interval(mins => b.slot_min * (g + 1))) AS local_end
    FROM bounds b
    CROSS JOIN LATERAL generate_series(b.d_from, b.d_to, interval '1 day') d
    CROSS JOIN LATERAL generate_series(0, (1440 / b.slot_min) - 1) g
  ),
  judged AS (
    SELECT
      gr.*,
      -- Inside an 'available' rule for this weekday, with the whole slot fitting.
      EXISTS (
        SELECT 1 FROM public.teacher_availability_rules r
         WHERE r.kind = 'available'
           AND r.weekday = EXTRACT(DOW FROM gr.slot_day)::int
           AND r.effective_from <= gr.slot_day
           AND (r.effective_to IS NULL OR r.effective_to >= gr.slot_day)
           AND (p_language IS NULL OR r.class_language IS NULL OR r.class_language = p_language)
           AND (gr.slot_day + r.start_time) <= gr.local_start
           AND (gr.slot_day + r.end_time)   >= gr.local_end
      ) AS in_available_rule,
      -- Overlapping a 'blocked' rule — her regular teaching.
      EXISTS (
        SELECT 1 FROM public.teacher_availability_rules r
         WHERE r.kind = 'blocked'
           AND r.weekday = EXTRACT(DOW FROM gr.slot_day)::int
           AND r.effective_from <= gr.slot_day
           AND (r.effective_to IS NULL OR r.effective_to >= gr.slot_day)
           AND (gr.slot_day + r.start_time) <  gr.local_end
           AND (gr.slot_day + r.end_time)   >  gr.local_start
      ) AS in_blocked_rule,
      -- Overlapping an ongoing student's class. Two branches: a class starting
      -- today, and one that started yesterday and runs past midnight.
      EXISTS (
        SELECT 1
          FROM public.teacher_student_classes sc
          JOIN public.teacher_students st ON st.id = sc.student_id
         WHERE st.status = 'active'
           AND (
             (    sc.weekday = EXTRACT(DOW FROM gr.slot_day)::int
              AND sc.effective_from <= gr.slot_day
              AND (sc.effective_to IS NULL OR sc.effective_to >= gr.slot_day)
              AND (gr.slot_day + sc.start_time) < gr.local_end
              AND (gr.slot_day + sc.start_time + make_interval(mins => sc.duration_minutes)) > gr.local_start
             )
             OR
             (    sc.weekday = EXTRACT(DOW FROM gr.slot_day - 1)::int
              AND sc.effective_from <= (gr.slot_day - 1)
              AND (sc.effective_to IS NULL OR sc.effective_to >= (gr.slot_day - 1))
              AND ((gr.slot_day - 1) + sc.start_time) < gr.local_end
              AND ((gr.slot_day - 1) + sc.start_time + make_interval(mins => sc.duration_minutes)) > gr.local_start
             )
           )
      ) AS in_student_class,
      -- An 'available' exception covering the whole slot.
      EXISTS (
        SELECT 1 FROM public.teacher_availability_exceptions e
         WHERE e.kind = 'available'
           AND e.exception_date = gr.slot_day
           AND (gr.slot_day + e.start_time) <= gr.local_start
           AND (gr.slot_day + e.end_time)   >= gr.local_end
      ) AS in_available_exception,
      -- A 'blocked' exception overlapping it.
      EXISTS (
        SELECT 1 FROM public.teacher_availability_exceptions e
         WHERE e.kind = 'blocked'
           AND e.exception_date = gr.slot_day
           AND (gr.slot_day + e.start_time) <  gr.local_end
           AND (gr.slot_day + e.end_time)   >  gr.local_start
      ) AS in_blocked_exception
    FROM grid gr
  ),
  open_slots AS (
    SELECT
      j.*,
      (j.local_start AT TIME ZONE j.tz) AS utc_start,
      (j.local_end   AT TIME ZONE j.tz) AS utc_end,
      -- Occupancy includes the buffer, so a buffer would keep the next slot
      -- clear without changing the length of the class itself.
      ((j.local_end AT TIME ZONE j.tz) + make_interval(mins => j.buffer_min)) AS utc_occupied_to
    FROM judged j
     -- Precedence, stated exactly once: exceptions beat rules, and within either
     -- level blocked beats available. A student class blocks like a blocked rule.
     WHERE (j.in_available_rule OR j.in_available_exception)
       AND NOT j.in_blocked_exception
       AND (NOT (j.in_blocked_rule OR j.in_student_class) OR j.in_available_exception)
  )
  SELECT
    o.utc_start AS starts_at,
    o.utc_end   AS ends_at,
    o.slot_min  AS duration_min
  FROM open_slots o
  WHERE o.utc_start >= now() + make_interval(mins => o.lead_min)
    AND NOT EXISTS (
      SELECT 1 FROM public.trial_bookings tb
       WHERE tb.status IN ('pending', 'confirmed')
         AND tb.slot_range IS NOT NULL
         AND tb.slot_range && tstzrange(o.utc_start, o.utc_occupied_to, '[)')
    )
  ORDER BY o.utc_start;
$function$;

COMMIT;
