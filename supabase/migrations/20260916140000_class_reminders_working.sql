-- The day-before reminder for paid group classes, made to actually run.
--
-- Found 16 Sep 2026: send-class-reminders had no cron job, so it never sent.
-- It was also English-only and put one global link (app_settings
-- zoom_meeting_url) in every letter instead of the group's own room.
--
-- This migration gives it:
--   * class_reminder_sends - one row per (session, student), so nobody is
--     reminded twice however often the job runs;
--   * fn_class_reminders_due() - tomorrow's sessions (Cairo) of STARTED
--     groups, one row per seated student not yet reminded, carrying the
--     group's own meeting_url and the letter language (the class language);
--   * an hourly cron at :50. The function itself sends only 09:00-21:59 Cairo.
--
-- Tested on production in a rolled-back transaction: a started group with a
-- session tomorrow returned its student with the group's room; after the
-- stamp, the same student was no longer due.

BEGIN;

CREATE TABLE IF NOT EXISTS public.class_reminder_sends (
  session_id uuid NOT NULL REFERENCES public.pkg_group_sessions(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

ALTER TABLE public.class_reminder_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_reminder_sends_admin_read ON public.class_reminder_sends;
CREATE POLICY class_reminder_sends_admin_read ON public.class_reminder_sends
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.fn_class_reminders_due()
RETURNS TABLE(
  session_id uuid, user_id uuid, session_date date, group_name text,
  start_time text, duration_min int, timezone text, level text,
  meeting_url text, name text, email text, language text,
  unsubscribe_token text, email_unsubscribed boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         m.user_id,
         s.session_date,
         g.name,
         to_char(sp.start_time, 'HH24:MI'),
         sp.duration_min,
         COALESCE(sp.timezone, 'Africa/Cairo'),
         sp.level,
         btrim(g.meeting_url),
         p.name,
         p.email,
         CASE sp.class_language
           WHEN 'arabic'  THEN 'ar'
           WHEN 'english' THEN 'en'
           ELSE COALESCE(NULLIF(p.language, ''), 'ar')
         END,
         p.unsubscribe_token::text,
         COALESCE(p.email_unsubscribed, false)
    FROM public.pkg_group_sessions s
    JOIN public.pkg_groups g         ON g.id = s.group_id
    JOIN public.schedule_packages sp ON sp.id = g.package_id
    JOIN public.pkg_group_members m  ON m.group_id = g.id
                                    AND COALESCE(m.member_status, 'active') = 'active'
    JOIN public.profiles p           ON p.user_id = m.user_id
   WHERE s.session_date = (now() AT TIME ZONE 'Africa/Cairo')::date + 1
     AND g.is_active
     AND g.start_date IS NOT NULL
     AND s.session_date >= g.start_date
     AND COALESCE(btrim(g.meeting_url), '') <> ''
     AND COALESCE(btrim(p.email), '') <> ''
     AND NOT EXISTS (
       SELECT 1 FROM public.class_reminder_sends r
        WHERE r.session_id = s.id AND r.user_id = m.user_id
     );
$$;

REVOKE ALL ON FUNCTION public.fn_class_reminders_due() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_class_reminders_due() TO service_role;

CREATE OR REPLACE FUNCTION public.trigger_class_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  perform app_private.invoke_edge('send-class-reminders', '{"dry_run": false}'::jsonb, true, 60000);
end $function$;

REVOKE ALL ON FUNCTION public.trigger_class_reminders() FROM PUBLIC, anon, authenticated;

do $$
begin
  perform cron.unschedule('class-reminders-hourly');
exception when others then
  null;
end $$;

select cron.schedule(
  'class-reminders-hourly',
  '50 * * * *',
  $cron$select public.trigger_class_reminders()$cron$
);

-- Verify before commit.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'class-reminders-hourly' AND active) THEN
    RAISE EXCEPTION 'Verify failed: class-reminders-hourly not scheduled';
  END IF;
  PERFORM count(*) FROM public.fn_class_reminders_due();
END $$;

COMMIT;
