-- A) Add user_id to leads + indexes
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS leads_email_lower_idx ON public.leads(lower(email));

-- B) Ensure enrollments.user_id is NOT NULL + index
ALTER TABLE public.enrollments ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS enrollments_user_id_idx ON public.enrollments(user_id);

-- C) Ensure profiles.user_id is unique and indexed
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_uq ON public.profiles(user_id);

-- D) RLS: allow authenticated users to update their own lead (for attach)
CREATE POLICY "Users can update own lead by email"
  ON public.leads FOR UPDATE
  USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())))
  WITH CHECK (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

-- E) Allow users to read their own lead
CREATE POLICY "Users can view own lead"
  ON public.leads FOR SELECT
  USING (user_id = auth.uid());