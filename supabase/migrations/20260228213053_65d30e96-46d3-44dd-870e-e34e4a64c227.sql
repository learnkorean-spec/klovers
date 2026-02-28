
CREATE TABLE public.placement_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  score integer NOT NULL,
  level text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.placement_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own placement test"
  ON public.placement_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own placement tests"
  ON public.placement_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all placement tests"
  ON public.placement_tests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX placement_tests_user_id_idx ON public.placement_tests(user_id);
