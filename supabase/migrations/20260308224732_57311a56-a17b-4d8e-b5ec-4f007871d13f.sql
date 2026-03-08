
-- Add book column to textbook_lessons
ALTER TABLE public.textbook_lessons
  ADD COLUMN IF NOT EXISTS book text NOT NULL DEFAULT 'korean-1';

-- Insert 32 Daily Routine Korean lessons
INSERT INTO public.textbook_lessons (sort_order, emoji, title_en, title_ko, description, title_ar, description_ar, book, is_published)
VALUES
  (1, '😴', 'Sleeping', '잠자기', 'Learn Korean verbs related to sleeping, dreaming, and bedtime routines.', 'النوم', 'تعلم الأفعال الكورية المتعلقة بالنوم والأحلام وروتين وقت النوم.', 'daily-routine', true),
  (2, '⏰', 'Waking Up', '일어나기', 'Master vocabulary for waking up and starting your day.', 'الاستيقاظ', 'أتقن المفردات المتعلقة بالاستيقاظ وبدء يومك.', 'daily-routine', true),
  (3, '🚿', 'Showering', '샤워하기', 'Learn shower and bathing related expressions.', 'الاستحمام', 'تعلم التعبيرات المتعلقة بالاستحمام.', 'daily-routine', true),
  (4, '💇', 'Washing Hair', '머리 감기', 'Vocabulary for washing and caring for your hair.', 'غسل الشعر', 'مفردات غسل الشعر والعناية به.', 'daily-routine', true),
  (5, '🧼', 'Washing Face', '세수하기', 'Learn face washing and skincare vocabulary.', 'غسل الوجه', 'تعلم مفردات غسل الوجه والعناية بالبشرة.', 'daily-routine', true),
  (6, '🪥', 'Brushing Teeth', '양치하기', 'Dental hygiene vocabulary in Korean.', 'تنظيف الأسنان', 'مفردات نظافة الأسنان بالكورية.', 'daily-routine', true),
  (7, '🪒', 'Shaving', '면도하기', 'Learn shaving and grooming expressions.', 'الحلاقة', 'تعلم تعبيرات الحلاقة والتجميل.', 'daily-routine', true),
  (8, '👓', 'Glasses & Contact Lenses', '안경과 렌즈', 'Vocabulary about glasses and contact lenses.', 'النظارات والعدسات', 'مفردات عن النظارات والعدسات اللاصقة.', 'daily-routine', true),
  (9, '👔', 'Getting Dressed', '옷 입기', 'Learn how to talk about getting dressed in Korean.', 'ارتداء الملابس', 'تعلم كيف تتحدث عن ارتداء الملابس بالكورية.', 'daily-routine', true),
  (10, '💄', 'Makeup', '화장하기', 'Korean vocabulary for makeup and beauty routines.', 'المكياج', 'مفردات كورية للمكياج وروتين التجميل.', 'daily-routine', true),
  (11, '🍳', 'Cooking', '요리하기', 'Learn cooking verbs and kitchen vocabulary.', 'الطبخ', 'تعلم أفعال الطبخ ومفردات المطبخ.', 'daily-routine', true),
  (12, '🍽️', 'Eating', '식사하기', 'Master mealtime vocabulary and expressions.', 'الأكل', 'أتقن مفردات وتعبيرات وقت الطعام.', 'daily-routine', true),
  (13, '🍽️', 'Doing the Dishes', '설거지하기', 'Learn dishwashing and cleanup vocabulary.', 'غسل الأطباق', 'تعلم مفردات غسل الأطباق والتنظيف.', 'daily-routine', true),
  (14, '🧹', 'Cleaning', '청소하기', 'House cleaning vocabulary and expressions.', 'التنظيف', 'مفردات وتعبيرات تنظيف المنزل.', 'daily-routine', true),
  (15, '👕', 'Laundry', '빨래하기', 'Learn laundry-related Korean vocabulary.', 'الغسيل', 'تعلم مفردات كورية متعلقة بالغسيل.', 'daily-routine', true),
  (16, '🌱', 'Gardening', '정원 가꾸기', 'Gardening and plant care vocabulary.', 'البستنة', 'مفردات البستنة والعناية بالنباتات.', 'daily-routine', true),
  (17, '📱', 'Telephone', '전화하기', 'Phone call vocabulary and expressions.', 'الهاتف', 'مفردات وتعبيرات المكالمات الهاتفية.', 'daily-routine', true),
  (18, '📺', 'Television', '텔레비전 보기', 'TV watching vocabulary in Korean.', 'التلفزيون', 'مفردات مشاهدة التلفزيون بالكورية.', 'daily-routine', true),
  (19, '📻', 'Radio', '라디오 듣기', 'Radio listening vocabulary and expressions.', 'الراديو', 'مفردات وتعبيرات الاستماع للراديو.', 'daily-routine', true),
  (20, '🌐', 'Web Surfing', '인터넷 하기', 'Internet and web browsing vocabulary.', 'تصفح الإنترنت', 'مفردات الإنترنت وتصفح الويب.', 'daily-routine', true),
  (21, '📖', 'Reading', '책 읽기', 'Reading-related vocabulary and expressions.', 'القراءة', 'مفردات وتعبيرات متعلقة بالقراءة.', 'daily-routine', true),
  (22, '🪑', 'Sitting', '앉기', 'Learn sitting positions and related verbs.', 'الجلوس', 'تعلم أوضاع الجلوس والأفعال المتعلقة.', 'daily-routine', true),
  (23, '🛋️', 'Lying Down', '눕기', 'Lying down and resting vocabulary.', 'الاستلقاء', 'مفردات الاستلقاء والراحة.', 'daily-routine', true),
  (24, '🧍', 'Standing', '서기', 'Standing positions and related expressions.', 'الوقوف', 'أوضاع الوقوف والتعبيرات المتعلقة.', 'daily-routine', true),
  (25, '👂', 'Hearing', '듣기', 'Hearing and listening vocabulary.', 'السمع', 'مفردات السمع والاستماع.', 'daily-routine', true),
  (26, '👁️', 'Seeing', '보기', 'Seeing and vision-related vocabulary.', 'الرؤية', 'مفردات متعلقة بالرؤية والبصر.', 'daily-routine', true),
  (27, '👅', 'Tasting', '맛보기', 'Tasting and flavor vocabulary.', 'التذوق', 'مفردات التذوق والنكهات.', 'daily-routine', true),
  (28, '✋', 'Touching', '만지기', 'Touch and texture vocabulary.', 'اللمس', 'مفردات اللمس والملمس.', 'daily-routine', true),
  (29, '🚶', 'Walking', '걷기', 'Walking and movement vocabulary.', 'المشي', 'مفردات المشي والحركة.', 'daily-routine', true),
  (30, '💍', 'Marriage', '결혼', 'Marriage and wedding vocabulary.', 'الزواج', 'مفردات الزواج والأعراس.', 'daily-routine', true),
  (31, '🎂', 'Birthday', '생일', 'Birthday celebration vocabulary.', 'عيد الميلاد', 'مفردات الاحتفال بعيد الميلاد.', 'daily-routine', true),
  (32, '📦', 'Moving House', '이사하기', 'Moving and relocation vocabulary.', 'الانتقال', 'مفردات الانتقال والتنقل.', 'daily-routine', true);
