-- 30 Sep 2026. Content fix for the Arabic Joseon post (dashboard item
-- scan47-joseon-ar-capital-year).
--
-- Fact: the capital moved to Hanseong (Seoul) in 1394, not 1393. The Joseon
-- journey station already says 1394 (fixed in #734); the Arabic blog post
-- still says "وفي عام 1393 انتقلت العاصمة إلى هانسونغ".
--
-- Data-only. The replace only touches "1393" when it is directly followed by
-- "انتقلت العاصمة", so no other year in the post can change, and re-running
-- is a no-op. If the live wording differs, nothing changes and a WARNING is
-- logged (deliberately not an exception, so it cannot block other pending
-- migrations in the same Apply run).

update public.blog_posts
   set content = regexp_replace(content,
         '(1393|١٣٩٣)(\s+انتقلت\s+العاصمة)',
         '1394\2',
         'g')
 where slug = 'joseon-dynasty-kings-and-scholars-ar'
   and content ~ '(1393|١٣٩٣)\s+انتقلت\s+العاصمة';

do $$
begin
  if exists (select 1 from public.blog_posts
              where slug = 'joseon-dynasty-kings-and-scholars-ar'
                and content ~ '(1393|١٣٩٣)') then
    raise warning 'joseon-dynasty-kings-and-scholars-ar still mentions 1393 - check the capital sentence by hand';
  end if;
end $$;
