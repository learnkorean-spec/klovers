-- Allow users to update (replace) their own receipts
CREATE POLICY "Users can update own receipts"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);
