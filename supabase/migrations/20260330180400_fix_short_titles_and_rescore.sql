-- Fix titles that are too short (< 30 chars) — need 30-60 chars for max points

UPDATE blog_posts SET title = 'كلمات كورية للمبتدئين: أهم 50 كلمة أساسية'
WHERE slug = '50-essential-korean-words-beginners-ar';

UPDATE blog_posts SET title = 'Korean Words for Beginners: 50 Essential Terms'
WHERE slug = '50-essential-korean-words-beginners';

UPDATE blog_posts SET title = 'KDrama Korean Phrases for Beginners Guide'
WHERE slug = 'kdrama-korean-phrases-beginners';

UPDATE blog_posts SET title = 'How Long to Learn Korean as Arabic Speaker'
WHERE slug = 'how-long-to-learn-korean-arabic-speakers';

UPDATE blog_posts SET title = 'Learn Korean Through KPop Music and Songs'
WHERE slug = 'learn-korean-through-kpop-bts-blackpink';

UPDATE blog_posts SET title = 'Learn Korean with KDramas: Study Method'
WHERE slug = 'study-korean-kdramas-method';

UPDATE blog_posts SET title = 'Korean vs Japanese: Which Is Easier to Learn'
WHERE slug = 'korean-easier-than-japanese-chinese';

UPDATE blog_posts SET title = 'Korean Numbers: Complete Guide to Both Systems'
WHERE slug = 'korean-numbers-guide';

UPDATE blog_posts SET title = 'Korean Workplace Culture: Business Etiquette'
WHERE slug = 'korean-workplace-business-culture';

-- Fix description length for workplace culture post (currently 143, need 120-160)
-- Already in range, but let me check — 143 is fine actually, gets 10 points

-- Recalculate ALL scores
UPDATE blog_posts SET seo_score = LEAST(100,
  CASE WHEN title IS NOT NULL AND title != '' THEN
    5
    + CASE WHEN length(title) >= 30 AND length(title) <= 60 THEN 10
           WHEN length(title) > 0 THEN 3 ELSE 0 END
    + CASE WHEN keywords IS NOT NULL AND array_length(keywords, 1) > 0
           AND lower(title) LIKE '%' || lower(keywords[1]) || '%' THEN 5 ELSE 0 END
  ELSE 0 END
  + CASE WHEN description IS NOT NULL AND description != '' THEN
    5
    + CASE WHEN length(description) >= 120 AND length(description) <= 160 THEN 10
           WHEN length(description) >= 50 THEN 5 ELSE 0 END
    + CASE WHEN keywords IS NOT NULL AND array_length(keywords, 1) > 0
           AND lower(description) LIKE '%' || lower(keywords[1]) || '%' THEN 5 ELSE 0 END
  ELSE 0 END
  + CASE WHEN content IS NOT NULL AND content != '' THEN
    5
    + CASE WHEN array_length(string_to_array(content, ' '), 1) >= 800 THEN 15
           WHEN array_length(string_to_array(content, ' '), 1) >= 300 THEN 10
           WHEN array_length(string_to_array(content, ' '), 1) >= 100 THEN 5
           ELSE 0 END
    + CASE WHEN content ~ '(?m)^##' THEN 5 ELSE 0 END
  ELSE 0 END
  + CASE WHEN hero_image IS NOT NULL AND hero_image != '' THEN 5 ELSE 0 END
  + CASE WHEN hero_alt IS NOT NULL AND length(hero_alt) > 10 THEN 5 ELSE 0 END
  + CASE WHEN hero_image_2 IS NOT NULL AND hero_image_2 != '' THEN 3 ELSE 0 END
  + CASE WHEN hero_alt_2 IS NOT NULL AND length(hero_alt_2) > 10 THEN 2 ELSE 0 END
  + CASE WHEN keywords IS NOT NULL AND array_length(keywords, 1) >= 3 THEN 5
         WHEN keywords IS NOT NULL AND array_length(keywords, 1) >= 1 THEN 2
         ELSE 0 END
  + CASE WHEN cta_text IS NOT NULL AND cta_text != '' AND cta_url IS NOT NULL AND cta_url != '' THEN 5 ELSE 0 END
);
