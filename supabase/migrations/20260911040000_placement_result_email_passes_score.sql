-- The placement-result email now explains the level instead of only naming it:
--
--   الدرجة: ٢٣
--   خط المستوى التاني: ١٨ — اتعدّى
--   خط المستوى التالت: ٢٨ — فاضل ٥
--
-- which needs the one thing the trigger was not sending: the score. The
-- thresholds themselves live in the template (mirrored from
-- src/constants/topikPapers.ts and guarded by
-- scripts/lib/placement-bands.test.mjs), because they are product policy rather
-- than data — nothing in the database knows that 18 is where 1급 ends.
--
-- Everything else about this function is unchanged from
-- 20260910210000_placement_result_email.sql: the admin guard, the no-group
-- branch and its admin notification, the double-submit window, and the level
-- key mapping. Reproduced in full because CREATE OR REPLACE takes a whole body.

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
      'score',           NEW.score,
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

-- ---------------------------------------------------------------------------
-- Verify, rather than assume
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  _src text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'trg_email_student_on_placement_result'
       AND tgrelid = 'public.placement_tests'::regclass
  ) THEN
    RAISE EXCEPTION 'the placement-result trigger is missing - 20260910210000 did not apply';
  END IF;

  -- CREATE OR REPLACE silently accepts a body that forgot the whole point of
  -- this migration. Check the one line it exists to add.
  SELECT prosrc INTO _src FROM pg_proc WHERE oid = 'public.email_student_on_placement_result'::regproc;
  IF _src NOT LIKE '%''score''%' THEN
    RAISE EXCEPTION 'the trigger still does not send the score';
  END IF;

  RAISE NOTICE 'placement-result trigger now sends the score';
END;
$$;
