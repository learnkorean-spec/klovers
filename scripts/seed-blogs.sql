-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rahpkflknkofuuhnbfyc/sql/new

INSERT INTO public.blog_posts (title, slug, description, keywords, article_type, hero_image, hero_alt, author, lang, published, seo_score, published_at, content)
VALUES

-- English Posts
(
  'How to Learn Hangul in 1 Week: A Complete Beginner Guide',
  'learn-hangul-one-week',
  'Hangul, the Korean alphabet, is one of the most logical writing systems in the world. With the right approach you can master all 24 letters in just 7 days — even with no prior Korean experience.',
  ARRAY['hangul', 'korean alphabet', 'beginner', 'learn korean'],
  'howto',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
  'Korean characters written on a notebook',
  'Klovers Team',
  'en',
  true,
  95,
  '2025-01-10T08:00:00Z',
  E'## What Is Hangul?\n\nHangul (한글) is the official alphabet of the Korean language, created in 1443 by King Sejong the Great. Unlike Chinese characters, Hangul is a phonetic alphabet — each symbol represents a sound, making it far easier to learn.\n\n## The Structure of Hangul\n\nHangul has **14 consonants** and **10 vowels**. These combine into syllable blocks:\n\n- 가 = ㄱ (g) + ㅏ (a) = *ga*\n- 한 = ㅎ (h) + ㅏ (a) + ㄴ (n) = *han*\n\n## Your 7-Day Study Plan\n\n### Day 1–2: Basic Vowels\nStart with the 10 basic vowels: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ. Write each one 10 times.\n\n### Day 3–4: Basic Consonants\nLearn the 14 consonants: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ.\n\n### Day 5: Syllable Blocks\nPractise combining: 가 나 다 라 마 바 사 아.\n\n### Day 6: Double Vowels & Consonants\nIntroduce compound vowels ㅐ, ㅔ, ㅘ and double consonants ㄲ, ㄸ, ㅃ.\n\n### Day 7: Read Real Words\nChallenge yourself to read: 한국 (Korea), 사랑 (love), 학교 (school).\n\n## Tips for Success\n\n1. **Write by hand** — muscle memory accelerates learning\n2. **Use flashcard apps** like Anki with audio\n3. **Label objects** around your home in Hangul\n4. **Sing along** to K-pop to practise pronunciation\n\n## Conclusion\n\nHangul is genuinely one of the easiest scripts to learn. By Day 7 you will be sounding out Korean menus, street signs, and song lyrics. Ready to start? Dive into our [free textbook](/textbook) for structured practice.'
),

(
  '50 Essential Korean Phrases Every K-Drama Fan Must Know',
  'korean-phrases-kdrama-fans',
  'From heartfelt confessions to dramatic plot twists, K-dramas are packed with reusable phrases. Here are 50 real expressions you will hear in every episode — with pronunciation tips and usage notes.',
  ARRAY['korean phrases', 'kdrama', 'korean expressions', 'conversational korean'],
  'listicle',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  'People watching a Korean drama on a laptop',
  'Klovers Team',
  'en',
  true,
  88,
  '2025-02-05T09:00:00Z',
  E'## Why K-Drama Phrases Work for Learning\n\nWatching dramas is one of the most effective ways to pick up natural Korean. The phrases below appear constantly — learn them and you will understand dialogue much faster.\n\n## Emotions & Feelings\n\n1. **미안해 (Mi-an-hae)** — I am sorry (informal)\n2. **괜찮아 (Gwaen-chana)** — It is okay / Are you okay?\n3. **사랑해 (Sa-rang-hae)** — I love you\n4. **보고 싶어 (Bo-go si-peo)** — I miss you\n5. **행복해 (Haeng-bok-hae)** — I am happy\n\n## Common Greetings\n\n6. **안녕하세요 (An-nyeong-ha-se-yo)** — Hello (formal)\n7. **잘 지냈어요? (Jal ji-nae-sseo-yo?)** — How have you been?\n8. **오랜만이에요 (O-raen-man-i-e-yo)** — Long time no see\n\n## At a Restaurant\n\n9. **이거 주세요 (I-geo ju-se-yo)** — Give me this, please\n10. **맛있어요 (Ma-si-sseo-yo)** — It is delicious\n\nSee the full list in our textbook at /textbook'
),

(
  'Korean Sentence Structure: The Complete Grammar Guide',
  'korean-grammar-sentence-structure',
  'Korean grammar feels alien at first, but once you understand its Subject-Object-Verb logic and particle system, everything clicks. This guide walks you through the core structures with clear English comparisons.',
  ARRAY['korean grammar', 'sentence structure', 'SOV', 'korean particles'],
  'longform',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
  'Grammar notes and Korean textbook open on a desk',
  'Klovers Team',
  'en',
  true,
  91,
  '2025-03-01T08:00:00Z',
  E'## The Golden Rule: SOV Order\n\nEnglish is Subject-Verb-Object: *I eat rice.*\nKorean is Subject-Object-Verb: *I rice eat.*\n\n> 저는 밥을 먹어요. (I rice eat = I eat rice.)\n\n## Particles: Korean''s Secret Weapon\n\nKorean uses **particles** (조사) attached to nouns to show grammatical role:\n\n| Particle | Role | Example |\n|---|---|---|\n| 은/는 | Topic | 저**는** = As for me |\n| 이/가 | Subject | 고양이**가** = The cat (subject) |\n| 을/를 | Object | 책**을** = The book (object) |\n| 에 | Location/time | 학교**에** = At school |\n\n## Verb Conjugation Basics\n\nKorean verbs always end in **-다** in dictionary form and conjugate for formality:\n\n- 먹다 (to eat) → 먹어요 (formal polite) → 먹어 (informal)\n\n## Practice Sentences\n\n- 저는 한국어를 공부해요. (I study Korean.)\n- 오늘 날씨가 좋아요. (The weather is nice today.)\n- 친구를 만나고 싶어요. (I want to meet my friend.)'
),

(
  'TOPIK Exam Guide 2025: Everything You Need to Pass',
  'topik-exam-guide-2025',
  'Whether you are aiming for TOPIK I (beginner) or TOPIK II (advanced), this comprehensive guide covers the exam format, scoring, registration, and the best study strategies to maximise your score.',
  ARRAY['TOPIK', 'korean exam', 'TOPIK I', 'TOPIK II', 'korean certificate'],
  'longform',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  'Student studying with Korean textbooks preparing for an exam',
  'Klovers Team',
  'en',
  true,
  89,
  '2025-03-15T08:00:00Z',
  E'## What Is TOPIK?\n\nTOPIK (Test of Proficiency in Korean) is the official Korean language proficiency exam administered by the Korean government. It is recognised worldwide for university admission, employment, and immigration.\n\n## Exam Levels\n\n| Level | Test | Score Range | Difficulty |\n|---|---|---|---|\n| Level 1 | TOPIK I | 80–139 | A1–A2 |\n| Level 2 | TOPIK I | 140–200 | A2–B1 |\n| Level 3 | TOPIK II | 120–149 | B1–B2 |\n| Level 4 | TOPIK II | 150–189 | B2 |\n| Level 5 | TOPIK II | 190–229 | C1 |\n| Level 6 | TOPIK II | 230–300 | C2 |\n\n## 2025 Exam Dates\n\nTOPIK is held multiple times per year. Check the official TOPIK website for exact dates in your country.\n\n## Study Strategy\n\n1. **Start with vocabulary** — Flashcard apps like Anki work well\n2. **Practise past papers** — Official papers from TOPIK website are free\n3. **Focus on listening** — Watch Korean news and dramas with subtitles\n4. **Writing practice** — TOPIK II has written essays, practice regularly\n\n## Register at Klovers\n\nOur structured courses are aligned to TOPIK levels. Take our free placement test at /placement-test to find your starting point.'
),

(
  'Korean Food Vocabulary: 60 Words to Order Like a Local',
  'korean-food-vocabulary-guide',
  'Visiting Korea or cooking Korean food at home? Master these 60 essential food words and restaurant phrases so you can order confidently, read menus, and discuss Korean cuisine like a local.',
  ARRAY['korean food vocabulary', 'korean restaurant', 'food words korean', 'korean cuisine'],
  'listicle',
  'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80',
  'Korean dishes spread on a traditional dining table',
  'Klovers Team',
  'en',
  true,
  82,
  '2025-04-10T08:00:00Z',
  E'## Essential Food Words\n\n### Staples\n- 밥 (bap) — rice\n- 국 (guk) — soup\n- 반찬 (banchan) — side dishes\n- 김치 (kimchi) — fermented vegetables\n\n### Proteins\n- 소고기 (so-go-gi) — beef\n- 돼지고기 (dwae-ji-go-gi) — pork\n- 닭고기 (dak-go-gi) — chicken\n- 해물 (hae-mul) — seafood\n\n### Popular Dishes\n- 비빔밥 (bi-bim-bap) — mixed rice bowl\n- 삼겹살 (sam-gyeop-sal) — grilled pork belly\n- 떡볶이 (tteok-bok-ki) — spicy rice cakes\n- 냉면 (naeng-myeon) — cold noodles\n\n## Ordering at a Restaurant\n\n- 메뉴 주세요 — Menu, please\n- 이거 하나 주세요 — One of this, please\n- 맵지 않게 해주세요 — Please make it not spicy\n- 계산서 주세요 — The bill, please\n\n## Describing Taste\n\n- 맛있어요 — Delicious\n- 매워요 — It is spicy\n- 달아요 — It is sweet\n- 짜요 — It is salty'
),

(
  '10 Things That Will Surprise You About Korean Culture',
  'korean-culture-surprises',
  'Beyond K-pop and K-dramas, Korean culture holds countless fascinating customs — from age-counting systems to the deep importance of nunchi. These 10 cultural insights will transform how you connect with Korean people.',
  ARRAY['korean culture', 'korea customs', 'korean society', 'nunchi'],
  'listicle',
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80',
  'Traditional Korean architecture at sunset',
  'Klovers Team',
  'en',
  true,
  85,
  '2025-05-01T08:00:00Z',
  E'## 1. Koreans Are a Year Older in Korea\n\nKorea uses a traditional age-counting system where you are born age 1, and everyone adds a year on January 1st — not on their birthday.\n\n## 2. 눈치 (Nunchi) — The Art of Reading the Room\n\nNunchi is the subtle ability to gauge others'' moods and respond appropriately. It is considered a core social skill.\n\n## 3. Age Determines Formality\n\nKorean grammar has six levels of formality. The moment you meet someone, unspoken negotiation happens to establish who is older.\n\n## 4. Sharing Food Is an Act of Love\n\nSharing from communal dishes is the norm. Refusing food can feel like rejecting the person offering it.\n\n## 5. Drinking Culture Has Deep Rituals\n\nNever pour your own drink — someone else pours for you. Always receive a glass with two hands to show respect.\n\n## 6. Bowing Replaces Handshakes\n\nA slight bow is the standard greeting. The deeper the bow, the more respect shown.\n\n## 7. Education Pressure Is Intense\n\n수능 (Suneung), the university entrance exam, is so important that planes are grounded during the listening section.'
),

-- Arabic Posts
(
  'كيف تتعلم الهانغول في أسبوع واحد: دليل المبتدئين',
  'learn-korean-beginner-arabic',
  'الهانغول، أبجدية اللغة الكورية، من أكثر أنظمة الكتابة منطقيةً في العالم. مع الأسلوب الصحيح يمكنك إتقان جميع الحروف الـ 24 في 7 أيام فقط — حتى لو لم تدرس الكورية من قبل.',
  ARRAY['هانغول', 'الأبجدية الكورية', 'مبتدئ', 'تعلم الكورية'],
  'howto',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
  'حروف كورية مكتوبة على دفتر ملاحظات',
  'فريق Klovers',
  'ar',
  true,
  90,
  '2025-01-15T08:00:00Z',
  E'## ما هو الهانغول؟\n\nالهانغول (한글) هو الأبجدية الرسمية للغة الكورية، أنشأها الملك سيجونغ العظيم عام 1443. على عكس الحروف الصينية، الهانغول أبجدية صوتية — كل رمز يمثل صوتاً محدداً.\n\n## هيكل الهانغول\n\nيتكون الهانغول من **14 حرفاً ساكناً** و**10 حروف متحركة**.\n\n## خطة الدراسة لـ 7 أيام\n\n### اليومان 1–2: الحروف المتحركة الأساسية\nابدأ بالحروف المتحركة العشرة: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ.\n\n### اليومان 3–4: الحروف الساكنة الأساسية\nتعلم الـ 14 حرفاً ساكناً: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ.\n\n### اليوم 7: اقرأ كلمات حقيقية\nتحدَّ نفسك بقراءة: 한국 (كوريا)، 사랑 (حب)، 학교 (مدرسة).\n\n## الخلاصة\n\nالهانغول هو بالفعل من أسهل الأنظمة الكتابية تعلماً. ابدأ بكتابنا المجاني على /textbook.'
),

(
  '50 عبارة كورية لا غنى عنها لمحبي المسلسلات',
  'korean-phrases-kdrama-arabic',
  'من الاعترافات المؤثرة إلى لحظات الدراما المثيرة، المسلسلات الكورية مليئة بعبارات قابلة للاستخدام اليومي. إليك 50 تعبيراً حقيقياً ستسمعه في كل حلقة — مع نصائح النطق وملاحظات الاستخدام.',
  ARRAY['عبارات كورية', 'مسلسلات كورية', 'تعابير كورية', 'محادثة كورية'],
  'listicle',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  'أشخاص يشاهدون مسلسلاً كورياً على جهاز لابتوب',
  'فريق Klovers',
  'ar',
  true,
  83,
  '2025-02-10T08:00:00Z',
  E'## المشاعر والأحاسيس\n\n1. **미안해 (Mi-an-hae)** — أنا آسف\n2. **괜찮아 (Gwaen-chana)** — لا بأس\n3. **사랑해 (Sa-rang-hae)** — أحبك\n4. **보고 싶어 (Bo-go si-peo)** — أشتاق إليك\n5. **행복해 (Haeng-bok-hae)** — أنا سعيد\n\n## التحيات الشائعة\n\n6. **안녕하세요** — مرحباً (رسمي)\n7. **잘 지냈어요?** — كيف حالك؟\n8. **오랜만이에요** — لم أرك منذ فترة\n\naطلع على القائمة الكاملة في كتابنا على /textbook'
),

(
  'قواعد اللغة الكورية: الدليل الكامل لبناء الجمل',
  'korean-grammar-arabic',
  'قواعد الكورية تبدو غريبة في البداية، لكن حين تفهم منطقها (الفاعل-المفعول-الفعل) ونظام الجسيمات، كل شيء يصبح واضحاً. هذا الدليل يأخذك خطوة بخطوة عبر التراكيب الأساسية.',
  ARRAY['قواعد الكورية', 'بناء الجملة', 'جسيمات الكورية', 'تعلم الكورية'],
  'longform',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
  'ملاحظات قواعد وكتاب كوري مفتوح على مكتب',
  'فريق Klovers',
  'ar',
  true,
  87,
  '2025-03-05T08:00:00Z',
  E'## القاعدة الذهبية: ترتيب الجملة\n\nالعربية: الفاعل + الفعل + المفعول\nالكورية: الفاعل + المفعول + الفعل\n\n> 저는 밥을 먹어요. (أنا / الأرز / آكل)\n\n## الجسيمات\n\n| الجسيمة | الوظيفة |\n|---|---|\n| 은/는 | المبتدأ |\n| 이/가 | الفاعل |\n| 을/를 | المفعول |\n| 에 | المكان/الزمان |\n\n## جمل تدريبية\n\n- 저는 한국어를 공부해요. (أنا أدرس الكورية.)\n- 오늘 날씨가 좋아요. (الطقس جميل اليوم.)\n- 친구를 만나고 싶어요. (أريد لقاء صديقي.)'
)

ON CONFLICT (slug) DO NOTHING;
