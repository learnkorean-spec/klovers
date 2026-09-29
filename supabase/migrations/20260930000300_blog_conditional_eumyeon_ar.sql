-- 30 Sep 2026. Content fix for the Arabic conditional-sentences post
-- (dashboard item scan53-conditional-ar-eumyeon).
--
-- The heading reads «أداة الشرط اليومية: -으면 (يومْيون)». 으 is a short
-- close vowel ("أُ"), not "يو", so -으면 is read «أُمْيون».
-- Only the parenthetical right after -으면 is touched; other readings in the
-- post (먹으면 «موغومْيون», 가면 «كامْيون») are left as they are.
--
-- Data-only and idempotent: the replace only matches the exact old phrase, so
-- re-running is a no-op. If the live wording differs, nothing changes and a
-- WARNING is logged (not an exception, so it cannot block other pending
-- migrations in the same Apply run).

update public.blog_posts
   set content = regexp_replace(content,
         '-으면\s*\(\s*يومْ?يون\s*\)',
         '-으면 (أُمْيون)',
         'g')
 where slug = 'korean-conditional-sentences-guide-ar'
   and content ~ '-으면\s*\(\s*يومْ?يون\s*\)';

do $$
begin
  if exists (select 1 from public.blog_posts
              where slug = 'korean-conditional-sentences-guide-ar'
                and content ~ '\(\s*يومْ?يون\s*\)') then
    raise warning 'korean-conditional-sentences-guide-ar still reads -으면 as يومْيون - fix by hand';
  end if;
end $$;
