import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rahpkflknkofuuhnbfyc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaHBrZmxrbmtvZnV1aG5iZnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzEyOTksImV4cCI6MjA4NjQwNzI5OX0.ZY416BgNYNoPgasvT6tXJ09OlYe8kSCgnl-qmxAT_oE"
);

const posts = [
  {
    title: "How to Learn Hangul in 1 Week: A Complete Beginner Guide",
    slug: "learn-hangul-one-week",
    description:
      "Hangul, the Korean alphabet, is one of the most logical writing systems in the world. With the right approach you can master all 24 letters in just 7 days — even with no prior Korean experience.",
    keywords: ["hangul", "korean alphabet", "beginner", "learn korean"],
    article_type: "howto",
    hero_image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    hero_alt: "Korean characters written on a notebook",
    author: "Klovers Team",
    lang: "en",
    published: true,
    published_at: "2025-01-10T08:00:00Z",
    content: `## What Is Hangul?

Hangul (한글) is the official alphabet of the Korean language, created in 1443 by King Sejong the Great. Unlike Chinese characters, Hangul is a phonetic alphabet — each symbol represents a sound, making it far easier to learn.

## The Structure of Hangul

Hangul has **14 consonants** and **10 vowels**. These combine into syllable blocks:

- 가 = ㄱ (g) + ㅏ (a) = *ga*
- 한 = ㅎ (h) + ㅏ (a) + ㄴ (n) = *han*

## Your 7-Day Study Plan

### Day 1–2: Basic Vowels
Start with the 10 basic vowels: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ. Write each one 10 times.

### Day 3–4: Basic Consonants
Learn the 14 consonants: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ.

### Day 5: Syllable Blocks
Practise combining: 가 나 다 라 마 바 사 아.

### Day 6: Double Vowels & Consonants
Introduce compound vowels ㅐ, ㅔ, ㅘ and double consonants ㄲ, ㄸ, ㅃ.

### Day 7: Read Simple Words
Try reading: 학교 (school), 사랑 (love), 음식 (food), 친구 (friend).

## Pro Tips

1. **Use spaced repetition** — apps like Anki work great for alphabet drills.
2. **Label household items** — write Korean words on sticky notes around your home.
3. **Practice with K-pop lyrics** — pick a favourite song and read along.

By Day 7 you will be able to read Korean out loud, even if you do not understand every word!`,
  },
  {
    title: "10 Must-Know Korean Phrases for K-Drama Fans",
    slug: "korean-phrases-kdrama-fans",
    description:
      "If you watch K-dramas you have already heard dozens of Korean phrases. Here are the 10 most common expressions explained with cultural context so you can finally understand what the characters are saying.",
    keywords: ["kdrama", "korean phrases", "expressions", "oppa", "saranghae"],
    article_type: "listicle",
    hero_image:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
    hero_alt: "Korean drama on a television screen",
    author: "Klovers Team",
    lang: "en",
    published: true,
    published_at: "2025-01-18T10:00:00Z",
    content: `## 1. 사랑해 (Saranghae) — I love you
The most iconic phrase in K-dramas. The polite form is 사랑해요 (saranghaeyo).

## 2. 오빠 (Oppa) — Older brother / term of endearment
A woman calls an older male friend or boyfriend "oppa". It conveys closeness.

## 3. 괜찮아요? (Gwaenchanayo?) — Are you okay?
Heard constantly when a character gets hurt or upset.

## 4. 진짜? (Jinjja?) — Really?
The ultimate expression of surprise.

## 5. 미안해 (Mianhae) — I am sorry
Casual apology. Formal version: 미안합니다 (mianhamnida).

## 6. 빨리빨리 (Ppalli ppalli) — Hurry up!
Korea is famous for its fast-paced culture — this phrase captures it perfectly.

## 7. 아이고 (Aigo) — Oh my / Oh dear
A versatile exclamation expressing surprise, frustration, or concern.

## 8. 화이팅! (Hwaiting!) — Fighting! / You can do it!
A cheer of encouragement.

## 9. 맛있다! (Masitda!) — It is delicious!
Every food scene in every K-drama ever.

## 10. 잠깐만요 (Jamkkanmanyo) — Wait a moment
Used to pause a conversation or ask someone to hold on.

---

Join our live Korean classes at Klovers and practise all these phrases with real teachers!`,
  },
  {
    title: "Korean Grammar 101: Understanding Sentence Structure (SOV)",
    slug: "korean-grammar-sentence-structure",
    description:
      "Korean follows Subject-Object-Verb word order — the opposite of English. Understanding this fundamental difference will unlock your ability to build Korean sentences correctly from day one.",
    keywords: [
      "korean grammar",
      "sentence structure",
      "SOV",
      "word order",
      "beginner",
    ],
    article_type: "longform",
    hero_image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    hero_alt: "Open notebook with grammar notes",
    author: "Klovers Team",
    lang: "en",
    published: true,
    published_at: "2025-02-03T09:00:00Z",
    content: `## The Big Difference: SOV vs SVO

In English: **I** (subject) **eat** (verb) **rice** (object).

In Korean: **나는** (I) **밥을** (rice) **먹어요** (eat).

The verb always comes **last** in Korean.

## Particles — The Korean Secret Weapon

Korean uses particles (조사) attached to nouns to show their grammatical role:

| Particle | Role | Example |
|---|---|---|
| 은/는 | Topic marker | 저는 학생이에요 (I am a student) |
| 이/가 | Subject marker | 고양이가 있어요 (There is a cat) |
| 을/를 | Object marker | 물을 마셔요 (I drink water) |
| 에 | Location/time | 학교에 가요 (I go to school) |

## Verb Endings Show Politeness

- **해요체** (polite): 가요, 먹어요, 해요
- **합쇼체** (formal): 갑니다, 먹습니다, 합니다
- **반말** (casual): 가, 먹어, 해

For most learners, start with 해요체 — it is polite enough for daily life.

## Practice Sentences

1. 저는 한국어를 공부해요. — I study Korean.
2. 친구가 커피를 마셔요. — My friend drinks coffee.
3. 우리는 영화를 봐요. — We watch a movie.

Mastering SOV and particles is the foundation of fluent Korean. Our structured courses at Klovers take you from A1 to C2.`,
  },
  {
    title: "TOPIK Exam Guide 2025: Structure, Scoring & Study Strategy",
    slug: "topik-exam-guide-2025",
    description:
      "The Test of Proficiency in Korean (TOPIK) is the official Korean language certification recognised worldwide. This complete guide covers exam structure, scoring, registration, and study strategies.",
    keywords: ["TOPIK", "korean exam", "certification", "study tips", "2025"],
    article_type: "longform",
    hero_image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    hero_alt: "Student preparing for an exam with study materials",
    author: "Klovers Team",
    lang: "en",
    published: true,
    published_at: "2025-02-15T08:00:00Z",
    content: `## What Is TOPIK?

TOPIK (한국어능력시험) is the standardised Korean language proficiency test by the National Institute for International Education (NIIED) of South Korea.

## TOPIK I vs TOPIK II

| | TOPIK I | TOPIK II |
|---|---|---|
| Levels | 1–2 (Beginner) | 3–6 (Intermediate–Advanced) |
| Sections | Reading, Listening | Reading, Listening, Writing |
| Duration | 100 min | 180 min |
| Questions | 70 | 104 |

## Scoring

- **Level 1**: 80–139 points
- **Level 2**: 140–200 points
- **Level 3**: 120–149 points
- **Level 4**: 150–189 points
- **Level 5**: 190–229 points
- **Level 6**: 230–300 points

## 2025 Exam Schedule

TOPIK is held 6 times per year in South Korea and internationally. Register at topik.go.kr at least 4–6 weeks before your chosen date.

## Study Strategy

1. **Past papers first** — Download 10 years of past TOPIK papers from the official site.
2. **Vocabulary lists** — Learn the 6,000 most common Korean words.
3. **Timed practice** — Simulate exam conditions weekly.
4. **Daily listening** — Korean news, podcasts, and drama improve your ear fast.

At Klovers, our TOPIK preparation track covers all exam sections with expert teachers and mock tests.`,
  },
  {
    title: "Korean Food Vocabulary: 50 Essential Words for Foodies",
    slug: "korean-food-vocabulary-guide",
    description:
      "Korean cuisine is world-famous — from kimchi to bibimbap to Korean BBQ. Whether visiting Korea or cooking at home, knowing these 50 food words will transform your experience.",
    keywords: ["korean food", "vocabulary", "kimchi", "bibimbap", "foodie"],
    article_type: "listicle",
    hero_image:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    hero_alt: "Colourful Korean food spread with multiple dishes",
    author: "Klovers Team",
    lang: "en",
    published: true,
    published_at: "2025-03-01T10:00:00Z",
    content: `## Staple Foods

| Korean | Romanization | English |
|---|---|---|
| 밥 | bap | rice |
| 국 | guk | soup |
| 김치 | kimchi | kimchi |
| 된장 | doenjang | soybean paste |
| 고추장 | gochujang | red chilli paste |

## Popular Dishes

| Korean | Romanization | English |
|---|---|---|
| 비빔밥 | bibimbap | mixed rice bowl |
| 불고기 | bulgogi | marinated beef |
| 삼겹살 | samgyeopsal | pork belly BBQ |
| 냉면 | naengmyeon | cold noodles |
| 떡볶이 | tteokbokki | spicy rice cakes |
| 순두부찌개 | sundubu jjigae | soft tofu stew |

## Drinks & Desserts

| Korean | Romanization | English |
|---|---|---|
| 소주 | soju | Korean spirit |
| 막걸리 | makgeolli | rice wine |
| 빙수 | bingsu | shaved ice dessert |

## Useful Phrases at a Restaurant

- 이거 주세요 — I will have this, please.
- 맵지 않게 해주세요 — Please make it not spicy.
- 계산서 주세요 — The bill, please.
- 맛있어요! — It is delicious!

Use our flashcard games at Klovers to memorise all 50 words faster!`,
  },
  {
    title: "Korean Culture Guide: 7 Things That Surprised Me About Korea",
    slug: "korean-culture-surprises",
    description:
      "From age-based honorifics to the concept of nunchi, Korean culture is rich and nuanced. Here are 7 cultural insights that will help you understand Koreans better — and speak the language more naturally.",
    keywords: [
      "korean culture",
      "nunchi",
      "honorifics",
      "cultural tips",
      "korean society",
    ],
    article_type: "listicle",
    hero_image:
      "https://images.unsplash.com/photo-1538669715315-155098f0fb1d?w=800&q=80",
    hero_alt: "Traditional Korean lanterns at a night festival",
    author: "Klovers Team",
    lang: "en",
    published: true,
    published_at: "2025-03-10T09:00:00Z",
    content: `## 1. Age Determines Everything

In Korea, age defines how you speak to someone. You use different verb endings and vocabulary depending on whether someone is older (존댓말 / jondaemal) or younger/the same age (반말 / banmal). The first question Koreans often ask: "How old are you?"

## 2. Nunchi — The Art of Reading the Room

눈치 (nunchi) is the ability to sense others' moods and react appropriately. Having good nunchi is considered a highly valued social skill in Korea.

## 3. Skincare Is Serious Business

Korea is the birthplace of the 10-step skincare routine. Taking care of your skin is seen as self-respect, not vanity — and this shows up in the language too.

## 4. Meal-Sharing Culture

Korean meals are communal — dishes are shared from the centre of the table. Asking "혼자 먹어요?" (are you eating alone?) is considered sad.

## 5. The Word 정 (Jeong)

정 roughly translates as deep affection or attachment that builds over time. There is no English equivalent. Once you feel jeong for Korea, it never goes away.

## 6. Bowing as Greeting

Koreans bow instead of shaking hands in most social situations. The depth of the bow shows the level of respect — 15° for casual, 45° for formal apology.

## 7. Pali-Pali Culture (빨리빨리)

Korea is one of the fastest-moving societies in the world. Delivery arrives in hours, internet is the fastest globally, and patience is a virtue learned late.

Understanding culture is essential to true language fluency. At Klovers, our teachers bring cultural context into every class.`,
  },
  // Arabic posts
  {
    title: "كيف تتعلم اللغة الكورية من الصفر: دليل المبتدئين الشامل",
    slug: "learn-korean-beginner-arabic",
    description:
      "هل تريد تعلم اللغة الكورية ولا تعرف من أين تبدأ؟ هذا الدليل الشامل يأخذك خطوة بخطوة من الأبجدية الكورية حتى المحادثة الأولى.",
    keywords: ["تعلم الكورية", "المبتدئين", "هانغول", "اللغة الكورية"],
    article_type: "howto",
    hero_image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    hero_alt: "كتاب مفتوح لتعلم اللغة الكورية",
    author: "فريق Klovers",
    lang: "ar",
    published: true,
    published_at: "2025-01-12T08:00:00Z",
    content: `## لماذا تتعلم الكورية؟

اللغة الكورية هي لغة أكثر من 80 مليون شخص حول العالم. مع انتشار موجة الهالية (K-Wave) من K-pop ودراما كورية ومطبخ كوري، أصبح تعلم الكورية أكثر شعبية من أي وقت مضى.

## الخطوة الأولى: تعلم الهانغول

الهانغول (한글) هو أبجدية اللغة الكورية، وتتكون من 14 حرفاً ساكناً و10 حروف متحركة. يمكنك تعلمها خلال أسبوع واحد فقط!

## خطة الدراسة الأسبوعية

### الأيام 1-2: الحروف المتحركة
تعلم: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ

### الأيام 3-4: الحروف الساكنة
تعلم: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ

### اليوم 5: تركيب المقاطع
تدرب على الدمج: 가 나 다 라 마

### الأيام 6-7: قراءة كلمات بسيطة
학교 (مدرسة) · 사랑 (حب) · 음식 (طعام) · 친구 (صديق)

## المستويات من A1 إلى C2

- **A1-A2**: المفردات الأساسية والتحيات والأرقام
- **B1-B2**: المحادثة اليومية والقواعد المتوسطة
- **C1-C2**: الطلاقة الكاملة واختبار TOPIK

في Klovers لدينا مسارات لكل المستويات مع مدرسين متخصصين. سجّل الآن وابدأ رحلتك!`,
  },
  {
    title: "10 عبارات كورية يجب أن يعرفها كل محب للدراما الكورية",
    slug: "korean-phrases-kdrama-arabic",
    description:
      "إذا كنت تشاهد المسلسلات الكورية فقد سمعت هذه العبارات مئات المرات. إليك أهم 10 تعبيرات مع معانيها وسياقاتها الثقافية.",
    keywords: ["دراما كورية", "عبارات كورية", "أوبا", "سارانغهاي"],
    article_type: "listicle",
    hero_image:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
    hero_alt: "مشهد من مسلسل كوري",
    author: "فريق Klovers",
    lang: "ar",
    published: true,
    published_at: "2025-01-20T10:00:00Z",
    content: `## 1. 사랑해 (سارانغهاي) — أنا أحبك
أشهر عبارة في المسلسلات الكورية. الشكل المؤدب: 사랑해요.

## 2. 오빠 (أوبا) — الأخ الأكبر / حبيبي
تستخدمها الفتاة لمناداة صديقها الأكبر منها سناً.

## 3. 괜찮아요? (كوينشانايو؟) — هل أنت بخير؟
تسمعها في كل مشهد يتعرض فيه أحدهم للأذى.

## 4. 진짜? (جينجا؟) — حقاً؟
تعبير عن الدهشة تسمعه عشرات المرات في كل حلقة!

## 5. 미안해 (ميانهاي) — أنا آسف
اعتذار غير رسمي. الرسمي: 미안합니다.

## 6. 빨리빨리 (بالي بالي) — بسرعة بسرعة!
يعكس الثقافة الكورية المعروفة بالسرعة والكفاءة.

## 7. 아이고 (أيغو) — يا إلهي!
تعبير متعدد يدل على الدهشة أو الإرهاق.

## 8. 화이팅! (هواييتينغ!) — اجتهد! أنت قادر!
صيحة تشجيع شهيرة.

## 9. 맛있다! (ماسيتدا!) — لذيييذ!
لا يخلو مشهد طعام من هذه العبارة!

## 10. 잠깐만요 (جامكانمانيو) — لحظة من فضلك
لإيقاف محادثة أو طلب الانتظار.

---
انضم إلى دروس Klovers المباشرة وتحدث الكورية من اليوم الأول!`,
  },
  {
    title: "قواعد اللغة الكورية للمبتدئين: نظام الجملة SOV",
    slug: "korean-grammar-arabic",
    description:
      "تتبع اللغة الكورية نظام الفاعل-المفعول-الفعل، عكس اللغة العربية تماماً. فهم هذا الفرق الأساسي سيفتح لك باب بناء الجمل الكورية بشكل صحيح من اليوم الأول.",
    keywords: ["قواعد الكورية", "بنية الجملة", "مبتدئين", "نحو كوري"],
    article_type: "longform",
    hero_image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    hero_alt: "دفتر مفتوح لتدوين قواعد اللغة",
    author: "فريق Klovers",
    lang: "ar",
    published: true,
    published_at: "2025-02-05T09:00:00Z",
    content: `## الفرق الجوهري: SOV مقابل SVO

في العربية نقول: **أنا** (فاعل) **آكل** (فعل) **الأرز** (مفعول).

في الكورية: **나는** (أنا) **밥을** (الأرز) **먹어요** (آكل).

الفعل دائماً يأتي **في النهاية** في الكورية!

## الأدوات النحوية (الجسيمات)

تستخدم الكورية أدوات تُلحق بالأسماء لتحديد وظيفتها في الجملة:

| الأداة | الوظيفة | مثال |
|---|---|---|
| 은/는 | محدد الموضوع | 저는 학생이에요 (أنا طالب) |
| 이/가 | محدد الفاعل | 고양이가 있어요 (يوجد قط) |
| 을/를 | محدد المفعول | 물을 마셔요 (أشرب الماء) |
| 에 | المكان/الزمان | 학교에 가요 (أذهب إلى المدرسة) |

## مستويات الرسمية

تتغير نهايات الأفعال حسب مستوى الرسمية:

- **해요체** (مؤدب): 가요، 먹어요، 해요
- **합쇼체** (رسمي): 갑니다، 먹습니다、합니다
- **반말** (عادي): 가، 먹어، 해

للمبتدئين ابدأ بـ 해요체 — فهو مناسب لمعظم المواقف.

## جمل للتدرب

1. 저는 한국어를 공부해요. — أنا أدرس الكورية.
2. 친구가 커피를 마셔요. — صديقي يشرب القهوة.
3. 우리는 영화를 봐요. — نحن نشاهد فيلماً.

في Klovers مساراتنا تأخذك من A1 إلى C2 بشكل منهجي مع مدرسين متخصصين.`,
  },
];

async function seedBlogs() {
  console.log(`Seeding ${posts.length} blog posts...`);

  for (const post of posts) {
    // Check if slug already exists
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", post.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  SKIP (exists): ${post.slug}`);
      continue;
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .insert(post)
      .select("id, slug")
      .single();

    if (error) {
      console.error(`  ERROR: ${post.slug} —`, error.message);
    } else {
      console.log(`  OK: ${data.slug} (${data.id})`);
    }
  }

  console.log("Done.");
}

seedBlogs().catch(console.error);
