-- Fix: "Users can update own lead by email" policy was querying auth.users
-- directly, which the authenticated role cannot access, causing 42501 on every
-- leads UPDATE (including admin edits because ALL UPDATE policies are evaluated).
-- Replace the subquery with auth.email() which reads the email from the JWT.

DROP POLICY IF EXISTS "Users can update own lead by email" ON public.leads;

CREATE POLICY "Users can update own lead by email"
  ON public.leads FOR UPDATE
  USING  (lower(email) = lower(auth.email()))
  WITH CHECK (lower(email) = lower(auth.email()));
