-- The placement test used to end in nothing.
--
-- Someone answered every question, saw a level on the screen, and that was the
-- end of it: no letter, no times, no way back in. Twenty-nine tests have been
-- taken and not one produced an email. This closes that: the moment a result is
-- written, the student gets the level, the times of the group at that level, and
-- one link that books the seat.
--
-- Three guards, each for a thing that would otherwise go wrong:
--
--  1. ADMINS ARE SKIPPED. admin@klovers.com holds 8 test rows from checking the
--     test itself. Without this guard, turning the feature on would email Re
--     eight times about her own trial runs, and every future check would email
--     her again.
--  2. A LEVEL WITH NO GROUP DOES NOT GET A BOOKING BUTTON. Levels 4-6 have no
--     schedule_packages row. The letter says so plainly and promises a personal
--     message, and an admin notification is raised in the same transaction so
--     that promise is one Re actually sees.
--  3. ONE LETTER PER RESULT, AND NOT TWICE IN AN HOUR. result_email_sent_at
--     records the send; a second row for the same student within the hour (a
--     double submit) is ignored.

ALTER TABLE public.placement_tests
  ADD COLUMN IF NOT EXISTS result_email_sent_at timestamptz;

COMMENT ON COLUMN public.placement_tests.result_email_sent_at IS
  'When the placement-result email went out for this row. NULL means it did not '
  'send - either the student has no email, or they are an admin, or the trigger '
  'had not shipped yet. Set by email_student_on_placement_result.';

CREATE OR REPLACE FUNCTION public.email_student_on_placement_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile   RECORD;
  _lang      TEXT;
  _sched_key TEXT;
  _dows      integer[];
  _time      TEXT;
  _tz        TEXT;
  _needs     BOOLEAN;
  _recent    BOOLEAN;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  -- Guard 1: Re's own test runs must not become mail to Re.
  IF public.has_role(NEW.user_id, 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT name, email, timezone, country, phone, language
    INTO _profile
    FROM public.profiles
   WHERE user_id = NEW.user_id;

  IF _profile.email IS NULL OR _profile.email = '' THEN RETURN NEW; END IF;

  -- Guard 3: a double submit is one result, not two letters.
  SELECT EXISTS (
    SELECT 1 FROM public.placement_tests pt
     WHERE pt.user_id = NEW.user_id
       AND pt.id <> NEW.id
       AND pt.result_email_sent_at > NOW() - INTERVAL '1 hour'
  ) INTO _recent;
  IF _recent THEN RETURN NEW; END IF;

  -- schedule_packages still spells the levels the pre-2026-04 way, while the
  -- placement test writes the canonical keys. Map rather than assume.
  _sched_key := CASE lower(COALESCE(NEW.level, ''))
    WHEN 'l1' THEN 'level_1' WHEN 'l2' THEN 'level_2' WHEN 'l3' THEN 'level_3'
    WHEN 'l4' THEN 'level_4' WHEN 'l5' THEN 'level_5' WHEN 'l6' THEN 'level_6'
    ELSE lower(COALESCE(NEW.level, ''))
  END;

  SELECT array_agg(sp.day_of_week ORDER BY sp.day_of_week),
         to_char(min(sp.start_time), 'HH24:MI'),
         min(sp.timezone)
    INTO _dows, _time, _tz
    FROM public.schedule_packages sp
   WHERE sp.level = _sched_key
     AND sp.is_active
     AND COALESCE(sp.course_type, 'group') = 'group';

  _lang := CASE WHEN _profile.language = 'en' THEN 'en' ELSE 'ar' END;

  _needs := _profile.phone IS NULL OR _profile.phone = ''
         OR _profile.timezone IS NULL OR _profile.timezone = ''
         OR _profile.country IS NULL OR _profile.country = '';

  PERFORM app_private.invoke_edge(
    'send-confirmation-email',
    jsonb_build_object(
      'template',        'placement_result',
      'email',           _profile.email,
      'name',            _profile.name,
      'language',        _lang,
      'level',           COALESCE(NEW.level, ''),
      'slot_level',      COALESCE(NEW.level, ''),
      'group_days_dow',  COALESCE(to_jsonb(_dows), '[]'::jsonb),
      'group_time',      COALESCE(_time, ''),
      'group_timezone',  COALESCE(_tz, 'Africa/Cairo'),
      'needs_profile',   _needs
    )
  );

  UPDATE public.placement_tests
     SET result_email_sent_at = NOW()
   WHERE id = NEW.id;

  -- Guard 2's other half: the promise of a personal message is only worth
  -- making if it lands somewhere Re reads.
  IF _dows IS NULL OR array_length(_dows, 1) IS NULL THEN
    INSERT INTO public.admin_notifications (message, type, related_user_id)
    VALUES (
      COALESCE(_profile.name, _profile.email) || ' finished the placement test at '
        || COALESCE(NEW.level, '?') || ' - no group runs at that level. '
        || 'The email promised a personal message.',
      'warning',
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_student_on_placement_result ON public.placement_tests;
CREATE TRIGGER trg_email_student_on_placement_result
AFTER INSERT ON public.placement_tests
FOR EACH ROW EXECUTE FUNCTION public.email_student_on_placement_result();

-- ---------------------------------------------------------------------------
-- Verify, rather than assume
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  _admin_rows integer;
  _levels     integer;
BEGIN
  -- Nothing already in the table may be treated as sent.
  IF EXISTS (SELECT 1 FROM public.placement_tests WHERE result_email_sent_at IS NOT NULL) THEN
    RAISE EXCEPTION 'result_email_sent_at should be NULL on every existing row';
  END IF;

  -- The admin guard has to be doing real work: if this is 0, the guard was
  -- written for a case that does not exist and something else is wrong.
  SELECT count(*) INTO _admin_rows
    FROM public.placement_tests pt
   WHERE public.has_role(pt.user_id, 'admin');
  IF _admin_rows = 0 THEN
    RAISE WARNING 'no admin placement rows found - expected Re''s own test runs';
  END IF;

  SELECT count(DISTINCT level) INTO _levels FROM public.schedule_packages WHERE is_active;
  RAISE NOTICE 'placement-result email armed; % admin row(s) will be skipped; % active level(s) have a group',
    _admin_rows, _levels;
END;
$$;
