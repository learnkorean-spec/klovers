-- 30 Sep 2026. Content fix for the Arabic body-parts post
-- (dashboard item scan64-bodyparts-ar-batn).
--
-- The example 배가 아파요. is translated «بطني تؤلمني». بطن is masculine, so
-- the verb agrees in the masculine: «بطني يؤلمني».
-- Only that exact phrase is touched; the pronunciation items in the same post
-- (scan64-bodyparts-ar-songarak) wait on Re's transliteration review.
--
-- Data-only and idempotent: «بطني يؤلمني» does not contain «بطني تؤلمني», so
-- re-running is a no-op. If the live wording differs, nothing changes and a
-- WARNING is logged (not an exception, so it cannot block other pending
-- migrations in the same Apply run).

update public.blog_posts
   set content = replace(content, 'بطني تؤلمني', 'بطني يؤلمني')
 where slug = 'korean-body-parts-vocabulary-ar'
   and content like '%بطني تؤلمني%';

do $$
begin
  if exists (select 1 from public.blog_posts
              where slug = 'korean-body-parts-vocabulary-ar'
                and content like '%بطني تؤلمني%') then
    raise warning 'korean-body-parts-vocabulary-ar still reads «بطني تؤلمني» - fix by hand';
  end if;
end $$;
