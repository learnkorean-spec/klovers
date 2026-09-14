-- A group class's language of instruction lived in a group's NAME.
--
-- `trial_slots` has carried `class_language` since 20260517000002, and the
-- whole trial funnel reads it: sessions are Arabic or English, students are
-- invited to the right one, and the confirmation letter is written in it.
--
-- `schedule_packages` -- the group classes people actually pay for -- had
-- nothing. The only place the fact existed anywhere was `pkg_groups.name`:
--
--     Hangul · Arabic track · Friday 15:00 Cairo
--     Hangul · English track · Saturday 15:00 Cairo
--
-- Two rows out of eight, in a free-text label. Nothing read it. Nothing
-- enforced it. No screen showed it. And a name is one edit away from gone.
--
-- IT NEARLY WENT. Earlier today those two names were made neutral, so that the
-- two Hangul days would read as two times to choose between rather than two
-- different classes -- which is what Re asked for, and right. But the rename
-- also erased the only record anywhere that the Saturday class is taught in a
-- different language. A fact that only one name is holding is a fact already
-- half lost.
--
-- So: the column trial slots already have, on the table that was missing it,
-- with the Saturday Hangul value restored from what its name said before the
-- rename.
--
-- WHAT THIS DOES NOT DO. It does not make anything behave differently yet --
-- no letter picks its language from here, no picker filters on it. That is
-- deliberate: the value has to be right before anything depends on it, and
-- only Re knows whether Saturday Hangul is genuinely taught in English. The
-- Class Rooms card shows it so she can see and correct it. Wiring it into the
-- letters is the next change, not this one.

ALTER TABLE public.schedule_packages
  ADD COLUMN IF NOT EXISTS class_language text NOT NULL DEFAULT 'arabic';

ALTER TABLE public.schedule_packages
  DROP CONSTRAINT IF EXISTS schedule_packages_class_language_check;

ALTER TABLE public.schedule_packages
  ADD CONSTRAINT schedule_packages_class_language_check
  CHECK (class_language IN ('arabic', 'english'));

COMMENT ON COLUMN public.schedule_packages.class_language IS
  'The language this group class is TAUGHT in: ''arabic'' or ''english''. Not '
  'the language a student reads the site in - that is profiles.language, and '
  'the two can differ. Mirrors trial_slots.class_language. Before 2026-09-14 '
  'this fact lived only in pkg_groups.name and nothing read it.';

-- Restore the one non-default value from what the group name carried before it
-- was renamed. Matched on the package, not on the name, because the name has
-- already changed.
UPDATE public.schedule_packages
   SET class_language = 'english'
 WHERE id = '47fc7416-2309-4001-8485-3eb207b645d9'
   AND class_language <> 'english';

-- ---------------------------------------------------------------------------
-- Verify, rather than assume
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  _total   integer;
  _english integer;
  _bad     integer;
BEGIN
  SELECT count(*) INTO _total FROM public.schedule_packages;
  SELECT count(*) INTO _english FROM public.schedule_packages WHERE class_language = 'english';

  SELECT count(*) INTO _bad
    FROM public.schedule_packages
   WHERE class_language NOT IN ('arabic', 'english');
  IF _bad > 0 THEN
    RAISE EXCEPTION '% package(s) hold a language that is neither arabic nor english', _bad;
  END IF;

  -- The Saturday Hangul row is the whole reason this migration exists. If the
  -- restore matched nothing, the column has been added and the fact it was
  -- added to hold has still been lost - which is worse than not shipping, so
  -- it fails instead.
  IF _english = 0 THEN
    RAISE EXCEPTION
      'the Saturday Hangul package was not found - the one non-default value did not restore';
  END IF;

  RAISE NOTICE 'schedule_packages.class_language is real: % of % taught in English', _english, _total;
END;
$$;
