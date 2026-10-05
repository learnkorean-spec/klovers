-- 5 Oct 2026: the English TOPIK 1 vocabulary post listed "Writing" as a
-- TOPIK I skill. TOPIK I is reading + listening only; writing starts in
-- TOPIK II. Already applied in production; this file keeps the repo in step.
-- Old row backed up in blog_posts_backup_20261005_topik1_en (RLS on).

create table if not exists public.blog_posts_backup_20261005_topik1_en as
  select * from public.blog_posts where slug = 'topik-1-vocabulary-list-800-words';
alter table public.blog_posts_backup_20261005_topik1_en enable row level security;

update public.blog_posts set content = replace(replace(content,
'- Listening comprehension (speed and accent variation)
- Writing (sentence construction)
',
'- Listening comprehension (speed and accent variation)

TOPIK I has no writing section: it is reading and listening only. Writing first appears in TOPIK II.
'),
'where all four skills are developed simultaneously', 'where vocabulary, grammar, reading and listening are developed together'),
updated_at = now()
where slug = 'topik-1-vocabulary-list-800-words';
