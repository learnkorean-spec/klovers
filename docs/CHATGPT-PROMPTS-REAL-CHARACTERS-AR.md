# برومبتات ChatGPT لتوليد الصور بالشخصيتين الحقيقيتين

**آدم (Adam)** و **لينا (Lina)** + **كلوبي (Cluby)**
مرجع: `src/config/klovers-world.ts` (الكانون) + `public/brand-sheet.html`
مربوطة بأسماء الملفات الفعلية من تدقيق `IMAGE-STYLE-AUDIT-AR-2026-10-04.md`

---

## ⚠️ اقرأ هذا أولًا — ثلاثة حقائق تحكم كل شيء

**١. ChatGPT لا يتذكّر الشخصية بين محادثة وأخرى.**
الاتساق لا يأتي من البرومبت وحده، بل من **صورة مرجعية مرفقة**. لذلك الخطوة الأولى إلزامية:
ولّد «ورقة الشخصيتين» (البرومبت ⓪) واحفظها، ثم **أرفقها في كل طلب** وأضف السطر:
`Use the two people in the attached reference sheet. Keep their faces, hair, skin tone and outfits identical.`

**٢. لا تفتح محادثة جديدة بين الصور.** ابقَ في نفس المحادثة — السياق يساعد الاتساق.

**٣. الخلفية الشفافة غير مضمونة في ChatGPT.**
اطلبها صراحة أولًا؛ إن خرجت خلفية بيضاء مسطّحة، اطلب `transparent PNG background (alpha channel)`.
لو فشل، ولّدها على أبيض نقي `#FFFFFF` وأزل الخلفية محليًا — **لا تستخدم خلفية بيضاء في الموقع**،
لأن الأيقونات تُوضع على بلاطات صفراء وفحمية (قاعدة «Icons on a tile» في ورقة البراند).

---

## ① الكتلة الثابتة — «قفل الشخصيتين»

> تُلصق **في كل** برومبت، قبل وصف المشهد. هي التي تُبقي الوجهين متطابقين.

```
CHARACTERS — two recurring real people, keep them identical in every image:

ADAM: a man in his early 20s, definitely not Korean and not East Asian, wavy
dark-brown hair with a slightly messy fringe, friendly open smile, bright and
confident energy. Wearing a Klovers-yellow tailored blazer (#FFFF00) over a plain
ivory t-shirt, ivory trousers, white sneakers.

LINA: a woman in her early 20s, definitely not Korean and not East Asian, long wavy
auburn-copper hair, light freckles across the nose, warm curious smile. Wearing an
ivory hanbok-inspired wrap top with subtle white floral embroidery, a Klovers-yellow
midi skirt (#FFFF00) with a yellow floral sash, ivory flats.

CLUBY (include only when the scene says so): a small mint-green realistic-cute 3D
plush creature with soft felt-fur texture, round head, two short butter-yellow horns,
pointed ears with pink inner ear, warm dark-brown eyes, rosy cheeks, two tiny fangs,
ivory mini hanbok top, yellow wrap skirt with a sash bow, a green four-leaf clover on
the chest, short mint-green tail with small spikes.

ADAM AND LINA ARE FRIENDS AND STUDY COMPANIONS. Never a couple.

STYLE: photorealistic people with natural skin texture and real fabric, like a premium
editorial photograph — soft golden-hour Korean light, warm, calm and premium.
Cluby stays a soft 3D plush render, never a 2D cartoon.
```

### اختياري — قرار لريم فقط (لا تُضِفه قبل موافقتها)
الكانون يقول «ليس كوريًا وليس آسيويًا» ولا يحدد العِرق. لو أردتِ ملامح قريبة من جمهورك:

```
[OPTIONAL] Adam and Lina have North-African / Middle-Eastern features, warm
medium-tan skin, dark expressive eyes.
```
> لم أضفها إلى القفل لأن إضافة عِرق للشخصية **تعديل كانون**، ويجب أن يكون قرارًا واعيًا.

---

## ② الكتلة المانعة — «لا»

```
DO NOT INCLUDE: any text, letters, Hangul, captions, logos, watermarks, UI elements
or frames. No anime, manga, cartoon, comic, flat-vector or illustration style. No
plastic, waxy or over-smoothed skin. No oversaturated colours. No colour outside
Klovers yellow #FFFF00, charcoal #2E2E2E and ivory #FFF9EC (neon green #39FF14 only
as a tiny status accent if the scene asks for it). Never more than one Namsan Tower.
No romantic or couple framing: no hand-holding, no cheek-to-cheek, no kissing, no
arms around each other. No hard rectangular border — keep soft edges and leave clean
empty space so the image can dissolve into the page.
```

---

## ③ صيغة الطلب

```
[① قفل الشخصيتين]
[② الكتلة المانعة]
SCENE: <وصف المشهد من الجدول>
FORMAT: <المقاس>
```

### جدول المقاسات
| النوع | نص الـFORMAT |
|---|---|
| أيقونة وجه | `a square 1:1 image, head and shoulders, 3/4 view, generous margin, isolated on a fully transparent background (alpha PNG), no shadow on the background` |
| وضع كلوبي للألعاب | `a square 1:1 image, full body, isolated on a fully transparent background (alpha PNG), soft contact shadow only under the feet` |
| مشهد عريض (عوالم، لماذا الكورية، متجر) | `a wide 16:9 cinematic image, high resolution, leave clean empty space on one third for headline text` |
| غلاف مدونة | `a wide 16:9 editorial image, 1200x675, no people` |

---

## ⓪ أولًا: ورقة الشخصيتين (المرجع — لا تُنشر)

> ولّدها **مرة واحدة**، وأرفقها في كل الطلبات التالية. ويمكن أن تحلّ محل الصور الكرتونية
> `klovers-characters.png` و `hanbok-pair.jpg` في مكتبة الصور.

```
A clean two-person character reference sheet, one single image, plain ivory #FFF9EC
background, soft even studio light:

LEFT: full-body ADAM standing, facing camera, relaxed confident smile, arms easy at
his sides. RIGHT: full-body LINA standing, facing camera, warm smile, hands loosely
together in front. Both shown front-on, full body head to shoes, nothing cropped.

CHARACTERS: Adam is a man in his early 20s, definitely not Korean and not East Asian,
wavy dark-brown hair, wearing a Klovers-yellow tailored blazer (#FFFF00) over a plain
ivory t-shirt, ivory trousers, white sneakers. Lina is a woman in her early 20s,
definitely not Korean and not East Asian, long wavy auburn-copper hair, light freckles,
wearing an ivory hanbok-inspired wrap top with subtle white floral embroidery, a
Klovers-yellow midi skirt (#FFFF00) with a yellow floral sash, ivory flats. They stand
side by side as friends and study companions, with a clear gap between them, both feet
on the ground, equal height in frame.

STYLE: photorealistic people with natural skin texture and real fabric, premium
editorial photograph, clean and calm.

DO NOT INCLUDE: any text, letters, Hangul, logos or watermarks. No anime, manga,
cartoon or illustration style. No plastic or over-smoothed skin. No couple pose, no
touching, no hand-holding. No props, no scenery, no frame.

FORMAT: a wide 3:2 sheet, highest available resolution, both people fully in frame.
```

---

## الأيقونات — تحلّ محل أخطر ملفين في الريبو (٢٣ موضعًا)

> **مهم:** احفظ الملفين **بنفس الاسمين الحاليين** ليُصلَح كل شيء تلقائيًا:
> `public/assets/icons/student-boy-thumbsup.webp` و `student-girl-heart.webp` (+ نسخة `@2x`).
> انسخ القفل ① والمانع ② قبل كل واحد.

### ④ أيقونة آدم — `student-boy-thumbsup`

```
SCENE: Adam only, head and shoulders, three-quarter view, smiling warmly straight at
the camera and giving an encouraging thumbs-up close to his chest, the gesture inside
the frame. Bright daylit soft light, nothing in the background.

FORMAT: a square 1:1 image, head and shoulders, 3/4 view, generous margin around him,
isolated on a fully transparent background (alpha PNG), no background shadow.
```

### ⑤ أيقونة لينا — `student-girl-heart`

```
SCENE: Lina only, head and shoulders, three-quarter view, warm genuine smile at the
camera, one hand resting lightly flat on her chest near her heart, the gesture inside
the frame. Bright daylit soft light, nothing in the background.

FORMAT: a square 1:1 image, head and shoulders, 3/4 view, generous margin around her,
isolated on a fully transparent background (alpha PNG), no background shadow.
```

> **ملاحظة تصميمية:** استبدال الوجهين العامّين بآدم ولينا يمنح شارات الثقة هوية حقيقية.
> لو خرج الوجه صغيرًا أو مقطوعًا، أعد التوليد — هذه الأيقونة تُعرض 16–80px فقط، فيجب أن
> يقرأ الوجه من مسافة.

---

## كلوبي 3D — لإصلاح صفحة الألعاب

> يحلّ محل `public/assets/characters/cluby-{scholar,market,cafe}.webp` المسطّحة.
> **سمِّها بمفاتيح العوالم** لتصبح جاهزة لـ`WORLD_CLUBY`:
> `cluby-hangul-village.webp` · `cluby-vocabulary-market.webp` · `cluby-conversation-cafe.webp`
> هذه البرومبتات **بلا بشر** — لا تحتاج القفل ①، فقط المانع ② + سطر كلوبي.

### ⑥ كلوبي — قرية الهانغول

```
SCENE: Cluby, the small mint-green realistic-cute 3D plush creature with soft felt-fur
texture, round head, two short butter-yellow horns, pointed ears with pink inner ear,
warm dark-brown eyes, rosy cheeks, two tiny fangs, ivory mini hanbok top, yellow wrap
skirt with a sash bow, a green four-leaf clover on the chest and a short mint-green
spiky tail. He stands full body, waving hello with one arm raised, cheerful and curious,
head slightly tilted. Soft warm studio light.

DO NOT INCLUDE: any text, letters, Hangul or logos. No flat 2D cartoon look, no vector
outlines, no anime eyes — he must read as a soft physical plush toy photographed in 3D.

FORMAT: a square 1:1 image, full body, isolated on a fully transparent background
(alpha PNG), soft contact shadow only under the feet.
```
**نسختا السوق والمقهى:** نفس البرومبت مع تبديل السطر الأخير من المشهد:
- **سوق المفردات:** `He stands full body holding up one bright red apple in both paws, delighted, as if he just found it.`
- **مقهى المحادثة:** `He stands full body on the café counter beside a small ivory coffee cup, one paw raised as if mid-sentence, warm and chatty.`

---

## مشاهد العوالم الستة — 1600×900

> انسخ ① + ② + المشهد. هذه تستبدل الملفات الحقيقية الموجودة بـ **نفس الشيء** إن كانت سليمة —
> استخدمها للعوالم التي تحتاج تجديدًا أو للكتاب القادم. سمِّها
> `public/assets/story/world-<world-id>.webp` (`hangul-village`, `vocabulary-market`,
> `conversation-cafe`, `culture-street`, `memory-garden`, `seoul-journey`).

### ⑦ قرية الهانغول — آدم + كلوبي
```
SCENE: A quiet old Korean village of hanok houses at golden hour. Adam crouches slightly
beside a wooden village signpost, pointing at the carved Hangul on it with an expression
of delighted discovery. Cluby stands beside him, looking up at the sign with him. On the
signpost use abstract decorative brush strokes — no readable letters anywhere.
FORMAT: a wide 16:9 cinematic image, high resolution, leave clean empty space on the left third for headline text.
```

### ⑧ سوق المفردات — لينا + كلوبي
```
SCENE: A warm bustling Korean market at golden hour, fruit stalls and hanging lanterns.
Lina holds a wooden basket and lifts one bright red apple, smiling at it as if she just
learned the word. Cluby stands on the stall counter beside her, reaching happily toward
the fruit.
FORMAT: a wide 16:9 cinematic image, high resolution, leave clean empty space on the right third for headline text.
```

### ⑨ مقهى المحادثة — آدم + لينا + كلوبي
```
SCENE: A warm Korean café interior, wooden tables and a big window with soft afternoon
light. Adam and Lina sit across from each other as study partners with an open notebook
and two cups between them, mid-conversation, both smiling at each other naturally.
Cluby sits on the table edge between them, happily listening. Friendly and relaxed —
absolutely not a romantic date.
FORMAT: a wide 16:9 cinematic image, high resolution, leave clean empty space on the left third for headline text.
```

### ⑩ شارع الثقافة — لينا
```
SCENE: A refined Seoul street where modern storefronts meet traditional details, golden
hour, blossom petals in the air. Lina walks along it looking up at the architecture with
warm curiosity, one hand holding the edge of her skirt.
FORMAT: a wide 16:9 cinematic image, high resolution, leave clean empty space on the right third for headline text.
```

### ⑪ حديقة ذاكرة كلوبي — كلوبي فقط
```
SCENE: A quiet green garden at soft morning light, moss, low stone walls, tiny yellow
blossoms. Cluby sits on the grass holding an open ivory note card, looking at it
thoughtfully, as if remembering something for a friend. No people, no readable writing
on the card — blank ivory paper only.
FORMAT: a wide 16:9 cinematic image, high resolution, leave clean empty space on the left third for headline text.
```

### ⑫ رحلة سيول — الثلاثة
```
SCENE: A rooftop view over Seoul at sunset. Adam and Lina stand side by side as friends
looking out over the city, Lina pointing toward the horizon, Adam following her look.
Cluby stands on the low wall in front of them, waving at the skyline. Namsan Tower
appears exactly once in the distant skyline, small and far away.
FORMAT: a wide 16:9 cinematic image, high resolution, leave clean empty space on the
upper left for a headline.
```

---

## صورة المتجر / البراند — 16:9

> تحلّ محل `public/assets/story/shop-hero-lina.webp` و `shop-hero-lina-mobile.webp`،
> ويمكن استخدام نسخة منها لتحلّ محل `klovers-characters.png` في مكتبة الصور.

### ⑬ بورتريه الثنائي مع كلوبي
```
SCENE: Adam and Lina sitting together on a low hanok courtyard step in warm golden-hour
light, both looking toward the camera with relaxed friendly smiles, an open notebook and
a basket of yellow flowers beside them. Cluby sits on the step between them, paws
together, cheerful. The composition is calm and premium, with clear space beside them.
FORMAT: a wide 16:9 cinematic image, high resolution, leave the right half visually calm
and uncluttered for text.
FORMAT (mobile companion): the same two people and Cluby arranged vertically centred in
a 4:5 frame with generous space below them.
```

---

## «لماذا الكورية» — ٤ صور

> انسخ ① + ②، ثم المشهد + سطره. سمِّها كما هي في الريبو:
> `public/assets/world/why-career.webp` · `why-culture.webp` · `why-study.webp` · `why-travel.webp`

النهايات الأربعة (أضفها لبرومبت واحد بعد نسخ الكتلتين):

| الملف | السطر النهائي للمشهد |
|---|---|
| `why-career` | `SCENE: Adam sits at a bright modern desk by a tall window in Seoul, laptop open, city skyline behind the glass, self-assured and focused.` |
| `why-culture` | `SCENE: Lina sits in a sunlit café with a laptop and a small cup, laughing softly at something on the screen, warm cultural details around her in soft focus.` |
| `why-study` | `SCENE: Adam walks under a golden ginkgo avenue at peak autumn, a notebook under his arm, looking up at the yellow leaves with quiet satisfaction.` |
| `why-travel` | `SCENE: Lina stands at a Korean street food stall at dusk with a paper map in her hand, choosing what to eat, lanterns glowing warmly around her.` |

ثم دائمًا:
```
FORMAT: a wide 16:9 cinematic image, high resolution, leave clean empty space on one
third for headline text.
```

---

## أغلفة المدونة — **بلا أشخاص** (الأهم استراتيجيًا)

> توصية التدقيق: لا تضع أشخاصًا في أغلفة المدونة أصلًا — هذا يُلغي سؤال «من هذه الشخصية؟»
> نهائيًا. استخدم قالبًا واحدًا وبدّل الموضوع:

```
A photorealistic editorial photograph for a Korean-culture blog cover, golden-hour warm
light, shallow depth of field, calm premium magazine feel, generous negative space for a
title. No people, no faces, no hands.

SUBJECT: <بدّل هذا السطر>
```
**الاستبدالات — وهي الأغلفة الكاركتونية التي تحتاج استبدالًا:**
| الملف | سطر الـSUBJECT |
|---|---|
| `kong-pat.jpg` | `a rustic Korean table with red bean porridge in a ceramic bowl, a linen cloth and brass spoon, steam rising` |
| `korean-blood-type.jpg` | `four small ceramic Korean tea cups on a wooden tray in a row, each a different glaze` |
| `language-mixing.jpg` | `two open notebooks side by side on a desk, one with Latin script and one with Hangul, a pencil between them` |
| `translation-mistakes.jpg` | `a single open dictionary on a desk with a red pen resting in the fold, soft window light` |
| `kpop-trainee-room.jpg` | `an empty mirrored dance practice studio at golden hour, wooden floor, a water bottle and towel by the wall` |
| `korean-onomatopoeia.jpg` | `a warm Korean kitchen window with a kettle steaming, ceramic jars on the sill` |
| `korean-numbers.jpg` | `a Korean market price board and abacus on a wooden counter, no readable characters` |
| `korean-body-parts.webp` | `a hanbok hanging on a wooden hanger against an ivory plaster wall, soft morning light` |
| `multilingual-brain.jpg` | `an open notebook, a fountain pen and a cup of coffee on a linen desk, morning light` |
| `hallyu-wave.jpg` | `a Seoul street at dusk with glowing signage in soft bokeh, no readable letters` |
| `5min-psychology.jpg` / `5min-history.jpg` | `an old Korean brass clock and a stack of worn books on a wooden desk, warm lamp light` |
| `korean-directions.jpg` | `a Seoul subway map board and a hand pointing, shot from behind so no face is visible` |
| `korean-counters.jpg` | `a tidy row of Korean market goods — apples, rice cakes, ceramics — on a wooden shelf` |

---

## جدول الربط — أي برومبت يحلّ محل أي ملف

| البرومبت | الملف الناتج | يحلّ محل |
|---|---|---|
| ⓪ | (مرجع فقط — لا يُنشر) | `public/klovers-characters.png`, `public/characters/hanbok-pair.jpg` |
| ④ | `student-boy-thumbsup.webp` (+`@2x`) | وجه أنمي في **٢٣ موضعًا** |
| ⑤ | `student-girl-heart.webp` (+`@2x`) | وجه أنمي في نفس المواضع |
| ⑥ | `cluby-hangul-village/market/conversation-cafe.webp` | `public/assets/characters/cluby-*.webp` (٨ مسطّحة) |
| ⑦–⑫ | `world-*.webp` | تجديد العوالم الستة |
| ⑬ | `shop-hero-lina.webp` + `-mobile` | صورة المتجر |
| — | `why-{career,culture,study,travel}.webp` | نفس الأسماء (سليمة حاليًا، للتجديد) |
| — | أغلفة المدونة | ١٧ غلافًا كاركتونيًا |

---

## نصائح تشغيلية قصيرة

- **اطلب صورة واحدة في كل مرة.** «Generate one image» — لا تطلب عدة صور في رسالة واحدة.
- **لا تطلب نصًّا في الصورة أبدًا**، ولو ظهر حرف واحد أعد التوليد فورًا (ChatGPT يميل لكتابة الحروف).
- **للجودة العالية:** اطلب `highest available resolution` ثم صغّرها في محرر إلى 1600×900 أو 128/256.
- **تثبيت الوجه:** إن انحرف الوجه، اكتب `The face has drifted — keep exactly the same person as the attached reference sheet.`
- **للمشاهد الليلية:** أضف `golden hour or blue hour, warm practical lights, never harsh flash`.
- **الأيدي والعيون:** افحصهما دائمًا. أي يد مشوّهة = أعد التوليد.
- **بعد القبول:** احفظ بالاسم الصحيح، ضع كل الصور في **كوميت واحد** (قاعدة ميزانية نشر Vercel في
  `CLAUDE.md`: ١٠٠ نشر لكل ٢٤ ساعة، وقد حُطّمت سابقًا بسبب كوميت لكل ملف).
- **قبل النشر:** أضف قسم «KLOVERS REAL» إلى `public/brand-sheet.html` بحيث تصبح صور المرجع
  نفسها موثّقة — وإلا فسيعيد مولّد الصور القادم الكاركتون مرة أخرى.
