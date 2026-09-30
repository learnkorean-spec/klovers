-- 30 Sep 2026. Content fix for the English colour-vocabulary post
-- (dashboard item scan61-colors-en-drop-saek).
--
-- 1. The post says "Drop 색 and add -하다 or -이다 to describe something
--    directly: 하늘이 파래요". That rule is wrong: 파래요 comes from the
--    descriptive verb 파랗다, not from 파란색 + 하다.
-- 2. It says "Every color word ends in 색", then lists 빨갛다 / 파랗다 without
--    색. Softened to "Most color nouns end in 색".
--
-- Wording was read from the live page on 30 Sep 2026; the database itself was
-- not reachable from this session.
-- Data-only and idempotent: the new text does not contain the old text, so
-- re-running is a no-op. If the live wording differs (e.g. markdown inside the
-- sentence), nothing changes and a WARNING is logged (never an exception, so it
-- cannot block other pending migrations in the same Apply run).

update public.blog_posts
   set content = replace(content,
         'Drop 색 and add -하다 or -이다 to describe something directly',
         'To describe something directly, use the descriptive verb instead (파랗다 → 파래요)')
 where slug = 'korean-color-vocabulary-guide'
   and content like '%Drop 색 and add -하다 or -이다 to describe something directly%';

update public.blog_posts
   set content = replace(content,
         'Every color word ends in 색',
         'Most color nouns end in 색')
 where slug = 'korean-color-vocabulary-guide'
   and content like '%Every color word ends in 색%';

do $$
begin
  if exists (select 1 from public.blog_posts
              where slug = 'korean-color-vocabulary-guide'
                and (content like '%Drop 색 and add%'
                     or content like '%Every color word ends in 색%')) then
    raise warning 'korean-color-vocabulary-guide still has the old 색 rule - fix by hand';
  end if;
  if not exists (select 1 from public.blog_posts
                  where slug = 'korean-color-vocabulary-guide'
                    and content like '%파랗다 → 파래요%') then
    raise warning 'korean-color-vocabulary-guide: new 파랗다 wording not found - live text differs, fix by hand';
  end if;
end $$;
