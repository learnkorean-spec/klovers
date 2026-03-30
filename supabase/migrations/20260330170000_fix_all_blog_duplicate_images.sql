-- Fix ALL duplicate blog images across English and Arabic posts
-- Each post gets a unique, topic-relevant Unsplash image

-- ═══════════════════════════════════════════════════
-- ENGLISH POSTS — fix duplicates + add hero_image_2
-- ═══════════════════════════════════════════════════

-- Seoul Travel Guide (was duplicate of Slang)
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1200&q=80',
  hero_alt = 'Seoul city skyline with Namsan Tower',
  hero_image_2 = 'https://images.unsplash.com/photo-1546874177-9e664107314e?w=1200&q=80',
  hero_alt_2 = 'Traditional Korean street in Seoul with lanterns',
  hero_caption_2 = 'Seoul blends tradition and modernity perfectly'
WHERE lang = 'en' AND title LIKE '%Seoul Travel%';

-- Korean Number Systems (was duplicate of TOPIK)
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80',
  hero_alt = 'Numbers and math symbols on a chalkboard',
  hero_image_2 = 'https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=1200&q=80',
  hero_alt_2 = 'Student counting with Korean number flashcards',
  hero_caption_2 = 'Korean has two number systems — learn both'
WHERE lang = 'en' AND title LIKE '%Number System%';

-- TOPIK Exam Guide
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&q=80',
  hero_alt = 'Student preparing for Korean language exam',
  hero_image_2 = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
  hero_alt_2 = 'Study materials for TOPIK preparation',
  hero_caption_2 = 'TOPIK is the standard test for Korean proficiency'
WHERE lang = 'en' AND title LIKE '%TOPIK%';

-- Korean Cafe Culture
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80',
  hero_alt = 'Aesthetic Korean cafe interior',
  hero_image_2 = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
  hero_alt_2 = 'Creative Korean coffee art and pastries',
  hero_caption_2 = 'Korean cafes are famous for their unique concepts'
WHERE lang = 'en' AND title LIKE '%Cafe Culture%';

-- Korean Particles Guide
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&q=80',
  hero_alt = 'Open Korean grammar textbook',
  hero_image_2 = 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=1200&q=80',
  hero_alt_2 = 'Student studying Korean sentence structure',
  hero_caption_2 = 'Particles are the building blocks of Korean grammar'
WHERE lang = 'en' AND title LIKE '%Particles Guide%';

-- 35 Korean Slang Words
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1489599849927-9b8a2c3e04b3?w=1200&q=80',
  hero_alt = 'Young people chatting and using Korean slang',
  hero_image_2 = 'https://images.unsplash.com/photo-1522152302542-71a8e5172aa1?w=1200&q=80',
  hero_alt_2 = 'Korean text messages with slang expressions',
  hero_caption_2 = 'Korean slang is essential for casual conversations'
WHERE lang = 'en' AND title LIKE '%Slang%';

-- Korean Food Vocabulary
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=1200&q=80',
  hero_alt = 'Colorful Korean food spread on a table',
  hero_image_2 = 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=1200&q=80',
  hero_alt_2 = 'Korean BBQ restaurant with traditional dishes',
  hero_caption_2 = 'Knowing food vocabulary makes ordering in Korean easy'
WHERE lang = 'en' AND title LIKE '%Food Vocab%';

-- 40 Essential Korean Greetings
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=1200&q=80',
  hero_alt = 'People bowing as a Korean greeting',
  hero_image_2 = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
  hero_alt_2 = 'Friends greeting each other in Korean style',
  hero_caption_2 = 'Korean greetings change based on formality level'
WHERE lang = 'en' AND title LIKE '%Greetings%';

-- Hanbok article
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=1200&q=80',
  hero_alt = 'Traditional Korean Hanbok dress',
  hero_image_2 = 'https://images.unsplash.com/photo-1583862089880-6e06e82c4556?w=1200&q=80',
  hero_alt_2 = 'People wearing Hanbok at a Korean palace',
  hero_caption_2 = 'Hanbok is worn during Korean festivals and celebrations'
WHERE lang = 'en' AND title LIKE '%Hanbok%';

-- K-Drama Study Method
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80',
  hero_alt = 'Korean drama scene on TV screen',
  hero_image_2 = 'https://images.unsplash.com/photo-1585951237313-1979e4df7385?w=1200&q=80',
  hero_alt_2 = 'Person watching K-Drama with subtitles on laptop',
  hero_caption_2 = 'K-Dramas are a fun way to learn real Korean phrases'
WHERE lang = 'en' AND title LIKE '%K-Drama Study%';

-- Learn Korean Alphabet (Hangul)
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1200&q=80',
  hero_alt = 'Korean Hangul characters written on paper',
  hero_image_2 = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80',
  hero_alt_2 = 'Student practicing Hangul writing',
  hero_caption_2 = 'Practice writing Hangul daily for best results'
WHERE lang = 'en' AND title LIKE '%Hangul%' AND title LIKE '%Alphabet%';

-- How Long to Learn Korean
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
  hero_alt = 'Students studying together at a table',
  hero_image_2 = 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=80',
  hero_alt_2 = 'Language learning timeline milestones',
  hero_caption_2 = 'Your Korean timeline depends on daily study hours'
WHERE lang = 'en' AND title LIKE '%How Long%Learn Korean%';

-- 30 K-Drama Phrases
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80',
  hero_alt = 'Watching Korean drama on screen',
  hero_image_2 = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=1200&q=80',
  hero_alt_2 = 'Korean drama scene with subtitles',
  hero_caption_2 = 'K-Drama phrases you hear every episode'
WHERE lang = 'en' AND title LIKE '%K-Drama%Phrases%' AND title NOT LIKE '%Study Method%';

-- 50 Essential Korean Words
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1200&q=80',
  hero_alt = 'Notebook with vocabulary words and pen',
  hero_image_2 = 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1200&q=80',
  hero_alt_2 = 'Colorful sticky notes with Korean words',
  hero_caption_2 = 'Flashcards help memorize new vocabulary'
WHERE lang = 'en' AND title LIKE '%50 Essential%Words%';

-- 10 Proven Ways to Learn Korean Faster
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&q=80',
  hero_alt = 'Laptop with study materials and coffee',
  hero_image_2 = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80',
  hero_alt_2 = 'Organized study workspace with notes',
  hero_caption_2 = 'A structured routine helps learn Korean faster'
WHERE lang = 'en' AND title LIKE '%10 Proven Ways%';

-- Korean Work Culture
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80',
  hero_alt = 'Korean office and business culture',
  hero_image_2 = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80',
  hero_alt_2 = 'Team meeting in a Korean workplace',
  hero_caption_2 = 'Understanding Korean work culture is key for business'
WHERE lang = 'en' AND title LIKE '%Work Culture%';

-- Korean Songs article
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
  hero_alt = 'K-Pop concert with colorful lights',
  hero_image_2 = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
  hero_alt_2 = 'Person listening to Korean music with headphones',
  hero_caption_2 = 'Korean songs are a great way to improve listening'
WHERE lang = 'en' AND (title LIKE '%Songs%' OR title LIKE '%K-Pop%Learn%');

-- Korean Family Names
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1200&q=80',
  hero_alt = 'Korean family sitting together',
  hero_image_2 = 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80',
  hero_alt_2 = 'Korean family gathering for a holiday',
  hero_caption_2 = 'Korean family terms change based on relationship'
WHERE lang = 'en' AND (title LIKE '%Family%' AND title LIKE '%Korean%');

-- ═══════════════════════════════════════════════════
-- ARABIC POSTS — fix duplicates
-- ═══════════════════════════════════════════════════

-- Arabic Numbers (was duplicate of Particles)
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80',
  hero_alt = 'أرقام ورموز رياضية على السبورة',
  hero_image_2 = 'https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=1200&q=80',
  hero_alt_2 = 'طالب يتعلم الأرقام الكورية',
  hero_caption_2 = 'اللغة الكورية تستخدم نظامين مختلفين للأرقام'
WHERE lang = 'ar' AND title LIKE '%أرقام%';

-- Arabic Particles (keep current but ensure hero_image_2)
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&q=80',
  hero_alt = 'كتاب قواعد اللغة الكورية مفتوح',
  hero_image_2 = 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=1200&q=80',
  hero_alt_2 = 'طالب يدرس تركيب الجمل الكورية',
  hero_caption_2 = 'أدوات الربط هي أساس القواعد الكورية'
WHERE lang = 'ar' AND title LIKE '%أدوات الربط%';

-- Arabic TOPIK (ensure unique)
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&q=80',
  hero_alt = 'طالبة تستعد لامتحان التوبيك',
  hero_image_2 = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
  hero_alt_2 = 'مواد دراسية لاختبار الكفاءة الكورية',
  hero_caption_2 = 'اختبار التوبيك هو المعيار الدولي لقياس مستواك'
WHERE lang = 'ar' AND title LIKE '%TOPIK%';

-- Arabic Hangul
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80',
  hero_alt = 'حروف الهانغول مكتوبة على ورقة',
  hero_image_2 = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
  hero_alt_2 = 'طالبة تتعلم كتابة الهانغول',
  hero_caption_2 = 'تدرب على كتابة الهانغول يوميًا للإتقان'
WHERE lang = 'ar' AND (title LIKE '%هانغول%' OR title LIKE '%الأبجدية%');

-- Arabic K-Drama
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1561816954-b6f7b6cc2ac3?w=1200&q=80',
  hero_alt = 'مشاهدة دراما كورية على الشاشة',
  hero_image_2 = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=1200&q=80',
  hero_alt_2 = 'شخص يشاهد مسلسل كوري مع ترجمة',
  hero_caption_2 = 'الدراما الكورية طريقة ممتعة لتعلم العبارات'
WHERE lang = 'ar' AND title LIKE '%Drama%' AND title NOT LIKE '%عامية%';

-- Arabic Slang
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1489599849927-9b8a2c3e04b3?w=1200&q=80',
  hero_alt = 'شباب يتحدثون باللغة العامية الكورية',
  hero_image_2 = 'https://images.unsplash.com/photo-1522152302542-71a8e5172aa1?w=1200&q=80',
  hero_alt_2 = 'رسائل نصية كورية عامية',
  hero_caption_2 = 'العامية الكورية ضرورية للمحادثات اليومية'
WHERE lang = 'ar' AND title LIKE '%عامية%';

-- Arabic Food
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=1200&q=80',
  hero_alt = 'مائدة طعام كوري متنوعة',
  hero_image_2 = 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=1200&q=80',
  hero_alt_2 = 'مطعم شواء كوري تقليدي',
  hero_caption_2 = 'معرفة مفردات الطعام تسهل الطلب بالكورية'
WHERE lang = 'ar' AND title LIKE '%طعام%';

-- Arabic Greetings
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=1200&q=80',
  hero_alt = 'أشخاص يتبادلون التحية بالطريقة الكورية',
  hero_image_2 = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
  hero_alt_2 = 'أصدقاء يتبادلون التحية',
  hero_caption_2 = 'التحيات الكورية تتغير حسب مستوى الرسمية'
WHERE lang = 'ar' AND title LIKE '%تحية%';

-- Arabic Seoul Travel
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1200&q=80',
  hero_alt = 'أفق مدينة سيول مع برج نامسان',
  hero_image_2 = 'https://images.unsplash.com/photo-1546874177-9e664107314e?w=1200&q=80',
  hero_alt_2 = 'شارع تقليدي في سيول مع فوانيس',
  hero_caption_2 = 'سيول تجمع بين التراث والحداثة'
WHERE lang = 'ar' AND title LIKE '%سيول%';

-- Arabic Cafe Culture
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80',
  hero_alt = 'مقهى كوري بتصميم جميل',
  hero_image_2 = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
  hero_alt_2 = 'فن القهوة والحلويات الكورية',
  hero_caption_2 = 'المقاهي الكورية مشهورة بتصاميمها الفريدة'
WHERE lang = 'ar' AND title LIKE '%مقاهي%';

-- Arabic Work Culture
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80',
  hero_alt = 'ثقافة العمل والأعمال الكورية',
  hero_image_2 = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80',
  hero_alt_2 = 'اجتماع فريق عمل في شركة كورية',
  hero_caption_2 = 'فهم ثقافة العمل الكورية مهم للأعمال'
WHERE lang = 'ar' AND title LIKE '%عمل%';

-- Arabic Songs / K-Pop
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
  hero_alt = 'حفل كيبوب مع أضواء ملونة',
  hero_image_2 = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
  hero_alt_2 = 'شخص يستمع لموسيقى كورية',
  hero_caption_2 = 'الأغاني الكورية طريقة رائعة لتحسين الاستماع'
WHERE lang = 'ar' AND title LIKE '%أغاني%';

-- Arabic Hanbok
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=1200&q=80',
  hero_alt = 'الزي التقليدي الكوري الهانبوك',
  hero_image_2 = 'https://images.unsplash.com/photo-1583862089880-6e06e82c4556?w=1200&q=80',
  hero_alt_2 = 'أشخاص يرتدون الهانبوك في قصر كوري',
  hero_caption_2 = 'الهانبوك يُرتدى في المناسبات والأعياد الكورية'
WHERE lang = 'ar' AND title LIKE '%هانبوك%';

-- Arabic Family Names
UPDATE blog_posts SET
  hero_image = 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1200&q=80',
  hero_alt = 'عائلة كورية جالسة معًا',
  hero_image_2 = 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80',
  hero_alt_2 = 'تجمع عائلي كوري في عطلة',
  hero_caption_2 = 'أسماء أفراد العائلة تتغير حسب العلاقة'
WHERE lang = 'ar' AND title LIKE '%أسر%';

-- ═══════════════════════════════════════════════════
-- CATCH-ALL: fill missing hero_image_2 for any remaining posts
-- ═══════════════════════════════════════════════════

UPDATE blog_posts SET
  hero_image_2 = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  hero_alt_2 = CASE WHEN lang = 'ar' THEN 'طلاب يتعلمون الكورية في فصل دراسي' ELSE 'Students learning Korean in a classroom' END,
  hero_caption_2 = CASE WHEN lang = 'ar' THEN 'انضم لمجتمع كلوفرز لتعلم الكورية' ELSE 'Join KLovers to start learning Korean' END
WHERE hero_image_2 IS NULL OR hero_image_2 = '';
