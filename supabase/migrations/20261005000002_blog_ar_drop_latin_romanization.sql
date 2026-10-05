-- 5 Oct 2026 - Arabic blog posts: drop Latin romanisation after Korean words
-- (dashboard item scan86-arts-ar-latin-translit).
--
-- Arabic posts wrote «한글 (romanisation)», e.g. «미역국 (miyeokguk)», in Latin
-- letters. Re's rule: an Arabic page uses Arabic letters or Hangul alone.
-- The live pages were swept on 5 Oct 2026: 280 such spots across ~30 posts,
-- every one a lowercase romanisation directly after a Hangul word (or after
-- ? ! . , that ends a Korean sentence). The Hangul and the Arabic meaning
-- beside it stay; only the Latin bracket goes.
--
-- Data-only and idempotent: a post with nothing left to strip is untouched.
-- Scope: slugs ending in -ar, except korean-pronunciation-guide-speaking-ar,
-- where romanisation can be the point of the lesson (1 spot, review by hand).
-- Capitalised brackets, such as names (Lee Dong-wook) and acronyms (KTX),
-- are never matched, because the pattern requires a lowercase first letter.

do $$
declare
  pat constant text := '([ㄱ-힣?!.,])\s*\([a-z][a-z'' \-]{2,40}\)';
  r record;
  n int := 0;
begin
  for r in
    select slug
      from public.blog_posts
     where slug like '%-ar'
       and slug <> 'korean-pronunciation-guide-speaking-ar'
       and (content ~ pat or description ~ pat)
  loop
    update public.blog_posts
       set content     = regexp_replace(content,     pat, '\1', 'g'),
           description = regexp_replace(description, pat, '\1', 'g')
     where slug = r.slug;
    n := n + 1;
    raise notice 'latin-romanisation stripped: %', r.slug;
  end loop;
  raise notice 'posts changed: %', n;

  -- Check: report any post that still has a Latin bracket after Hangul.
  for r in
    select slug from public.blog_posts
     where slug like '%-ar'
       and slug <> 'korean-pronunciation-guide-speaking-ar'
       and content ~ pat
  loop
    raise warning '% still has Latin romanisation - fix by hand', r.slug;
  end loop;
end $$;
