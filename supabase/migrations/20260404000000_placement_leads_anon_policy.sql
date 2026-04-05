-- Allow anonymous users to submit leads from the placement test
CREATE POLICY "Anon can submit placement leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (source = 'placement_test');
