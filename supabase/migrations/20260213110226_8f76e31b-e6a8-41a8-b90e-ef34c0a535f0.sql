
CREATE OR REPLACE FUNCTION public.add_credits(_user_id uuid, _amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result_credits INTEGER;
  _email TEXT;
  _name TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Try to update existing profile
  UPDATE public.profiles
  SET credits = credits + _amount, status = 'ACTIVE'
  WHERE user_id = _user_id
  RETURNING credits INTO result_credits;

  -- If no profile exists, create one from auth.users
  IF NOT FOUND THEN
    SELECT u.email, COALESCE(u.raw_user_meta_data->>'name', '') 
      INTO _email, _name
      FROM auth.users u WHERE u.id = _user_id;

    IF _email IS NULL THEN
      RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO public.profiles (user_id, name, email, credits, status)
    VALUES (_user_id, _name, _email, _amount, 'ACTIVE')
    RETURNING credits INTO result_credits;
  END IF;

  RETURN result_credits;
END;
$function$;
