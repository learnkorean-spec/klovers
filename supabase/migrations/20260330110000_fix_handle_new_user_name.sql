-- Fix handle_new_user: read full_name (what SignUpPage sends) instead of name
-- Backfill existing empty names from auth metadata
-- Add name_reminder_sent_at column for deduplication

-- 1. Add dedup column for name collection emails
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name_reminder_sent_at timestamptz;

-- 2. Fix the trigger: COALESCE(full_name, name) matches SignUpPage's metadata key
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _reset_version text;
BEGIN
  SELECT value INTO _reset_version FROM public.app_settings WHERE key = 'app_reset_version';

  INSERT INTO public.profiles (user_id, name, email, country, level, reset_version)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'level', ''),
    COALESCE(_reset_version, '1')
  );
  RETURN NEW;
END;
$$;

-- 3. One-time backfill: pull full_name from auth metadata for all empty profile names
UPDATE public.profiles p
SET    name = trim(u.raw_user_meta_data->>'full_name')
FROM   auth.users u
WHERE  p.user_id = u.id
  AND  (p.name IS NULL OR trim(p.name) = '')
  AND  trim(COALESCE(u.raw_user_meta_data->>'full_name', '')) <> '';
