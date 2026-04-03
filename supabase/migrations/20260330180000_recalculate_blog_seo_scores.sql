-- Recalculate SEO scores for all blog posts using the same algorithm as BlogManager.tsx
-- Score breakdown: title(20) + description(20) + content(25) + images(15) + keywords(5) + cta(5) = 90 max realistic

UPDATE blog_posts SET seo_score = LEAST(100,
  -- Title: exists (5) + length 30-60 chars (10, else 3) + contains first keyword (5)
  CASE WHEN title IS NOT NULL AND title != '' THEN
    5
    + CASE WHEN length(title) >= 30 AND length(title) <= 60 THEN 10
           WHEN length(title) > 0 THEN 3 ELSE 0 END
    + CASE WHEN keywords IS NOT NULL AND array_length(keywords, 1) > 0
           AND lower(title) LIKE '%' || lower(keywords[1]) || '%' THEN 5 ELSE 0 END
  ELSE 0 END

  -- Description: exists (5) + length 120-160 chars (10, else 5 if 50+) + contains keyword (5)
  + CASE WHEN description IS NOT NULL AND description != '' THEN
    5
    + CASE WHEN length(description) >= 120 AND length(description) <= 160 THEN 10
           WHEN length(description) >= 50 THEN 5 ELSE 0 END
    + CASE WHEN keywords IS NOT NULL AND array_length(keywords, 1) > 0
           AND lower(description) LIKE '%' || lower(keywords[1]) || '%' THEN 5 ELSE 0 END
  ELSE 0 END

  -- Content: exists (5) + word count 800+ (15) or 300+ (10) or 100+ (5) + has headings (5)
  + CASE WHEN content IS NOT NULL AND content != '' THEN
    5
    + CASE WHEN array_length(regexp_split_to_array(content, '\s+'), 1) >= 800 THEN 15
           WHEN array_length(regexp_split_to_array(content, '\s+'), 1) >= 300 THEN 10
           WHEN array_length(regexp_split_to_array(content, '\s+'), 1) >= 100 THEN 5
           ELSE 0 END
    + CASE WHEN content ~ '(?m)^##?\s' THEN 5 ELSE 0 END
  ELSE 0 END

  -- Hero image 1: exists (5) + alt > 10 chars (5)
  + CASE WHEN hero_image IS NOT NULL AND hero_image != '' THEN 5 ELSE 0 END
  + CASE WHEN hero_alt IS NOT NULL AND length(hero_alt) > 10 THEN 5 ELSE 0 END

  -- Hero image 2: exists (3) + alt > 10 chars (2)
  + CASE WHEN hero_image_2 IS NOT NULL AND hero_image_2 != '' THEN 3 ELSE 0 END
  + CASE WHEN hero_alt_2 IS NOT NULL AND length(hero_alt_2) > 10 THEN 2 ELSE 0 END

  -- Keywords: 3+ (5) or 1+ (2)
  + CASE WHEN keywords IS NOT NULL AND array_length(keywords, 1) >= 3 THEN 5
         WHEN keywords IS NOT NULL AND array_length(keywords, 1) >= 1 THEN 2
         ELSE 0 END

  -- CTA: both exist (5)
  + CASE WHEN cta_text IS NOT NULL AND cta_text != '' AND cta_url IS NOT NULL AND cta_url != '' THEN 5 ELSE 0 END
);
