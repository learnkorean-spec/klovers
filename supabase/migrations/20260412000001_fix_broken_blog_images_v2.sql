-- Fix broken Unsplash images (503 errors confirmed 2026-04-12)

-- 1. Pronunciation guide (EN + AR): photo-1516321318423-f06f70d504f0 → 503
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80'
WHERE hero_image LIKE '%photo-1516321318423%';

-- 2. Apps comparison (EN + AR): photo-1512941691920-13342813f60d → 503
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80'
WHERE hero_image LIKE '%photo-1512941691920%';

-- 3. AR K-Drama post: photo-1561816954-b6f7b6cc2ac3 → 503
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80'
WHERE hero_image LIKE '%photo-1561816954%';
