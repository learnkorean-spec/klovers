# برومبتات توليد الصور — الحزمة الكاملة

**آدم (Adam) · لينا (Lina) · كلوبي (Cluby)**
المرجع: `src/config/klovers-world.ts` ← `visualSystem.standingRule` · و`public/brand-sheet.html`
التدقيق الكامل: `docs/IMAGE-STYLE-AUDIT-AR.md`

> **القاعدة الحاكمة (ريم، ٥ أكتوبر ٢٠٢٦): «الثيم دايمًا المشاهد الحقيقية.»
> ثيم واحد فوتوغرافي، وبلا استثناء للحجم — وجه مرسوم أو أنمي مرفوض حتى في أيقونة ١٤ بكسل.**

---

## حالة اللوحة الآن (اقرأه قبل أن تولّد شيئًا)

| ✅ أُنجز ورُكّب | الملف |
|---|---|
| أيقونة آدم الفوتوغرافية | `public/assets/icons/student-boy-thumbsup.webp` + `@2x` |
| الهيرو العربي (trio-a) | `public/assets/cluby/hero-ar.webp` — 1600×900 |

| ⏳ مطلوب | العدد | الأولوية |
|---|---|---|
| **أيقونة لينا** — الزوج الآن غير متطابق (صورة بجانب رسمة في `JourneyMilestone`) | ١ | 🔴 عاجل |
| أوضاع كلوبي 3D لصفحة الألعاب | ٣ | 🟠 عالية |
| إعادة رسم أيقونات كلوبي المسطّحة حيًّا | ٤ | 🟠 عالية |
| هيرو إنجليزي يطابق العربي في المقاس | ١ | 🟡 متوسطة |
| بورتريه البراند (يحلّ محل ٣ ملفات كاركتون) | ١ | 🟡 متوسطة |
| أغلفة المدونة المرسومة | ١٧ | 🟢 الأخيرة |
| **الإجمالي** | **٢٧ صورة** | |

---

# الكتل الثابتة — تُلصق في كل طلب

## ① قفل الشخصيات

```
CHARACTERS — recurring real people, keep them identical in every image:

ADAM: a man in his early 20s, definitely not Korean and not East Asian, wavy
dark-brown hair with a slightly messy fringe, friendly open smile. Wearing a
Klovers-yellow tailored blazer (#FFFF00) over a plain ivory t-shirt, ivory trousers,
white sneakers.

LINA: a woman in her early 20s, definitely not Korean and not East Asian, long wavy
auburn-copper hair, light freckles across the nose, warm curious smile. Wearing an
ivory hanbok-inspired wrap top with subtle white floral embroidery, a Klovers-yellow
midi skirt (#FFFF00) with a yellow floral sash, ivory flats.

CLUBY (only when the scene includes him): a small mint-green realistic-cute 3D plush
creature with soft felt-fur texture, round head, two short butter-yellow horns,
pointed ears with pink inner ear, WARM DARK-BROWN EYES, rosy cheeks, TWO TINY FANGS,
ivory mini hanbok top, yellow wrap skirt with a sash bow, a green four-leaf clover on
the chest, short mint-green tail with small spikes.

ADAM AND LINA ARE FRIENDS AND STUDY COMPANIONS. Never a couple.

STYLE: photorealistic people with natural skin texture and real fabric, like a premium
editorial photograph — soft golden-hour Korean light, warm, calm and premium.
Cluby stays a soft 3D plush render, never a 2D cartoon.
```

> **تحقّق كلوبي:** العيون البنية **مفتوحة** والنابان **ظاهران**. هذه البنود الثلاثة هي التي
> فرّقت بين نسخ المشهد الثلاث التي أرسلتِها — والنسخة المقبولة (`trio-a`) حققتها كلها.
> نسخة العيون المغمضة تسقط، وورقة البراند تقول صراحة: «Brown eyes, same horns, same hanbok every time».

## ② الكتلة المانعة

```
DO NOT INCLUDE: any text, letters, Hangul, captions, logos, watermarks, UI elements or
frames. No anime, manga, cartoon, comic, flat-vector or illustration style. No plastic,
waxy or over-smoothed skin. No oversaturated colours. No colour outside Klovers yellow
#FFFF00, charcoal #2E2E2E and ivory #FFF9EC. Never more than one Namsan Tower. No
romantic or couple framing: no hand-holding, no cheek-to-cheek, no kissing, no arms
around each other. No hard rectangular border — keep soft edges and leave clean empty
space so the image can dissolve into the page.
```

## ③ صيغ المقاسات

| النوع | نص الـFORMAT |
|---|---|
| أيقونة (شفافة) | `a square 1:1 image, head and shoulders, 3/4 view, generous margin, isolated on a fully transparent background (alpha PNG), no background shadow` |
| وضع كلوبي | `a square 1:1 image, full body, isolated on a fully transparent background (alpha PNG), soft contact shadow only under the feet` |
| أيقونة 3D بنفس أسلوب العائلة | `a square 1:1 image, the character centred on a soft pastel disc, isolated on a fully transparent background (alpha PNG)` |
| مشهد عريض | `a wide 16:9 cinematic image, highest available resolution, leave clean empty space on one third for headline text` |
| غلاف مدونة | `a wide 16:9 editorial image, 1200x675, no people` |

## ④ طريقة العمل (لا تتخطَّها)

1. **ولّد «ورقة الشخصيتين» أولًا** — برومبت ⓪ في آخر هذا الملف — واحفظها.
2. **أرفقها في كل طلب** وأضف: `Use the two people in the attached reference sheet. Keep their faces, hair, skin tone and outfits identical.`
3. **ابقَ في نفس المحادثة** — السياق يساعد الاتساق.
4. **صورة واحدة في كل رسالة.**
5. **الخلفية الشفافة غير مضمونة:** اطلبها صراحة؛ إن خرجت بيضاء اطلب `transparent PNG background (alpha channel)`، وإن فشل أزلها محليًا — **لا تنشر أيقونة بخلفية بيضاء**، فالأيقونات تُوضع على بلاطات صفراء وفحمية.
6. **افحص:** أي حرف أو شعار في الصورة = أعد التوليد. الأيدي والعيون دائمًا.

---

# القسم ١ — أيقونة لينا 🔴 عاجل

### ① `student-girl-heart.webp` + `@2x` — 128 و٢٥٦ بكسل شفاف

```
[① قفل الشخصيات] [② المانع]

SCENE: Lina only, head and shoulders, three-quarter view, warm genuine smile at the
camera, one hand resting lightly flat on her chest near her heart, the gesture inside
the frame. Bright daylit soft light, nothing in the background.

FORMAT: a square 1:1 image, head and shoulders, 3/4 view, generous margin around her,
isolated on a fully transparent background (alpha PNG), no background shadow.
```

> **لماذا هذا عاجل:** `JourneyMilestone.tsx:26,28` يعرض أيقونتي الشخصيتين **جنبًا إلى جنب
> بمقاس ٦٤/٨٠ بكسل** — فصورة آدم الفوتوغرافية تُعرض الآن بجانب رسمة لينا الأنمي في مكان ظاهر.
> وبعد وصول الصورة: `public/assets/icons/student-girl-heart.webp` بنفس الاسم ⇒ صفر تعديل كود.
>
> **مقارنة للرجوع (آدم — أُنجز):** نفس البنية، لكن `giving an encouraging thumbs-up close to his chest`.

---

# القسم ٢ — أوضاع كلوبي 3D لصفحة الألعاب 🟠

تفصل صفحة الألعاب كلوبي لكل عالم من **المجموعة المسطّحة 2D** في `public/assets/characters/`
(‏٨ ملفات)، بينما تعرّف النمط الصحيح 3D في السطر نفسه. الأوضاع المتوفرة 3D الآن:
`cluby-wave` · `cluby-star` · `cluby-reading` · `cluby-hanbok` · `canon-celebrate` · `canon-star` · `cluby-hatch`
— لا مقابل لـ«الهانغول/السوق/المقهى»، فولّدها بالأسماء التالية **لتطابق مفاتيح `WORLD_CLUBY` مباشرة**.

### ② `cluby-hangul-village.webp` — قرية الهانغول

```
[② المانع]

SCENE: Cluby, the small mint-green realistic-cute 3D plush creature with soft felt-fur
texture, round head, two short butter-yellow horns, pointed ears with pink inner ear,
warm dark-brown eyes, rosy cheeks, two tiny fangs, ivory mini hanbok top, yellow wrap
skirt with a sash bow, a green four-leaf clover on the chest, short mint-green spiky
tail. He stands full body holding up a wooden signpost with abstract decorative brush
strokes on it — no readable letters anywhere — looking pleased, head slightly tilted.
Soft warm studio light.

FORMAT: a square 1:1 image, full body, isolated on a fully transparent background
(alpha PNG), soft contact shadow only under the feet.
```

### ③ `cluby-vocabulary-market.webp` — سوق المفردات

```
[② المانع]

SCENE: Cluby (same description as above) stands full body holding up one bright red
apple in both paws, delighted, as if he has just found it and learned its name. Soft
warm studio light.

FORMAT: a square 1:1 image, full body, isolated on a fully transparent background
(alpha PNG), soft contact shadow only under the feet.
```

### ④ `cluby-conversation-cafe.webp` — مقهى المحادثة

```
[② المانع]

SCENE: Cluby (same description as above) stands full body beside a small ivory coffee
cup on a low café counter, one paw raised as if mid-sentence, warm and chatty. Soft warm
studio light.

FORMAT: a square 1:1 image, full body, isolated on a fully transparent background
(alpha PNG), soft contact shadow only under the feet.
```

> **بديل أرخص:** إن أردتِ تجنّب التوليد، يمكن إعادة استخدام `cluby-wave` و`cluby-star`
> و`cluby-reading` في العوالم الثلاثة بتعديل سطرين في `GameWorldsHub.tsx` — النتيجة أقل
> ارتباطًا بالعوالم لكنها صفر صور. القرار لك.

---

# القسم ٣ — أيقونات كلوبي المسطّحة 🟠

**قِست كل موضع:** بعضها بحجم يستحق إعادة الرسم 3D، وبعضها **صغير جدًا** فتغيير الرسم لا ينفعه
بل يجب أن يتحوّل للأيقونات المرسومة الموجودة (مثل ما فعلنا مع وجهي آدم ولينا).

| الأيقونة | مواضعها | الحكم |
|---|---|---|
| `game-klobi-thumbsup` | `AffiliatePage` **٦٤** · `TrialBookingPage` **٥٦** · واجهة الألعاب ٢٨–٥٦ | ✅ أعد رسمها 3D |
| | `TestimonialsSection` **١٦ و٢٤** | 🔄 **حوّليها** لأيقونة مرسومة — لا تُرسم 3D |
| `klobi-reading` | `MySchedulePage` **٤٠** | ✅ أعد رسمها |
| | `TextbookHubPage` **٢٠** | 🔄 **حوّليها** |
| `klobi-headphones` | `MySchedulePage` **٤٨** | ✅ أعد رسمها |
| | `WhyLearnKorean` **٢٨/٣٦** (الرئيسية) | 🔄 **حوّليها** |
| `game-klobi-han` | واجهة الألعاب ٢٨–٥٦ | ✅ أعد رسمها |

### ⑤ `game-klobi-thumbsup.webp` + `@2x`
### ⑥ `klobi-reading.webp` + `@2x`
### ⑦ `klobi-headphones.webp` + `@2x`
### ⑧ `game-klobi-han.webp` + `@2x`

**برومبت واحد يُعاد استخدامه، ويُبدَّل فيه سطر الحركة:**

```
[② المانع]

SCENE: Cluby, the small mint-green realistic-cute 3D plush creature with soft felt-fur
texture, round head, two short butter-yellow horns, pointed ears with pink inner ear,
warm dark-brown eyes, rosy cheeks, two tiny fangs, ivory mini hanbok top, yellow wrap
skirt with a sash bow, a green four-leaf clover on the chest, short mint-green spiky
tail. Soft warm studio light, three-quarter view, cheerful.

ACTION: <بدّل من القائمة>
```

| الملف | سطر ACTION |
|---|---|
| `game-klobi-thumbsup` | `giving an enthusiastic thumbs-up with one paw, eyes open and friendly` |
| `klobi-reading` | `sitting and reading an open ivory book, looking up warmly from the page` |
| `klobi-headphones` | `wearing soft ivory headphones and smiling, one paw raised in a happy gesture` |
| `game-klobi-han` | `holding up a small ivory card with abstract brush strokes on it — no readable letters — pointing at it with the other paw` |

ثم:
```
FORMAT: a square 1:1 image, the character centred on a soft pastel disc, isolated on a
fully transparent background (alpha PNG). No flat 2D cartoon look, no vector outlines —
he must read as a soft physical plush toy rendered in 3D.
```

> **الشرط الثاني في ورقة البراند (سطر ٤٠٦)** يقول إن هذه المجموعة «ستُعاد رسمها 3D» — هذه
> هي الجولة التي تُغلق ذلك الوعد. وبعد إعادة الرسم، الأيقونة ذاتها تُستخدم بنفس الاسم في
> المواضع الكبيرة ⇒ صفر تعديل كود هناك.

---

# القسم ٤ — أغلفة المدونة: **بلا أشخاص** 🟢

القرار المتّخذ: **لا أشخاص في أغلفة المدونة إطلاقًا** — مشهد فقط. هذا يُلغي سؤال «من هذه
الشخصية؟» من الأساس، ولا يجعل الوجه يُقاس بـ١٢٠٠×٦٧٥.

**قالب واحد، ويُبدَّل سطر الموضوع:**

```
A photorealistic editorial photograph for a Korean-culture blog cover, golden-hour warm
light, shallow depth of field, calm premium magazine feel, generous negative space for a
title. No people, no faces, no hands, no text, no letters, no Hangul, no logos.

SUBJECT: <بدّل>
FORMAT: a wide 16:9 editorial image, 1200x675.
```

| # | الملف | سطر SUBJECT |
|---|---|---|
| ⑨ | `kong-pat.jpg` | `a rustic Korean table with red bean porridge in a ceramic bowl, a linen cloth and a brass spoon, steam rising` |
| ⑩ | `korean-blood-type.jpg` | `four small ceramic Korean tea cups on a wooden tray in a row, each a different glaze` |
| ⑪ | `language-mixing.jpg` | `two open notebooks side by side on a desk, one filled with Latin script and one with Hangul, a pencil between them` |
| ⑫ | `translation-mistakes.jpg` | `a single open dictionary on a desk with a red pen resting in the fold, soft window light` |
| ⑬ | `kpop-trainee-room.jpg` | `an empty mirrored dance practice studio at golden hour, wooden floor, a water bottle and a folded towel by the wall` |
| ⑭ | `korean-onomatopoeia.jpg` | `a warm Korean kitchen window with a kettle steaming, ceramic jars lined along the sill` |
| ⑮ | `korean-numbers.jpg` | `a Korean market price board and a wooden abacus on a counter, no readable characters` |
| ⑯ | `korean-body-parts.webp` | `a hanbok hanging on a wooden hanger against an ivory plaster wall, soft morning light` |
| ⑰ | `multilingual-brain.jpg` | `an open notebook, a fountain pen and a cup of coffee on a linen desk, morning light` |
| ⑱ | `hallyu-wave.jpg` | `a Seoul street at dusk with glowing signage in soft bokeh, no readable letters` |
| ⑲ | `5min-psychology.jpg` | `an old Korean brass clock beside a stack of worn books on a wooden desk, warm lamp light` |
| ⑳ | `5min-history.jpg` | `a weathered Korean history book open on a desk with a magnifying glass resting on the page` |
| ㉑ | `korean-counters.jpg` | `a tidy row of Korean market goods — apples, rice cakes, ceramics — on a wooden shelf` |
| ㉒ | `korean-directions.jpg` | `a Seoul subway route board photographed from behind a shoulder, so no face is visible` |
| ㉓ | `korean-age-system.jpg` | `a small birthday table with a white rice-cake and a lit candle, ivory cloth, morning light` |
| ㉔ | `kpop-history.jpg` | `a shelf of old vinyl records and a cassette player in warm afternoon light` |
| ㉕ | `kpop-global-learning.jpg` | `a world map and a notebook with sticky tabs on a desk, warm side light` |

> كلها في `public/assets/blog/` **بنفس الأسماء** ⇒ صفر تعديل كود.

---

# القسم ٥ — بورتريه البراند 🟡

### ㉖ بورتريه الثنائي مع كلوبي — يحلّ محل **ثلاثة** ملفات كاركتون

```
[① قفل الشخصيات] [② المانع]

SCENE: Adam and Lina sitting together on a low hanok courtyard step in warm golden-hour
light, both looking toward the camera with relaxed friendly smiles, an open notebook and
a basket of yellow flowers beside them. Cluby sits on the step between them, paws
together, cheerful, eyes open. The composition is calm and premium, with clear space
beside them.

FORMAT: a wide 16:9 cinematic image, highest available resolution, leave the right half
visually calm and uncluttered for text.
FORMAT (companion): the same three arranged vertically centred in a 4:5 frame with
generous space below them.
```

**يحلّ محل:** `public/klovers-mascot.png` · `public/klovers-characters.png` (نفس الملف، ١٦٣٨ كيلوبايت
لكل واحد) · `public/characters/hanbok-pair.jpg` — أي **يوفّر ~٣ ميجا** ويصلح أيضًا لقوالب
`klovers_mascot_left/right` في `src/lib/canvasRenderer.ts` (التي تعرض شعار K حاليًا لا شخصية).

---

# القسم ٦ — هيرو إنجليزي 🟡

### ㉗ `hero-en.webp` — لتطابق `hero-ar.webp`

`hero-ar.webp` صار **1600×900**، بينما `hero-en.webp` ما زال **960×540** — فأصبح الزوج غير
متطابق. ولّد النسخة الإنجليزية معكوسةً:

```
[① قفل الشخصيات] [② المانع]

SCENE: The same three — Adam, Lina and Cluby — sitting on a low hanok veranda step in warm
golden-hour light, reading an open book together, all three looking down at the pages with
warm smiles. Cluby sits between them, eyes open, two tiny fangs visible. The Seoul skyline
and Namsan Tower appear exactly once in the far distance at sunset. Mirror the Arabic hero:
put the three on the RIGHT side of the frame and leave the LEFT third visually calm and
uncluttered for a headline.

FORMAT: a wide 16:9 cinematic image, 1600x900, highest available resolution.
```

---

# ⓪ ورقة الشخصيتين — المرجع الذي يربط كل شيء

```
A clean two-person character reference sheet, one single image, plain ivory #FFF9EC
background, soft even studio light:

LEFT: full-body ADAM standing, facing camera, relaxed confident smile, arms easy at his
sides. RIGHT: full-body LINA standing, facing camera, warm smile, hands loosely together
in front. Both shown front-on, full body head to shoes, nothing cropped.

CHARACTERS: Adam is a man in his early 20s, definitely not Korean and not East Asian,
wavy dark-brown hair, wearing a Klovers-yellow tailored blazer (#FFFF00) over a plain
ivory t-shirt, ivory trousers, white sneakers. Lina is a woman in her early 20s,
definitely not Korean and not East Asian, long wavy auburn-copper hair, light freckles,
wearing an ivory hanbok-inspired wrap top with subtle white floral embroidery, a
Klovers-yellow midi skirt (#FFFF00) with a yellow floral sash, ivory flats. They stand
side by side as friends and study companions, with a clear gap between them, both feet on
the ground, equal height in frame.

STYLE: photorealistic people with natural skin texture and real fabric, premium editorial
photograph, clean and calm.

DO NOT INCLUDE: any text, letters, Hangul, logos or watermarks. No anime, manga, cartoon
or illustration style. No plastic or over-smoothed skin. No couple pose, no touching, no
hand-holding. No props, no scenery, no frame.

FORMAT: a wide 3:2 sheet, highest available resolution, both people fully in frame.
```

---

# ما لا يحتاج توليدًا (للتوثيق فقط)

| ✅ موجود وسليم | العدد |
|---|---|
| **٢١ صورة واقعية حيّة** في `/assets/story/` و`/assets/world/` و`/assets/cluby/` — مشاهد العوالم الستة، «لماذا الكورية» الأربعة، المتجر، المقهى، النزهة، حانوك، CTA | ٢١ |
| أغلفة مدونة فوتوغرافية سليمة | ~٧٦ |
| **صورتُك وأيقونتك الحقيقيتان** (`reham-*.jpg`) — المعلمة الحقيقية تبقى حقيقية، والكانون يمنع استبدالها بشخصية قصة | ٣ |
| أوضاع كلوبي 3D المتوفرة (يمكن إعادة استخدامها بدل التوليد) | ٨ |
| **أفاتار اللعبة 3D** في `src/game/player/` — كود إجرائي لا صور، فلا برومبت له | — |

**وملفات تُحذف بلا استبدال (١٤):** `src/assets/band/*.ts` · `src/assets/characters.ts` ·
ثمانية من `public/assets/illustrations/` (**عدا `hero-boy.webp`** — صار صورة «Off-model»
المرجعية في ورقة البراند) · `public/placeholder.svg` · فيديوَي `hero-korea-video*.mp4`.

---

# جدول الربط النهائي — البرومبت ← الملف ← المقاس

| # | البرومبت | الملف الناتج | المقاس |
|---|---|---|---|
| ⓪ | ورقة الشخصيتين | — (مرجع فقط) | 3:2 |
| ① | أيقونة لينا | `public/assets/icons/student-girl-heart.webp` `+@2x` | 128 / 256 |
| ②③④ | أوضاع كلوبي | `public/assets/cluby/cluby-{hangul-village,vocabulary-market,conversation-cafe}.webp` | مربع شفاف |
| ⑤⑥⑦⑧ | أيقونات كلوبي 3D | `public/assets/icons/{game-klobi-thumbsup,klobi-reading,klobi-headphones,game-klobi-han}.webp` `+@2x` | 128 / 256 |
| ⑨–㉕ | أغلفة المدونة | `public/assets/blog/*` بنفس الأسماء | 1200×675 |
| ㉖ | بورتريه البراند | `public/klovers-characters.png` (يحلّ محل ٣ ملفات) | 1600×900 + 4:5 |
| ㉗ | هيرو إنجليزي | `public/assets/cluby/hero-en.webp` | 1600×900 |

**بعد التوليد:** راجع `docs/IMAGE-STYLE-AUDIT-AR.md` للترتيب، وضع كل الصور في **كوميت واحد**
(‏`CLAUDE.md`: ميزانية Vercel ١٠٠ نشر لكل ٢٤ ساعة).
