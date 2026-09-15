-- The book is for the students who confirm — enforced, not promised.
-- 15 September 2026.
--
-- `student-materials` was created public, so the link in the book letter
-- worked forever and for anyone it was forwarded to. send-trial-guide now
-- mints a signed URL per letter (7 days), so the bucket must stop serving
-- anonymous reads.
--
-- Nothing else reads this bucket: it holds only the two trial books, and the
-- only reader is that letter. Signed URLs are generated with the service role
-- inside the edge function, which is unaffected by this change.
--
-- ORDER MATTERS. Apply this only AFTER the new send-trial-guide is deployed
-- (it ships in the same PR, and Deploy Supabase runs on merge). Applied
-- before that, the still-public URLs in the old code would 400 instead of
-- serving the file.
--
-- Do not add a COMMENT on storage.objects here: that table is owned by
-- supabase_storage_admin, so commenting on it raises 42501 and fails the
-- whole migration over a note.

update storage.buckets
   set public = false
 where id = 'student-materials';
