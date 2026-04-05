-- Fix broken Unsplash images (404s confirmed)

-- korean-pronunciation-guide-beginners (photo-1546410249 = 404)
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
  hero_alt = 'Person practicing Korean pronunciation out loud'
WHERE slug = 'korean-pronunciation-guide-beginners';

-- korean-body-language-social-etiquette (photo-1551521040 = 404)
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
  hero_alt = 'People bowing and greeting in Korean style'
WHERE slug = 'korean-body-language-social-etiquette';

-- korean-slang-words EN + AR (photo-1489599849927 = 404)
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1522152302542-71a8e5172aa1?w=1200&q=80',
  hero_alt = 'Young Koreans chatting with slang expressions'
WHERE slug IN ('korean-slang-words', 'korean-slang-words-ar', 'ar-korean-slang-words');

-- Fix broken hero_image_2 URLs
-- photo-1523050854058 (catch-all fallback) = 404
UPDATE blog_posts SET
  hero_image_2 = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
  hero_alt_2 = CASE WHEN lang = 'ar' THEN 'طلاب يتعلمون الكورية في فصل دراسي' ELSE 'Students learning Korean in a classroom' END
WHERE hero_image_2 LIKE '%photo-1523050854058%';

-- photo-1583862089880 (Hanbok palace) = 404
UPDATE blog_posts SET
  hero_image_2 = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1200&q=80',
  hero_alt_2 = CASE WHEN lang = 'ar' THEN 'أشخاص يرتدون الهانبوك في مهرجان كوري' ELSE 'People wearing Hanbok at a Korean festival' END
WHERE hero_image_2 LIKE '%photo-1583862089880%';
