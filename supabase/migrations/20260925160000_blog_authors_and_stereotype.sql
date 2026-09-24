-- 25 Sep 2026 QA pass, part 2.
--
-- 1. One byline per language. Posts were signed seven different ways
--    ("KLovers Team", "فريق كي لوفرز", "فريق Klovers", English bylines on
--    Arabic posts...). English posts are now "Klovers Team", Arabic posts
--    "فريق كلوفرز", and Reham's own posts use the spelling on the rest of
--    the site, "Reham Elshrkawy".
-- 2. topik-exam-guide (en) generalised about "the educational cultures"
--    Arabic-speaking students come from. That line is removed.

update blog_posts set author = 'Reham Elshrkawy'
  where author = 'Reham El-Sharkawi';

update blog_posts set author = 'Klovers Team'
  where lang = 'en' and author = 'KLovers Team';

update blog_posts set author = 'فريق كلوفرز'
  where lang = 'ar' and author in ('فريق Klovers', 'فريق كي لوفرز', 'Klovers Team', 'KLovers Team');

update blog_posts
  set content = replace(
    content,
    E'3. **Dedication and discipline** — Arabic-speaking students often come from educational cultures that emphasize memorization and pattern mastery — perfect for vocabulary building.\n\n',
    ''
  ),
  updated_at = now()
  where slug = 'topik-exam-guide' and lang = 'en'
    and content like '%educational cultures that emphasize memorization%';
