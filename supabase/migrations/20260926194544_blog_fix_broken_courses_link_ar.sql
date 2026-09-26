-- QA-01 (25 Sep 2026): the Arabic apps-comparison article linked to /الدورات,
-- which does not exist (404). The courses page is /courses.
-- Guarded: only touches the row if it still has exactly that one link.
-- Applied in production on 27 Sep 2026 (version recorded in schema_migrations).
update public.blog_posts
set content = replace(content, '](/الدورات)', '](/courses)')
where slug = 'korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar'
  and content like '%](/الدورات)%';
