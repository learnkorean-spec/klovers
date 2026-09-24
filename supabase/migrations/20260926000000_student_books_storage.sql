-- Students download their assigned book PDFs from the private
-- `student-materials` bucket (dashboard "My books" card, 25 Sep 2026).
--
-- A student may read (and therefore sign a download link for) an object under
-- books/ ONLY if a book_assignments row gives her that exact book and its
-- available_from has passed. Everything else in the bucket (the trial guides)
-- stays service-role only, exactly as before.

drop policy if exists "Students read their assigned books" on storage.objects;

create policy "Students read their assigned books"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'student-materials'
    and name like 'books/%'
    and exists (
      select 1
      from public.book_assignments ba
      where ba.user_id = (select auth.uid())
        and ba.available_from <= now()
        and storage.objects.name = 'books/' || ba.book_id || '.pdf'
    )
  );
