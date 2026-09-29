-- 30 Sep 2026. Content fix for the English Joseon post (dashboard item
-- scan48-joseon-en-capital-year). Companion to #749 (Arabic post).
--
-- Fact: the capital moved to Hanseong (Seoul) in 1394, not 1393. The Joseon
-- journey station already says 1394 (#734). The live English post reads:
-- "In 1393 the capital moved to Hanseong, which is modern Seoul."
--
-- Data-only. The replace only touches "1393" when it is directly followed by
-- "the capital moved", so no other year in the post can change, and re-running
-- is a no-op. If the live wording differs, nothing changes and a WARNING is
-- logged (deliberately not an exception, so it cannot block other pending
-- migrations in the same Apply run).

update public.blog_posts
   set content = regexp_replace(content,
         '1393(\s+the\s+capital\s+moved)',
         '1394\1',
         'g')
 where slug = 'joseon-dynasty-kings-and-scholars'
   and content ~ '1393\s+the\s+capital\s+moved';

do $$
begin
  if exists (select 1 from public.blog_posts
              where slug = 'joseon-dynasty-kings-and-scholars'
                and content ~ '1393') then
    raise warning 'joseon-dynasty-kings-and-scholars still mentions 1393 - check the capital sentence by hand';
  end if;
end $$;
