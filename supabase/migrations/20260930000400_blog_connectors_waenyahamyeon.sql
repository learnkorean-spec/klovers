-- 30 Sep 2026. Content fix for the connectors guides, English and Arabic
-- (dashboard item scan56-connectors-en-waenyahamyeon).
--
-- The cause/result table gives 「왜냐하면 시간이 없었어요.」 as the example for
-- 왜냐하면. A sentence opened by 왜냐하면 normally closes with -거든요 or
-- -기 때문이에요, so the example becomes 「왜냐하면 시간이 없었거든요.」.
-- The Arabic post carries the same example in the same table.
--
-- Data-only and idempotent: the replace only matches the exact old sentence,
-- so re-running is a no-op. If the live wording differs, nothing changes and a
-- WARNING is logged (not an exception, so it cannot block other pending
-- migrations in the same Apply run).

update public.blog_posts
   set content = replace(content,
         '왜냐하면 시간이 없었어요.',
         '왜냐하면 시간이 없었거든요.')
 where slug in ('korean-connectors-conjunctions-guide',
                'korean-connectors-conjunctions-guide-ar')
   and content like '%왜냐하면 시간이 없었어요.%';

do $$
begin
  if exists (select 1 from public.blog_posts
              where slug in ('korean-connectors-conjunctions-guide',
                             'korean-connectors-conjunctions-guide-ar')
                and content like '%왜냐하면 시간이 없었어요%') then
    raise warning 'connectors guide still has 왜냐하면 ... 없었어요 - fix by hand';
  end if;
end $$;
