-- Trial picker matches book-trial's cutoff + where bookings came from (24 Nov 2026)
-- ==================================================================================
--
-- 1. THE PICKER OFFERED CLASSES THE SERVER REFUSES
--    book-trial refuses any trial today or tomorrow ("registrations close 1 day
--    before the class", counted in the slot's zone). get_trial_availability(),
--    which the booking page lists, only required the class to be in the future.
--    So the first option in the list was often one that could not be booked,
--    and the student got "Booking is closed" after filling in the whole form.
--    The same rule is now in the RPC. Every other clause is kept as it was live,
--    SET search_path included.
--
-- 2. v_trial_booking_source
--    Each trial booking matched to the visit that made it (the lead_events
--    session that logged trial_booked_confirmed: by booking_id in metadata from
--    24 Nov 2026, by time before that), then to that visit's first page and its
--    referrer / utm tags. security_invoker, so only admins see rows (both
--    underlying tables are admin-read). Shown in the admin Lead Funnel panel.

CREATE OR REPLACE FUNCTION public.get_trial_availability(p_language text DEFAULT NULL::text)
 RETURNS TABLE(day_of_week integer, start_time text, booked_count bigint, capacity integer, duration_min integer, timezone text, next_trial_date date, class_language text, session_period text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT
    ts.day_of_week,
    ts.start_time,
    COALESCE(COUNT(tb.id), 0) AS booked_count,
    ts.capacity,
    ts.duration_min,
    ts.timezone,
    ts.trial_date AS next_trial_date,
    ts.class_language,
    ts.session_period
  FROM public.trial_slots ts
  LEFT JOIN public.trial_bookings tb
    ON  tb.day_of_week = ts.day_of_week
   AND tb.start_time   = ts.start_time
   AND tb.trial_date   = ts.trial_date
   AND tb.status NOT IN ('cancelled','rejected')
   AND tb.is_tba = false
  WHERE ts.is_active = true
    AND ts.lifecycle  = 'active'
    AND ts.trial_date IS NOT NULL
    AND (ts.trial_date + ts.start_time::time) AT TIME ZONE COALESCE(ts.timezone, 'Asia/Kuala_Lumpur') > now()
    -- Same rule book-trial enforces: registrations close 1 day before the
    -- class, counted in the slot's own zone. Without it the picker offered
    -- today's and tomorrow's classes and book-trial then refused them.
    AND ts.trial_date - (now() AT TIME ZONE COALESCE(ts.timezone, 'Asia/Kuala_Lumpur'))::date > 1
    AND (p_language IS NULL OR ts.class_language IS NULL OR ts.class_language = p_language)
  GROUP BY ts.id, ts.day_of_week, ts.start_time, ts.capacity, ts.duration_min, ts.timezone, ts.trial_date, ts.class_language, ts.session_period
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity
  ORDER BY ts.trial_date, ts.start_time;
$function$;

CREATE OR REPLACE VIEW public.v_trial_booking_source
WITH (security_invoker = true) AS
WITH m AS (
  SELECT DISTINCT ON (b.id)
         b.id AS booking_id, b.created_at AS booked_at, b.status, b.attended, e.session_id
    FROM public.trial_bookings b
    JOIN public.lead_events e
      ON e.cta_label = 'trial_booked_confirmed'
     AND (e.metadata->>'booking_id' = b.id::text
          OR (e.metadata->>'booking_id' IS NULL
              AND e.created_at BETWEEN b.created_at - interval '10 seconds' AND b.created_at + interval '3 minutes'))
   ORDER BY b.id, (e.metadata->>'booking_id' = b.id::text) DESC NULLS LAST,
            abs(extract(epoch FROM e.created_at - b.created_at))
),
f AS (
  SELECT DISTINCT ON (m.booking_id)
         m.*, e.created_at AS first_seen_at, e.source_page AS first_page,
         e.utm_source, e.utm_medium, e.campaign, e.referrer
    FROM m JOIN public.lead_events e ON e.session_id = m.session_id
   ORDER BY m.booking_id, e.created_at
)
SELECT booking_id, booked_at, status, attended, session_id, first_seen_at, first_page,
       utm_source, utm_medium, campaign, referrer,
       CASE
         WHEN nullif(utm_source, '') IS NOT NULL THEN lower(utm_source) || COALESCE(' / ' || nullif(utm_medium, ''), '')
         WHEN referrer ILIKE '%google.%'    THEN 'google (organic)'
         WHEN referrer ILIKE '%bing.%'      THEN 'bing (organic)'
         WHEN referrer ~* '(facebook|fb\.|instagram)' THEN 'facebook / instagram'
         WHEN referrer ILIKE '%threads.%'   THEN 'threads'
         WHEN referrer ILIKE '%t.me%' OR referrer ILIKE '%telegram%' THEN 'telegram'
         WHEN referrer ILIKE '%chatgpt%' OR referrer ILIKE '%openai%' THEN 'chatgpt'
         WHEN referrer IS NULL OR referrer = '' THEN 'direct'
         ELSE split_part(split_part(referrer, '//', 2), '/', 1)
       END AS source,
       CASE WHEN first_page ~ '^/(ar/)?blog/' THEN 'blog article'
            WHEN first_page = '/' THEN 'homepage'
            ELSE first_page END AS first_page_kind
  FROM f;

COMMENT ON VIEW public.v_trial_booking_source IS
  'Where each trial booking came from: the booking is matched to the lead_events session that logged trial_booked_confirmed (by booking_id in metadata from 24 Nov 2026, by time before that), then to that session''s first event. Unmatched bookings are absent.';
REVOKE ALL ON public.v_trial_booking_source FROM anon;
GRANT SELECT ON public.v_trial_booking_source TO authenticated;
