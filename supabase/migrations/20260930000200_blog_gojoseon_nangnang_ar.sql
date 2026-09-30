-- 30 Sep 2026. Content fix for the Arabic "Before Korea" post (dashboard item
-- scan51-gojoseon-ar-nangnang).
--
-- The post writes «لولانغ (낙랑، نانغرانغ)». 낙랑 is pronounced "nangnang"
-- (ㄹ after ㅇ becomes ㄴ), not "nangrang", and «لولانغ» is the Chinese reading
-- (Lelang), not the Korean word printed next to it.
-- New wording: «نانغنانغ (낙랑؛ لولانغ بالصينية)» — a parenthetical, so the
-- surrounding sentence keeps its grammar.
--
-- Data-only and idempotent: the replace only matches the exact old phrase, so
-- re-running is a no-op. If the live wording differs, nothing changes and a
-- WARNING is logged (not an exception, so it cannot block other pending
-- migrations in the same Apply run).

update public.blog_posts
   set content = regexp_replace(content,
         'لولانغ\s*\(\s*낙랑\s*[،,]\s*نانغرانغ\s*\)',
         'نانغنانغ (낙랑؛ لولانغ بالصينية)',
         'g')
 where slug = 'before-korea-gojoseon-and-china-ar'
   and content ~ 'لولانغ\s*\(\s*낙랑\s*[،,]\s*نانغرانغ\s*\)';

do $$
begin
  if exists (select 1 from public.blog_posts
              where slug = 'before-korea-gojoseon-and-china-ar'
                and content ~ 'نانغرانغ') then
    raise warning 'before-korea-gojoseon-and-china-ar still says نانغرانغ - fix the 낙랑 reading by hand';
  end if;
end $$;
