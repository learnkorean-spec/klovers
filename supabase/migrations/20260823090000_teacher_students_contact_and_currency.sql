-- Bundles & credits, part 1 of 2: what the student card needs to know about a
-- person before it can price anything for them.
--
-- Three nullable columns on teacher_students. Nothing is written here, nothing
-- existing is altered, and the My Students tab keeps working unchanged if this
-- is applied before the UI ships -- a nullable column no query selects is
-- invisible.
--
-- Why country and currency are separate
-- -------------------------------------
-- Country decides the *default* currency and the *default* catalogue price.
-- It never forces either. A student living in Saudi Arabia may still have
-- agreed to pay in EGP, and that agreement is a fact about the bundle, not a
-- fact about the country. So currency is stored, defaulted from country at the
-- point of entry, and always overridable.
--
-- Country is deliberately unconstrained
-- -------------------------------------
-- The list of countries lives in src/components/PricingSection.tsx (31 of them,
-- each with its own currency and its own group/private price arrays). Adding a
-- CHECK here would mean a migration every time that list grows, and the two
-- would drift the first time someone forgot. The UI offers the list; the
-- database stores what it is given.

BEGIN;

ALTER TABLE public.teacher_students
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS country     text,
  ADD COLUMN IF NOT EXISTS currency    text;

-- A pasted link that is not a link is worth catching at the point of paste
-- rather than at the point of a student staring at a dead button. Only the
-- scheme is checked: Teams, Meet and Zoom URLs share nothing else, and guessing
-- at their shapes would reject a valid link the day one of them changes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teacher_students_meeting_url_check'
  ) THEN
    ALTER TABLE public.teacher_students
      ADD CONSTRAINT teacher_students_meeting_url_check
      CHECK (meeting_url IS NULL OR meeting_url ~ '^https://[^[:space:]]+$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teacher_students_currency_check'
  ) THEN
    ALTER TABLE public.teacher_students
      ADD CONSTRAINT teacher_students_currency_check
      CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teacher_students_country_check'
  ) THEN
    ALTER TABLE public.teacher_students
      ADD CONSTRAINT teacher_students_country_check
      CHECK (country IS NULL OR length(btrim(country)) > 0);
  END IF;
END
$$;

COMMENT ON COLUMN public.teacher_students.meeting_url IS
  'Stable per-student meeting room (Teams/Meet/Zoom). Distinct from '
  'app_settings.zoom_meeting_url, which is the single shared link the group '
  'system uses, and from trial_slots.meeting_url, which belongs to a trial.';
COMMENT ON COLUMN public.teacher_students.country IS
  'Matches a key in the country price table in src/components/PricingSection.tsx '
  '(e.g. "Egypt", "Saudi Arabia"). Drives the default currency and the default '
  'catalogue prices offered when adding a bundle. Not constrained here: the '
  'authoritative list lives in code and would drift from a CHECK.';
COMMENT ON COLUMN public.teacher_students.currency IS
  'ISO 4217, e.g. EGP, SAR, MYR. Defaulted from country when the student is '
  'entered, then overridable -- what they actually pay in is an agreement, not '
  'a lookup. Amounts are always recorded as paid and never converted.';

COMMIT;
