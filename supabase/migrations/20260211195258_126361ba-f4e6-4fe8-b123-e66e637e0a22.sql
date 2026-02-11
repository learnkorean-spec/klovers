
-- Drop existing RESTRICTIVE policies on leads
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;

-- Drop existing RESTRICTIVE policy on user_roles
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;

-- Recreate as PERMISSIVE policies scoped to authenticated users with admin role
CREATE POLICY "Admins can view leads"
ON public.leads FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Also add INSERT policy for anon to allow lead form submissions from public site
CREATE POLICY "Anyone can submit leads"
ON public.leads FOR INSERT
TO anon
WITH CHECK (true);
