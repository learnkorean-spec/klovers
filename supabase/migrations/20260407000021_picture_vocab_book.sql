-- Picture Vocabulary book: 15 lessons + vocabulary with Arabic meanings
-- Book slug: picture-vocab

-- ────────────────────────────────────────────
-- 1. Lesson metadata (textbook_lessons)
-- ────────────────────────────────────────────
INSERT INTO public.textbook_lessons
  (sort_order, emoji, title_en, title_ko, title_ar, description, description_ar, book, topik_level, is_published)
VALUES
  -- World 1: At Home
  (1,  '🛏️', 'Bedroom',       '침실',    'غرفة النوم',       'Furniture and objects in the bedroom.',          'أثاث وأشياء غرفة النوم.',            'picture-vocab', 1, true),
  (2,  '🚿', 'Bathroom',      '욕실',    'الحمام',           'Everything you find in the bathroom.',           'كل ما تجده في الحمام.',              'picture-vocab', 1, true),
  (3,  '🍳', 'Kitchen',       '부엌',    'المطبخ',           'Appliances, tools and objects in the kitchen.',  'الأجهزة والأدوات في المطبخ.',        'picture-vocab', 1, true),
  (4,  '🛋️', 'Living Room',   '거실',    'غرفة المعيشة',     'Furniture and items in the living room.',        'أثاث وأشياء غرفة المعيشة.',          'picture-vocab', 1, true),
  (5,  '👔', 'Getting Dressed','옷 입기', 'ارتداء الملابس',   'Clothing items and accessories.',                'قطع الملابس والإكسسوارات.',          'picture-vocab', 1, true),
  -- World 2: Out in the City
  (6,  '🛒', 'Supermarket',   '슈퍼마켓','السوبرماركت',       'Shopping cart, aisles, checkout and products.',  'عربة التسوق والممرات وصندوق الدفع.',  'picture-vocab', 1, true),
  (7,  '🍽️', 'Restaurant',    '식당',    'المطعم',           'Ordering food, utensils, and the bill.',         'طلب الطعام والأدوات والفاتورة.',     'picture-vocab', 1, true),
  (8,  '☕', 'Café',          '카페',    'الكافيه',          'Coffee drinks, pastries and café scene.',        'مشروبات القهوة والمعجنات.',          'picture-vocab', 1, true),
  (9,  '🚇', 'Transportation', '교통수단','وسائل المواصلات',  'Buses, subway, taxi and getting around.',        'الحافلات والمترو وسيارة الأجرة.',    'picture-vocab', 1, true),
  (10, '🏥', 'Hospital',      '병원',    'المستشفى',         'Doctors, nurses, medicine and the clinic.',      'الأطباء والممرضات والدواء.',         'picture-vocab', 2, true),
  -- World 3: World Around Us
  (11, '🌳', 'Park',          '공원',    'الحديقة',          'Trees, benches, pond and outdoor scenery.',      'أشجار ومقاعد وبركة ومشاهد خارجية.', 'picture-vocab', 1, true),
  (12, '🌦️', 'Weather',       '날씨',    'الطقس',            'Rain, snow, sun, clouds and wind.',              'المطر والثلج والشمس والسحاب.',        'picture-vocab', 1, true),
  (13, '🫀', 'Body Parts',    '신체',    'أجزاء الجسم',      'Head, face, hands, feet and more.',              'الرأس والوجه واليدين والقدمين.',     'picture-vocab', 1, true),
  (14, '😊', 'Emotions',      '감정',    'المشاعر',          'Happy, sad, angry, surprised and more.',         'سعيد وحزين وغاضب ومفاجأة والمزيد.', 'picture-vocab', 1, true),
  (15, '🎉', 'Celebration',   '축하',    'الاحتفال',         'Cake, balloons, gifts, candles and fireworks.',  'كيك وبالونات وهدايا وشموع.',         'picture-vocab', 2, true)
ON CONFLICT (book, sort_order) DO UPDATE SET
  title_en = EXCLUDED.title_en, title_ko = EXCLUDED.title_ko, title_ar = EXCLUDED.title_ar,
  description = EXCLUDED.description, description_ar = EXCLUDED.description_ar,
  emoji = EXCLUDED.emoji, topik_level = EXCLUDED.topik_level, is_published = EXCLUDED.is_published;

-- ────────────────────────────────────────────
-- 2. Vocabulary content
-- ────────────────────────────────────────────

-- Lesson 1: Bedroom
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('침대',     'chimdae',       'bed',          'سرير',            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop', 1),
  ('베개',     'begae',         'pillow',        'وسادة',           'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop', 2),
  ('이불',     'ibul',          'blanket',       'بطانية',          'https://images.unsplash.com/photo-1567016376408-0226e4d0cdd6?w=400&h=400&fit=crop', 3),
  ('커튼',     'keoteun',       'curtains',      'ستائر',           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop', 4),
  ('옷장',     'otjang',        'wardrobe',      'خزانة ملابس',     NULL, 5),
  ('거울',     'geoul',         'mirror',        'مرآة',            NULL, 6),
  ('알람시계', 'allamsi-gye',   'alarm clock',   'منبّه',           'https://images.unsplash.com/photo-1495261606038-84dc5f97ffa9?w=400&h=400&fit=crop', 7),
  ('창문',     'changmun',      'window',        'نافذة',           NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 1
ON CONFLICT DO NOTHING;

-- Lesson 2: Bathroom
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('세면대', 'semyendae',  'washbasin',    'حوض الغسيل',      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop', 1),
  ('샤워기', 'syawogi',    'shower',       'دش',              NULL, 2),
  ('욕조',   'yokjo',      'bathtub',      'حوض الاستحمام',   NULL, 3),
  ('수건',   'sugeon',     'towel',        'منشفة',           NULL, 4),
  ('치약',   'chiyak',     'toothpaste',   'معجون أسنان',     NULL, 5),
  ('칫솔',   'chitsol',    'toothbrush',   'فرشاة أسنان',     NULL, 6),
  ('비누',   'binu',       'soap',         'صابون',           NULL, 7),
  ('샴푸',   'syampu',     'shampoo',      'شامبو',           NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 2
ON CONFLICT DO NOTHING;

-- Lesson 3: Kitchen
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('냉장고',   'naengjanggo',  'refrigerator',  'ثلاجة',          'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=400&fit=crop', 1),
  ('오븐',     'obeun',        'oven',           'فرن',            NULL, 2),
  ('냄비',     'naembi',       'pot',            'قدر',            NULL, 3),
  ('프라이팬', 'peuraipaen',   'frying pan',     'مقلاة',          NULL, 4),
  ('칼',       'kal',          'knife',          'سكين',           'https://images.unsplash.com/photo-1566454419290-57a64afe30ac?w=400&h=400&fit=crop', 5),
  ('도마',     'doma',         'cutting board',  'لوح التقطيع',    NULL, 6),
  ('접시',     'jeopsi',       'plate',          'صحن',            NULL, 7),
  ('컵',       'keop',         'cup',            'كوب',            'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop', 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 3
ON CONFLICT DO NOTHING;

-- Lesson 4: Living Room
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('소파',   'sopa',       'sofa',           'أريكة',         'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop', 1),
  ('텔레비전','tellebijeon','television',     'تلفزيون',       NULL, 2),
  ('리모컨', 'limokon',    'remote control', 'جهاز التحكم',   NULL, 3),
  ('테이블', 'teibeul',    'table',          'طاولة',         NULL, 4),
  ('책장',   'chaekjang',  'bookshelf',      'رف الكتب',      NULL, 5),
  ('카펫',   'kapet',      'carpet',         'سجادة',         NULL, 6),
  ('램프',   'laempu',     'lamp',           'مصباح',         NULL, 7),
  ('화분',   'hwabun',     'plant pot',      'نبتة',          NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 4
ON CONFLICT DO NOTHING;

-- Lesson 5: Getting Dressed
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('셔츠', 'syeocheu', 'shirt',   'قميص',         NULL, 1),
  ('바지', 'baji',     'trousers','بنطلون',        NULL, 2),
  ('치마', 'chima',    'skirt',   'تنورة',         NULL, 3),
  ('재킷', 'jaekit',   'jacket',  'جاكيت',         NULL, 4),
  ('신발', 'sinbal',   'shoes',   'حذاء',          NULL, 5),
  ('양말', 'yangmal',  'socks',   'جوارب',         NULL, 6),
  ('모자', 'moja',     'hat',     'قبعة',          NULL, 7),
  ('가방', 'gabang',   'bag',     'حقيبة',         'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 5
ON CONFLICT DO NOTHING;

-- Lesson 6: Supermarket
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('카트',   'kateu',       'shopping cart', 'عربة تسوق',     NULL, 1),
  ('계산대', 'gyesandae',   'checkout',      'صندوق الدفع',   NULL, 2),
  ('채소',   'chaeso',      'vegetables',    'خضروات',        NULL, 3),
  ('과일',   'gwail',       'fruit',         'فاكهة',         NULL, 4),
  ('할인',   'halin',       'discount',      'خصم',           NULL, 5),
  ('영수증', 'yeongsujeung','receipt',       'إيصال',         NULL, 6),
  ('봉투',   'bongtu',      'bag',           'كيس',           NULL, 7),
  ('가격표', 'gagyeopyo',   'price tag',     'بطاقة السعر',   NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 6
ON CONFLICT DO NOTHING;

-- Lesson 7: Restaurant
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('메뉴판', 'menyupan',    'menu',       'قائمة الطعام',  NULL, 1),
  ('웨이터', 'weiteo',      'waiter',     'نادل',          NULL, 2),
  ('주문',   'jumun',       'order',      'طلب',           NULL, 3),
  ('젓가락', 'jeotgarak',   'chopsticks', 'عيدان الطعام',  NULL, 4),
  ('냅킨',   'naepkin',     'napkin',     'منديل ورقي',    NULL, 5),
  ('계산서', 'gyesanseo',   'bill',       'الفاتورة',      NULL, 6),
  ('팁',     'tip',         'tip',        'إكرامية',       NULL, 7),
  ('예약',   'yeyak',       'reservation','حجز',           NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 7
ON CONFLICT DO NOTHING;

-- Lesson 8: Café
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('아메리카노','amelikano',  'americano',   'أمريكانو',     'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', 1),
  ('라테',     'lateu',      'latte',       'لاتيه',        NULL, 2),
  ('케이크',   'keikeu',     'cake',        'كيك',          NULL, 3),
  ('머그컵',   'meogeukeop', 'mug',         'كوب',          NULL, 4),
  ('빨대',     'ppaldae',    'straw',       'قشة',          NULL, 5),
  ('쿠키',     'kuki',       'cookie',      'بسكويت',       NULL, 6),
  ('바리스타', 'bariseuteo', 'barista',     'باريستا',      NULL, 7),
  ('테라스',   'terasu',     'terrace',     'تراس',         NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 8
ON CONFLICT DO NOTHING;

-- Lesson 9: Transportation
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('버스',     'beoseu',       'bus',           'حافلة',           NULL, 1),
  ('지하철',   'jihacheol',    'subway/metro',  'مترو',            NULL, 2),
  ('택시',     'taeksi',       'taxi',          'سيارة أجرة',      NULL, 3),
  ('기차',     'gicha',        'train',         'قطار',            NULL, 4),
  ('자전거',   'jajeongeo',    'bicycle',       'دراجة',           NULL, 5),
  ('정류장',   'jeongnyujang', 'bus stop',      'موقف الحافلة',    NULL, 6),
  ('표',       'pyo',          'ticket',        'تذكرة',           NULL, 7),
  ('교통카드', 'gyotongkadeu', 'transit card',  'بطاقة مواصلات',   NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 9
ON CONFLICT DO NOTHING;

-- Lesson 10: Hospital
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('의사',   'uisa',         'doctor',       'طبيب',           NULL, 1),
  ('간호사', 'ganhosa',      'nurse',        'ممرضة',          NULL, 2),
  ('약',     'yak',          'medicine',     'دواء',           NULL, 3),
  ('주사',   'jusa',         'injection',    'حقنة',           NULL, 4),
  ('청진기', 'cheongjingi',  'stethoscope',  'سماعة طبية',     NULL, 5),
  ('처방전', 'cheobanjeon',  'prescription', 'وصفة طبية',      NULL, 6),
  ('대기실', 'daegisil',     'waiting room', 'غرفة الانتظار',  NULL, 7),
  ('체온계', 'cheongyegye',  'thermometer',  'ميزان الحرارة',  NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 10
ON CONFLICT DO NOTHING;

-- Lesson 11: Park
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('벤치',   'benchi',    'bench',        'مقعد',    NULL, 1),
  ('나무',   'namu',      'tree',         'شجرة',    'https://images.unsplash.com/photo-1440964829947-ca3277bd37f8?w=400&h=400&fit=crop', 2),
  ('꽃',     'kkot',      'flower',       'زهرة',    'https://images.unsplash.com/photo-1490750967868-88df5691bb30?w=400&h=400&fit=crop', 3),
  ('연못',   'yeonmot',   'pond',         'بركة',    NULL, 4),
  ('잔디',   'jandi',     'grass',        'عشب',     NULL, 5),
  ('분수',   'bunsu',     'fountain',     'نافورة',  NULL, 6),
  ('산책로', 'sanchakro', 'walking path', 'ممشى',    NULL, 7),
  ('새',     'sae',       'bird',         'طائر',    NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 11
ON CONFLICT DO NOTHING;

-- Lesson 12: Weather
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('비',     'bi',      'rain',      'مطر',        'https://images.unsplash.com/photo-1508193638397-1cc4ff75af6c?w=400&h=400&fit=crop', 1),
  ('눈',     'nun',     'snow',      'ثلج',        NULL, 2),
  ('태양',   'taeyang', 'sun',       'شمس',        NULL, 3),
  ('구름',   'gureum',  'cloud',     'سحابة',      NULL, 4),
  ('바람',   'baram',   'wind',      'رياح',       NULL, 5),
  ('번개',   'beongae', 'lightning', 'برق',        NULL, 6),
  ('무지개', 'mujigae', 'rainbow',   'قوس قزح',    NULL, 7),
  ('안개',   'angae',   'fog',       'ضباب',       NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 12
ON CONFLICT DO NOTHING;

-- Lesson 13: Body Parts
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('머리', 'meori',  'head',  'رأس',   NULL, 1),
  ('눈',   'nun',    'eyes',  'عيون',  NULL, 2),
  ('코',   'ko',     'nose',  'أنف',   NULL, 3),
  ('입',   'ip',     'mouth', 'فم',    NULL, 4),
  ('귀',   'gwi',    'ear',   'أذن',   NULL, 5),
  ('손',   'son',    'hand',  'يد',    NULL, 6),
  ('발',   'bal',    'foot',  'قدم',   NULL, 7),
  ('등',   'deung',  'back',  'ظهر',   NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 13
ON CONFLICT DO NOTHING;

-- Lesson 14: Emotions
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('행복하다',  'haengbokhada', 'to be happy',       'سعيد',         NULL, 1),
  ('슬프다',    'seulpeuda',    'to be sad',         'حزين',         NULL, 2),
  ('화나다',    'hwanada',      'to be angry',       'غاضب',         NULL, 3),
  ('놀라다',    'nollada',      'to be surprised',   'متفاجئ',       NULL, 4),
  ('무섭다',    'museopda',     'to be scared',      'خائف',         NULL, 5),
  ('피곤하다',  'pigonhada',    'to be tired',       'متعب',         NULL, 6),
  ('설레다',    'seolleda',     'to feel excited',   'متحمس',        NULL, 7),
  ('부끄럽다',  'bukkeureupda', 'to be embarrassed', 'محرج',         NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 14
ON CONFLICT DO NOTHING;

-- Lesson 15: Celebration
INSERT INTO public.lesson_vocabulary (lesson_id, korean, romanization, meaning, meaning_ar, image_url, sort_order)
SELECT l.id, v.korean, v.romanization, v.meaning, v.meaning_ar, v.image_url, v.sort_order
FROM public.textbook_lessons l, (VALUES
  ('케이크', 'keikeu',    'cake',       'كيك',          'https://images.unsplash.com/photo-1578985545062-57e4e71e679d?w=400&h=400&fit=crop', 1),
  ('풍선',   'pungseon',  'balloon',    'بالون',        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop', 2),
  ('선물',   'seonmul',   'gift',       'هدية',         NULL, 3),
  ('초',     'cho',       'candle',     'شمعة',         NULL, 4),
  ('파티',   'pati',      'party',      'حفلة',         NULL, 5),
  ('카드',   'kadeu',     'greeting card','بطاقة تهنئة',NULL, 6),
  ('폭죽',   'pokjuk',    'fireworks',  'ألعاب نارية',  NULL, 7),
  ('박수',   'baksu',     'applause',   'تصفيق',        NULL, 8)
) AS v(korean, romanization, meaning, meaning_ar, image_url, sort_order)
WHERE l.book = 'picture-vocab' AND l.sort_order = 15
ON CONFLICT DO NOTHING;
