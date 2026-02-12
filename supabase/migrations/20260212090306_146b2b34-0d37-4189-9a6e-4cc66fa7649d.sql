
-- Fix 1: Make receipts bucket private
UPDATE storage.buckets SET public = false WHERE id = 'receipts';

-- Fix 2: Drop overly permissive storage policy
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;

-- Fix 3: Add scoped storage policies
CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 4: Revoke anon access to profiles and enrollments
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.enrollments FROM anon;
