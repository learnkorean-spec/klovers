
-- Trigger: auto-create a lead for every new signup
CREATE OR REPLACE FUNCTION public.handle_new_user_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leads (name, email, source, status)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    NEW.email,
    'signup',
    'new'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop if exists to avoid duplicate
DROP TRIGGER IF EXISTS on_auth_user_created_lead ON auth.users;

CREATE TRIGGER on_auth_user_created_lead
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_lead();
