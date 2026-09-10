-- The Student Preference Trends screen has never displayed a row, and could
-- not have.
--
-- get_student_preference_trends read student_package_preferences
-- .preferred_day_of_week and .preferred_start_time, and required both to be
-- NOT NULL. Nothing writes them. When a student picks her time, SchedulePicker
-- and MySchedulePage write `package_id` — which schedule row she chose — and
-- leave that pair alone. All three rows in the table today carry NULL in both.
-- The screen has been asking about columns that have been empty for the life
-- of the product, and answering "No student preferences yet for this level."
--
-- The window was wrong too, and independently fatal. It filtered
-- enrollments.created_at — the date the student ENROLLED — not the date she
-- expressed the preference. Aya chose Friday 15:00 on 10 September; her
-- enrollment is from 27 March. Even with the columns populated, her choice
-- would have sat outside every window the screen offers.
--
-- Same signature and the same four output columns, so the React component is
-- not touched.

CREATE OR REPLACE FUNCTION public.get_student_preference_trends(days_back integer DEFAULT 30)
RETURNS TABLE(level text, day_of_week integer, preferred_start_time text, request_count integer)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  -- The chosen package IS the preference. Its day and time are read from
  -- schedule_packages rather than from a pair of columns the picker does not
  -- fill. The legacy columns still win where something did fill them, so this
  -- loses nothing if a future flow starts writing them.
  SELECT
    COALESCE(sp.level, spp.level)::text                                   AS level,
    COALESCE(spp.preferred_day_of_week, sp.day_of_week)::int              AS day_of_week,
    COALESCE(spp.preferred_start_time, left(sp.start_time::text, 5))::text AS preferred_start_time,
    -- DISTINCT on the student. The old count was a count of joined rows, so a
    -- student with two enrollments read as two people wanting that slot, and
    -- the whole point of this screen is to decide a schedule from those
    -- numbers.
    COUNT(DISTINCT spp.user_id)::int                                      AS request_count
  FROM public.student_package_preferences spp
  LEFT JOIN public.schedule_packages sp ON sp.id = spp.package_id
  WHERE
    -- When the choice was made, not when the student enrolled.
    COALESCE(spp.updated_at, spp.requested_at) >= now() - make_interval(days => days_back)
    AND COALESCE(spp.preferred_day_of_week, sp.day_of_week) IS NOT NULL
    AND COALESCE(sp.level, spp.level) IS NOT NULL
  GROUP BY 1, 2, 3
  ORDER BY request_count DESC, day_of_week ASC, preferred_start_time ASC;
END;
$function$;

-- Verify it can now return the choice that exists, rather than trusting that
-- it does. Runs as the migration role, so RLS does not narrow it here; the
-- admin's own policy on student_package_preferences already allows the read.
DO $$
DECLARE
  _rows integer;
  _recent integer;
BEGIN
  SELECT count(*) INTO _recent
    FROM public.student_package_preferences spp
    LEFT JOIN public.schedule_packages sp ON sp.id = spp.package_id
   WHERE COALESCE(spp.updated_at, spp.requested_at) >= now() - interval '30 days'
     AND COALESCE(spp.preferred_day_of_week, sp.day_of_week) IS NOT NULL;

  SELECT count(*) INTO _rows FROM public.get_student_preference_trends(30);

  IF _recent > 0 AND _rows = 0 THEN
    RAISE EXCEPTION
      'get_student_preference_trends still returns nothing while % resolvable preference(s) exist in the last 30 days',
      _recent;
  END IF;

  RAISE NOTICE 'preference trends: % row(s) for the last 30 days', _rows;
END;
$$;
