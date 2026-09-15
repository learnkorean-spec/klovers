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

update storage.buckets
   set public = false
 where id = 'student-materials';

comment on table storage.objects is
  'Storage objects. Note: the student-materials bucket is PRIVATE by design - the trial book is delivered as a 7-day signed URL minted per letter by send-trial-guide. Making it public again would hand the book to anyone a link is forwarded to.';
