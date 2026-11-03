-- Allow admins to upload/replace the teaching/store book PDFs through the
-- admin UI instead of the Supabase dashboard only. student-materials had
-- SELECT policies for admins and assigned students, but no INSERT/UPDATE at
-- all, so even an authenticated admin could not upload via the client SDK -
-- the dashboard was the only route. Mirrors the existing
-- "Admins can upload/update blog images" pattern already used for the
-- blog-images and marketing-images buckets.
--
-- Applied directly via the Supabase MCP tool on 3 Nov 2026 with Re's
-- explicit approval (production DB change); this file documents it for the
-- migration history, which the project's own CLAUDE.md already notes has
-- diverged from what's actually live.

create policy "Admins can upload student books"
  on storage.objects for insert
  with check (
    bucket_id = 'student-materials'
    and name like 'books/%'
    and has_role((select auth.uid()), 'admin'::app_role)
  );

create policy "Admins can update student books"
  on storage.objects for update
  using (
    bucket_id = 'student-materials'
    and name like 'books/%'
    and has_role((select auth.uid()), 'admin'::app_role)
  );

-- Some books (e.g. Level 2, 24 fully-illustrated lessons) exceed the
-- bucket's previous 25MB file limit. Raised to 50MB.
update storage.buckets
set file_size_limit = 52428800
where id = 'student-materials';
