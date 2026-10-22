-- Which brand an article belongs to: 'klovers' (Korean) or 'voca' (English).
--
-- Re, 23 Oct 2026: Voca (the English-lessons sibling brand) gets its own
-- articles. They live in blog_posts like every other article, so they get the
-- same build-time prerender and sitemap entry, but the Korean Journal (/blog)
-- must not list them and the Voca articles page (/learn-english/articles) must
-- list only them. Every existing row is Korean content, hence the default.
--
-- Checked live before writing (information_schema.columns, 23 Oct 2026): no
-- `brand` column exists; 225 rows, all Korean-course content.
--
-- Idempotent: safe to re-dispatch.
BEGIN;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT 'klovers';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'blog_posts_brand_check'
       AND conrelid = 'public.blog_posts'::regclass
  ) THEN
    ALTER TABLE public.blog_posts
      ADD CONSTRAINT blog_posts_brand_check CHECK (brand IN ('klovers', 'voca'));
  END IF;
END $$;

COMMIT;
