-- Fix blog post images: assign unique, relevant images to each post
-- Fixes: duplicate images across EN/AR posts, missing hero_image_2

-- ═══════════════════════════════════════════════════
-- ENGLISH POSTS (5)
-- ═══════════════════════════════════════════════════

UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1200&q=80',
  hero_alt     = 'Korean Hangul alphabet characters written on paper',
  hero_image_2 = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80',
  hero_alt_2   = 'Student practicing Hangul writing at desk',
  hero_caption_2 = 'Practice writing Hangul daily for best results'
WHERE slug = 'learn-korean-alphabet-hangul-guide' AND lang = 'en';

UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
  hero_alt     = 'Group of international students studying together',
  hero_image_2 = 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=80',
  hero_alt_2   = 'Timeline chart showing language learning milestones',
  hero_caption_2 = 'Your Korean learning timeline depends on daily study time'
WHERE slug = 'how-long-to-learn-korean-arabic-speakers' AND lang = 'en';

UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80',
  hero_alt     = 'Korean drama scene on a TV screen',
  hero_image_2 = 'https://images.unsplash.com/photo-1585951237313-1979e4df7385?w=1200&q=80',
  hero_alt_2   = 'Person watching Korean drama with subtitles',
  hero_caption_2 = 'K-Dramas are a fun way to pick up real Korean phrases'
WHERE slug = 'kdrama-korean-phrases-beginners' AND lang = 'en';

UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1200&q=80',
  hero_alt     = 'Notebook with vocabulary words and a pen',
  hero_image_2 = 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1200&q=80',
  hero_alt_2   = 'Colorful sticky notes with Korean words',
  hero_caption_2 = 'Flashcards and sticky notes help memorize new vocabulary'
WHERE slug = '50-essential-korean-words-beginners' AND lang = 'en';

UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&q=80',
  hero_alt     = 'Laptop with study materials and coffee on desk',
  hero_image_2 = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
  hero_alt_2   = 'Organized study workspace with notes and books',
  hero_caption_2 = 'A structured study routine is key to learning Korean faster'
WHERE slug = 'how-to-learn-korean-faster' AND lang = 'en';

-- ═══════════════════════════════════════════════════
-- ARABIC POSTS — fix images (many may be duplicated or missing)
-- Update by matching slug LIKE patterns since Arabic slugs vary
-- ═══════════════════════════════════════════════════

-- Arabic post about Hangul / Korean alphabet
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80',
  hero_alt     = 'حروف الهانغول الكورية مكتوبة على ورقة',
  hero_image_2 = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
  hero_alt_2   = 'طالبة تتعلم كتابة الهانغول',
  hero_caption_2 = 'تدرب على كتابة الهانغول يوميًا'
WHERE lang = 'ar' AND (slug LIKE '%hangul%' OR slug LIKE '%alphabet%' OR slug LIKE '%هانغول%' OR title LIKE '%هانغول%' OR title LIKE '%الحروف%');

-- Arabic post about K-Drama phrases
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1522152302542-71a8e5172aa1?w=1200&q=80',
  hero_alt     = 'مشهد من دراما كورية على الشاشة',
  hero_image_2 = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=1200&q=80',
  hero_alt_2   = 'شخص يشاهد مسلسل كوري مع ترجمة',
  hero_caption_2 = 'الدراما الكورية طريقة ممتعة لتعلم العبارات'
WHERE lang = 'ar' AND (slug LIKE '%drama%' OR slug LIKE '%kdrama%' OR title LIKE '%دراما%');

-- Arabic post about learning Korean faster / study tips
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80',
  hero_alt     = 'مجموعة طلاب يدرسون اللغة الكورية',
  hero_image_2 = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80',
  hero_alt_2   = 'مكتب منظم للدراسة مع كتب وملاحظات',
  hero_caption_2 = 'الروتين المنظم هو مفتاح تعلم الكورية بسرعة'
WHERE lang = 'ar' AND (slug LIKE '%faster%' OR slug LIKE '%tips%' OR slug LIKE '%نصائح%' OR title LIKE '%أسرع%' OR title LIKE '%نصائح%');

-- Arabic post about vocabulary / essential words
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&q=80',
  hero_alt     = 'دفتر ملاحظات مع كلمات كورية',
  hero_image_2 = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1200&q=80',
  hero_alt_2   = 'بطاقات تعليمية للمفردات الكورية',
  hero_caption_2 = 'البطاقات التعليمية تساعد على حفظ الكلمات الجديدة'
WHERE lang = 'ar' AND (slug LIKE '%words%' OR slug LIKE '%vocab%' OR slug LIKE '%كلمات%' OR title LIKE '%كلم%' OR title LIKE '%مفردات%');

-- Arabic post about how long to learn Korean / timeline
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80',
  hero_alt     = 'طلاب دوليون يدرسون معًا',
  hero_image_2 = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80',
  hero_alt_2   = 'جدول زمني لتعلم اللغة الكورية',
  hero_caption_2 = 'مدة تعلم الكورية تعتمد على وقت الدراسة اليومي'
WHERE lang = 'ar' AND (slug LIKE '%long%' OR slug LIKE '%timeline%' OR slug LIKE '%arabic-speaker%' OR title LIKE '%كم%' OR title LIKE '%مدة%' OR title LIKE '%وقت%');

-- Arabic post about Korean culture / K-Pop
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
  hero_alt     = 'حفل كيبوب مع أضواء ملونة',
  hero_image_2 = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
  hero_alt_2   = 'فن الثقافة الكورية الحديثة',
  hero_caption_2 = 'الكيبوب والثقافة الكورية بوابتك لتعلم اللغة'
WHERE lang = 'ar' AND (slug LIKE '%kpop%' OR slug LIKE '%culture%' OR slug LIKE '%ثقافة%' OR title LIKE '%كيبوب%' OR title LIKE '%ثقاف%');

-- Arabic post about online learning / beginners
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
  hero_alt     = 'تعلم اللغة الكورية عبر الإنترنت',
  hero_image_2 = 'https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=1200&q=80',
  hero_alt_2   = 'طالبة تدرس كورية على اللابتوب',
  hero_caption_2 = 'الدروس المباشرة عبر الإنترنت فعالة جدًا'
WHERE lang = 'ar' AND (slug LIKE '%online%' OR slug LIKE '%beginner%' OR slug LIKE '%مبتدئ%' OR title LIKE '%إنترنت%' OR title LIKE '%مبتدئ%' OR title LIKE '%أونلاين%');

-- Arabic post about grammar / sentence structure
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&q=80',
  hero_alt     = 'كتاب قواعد اللغة الكورية مفتوح',
  hero_image_2 = 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=1200&q=80',
  hero_alt_2   = 'طالب يدرس تركيب الجمل الكورية',
  hero_caption_2 = 'فهم القواعد الأساسية يجعل التعلم أسهل'
WHERE lang = 'ar' AND (slug LIKE '%grammar%' OR slug LIKE '%sentence%' OR slug LIKE '%قواعد%' OR title LIKE '%قواعد%' OR title LIKE '%جمل%');

-- Arabic post about TOPIK exam / testing
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
  hero_alt     = 'طالبة تستعد لامتحان التوبيك',
  hero_image_2 = 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&q=80',
  hero_alt_2   = 'مواد دراسية لاختبار الكفاءة الكورية',
  hero_caption_2 = 'اختبار التوبيك هو المعيار الدولي لقياس مستوى الكورية'
WHERE lang = 'ar' AND (slug LIKE '%topik%' OR slug LIKE '%exam%' OR slug LIKE '%test%' OR slug LIKE '%توبيك%' OR title LIKE '%توبيك%' OR title LIKE '%اختبار%' OR title LIKE '%امتحان%');

-- Arabic post about pronunciation
UPDATE blog_posts SET
  hero_image   = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&q=80',
  hero_alt     = 'شخص يتحدث ويتدرب على النطق الكوري',
  hero_image_2 = 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&q=80',
  hero_alt_2   = 'سماعات وميكروفون للتدرب على النطق',
  hero_caption_2 = 'الاستماع والتكرار أفضل طريقة لتحسين النطق'
WHERE lang = 'ar' AND (slug LIKE '%pronun%' OR slug LIKE '%speak%' OR slug LIKE '%نطق%' OR title LIKE '%نطق%' OR title LIKE '%محادثة%');

-- Catch-all: any Arabic posts still missing hero_image_2
UPDATE blog_posts SET
  hero_image_2 = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  hero_alt_2   = 'طلاب يتعلمون اللغة الكورية في فصل دراسي',
  hero_caption_2 = 'انضم إلى مجتمع كلوفرز لتعلم الكورية'
WHERE lang = 'ar' AND (hero_image_2 IS NULL OR hero_image_2 = '');

-- Catch-all: any English posts still missing hero_image_2
UPDATE blog_posts SET
  hero_image_2 = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  hero_alt_2   = 'Students learning Korean in a classroom setting',
  hero_caption_2 = 'Join the KLovers community to start learning Korean'
WHERE lang = 'en' AND (hero_image_2 IS NULL OR hero_image_2 = '');
