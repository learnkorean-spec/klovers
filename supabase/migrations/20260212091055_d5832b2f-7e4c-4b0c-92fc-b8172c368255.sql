
-- Atomic credit management functions to prevent race conditions

-- Function to add credits atomically
CREATE OR REPLACE FUNCTION public.add_credits(
  _user_id UUID,
  _amount INTEGER
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET credits = credits + _amount, status = 'ACTIVE'
  WHERE user_id = _user_id
  RETURNING credits;
$$;

-- Function to deduct credits atomically with validation
CREATE OR REPLACE FUNCTION public.deduct_credit(
  _user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
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
