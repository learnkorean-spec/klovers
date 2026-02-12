
CREATE OR REPLACE FUNCTION public.add_credits(_user_id uuid, _amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_credits INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  UPDATE public.profiles
  SET credits = credits + _amount, status = 'ACTIVE'
  WHERE user_id = _user_id
  RETURNING credits INTO result_credits;

  RETURN result_credits;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_credit(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  UPDATE public.profiles
  SET credits = credits - 1
  WHERE user_id = _user_id AND credits > 0
  RETURNING credits INTO new_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  RETURN new_credits;
END;
$$;
