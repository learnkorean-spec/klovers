-- The website's display language decides. Nothing else.
--
-- #376 (an hour ago) made profiles.language real for the first time, and while
-- doing it let trial_bookings.class_language outrank the profile inside the
-- placement trigger. That was wrong, and Re said so: class_language is the
-- language a class is TAUGHT in. It is not the language the student reads.
-- Someone can sit an Arabic-taught class and read the site in English, or the
-- reverse, and the letter must follow what they read.
--
-- So the trigger goes back to profiles.language and only profiles.language -
-- which is now safe, because #376 made that column carry a real answer instead
-- of a default, and the frontend half of this change keeps it current when a
-- signed-in person switches the site language.
--
-- The backfill #376 performed from class_language stays. It is the best answer
-- available for people who signed up before the display language was ever
-- recorded, and the moment any of them switches the site while signed in, their
-- own choice replaces it.

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
  _times     text[];
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

  -- Two arrays in the SAME order: day N in _dows is at time N in _times. Each
  -- pair is one weekly slot the student may CHOOSE; they are alternatives, not
  -- a schedule to attend in full.
  SELECT array_agg(sp.day_of_week ORDER BY sp.day_of_week),
         array_agg(to_char(sp.start_time, 'HH24:MI') ORDER BY sp.day_of_week),
         to_char(min(sp.start_time), 'HH24:MI'),
         min(sp.timezone)
    INTO _dows, _times, _time, _tz
    FROM public.schedule_packages sp
   WHERE sp.level = _sched_key
     AND sp.is_active
     AND COALESCE(sp.course_type, 'group') = 'group';

  -- The display language, and nothing else. The language a CLASS is taught in
  -- is deliberately not consulted here: it says how the lesson is delivered,
  -- not which language this person reads. Do not reintroduce it.
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
      'group_times',     COALESCE(to_jsonb(_times), '[]'::jsonb),
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

COMMENT ON COLUMN public.profiles.language IS
  'The language this person is shown Klovers in, and therefore the language '
  'Klovers writes to them in: ''ar'' or ''en''. Written at signup from the UI '
  'language and rewritten whenever a signed-in person switches the site. Seeded '
  'on 2026-09-14 from the trial booking for accounts that predate the '
  'recording. Nothing infers it from a name or a country.';

-- ---------------------------------------------------------------------------
-- Verify, rather than assume
--
-- The first version of this block searched pg_get_functiondef() for the name of
-- the column that must no longer be read - and failed, because that function
-- returns the source INCLUDING comments, and the comment above _lang names the
-- column in the course of saying not to use it. The guard matched the sentence
-- explaining the guard.
--
-- Comments are stripped before the check, so it reads the code and not the
-- prose. The column name is assembled rather than written literally, so this
-- block cannot match itself either.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  _def  text;
  _code text;
  _col  text := 'class' || '_language';
  _bad  integer;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO _def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'email_student_on_placement_result';

  IF _def IS NULL THEN
    RAISE EXCEPTION 'email_student_on_placement_result does not exist';
  END IF;

  _code := regexp_replace(_def, '--[^' || chr(10) || ']*', '', 'g');

  IF position(_col IN _code) > 0 THEN
    RAISE EXCEPTION 'the placement trigger still reads the class language column';
  END IF;
  IF position('_profile.language' IN _code) = 0 THEN
    RAISE EXCEPTION 'the placement trigger no longer reads profiles.language';
  END IF;

  SELECT count(*) INTO _bad
    FROM public.profiles
   WHERE language IS NOT NULL AND language NOT IN ('ar', 'en');
  IF _bad > 0 THEN
    RAISE EXCEPTION '% profile(s) hold a language that is neither ar nor en', _bad;
  END IF;

  RAISE NOTICE 'the display language decides; the booking no longer does';
END;
$$;
