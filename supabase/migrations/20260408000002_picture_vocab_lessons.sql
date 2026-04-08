-- Create 15 picture-vocab lessons for the Picture Vocabulary textbook
-- Lessons 1-5: At Home, 6-10: Out in the City, 11-15: World Around Us

INSERT INTO public.textbook_lessons
  (sort_order, emoji, title_en, title_ko, title_ar, description, description_ar, book, topik_level, is_published)
VALUES
  (1, '🛏️', 'Bedroom Vocabulary', '침실 어휘', 'مفردات غرفة النوم', 'Learn furniture and bedroom items.', 'تعلم أثاث وأشياء غرفة النوم.', 'picture-vocab', 0, true),
  (2, '🚿', 'Bathroom Items', '욕실 물건', 'أشياء الحمام', 'Master bathroom vocabulary and toiletries.', 'أتقن مفردات الحمام والعناية الشخصية.', 'picture-vocab', 0, true),
  (3, '🍳', 'Kitchen Essentials', '주방 필수물', 'أدوات المطبخ', 'Cooking tools and kitchen appliances.', 'أدوات الطهي والأجهزة.', 'picture-vocab', 0, true),
  (4, '🛋️', 'Living Room Items', '거실 물건', 'أشياء غرفة المعيشة', 'Furniture and entertainment items.', 'الأثاث وأشياء الترفيه.', 'picture-vocab', 0, true),
  (5, '👕', 'Clothing and Accessories', '의류와 악세서리', 'الملابس والإكسسوارات', 'Learn types of clothing and fashion items.', 'تعلم أنواع الملابس والأزياء.', 'picture-vocab', 0, true),
  (6, '🏪', 'Supermarket Vocabulary', '슈퍼마켓 어휘', 'مفردات السوبرماركت', 'Food items and shopping essentials.', 'المواد الغذائية والضروريات.', 'picture-vocab', 0, true),
  (7, '🍽️', 'Restaurant Dining', '레스토랑 식사', 'تناول الطعام في المطعم', 'Menu items and dining vocabulary.', 'مفردات الطعام والخدمات.', 'picture-vocab', 0, true),
  (8, '☕', 'Café Vocabulary', '카페 어휘', 'مفردات المقهى', 'Beverages and café items.', 'المشروبات وأشياء المقهى.', 'picture-vocab', 0, true),
  (9, '🚌', 'Transportation & Vehicles', '교통수단', 'وسائل النقل', 'Learn vehicles and transportation types.', 'تعلم المركبات ووسائل النقل.', 'picture-vocab', 0, true),
  (10, '🏥', 'Hospital & Healthcare', '병원과 의료', 'المستشفى والرعاية الصحية', 'Medical vocabulary and healthcare items.', 'مفردات طبية وأشياء الرعاية.', 'picture-vocab', 0, true),
  (11, '🌳', 'Park & Nature', '공원과 자연', 'الحديقة والطبيعة', 'Outdoor activities and natural items.', 'الأنشطة الخارجية والأشياء الطبيعية.', 'picture-vocab', 0, true),
  (12, '⛅', 'Weather & Seasons', '날씨와 계절', 'الطقس والفصول', 'Weather conditions and seasonal items.', 'أحوال الطقس والأشياء الموسمية.', 'picture-vocab', 0, true),
  (13, '👤', 'Body Parts & Health', '신체 부위와 건강', 'أجزاء الجسم والصحة', 'Human body and health-related terms.', 'أجزاء الجسم والمصطلحات الصحية.', 'picture-vocab', 0, true),
  (14, '😊', 'Emotions & Expressions', '감정과 표현', 'المشاعر والتعبيرات', 'Feelings and facial expressions.', 'المشاعر والتعبيرات الوجهية.', 'picture-vocab', 0, true),
  (15, '🎉', 'Celebrations & Holidays', '축제와 휴일', 'الاحتفالات والعطل', 'Special events and celebration items.', 'الأحداث الخاصة والاحتفالات.', 'picture-vocab', 0, true)
ON CONFLICT (sort_order, book) DO UPDATE SET
  emoji = EXCLUDED.emoji,
  title_en = EXCLUDED.title_en,
  title_ko = EXCLUDED.title_ko,
  title_ar = EXCLUDED.title_ar,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  is_published = EXCLUDED.is_published;
