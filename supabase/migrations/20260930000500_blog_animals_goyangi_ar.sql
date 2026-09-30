-- 30 Sep 2026. Content fix for the Arabic animal-vocabulary post
-- (dashboard item scan60-animals-ar-goyangi).
--
-- 고양이 (cat) is transliterated «كوينغي», which drops the 야 syllable.
-- The reading is go-yang-i, so it becomes «كويانغي».
-- Only that exact misspelling is touched; the other ㅐ spellings in the post
-- (scan60-animals-ar-ae-spelling) are on hold and left as they are.
--
-- Data-only and idempotent: «كويانغي» does not contain «كوينغي», so re-running
-- is a no-op. If the live wording differs, nothing changes and a WARNING is
-- logged (not an exception, so it cannot block other pending migrations in the
-- same Apply run).

update public.blog_posts
   set content = replace(content, 'كوينغي', 'كويانغي')
 where slug = 'korean-animal-vocabulary-sounds-ar'
   and content like '%كوينغي%';

do $$
begin
  if exists (select 1 from public.blog_posts
              where slug = 'korean-animal-vocabulary-sounds-ar'
                and content like '%كوينغي%') then
    raise warning 'korean-animal-vocabulary-sounds-ar still reads 고양이 as كوينغي - fix by hand';
  end if;
end $$;
