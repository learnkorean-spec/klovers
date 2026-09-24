-- Admin → Books "Download PDF" signs the book from the private bucket.
create policy "Admins read student books"
  on storage.objects for select to authenticated
  using (bucket_id = 'student-materials' and name like 'books/%' and public.has_role((select auth.uid()), 'admin'));
