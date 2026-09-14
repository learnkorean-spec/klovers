-- profiles.language was never a fact. It was a default.
--
-- All 107 profiles carry language = 'ar'. Not one row differs, because nothing
-- in the product ever writes the column: handle_new_user does not read it from
-- the signup metadata, and no screen sets it afterwards. Every letter that
-- chooses its language from profiles.language has therefore gone out in Arabic
-- to everybody, including the students on the English track.
--
-- That was found on 14 Sep while sending the placement-result backlog. Eighteen
-- letters had to be sent by hand, bypassing the trigger, because the trigger
-- would have sent Arabic to thirteen people Klovers has no reason to believe
-- read Arabic.
--
-- This closes it in three places:
--
--   1. SIGNUP RECORDS WHAT THEY WERE READING. SignUpPage already holds the UI
--      language in scope; it now passes it, and handle_new_user stores it.
--      Only 'ar' and 'en' are accepted - anything else falls back to 'ar', so a
--      stray metadata value cannot poison the column.
--   2. THE PLACEMENT LETTER PREFERS A REAL CHOICE. A trial booking carries
--      class_language, which the person picked themselves. That outranks a
--      profile column that may still be sitting on its default.
--   3. THE EXISTING ROWS ARE BACKFILLED from that same booking choice, so the
--      people already in the database stop being mislabelled.
--
-- Nothing here guesses a language from a name or a country. Where there is no
-- signal, the row keeps 'ar' and the decision stays with a human.

-- ---------------------------------------------------------------------------
-- 1. Signup stores the language, the same way it already stores level/country
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _reset_version text;
  _language      text;
BEGIN
  SELECT value INTO _reset_version FROM public.app_settings WHERE key = 'app_reset_version';

  -- Two known values only. An unrecognised one is not a language, it is noise.
  _language := CASE lower(COALESCE(NEW.raw_user_meta_data->>'language', ''))
                 WHEN 'en' THEN 'en'
                 WHEN 'ar' THEN 'ar'
                 ELSE 'ar'
               END;

  INSERT INTO public.profiles (user_id, name, email, country, level, reset_version, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'level', ''),
    COALESCE(_reset_version, '1'),
    _language
  );
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN public.profiles.language IS
  'Which language this person reads Klovers in: ''ar'' or ''en''. Written at '
  'signup from the UI language, and backfilled from trial_bookings.class_language '
  'where one exists. Before 2026-09-14 nothing wrote it and every row held the '
  '''ar'' default - do not trust rows created before then that have no booking.';

-- ---------------------------------------------------------------------------
-- 2. The placement letter prefers the language the student chose for a class
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_student_on_placement_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile   RECORD;
  _lang      TEXT;
  _booked    TEXT;
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

  -- The language the student picked for a trial class is a choice they made.
  -- profiles.language may still be sitting on its default, so the choice wins.
  SELECT tb.class_language
    INTO _booked
    FROM public.trial_bookings tb
   WHERE lower(tb.email) = lower(_profile.email)
     AND tb.class_language IS NOT NULL
   ORDER BY tb.created_at DESC
   LIMIT 1;

  _lang := CASE
             WHEN _booked = 'english'      THEN 'en'
             WHEN _booked = 'arabic'       THEN 'ar'
             WHEN _profile.language = 'en' THEN 'en'
             ELSE 'ar'
           END;

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

-- ---------------------------------------------------------------------------
-- 3. Backfill from the only real signal in the data
-- ---------------------------------------------------------------------------
UPDATE public.profiles p
   SET language = b.lang
  FROM (
    SELECT DISTINCT ON (lower(tb.email))
           lower(tb.email) AS email,
           CASE tb.class_language WHEN 'english' THEN 'en' ELSE 'ar' END AS lang
      FROM public.trial_bookings tb
     WHERE tb.class_language IS NOT NULL
     ORDER BY lower(tb.email), tb.created_at DESC
  ) b
 WHERE lower(p.email) = b.email
   AND COALESCE(p.language, '') IS DISTINCT FROM b.lang;

-- ---------------------------------------------------------------------------
-- Verify, rather than assume
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  _en       integer;
  _total    integer;
  _bad      integer;
BEGIN
  SELECT count(*) INTO _total FROM public.profiles;
  SELECT count(*) INTO _en FROM public.profiles WHERE language = 'en';

  -- Before this migration the answer was 0 out of 107. If it is still 0 the
  -- backfill matched nothing and the join is wrong, not the data.
  IF _en = 0 THEN
    RAISE EXCEPTION 'backfill set no English profiles - the email join did not match';
  END IF;

  SELECT count(*) INTO _bad
    FROM public.profiles
   WHERE language IS NOT NULL AND language NOT IN ('ar', 'en');
  IF _bad > 0 THEN
    RAISE EXCEPTION '% profile(s) hold a language that is neither ar nor en', _bad;
  END IF;

  RAISE NOTICE 'profiles.language is real now: % of % read English', _en, _total;
END;
$$;
