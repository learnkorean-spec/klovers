-- 25 Sep 2026 — website QA pass (claude/WEBSITE_QA_AI_SLOP_2026-09-25.md).
--
-- 20260330180500_pad_content_800_words.sql appended the same four-paragraph
-- block to every post under 800 words, only to raise an internal SEO score.
-- It says "our certified instructors bring over five years of teaching
-- experience" and "join thousands of successful learners" - both false (the
-- facts are 13 years and 200+ students taught by Reham). 59 published posts
-- carry it (EN + AR). This removes that block and everything after its
-- heading - the block was always appended last, so nothing written after it
-- exists.
--
-- It also rewrites the four remaining sentences that call Klovers' teacher
-- "certified" (معتمدة): the true credential is the Al-Alsun degree.
--
-- Idempotent: re-running changes nothing.

-- 1. The appended padding block, English.
UPDATE blog_posts
SET content = rtrim(split_part(content, E'\n\n## Why Learn Korean with Klovers Academy', 1)),
    updated_at = now()
WHERE lang = 'en'
  AND position(E'\n\n## Why Learn Korean with Klovers Academy' in content) > 0;

-- 2. The appended padding block, Arabic.
UPDATE blog_posts
SET content = rtrim(split_part(content, E'\n\n## لماذا تتعلم الكورية مع أكاديمية كلوفرز', 1)),
    updated_at = now()
WHERE lang = 'ar'
  AND position(E'\n\n## لماذا تتعلم الكورية مع أكاديمية كلوفرز' in content) > 0;

-- 3. "certified" teacher claims about Klovers itself (generic mentions of
--    certified teachers elsewhere are left alone).
UPDATE blog_posts
SET content = replace(content,
      'taught by a certified Korean teacher in live interactive sessions',
      'taught live by Reham, an Al-Alsun Korean graduate with 13 years of teaching'),
    updated_at = now()
WHERE content LIKE '%taught by a certified Korean teacher in live interactive sessions%';

UPDATE blog_posts
SET content = replace(content,
      'Our certified Korean teacher guides you',
      'Reham, our Al-Alsun–trained Korean teacher, guides you'),
    updated_at = now()
WHERE content LIKE '%Our certified Korean teacher guides you%';

UPDATE blog_posts
SET content = replace(content,
      'for structured preparation with a certified Korean teacher',
      'for structured preparation with an experienced Korean teacher'),
    updated_at = now()
WHERE content LIKE '%for structured preparation with a certified Korean teacher%';

UPDATE blog_posts
SET content = replace(content,
      'للتحضير المنظم مع معلمة كورية معتمدة',
      'للتحضير المنظم مع معلمة كوري خريجة الألسن'),
    updated_at = now()
WHERE content LIKE '%للتحضير المنظم مع معلمة كورية معتمدة%';
