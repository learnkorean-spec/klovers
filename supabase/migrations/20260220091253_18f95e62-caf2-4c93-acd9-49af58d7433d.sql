
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _reset_version text;
BEGIN
  -- Get current reset version
  SELECT value INTO _reset_version FROM public.app_settings WHERE key = 'app_reset_version';

  INSERT INTO public.profiles (user_id, name, email, country, level, reset_version)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'level', ''),
    COALESCE(_reset_version, '1')
  );
  RETURN NEW;
END;
$$;
