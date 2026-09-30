-- 28 Sep 2026. Brand guard: the English brand name is "Klovers" only.
-- 100 published English posts were signed "Klovers Team" (set on 25 Sep in
-- 20260925160000_blog_authors_and_stereotype.sql), and the column default
-- is still the old spelling "KLovers Team".
--
-- Arabic posts keep "فريق كلوفرز"; Reham's own posts keep "Reham Elshrkawy".
-- Data-only and idempotent.

update blog_posts
   set author = 'Klovers'
 where lang = 'en'
   and author in ('Klovers Team', 'KLovers Team');

alter table blog_posts alter column author set default 'Klovers';
