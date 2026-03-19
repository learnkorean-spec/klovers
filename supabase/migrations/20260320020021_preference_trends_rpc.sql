-- Create RPC function to get student preference trends
-- Groups student preferences by level, day, and time for the last N days

CREATE OR REPLACE FUNCTION get_student_preference_trends(days_back int DEFAULT 30)
RETURNS TABLE (
  level text,
  day_of_week int,
  preferred_start_time text,
  request_count int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.level,
    spp.preferred_day_of_week as day_of_week,
    spp.preferred_start_time,
    COUNT(*)::int as request_count
  FROM enrollments e
  LEFT JOIN student_package_preferences spp ON e.user_id = spp.user_id
  WHERE
    spp.preferred_day_of_week IS NOT NULL
    AND spp.preferred_start_time IS NOT NULL
    AND e.created_at >= now() - (days_back || ' days')::interval
  GROUP BY
    e.level,
    spp.preferred_day_of_week,
    spp.preferred_start_time
  ORDER BY
    request_count DESC,
    day_of_week ASC,
    preferred_start_time ASC;
END;
$$ LANGUAGE plpgsql;
