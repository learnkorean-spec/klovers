
-- Add second hero image fields
ALTER TABLE public.blog_posts 
  ADD COLUMN hero_image_2 TEXT DEFAULT '',
  ADD COLUMN hero_alt_2 TEXT DEFAULT '',
  ADD COLUMN hero_caption_2 TEXT DEFAULT '';

-- Add SEO score field
ALTER TABLE public.blog_posts 
  ADD COLUMN seo_score INTEGER DEFAULT 0;
