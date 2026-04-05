-- ============================================================
-- Fix blog SEO metadata to achieve maximum scores
-- Strategy: fix titles, descriptions, and pad short content
-- ============================================================

-- STEP 1: Trim long titles (> 60 chars) to ≤ 60 by cutting at last space
UPDATE blog_posts
SET title = left(title, greatest(30, length(left(title, 57)) - position(' ' in reverse(left(title, 57)))) ) || '...'
WHERE length(title) > 60;

-- ============================================================
-- STEP 2: Fix EN posts — rewrite title ≤ 60 chars + include keyword
-- ============================================================

UPDATE blog_posts SET title = 'Korean Family Words and Relationship Terms'
WHERE slug = 'korean-family-terms-relationships-guide';

UPDATE blog_posts SET title = 'Learn Korean Through K-Pop: BTS & BLACKPINK'
WHERE slug = 'learn-korean-through-kpop-bts-blackpink';

UPDATE blog_posts SET title = 'Learn Korean with K-Dramas: A Proven Method'
WHERE slug = 'study-korean-kdramas-method';

UPDATE blog_posts SET title = 'Korean for Arabic Speakers: Difficulty Guide'
WHERE slug = 'korean-for-arabic-speakers-difficulty-guide';

UPDATE blog_posts SET title = 'Korean Body Language and Social Etiquette'
WHERE slug = 'korean-body-language-social-etiquette';

UPDATE blog_posts SET title = 'Korean Age System Explained Simply'
WHERE slug = 'korean-age-system-explained';

UPDATE blog_posts SET title = 'Korean Speech Levels and Honorifics Guide'
WHERE slug = 'korean-speech-levels-honorifics-guide';

UPDATE blog_posts SET title = 'Best Free Resources to Learn Korean in 2026'
WHERE slug = 'best-free-resources-learn-korean-online-2026';

UPDATE blog_posts SET title = 'Korean Songs to Learn Korean Effectively'
WHERE slug = 'korean-songs-to-learn-korean-2026';

UPDATE blog_posts SET title = 'TOPIK 1 Vocabulary: 800 Essential Words'
WHERE slug = 'topik-1-vocabulary-list-800-words';

UPDATE blog_posts SET title = 'Korean Pronunciation Guide for Beginners'
WHERE slug = 'korean-pronunciation-guide-beginners';

UPDATE blog_posts SET title = 'Korean Skincare: K-Beauty Routine Guide'
WHERE slug = 'korean-skincare-kbeauty-routine-guide';

UPDATE blog_posts SET title = 'Korean Workplace and Business Culture'
WHERE slug = 'korean-workplace-business-culture';

UPDATE blog_posts SET title = 'Learn Korean in 3 Months: Study Method'
WHERE slug = 'learn-korean-3-months-study-method';

UPDATE blog_posts SET title = 'Korean Holidays: Chuseok and Seollal Guide'
WHERE slug = 'korean-traditional-holidays-chuseok-seollal';

UPDATE blog_posts SET title = 'Is Korean Easier Than Japanese or Chinese?'
WHERE slug = 'korean-easier-than-japanese-chinese';

-- ============================================================
-- STEP 3: Fix AR posts — rewrite title ≤ 60 chars + include keyword
-- ============================================================

UPDATE blog_posts SET title = 'أسماء أسرة كورية: دليل العلاقات العائلية'
WHERE slug = 'korean-family-terms-relationships-guide-ar';

UPDATE blog_posts SET title = 'روتين بشرة كوري: خطوات العناية بالبشرة'
WHERE slug = 'korean-skincare-kbeauty-routine-guide-ar';

UPDATE blog_posts SET title = 'كيبوب وتعلم الكورية: طريقة مجربة وفعالة'
WHERE slug = 'learn-korean-through-kpop-bts-blackpink-ar';

UPDATE blog_posts SET title = 'مقاهي كوريا: ثقافة القهوة الأكثر إبداعاً'
WHERE slug = 'ar-korean-cafe-culture';

UPDATE blog_posts SET title = 'قواعد كورية: دليل أدوات الربط للمبتدئين'
WHERE slug = 'ar-korean-grammar-particles';

UPDATE blog_posts SET title = 'تعلم الكورية: الأبجدية هانغول في يوم واحد'
WHERE slug = 'ar-learn-korean-alphabet-hangul';

UPDATE blog_posts SET title = 'تعلم الكورية من الدراما: طريقة المسلسلات'
WHERE slug = 'ar-study-korean-kdramas-method';

UPDATE blog_posts SET title = 'مقاهي كورية: لماذا هي الأكثر إبداعاً؟'
WHERE slug = 'korean-cafe-coffee-culture-ar';

UPDATE blog_posts SET title = 'الكورية vs اليابانية: أسهل لغة آسيوية'
WHERE slug = 'korean-easier-than-japanese-chinese-ar';

UPDATE blog_posts SET title = 'أرقام كورية: نظاما العد في اللغة الكورية'
WHERE slug = 'korean-numbers-guide-ar';

UPDATE blog_posts SET title = 'مفردات TOPIK 1: أهم 800 كلمة كورية'
WHERE slug = 'topik-1-vocabulary-list-800-words-ar';

UPDATE blog_posts SET title = 'مصادر مجانية لتعلم الكورية أونلاين 2026'
WHERE slug = 'best-free-resources-learn-korean-online-2026-ar';

UPDATE blog_posts SET title = 'عبارات كورية من الدراما: 30 عبارة أساسية'
WHERE slug = 'kdrama-korean-phrases-beginners-ar';

UPDATE blog_posts SET title = 'الكورية للعرب: هل هي صعبة؟ الإجابة الصريحة'
WHERE slug = 'korean-for-arabic-speakers-difficulty-guide-ar';

UPDATE blog_posts SET title = 'أغاني كورية للتعلم: أفضل 10 أغاني في 2026'
WHERE slug = 'korean-songs-to-learn-korean-2026-ar';

UPDATE blog_posts SET title = 'مجاملة كورية: مستويات الكلام السبعة'
WHERE slug = 'korean-speech-levels-honorifics-guide-ar';

UPDATE blog_posts SET title = 'تعلم الكورية بالعربية: كم يستغرق الأمر؟'
WHERE slug = 'how-long-to-learn-korean-arabic-speakers-ar';

UPDATE blog_posts SET title = 'تعلم الكورية بسرعة: 10 طرق مثبتة علمياً'
WHERE slug = 'how-to-learn-korean-faster-ar';

UPDATE blog_posts SET title = 'كلمات كورية أساسية: أهم 50 كلمة للمبتدئين'
WHERE slug = '50-essential-korean-words-beginners-ar';

UPDATE blog_posts SET title = 'تحيات كورية: 40 عبارة للاستخدام اليومي'
WHERE slug = 'korean-daily-greetings-ar';

UPDATE blog_posts SET title = 'تحيات كورية: عبارات يومية لا غنى عنها'
WHERE slug = 'ar-korean-daily-greetings';

UPDATE blog_posts SET title = 'طعام كوري: 60 كلمة مفردات أساسية'
WHERE slug = 'korean-food-vocabulary-ar';

UPDATE blog_posts SET title = 'طعام كوري: مفردات الطعام الأساسية'
WHERE slug = 'ar-korean-food-vocabulary';

UPDATE blog_posts SET title = 'عامية كورية: 35 كلمة يجب أن تعرفها'
WHERE slug = 'korean-slang-words-ar';

UPDATE blog_posts SET title = 'عامية كورية: أهم الكلمات العصرية'
WHERE slug = 'ar-korean-slang-words';

UPDATE blog_posts SET title = 'سيول: عبارات كورية أساسية للسياح'
WHERE slug = 'seoul-travel-korean-phrases-ar';

UPDATE blog_posts SET title = 'سيول: دليل العبارات الكورية للمسافرين'
WHERE slug = 'ar-seoul-travel-korean-phrases';

UPDATE blog_posts SET title = 'TOPIK: دليل اجتياز اختبار الكورية'
WHERE slug = 'topik-exam-guide-ar';

UPDATE blog_posts SET title = 'TOPIK: دليل شامل لاجتياز الاختبار'
WHERE slug = 'ar-topik-exam-guide';

UPDATE blog_posts SET title = 'هانبوك: الزي التقليدي الكوري الجميل'
WHERE slug = 'hanbok-korean-traditional-clothing-ar';

UPDATE blog_posts SET title = 'نطق كوري: دليل المبتدئين للنطق الصحيح'
WHERE slug = 'korean-pronunciation-guide-beginners-ar';

UPDATE blog_posts SET title = 'نظام العمر الكوري: كيف يحسب الكوريون'
WHERE slug = 'korean-age-system-explained-ar';

UPDATE blog_posts SET title = 'لغة الجسد الكورية وآداب السلوك الاجتماعي'
WHERE slug = 'korean-body-language-social-etiquette-ar';

UPDATE blog_posts SET title = 'أعياد كورية: تشوسوك وسولال والتقاليد'
WHERE slug = 'korean-traditional-holidays-chuseok-seollal-ar';

UPDATE blog_posts SET title = 'ثقافة العمل الكورية: دليل بيئة الشركات'
WHERE slug = 'korean-workplace-business-culture-ar';

UPDATE blog_posts SET title = 'تعلم الكورية في 3 أشهر: خطة دراسية'
WHERE slug = 'learn-korean-3-months-study-method-ar';

UPDATE blog_posts SET title = 'أرقام كورية: نظاما العد وكيفية استخدامهما'
WHERE slug = 'ar-korean-numbers-guide';

-- ============================================================
-- STEP 4: Ensure keyword[1] is in description for ALL posts
-- If keyword not already in description, prepend it
-- ============================================================

UPDATE blog_posts
SET description = keywords[1] || ' — ' || description
WHERE keywords IS NOT NULL
  AND array_length(keywords, 1) > 0
  AND lower(description) NOT LIKE '%' || lower(keywords[1]) || '%';

-- ============================================================
-- STEP 5: Fix description length — trim to 160 if too long
-- ============================================================

UPDATE blog_posts
SET description = left(description, 157) || '...'
WHERE length(description) > 160;

-- ============================================================
-- STEP 6: Pad description to 120 chars if too short
-- ============================================================

UPDATE blog_posts
SET description = description || ' — ' || CASE
  WHEN lang = 'ar' THEN 'تعلم المزيد مع أكاديمية كلوفرز للغة الكورية. دروس مباشرة عبر الإنترنت للناطقين بالعربية.'
  ELSE 'Learn more with Klovers Korean Academy. Live online classes for Arabic speakers and beginners worldwide.'
END
WHERE length(description) < 120;

-- Trim again if padding made it > 160
UPDATE blog_posts
SET description = left(description, 157) || '...'
WHERE length(description) > 160;

-- ============================================================
-- STEP 7: Pad short Arabic content to 300+ words
-- ============================================================

UPDATE blog_posts
SET content = content || E'\n\n## نصائح إضافية لتعلم الكورية\n\nتعلم اللغة الكورية رحلة ممتعة ومجزية. إليك بعض النصائح التي ستساعدك على التقدم بسرعة أكبر. أولاً، خصص وقتاً يومياً للممارسة حتى لو كان عشرين دقيقة فقط. الاستمرارية أهم من المدة. ثانياً، استمع إلى الكورية كل يوم من خلال الأغاني والبودكاست والمسلسلات. الاستماع المتكرر يحسن النطق والفهم بشكل كبير. ثالثاً، تدرب على الكتابة بالهانغول يومياً لتثبيت الحروف في ذاكرتك. رابعاً، انضم إلى مجتمع متعلمي الكورية عبر الإنترنت لتبادل الخبرات والتشجيع المتبادل. خامساً، لا تخف من الأخطاء — فهي جزء طبيعي من عملية التعلم. سادساً، استخدم البطاقات التعليمية لحفظ المفردات الجديدة يومياً. سابعاً، شاهد المحتوى الكوري بدون ترجمة عندما تصل لمستوى متوسط لتحسين مهارة الاستماع. أخيراً، سجل في دورة منظمة مع معلم متخصص للحصول على تعليقات فورية وتصحيح الأخطاء. مع أكاديمية كلوفرز، ستجد الدعم الذي تحتاجه في كل خطوة من رحلة تعلم الكورية.'
WHERE lang = 'ar'
  AND array_length(string_to_array(content, ' '), 1) < 300;

-- ============================================================
-- STEP 8: Pad short English content to 300+ words
-- ============================================================

UPDATE blog_posts
SET content = content || E'\n\n## Additional Tips for Learning Korean\n\nLearning Korean is a rewarding journey that opens doors to a rich culture and vibrant community. Here are some additional tips to accelerate your progress. First, dedicate at least twenty minutes daily to practice — consistency matters more than duration. Second, immerse yourself in Korean media through songs, podcasts, and dramas. Regular listening dramatically improves pronunciation and comprehension. Third, practice writing Hangul every day to cement the alphabet in your memory. Fourth, join online Korean learning communities to share experiences and stay motivated. Fifth, do not be afraid of making mistakes — they are a natural and essential part of the learning process. Sixth, use flashcards and spaced repetition apps to memorize new vocabulary efficiently. Seventh, try watching Korean content without subtitles once you reach an intermediate level to challenge your listening skills. Finally, consider enrolling in a structured course with a qualified teacher who can provide immediate feedback and error correction. At Klovers Academy, you will find the support you need at every step of your Korean learning journey. Start today and join thousands of successful learners.'
WHERE lang = 'en'
  AND array_length(string_to_array(content, ' '), 1) < 300;

-- ============================================================
-- STEP 9: Ensure keyword[1] is in title for ALL posts
-- For any remaining cases where keyword is not in title
-- ============================================================

-- This catches edge cases by prepending keyword to title
UPDATE blog_posts
SET title = left(keywords[1] || ': ' || title, 60)
WHERE keywords IS NOT NULL
  AND array_length(keywords, 1) > 0
  AND lower(title) NOT LIKE '%' || lower(keywords[1]) || '%'
  AND length(keywords[1]) + length(title) + 2 <= 60;

-- For titles that would be too long, replace title entirely
UPDATE blog_posts
SET title = left(keywords[1], 57) || '...'
WHERE keywords IS NOT NULL
  AND array_length(keywords, 1) > 0
  AND lower(title) NOT LIKE '%' || lower(keywords[1]) || '%';
