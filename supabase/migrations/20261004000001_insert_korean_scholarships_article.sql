-- Korean scholarships: one article, two languages, as DRAFTS (4 Oct 2026)
-- =====================================================================
--
-- CONTENT, NOT SCHEMA. This inserts two rows into blog_posts and changes no
-- object: it follows the pattern of 20260411000003 / 20260411000004, the two
-- migrations that added the earlier Arabic articles.
--
-- WHY unpublished: Re reviews the copy before it is public. `published` is
-- deliberately absent from the ON CONFLICT update as well, so re-running this
-- after a publish does NOT silently unpublish a live article.
--
-- WHY no trigger juggling: the older insert migration disabled
-- on_blog_post_published because it inserted rows that were already published.
-- These two rows are `published = false`, so the ping trigger never fires and
-- nothing needs disabling.
--
-- THE FACTS, AND WHERE THEY COME FROM (verified 4 Oct 2026, the same
-- verification behind src/constants/koreaScholarships.ts and /scholarships):
--   NIIED / Study in Korea ... GKS tracks, benefits, eligibility, timelines
--   Korean Embassy in Cairo .. Egypt's quotas on both GKS tracks (2026 cycle)
--   KAIST .................... 8-semester tuition exemption, KRW 350,000/m
--   The Korea Foundation ..... language fellowship, KRW 1.0-1.2m/m, KRW 300k travel
--   KOICA .................... benefits list, 17 months, nomination, country list
--
-- NO AMOUNT IS PRINTED FOR GKS OR KOICA. Both publish their figures in an
-- annual PDF guideline rather than in HTML, and the official university pages
-- disagree with each other on the GKS monthly allowance (800,000 vs 900,000
-- undergraduate; 1,000,000 vs about 1,130,000 graduate). Quoting one of those
-- as "the" figure would be passing on a disagreement as a fact. The article
-- says so in a section of its own instead.
--
-- The twin slugs are <base> and <base>-ar, the convention 90 of the 100
-- Arabic posts already use, and neither collides with the 200 published slugs
-- or with any keyword another article already owns.

INSERT INTO blog_posts (
  title, slug, description, keywords, article_type, hero_image, hero_alt,
  cta_text, cta_url, content, author, lang, published, published_at
)
VALUES
(
  'منح كوريا الدراسية: دليل عملي للطلاب العرب',
  'korean-scholarships-guide-ar',
  'ست منح كورية رسمية: ما تغطيه كل منحة، ومن ينطبق عليه الشرط، ومواعيد التقديم، وحصص مصر — بمصادر رسمية لا مواقع وسيطة.',
  ARRAY['منح كوريا', 'المنح الدراسية في كوريا', 'منحة الحكومة الكورية', 'GKS', 'الدراسة في كوريا', 'TOPIK'],
  'longform',
  '/assets/blog/korean-university.jpg',
  'حرم جامعي كوري في الربيع، وأشجار الكرز على جانبي الممر',
  'اعرف المنحة المناسبة لمستواك',
  '/ar/placement-test',
  $$## كل منحة تبدأ بورقة واحدة

أخطر ما يحدث لطالب منحة هو رقم منقول من موقع وسيط: يبني عليه خطة سنة كاملة، ثم يكتشف في سيول أن الرقم كان لدورة سابقة أو لجامعة أخرى. في هذا الدليل جمعنا **ست منح كورية رسمية**، وما تغطيه كل واحدة، ومن ينطبق عليه الشرط، ومواعيد التقديم، ومصدر كل معلومة من الجهة المانحة نفسها. تم التحقق من المعلومات في **٤ أكتوبر ٢٠٢٦**.

## أولًا: حقيقة توفّر عليك سنة كاملة

**خمس من المنح الست لا تطلب أي مستوى في TOPIK عند التقديم:**

- **منحة الحكومة الكورية (GKS)** لا تطلب TOPIK عند التقديم، والمنحة نفسها تشمل **سنة كاملة** لتدريس اللغة الكورية.
- **KAIST** لغة الدراسة والتواصل فيها الإنجليزية.
- **KOICA** تطلب الإنجليزية، وتُضاف دروس في الكورية.
- **برنامج التبادل** يُحدَّد شرطه اللغوي مع الجامعة الكورية المضيفة.

والمنحة الوحيدة التي تطلب كورية مسبقًا هي **زمالة مؤسسة كوريا لتدريب اللغة**، وتطلب فهم الكورية الأساسية والتحدث بها عند التقديم.

> معنى ذلك: إذا كانت المنحة المستهدفة هي GKS، فالعقبة ليست في مستوى اللغة الآن، بل في الملف: السن، والمعدل، والمستندات، والمواعيد.

## جدول سريع

| المنحة | الدرجة | اللغة عند التقديم | أبرز ما تغطيه |
|---|---|---|---|
| منحة الحكومة الكورية — بكالوريوس (GKS-U) | بكالوريوس | لا تُشترط | تذاكر + سنة لغة + رسوم + مصروف + تأمين |
| منحة الحكومة الكورية — دراسات عليا (GKS-G) | ماجستير/دكتوراه | لا تُشترط | تذاكر + سنة لغة + رسوم + مصروف + تأمين |
| منحة KAIST | بكالوريوس | الإنجليزية | إعفاء رسوم ٨ فصول + ٣٥٠٬٠٠٠ وون شهريًا + تأمين |
| زمالة مؤسسة كوريا لتدريب اللغة | لغة فقط | **كورية أساسية** | مصروف شهري + بدل سفر + رسوم + تأمين |
| برنامج منح KOICA | ماجستير | الإنجليزية | رسوم + تذاكر + سكن + مصروف + تأمين + منحة إتمام |
| برنامج الطلاب المتبادلين (GKS) | فصل واحد | حسب الجامعة المضيفة | مصروف شهري + تذكرة ذهاب وعودة |

## ثانيًا: المنح الست واحدة واحدة

### ١. منحة الحكومة الكورية — البكالوريوس (GKS-U)

الجهة: وزارة التعليم الكورية عبر المعهد الوطني للتعليم الدولي (NIIED).

- **من ينطبق عليه الشرط:** السن **أقل من ٢٥ سنة**، وشهادة الثانوية، ومعدل تراكمي **٨٠٪** أو ضمن أفضل ٢٠٪ من الدفعة. ومن يحمل شهادة جامعية **غير مؤهل** لهذا المسار.
- **التغطية:** تذاكر الطيران ذهابًا وعودة، وسنة كاملة لتدريس اللغة الكورية، والرسوم الدراسية كاملة، ومصروف شهري، وتأمين صحي، وبدل استقرار عند الوصول.
- **اللغة:** لا يُشترط TOPIK عند التقديم.
- **مصر:** حصة سنوية على هذا المسار — مقعدان في دورة ٢٠٢٦ (مقعد للمسار العام ومقعد لمسار R-GKS).
- **المواعيد:** التقديم في سبتمبر–أكتوبر. وكانت نافذة مسار السفارة في مصر **١٥–٣٠ سبتمبر** في دورة ٢٠٢٦، وهي أقصر من الموعد العام، وللمسار الجامعي موعد مختلف.

### ٢. منحة الحكومة الكورية — الدراسات العليا (GKS-G)

- **من ينطبق عليه الشرط:** السن **أقل من ٤٠ سنة**، وبكالوريوس مكتمل للماجستير أو ماجستير للدكتوراه، ومعدل **٨٠٪** في آخر مؤهل.
- **المدة:** ماجستير = سنة لغة + سنتان، ودكتوراه = سنة لغة + ثلاث سنوات. ومسار «الشبكة العالمية» للماجستير يُدرَّس بالإنجليزية دون سنة اللغة.
- **مصر:** ٧ مقاعد عبر السفارة و٨ عبر الجامعات في دورة ٢٠٢٦.
- **المواعيد:** التقديم في فبراير–مارس، والنتائج النهائية في يونيو.

### ٣. منحة KAIST

- **التغطية:** إعفاء كامل من الرسوم لثمانية فصول دراسية، و**٣٥٠٬٠٠٠ وون** شهريًا، وتأمين صحي — حسب صفحة المنحة في موقع الجامعة.
- **كيف تُمنح:** تلقائيًا مع القبول، بشرط الحفاظ على معدل **٢٫٧ من ٤٫٣** بعد السنة الأولى.
- **لمن:** طلاب الثانوية المتقدمون لدرجة البكالوريوس في العلوم والهندسة، والدراسة بالإنجليزية.

### ٤. زمالة مؤسسة كوريا لتدريب اللغة الكورية

- **ليست درجة علمية:** ستة أشهر قابلة للتمديد إلى اثني عشر.
- **التغطية:** مصروف معيشة شهري **١٬٠٠٠٬٠٠٠ وون** لحاملي البكالوريوس أو من لديهم أقل من ثلاث سنوات خبرة، و**١٬٢٠٠٬٠٠٠ وون** لحاملي الماجستير أو الدكتوراه أو من لديهم ثلاث سنوات خبرة فأكثر، مع **٣٠٠٬٠٠٠ وون** بدل سفر لمرة واحدة، والرسوم الدراسية، وتأمين صحي.
- **لمن:** طلاب أو باحثو الدراسات الكورية أو اللغة الكورية، ومنطقة **الشرق الأوسط مؤهلة بالاسم**. ومن يخطط للالتحاق ببرنامج درجة في كوريا غير مؤهل لها.
- **اللغة:** تشترط فهم الكورية الأساسية والتحدث بها عند التقديم، والترقي مستوى واحدًا في كل فصل دراسي.
- **البداية:** مارس أو سبتمبر، وتُعلن المواعيد في إعلان سنوي.

### ٥. برنامج منح KOICA

- **التغطية:** ماجستير بتمويل كامل: الرسوم، وتذاكر الطيران، وبدل استقرار، والسكن الجامعي، ومصروف شهري، والتأمين الصحي والطبي، ومنحة إتمام الدراسة، ودروس في اللغة الكورية. ومدة البرنامج **سبعة عشر شهرًا**.
- **لمن:** الموظفون الحكوميون، و**الترشيح الرسمي من الجهة الحكومية إلزامي**، والسن المفضل أقل من ٤٠ سنة، واللغة إنجليزية.
- **تحذير مهم:** قائمة الدول المؤهلة **تُعلن سنويًا** من KOICA، ولم تكن **مصر** مؤكدة على صفحات الوكالة عند التحقق. يلزم تأكيد الأهلية من مكتب KOICA أو السفارة الكورية في القاهرة قبل التقديم.
- **المواعيد:** الفرز في مارس عبر مكتب KOICA أو السفارة، ثم فرز الجامعات من أبريل إلى يونيو.

### ٦. برنامج الطلاب المتبادلين (GKS Exchange)

- **المدة:** فصل دراسي واحد (٤ أشهر)، ولا يُمدَّد.
- **التغطية:** **٦٣٠٬٠٠٠ وون** شهريًا، وتذكرة طيران ذهابًا وعودة بالدرجة الاقتصادية.
- **لمن:** الطلاب المسجّلون في جامعة لها اتفاق مع إحدى الجامعات الكورية المعتمدة، بمعدل ٨٠٪ أو أعلى، وفي برنامج تبادل يؤدي إلى درجة.
- **ملاحظة:** لا يوجد تقديم مباشر — الجامعة الأم هي التي ترشّح الطالب.

## ثالثًا: لماذا لا تجد أرقام GKS الشهرية في هذا الدليل؟

لأن NIIED تنشر مبالغها في **دليل PDF سنوي**، لا في صفحة ويب، ولأن صفحات الجامعات الرسمية تذكر أرقامًا **مختلفة** للسنة نفسها: جامعة سيول تذكر ٨٠٠٬٠٠٠ وون شهريًا للبكالوريوس، وجامعة كوموه ٩٠٠٬٠٠٠ وون، وفي الدراسات العليا مليون مقابل نحو ١٬١٣٠٬٠٠٠. وذكر رقم واحد منها سيكون نقلًا لخلاف لا لحقيقة.

أما الأرقام المذكورة في هذا المقال — KAIST وزمالة مؤسسة كوريا وبرنامج التبادل — فهي من صفحة رسمية واحدة تنص عليها.

**القاعدة العملية:** المبلغ يُقرأ من الدليل الرسمي للدورة الحالية، لا من مقال ولا من موقع وكالة.

## رابعًا: الطريق في خمس خطوات

1. **اختيار المسار:** مسار السفارة أو المسار الجامعي، ولكل منهما موعد مختلف، ونافذة السفارة هي الأقصر عادة.
2. **قراءة الدليل السنوي الحالي:** هو المستند الوحيد الذي يحمل المبالغ وقائمة الدول المؤهلة.
3. **ترتيب إثبات اللغة:** GKS لا يطلبه عند التقديم ويشمل سنة لغة، وزمالة مؤسسة كوريا تطلبه، وKAIST وKOICA بالإنجليزية.
4. **تجهيز المستندات:** كشوف الدرجات، والشهادات المصدّقة، وخطابات التوصية، وخطة الدراسة. والتصديق والترجمة هما الجزء الأبطأ.
5. **مراقبة المواعيد:** البكالوريوس في سبتمبر–أكتوبر، والدراسات العليا في فبراير–مارس، والمواعيد تُعلن من جديد في كل دورة.

## خامسًا: خطآن متكرران

**الأول: نقل الأرقام من مواقع الوسائط.** الأرقام والمواعيد وقوائم الدول تُعلن من جديد كل دورة، والمصدر الوحيد الذي يلزم الاعتماد عليه هو صفحة الجهة المانحة.

**الثاني: التعامل مع الموعد كأنه ثابت.** فقد تكون نافذة السفارة في بلدك أقصر بكثير من الموعد العام، كما حدث في مصر في دورة ٢٠٢٦.

## المصادر الرسمية

- NIIED / Study in Korea — برامج GKS: https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab1
- السفارة الكورية بالقاهرة — حصص مصر: https://overseas.mofa.go.kr/eg-ko/brd/m_11508/view.do?seq=1343892
- KAIST — صفحة المنحة: https://admission.kaist.ac.kr/intl-undergraduate/support/scholarships/kaist
- مؤسسة كوريا — زمالة تدريب اللغة: https://kf.or.kr/kfEng/cm/cntnts/cntntsView.do?cntntsId=1637
- KOICA — برنامج المنح: https://www.koica.go.kr/ciat/7806/subview.do
- برنامج الطلاب المتبادلين: https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab3

## الخطوة التالية

كل منحة في هذا الدليل لها شرط لغة مختلف: واحدة تطلب كورية أساسية، وأربع لا تطلب كورية أصلًا، والتبادل يحدّده الطرف المضيف. ولمعرفة أي منحة يستطيع **مستواك الحالي** الوصول إليها، يبدأ الطريق من اختبار تحديد المستوى المجاني في كلوفرز — وبعده تظهر المنح المناسبة لك وكم يفصلك عن كل واحدة.$$,
  'فريق كلوفرز',
  'ar',
  false,
  NULL
),
(
  'Korean Scholarships: A Practical Guide for Arab Students',
  'korean-scholarships-guide',
  'Six official Korean scholarships: what each covers, who qualifies, the deadlines and Egypt quotas - sourced from the funding bodies, not from agencies.',
  ARRAY['korean scholarships', 'GKS scholarship', 'study in korea', 'scholarships for arab students', 'KAIST scholarship', 'KOICA scholarship'],
  'longform',
  '/assets/blog/korean-university.jpg',
  'A Korean university campus in spring, cherry blossom along the walkway',
  'Find the scholarship that fits your level',
  '/placement-test',
  $$## Every scholarship starts with one page

The most expensive mistake a scholarship applicant makes is trusting a number copied from an agency site: they plan a whole year around it, then find in Seoul that it belonged to a previous cycle or to a different university. This guide collects **six official Korean scholarships**, what each one covers, who qualifies, when to apply, and the funding body's own page for every claim. Facts verified on **4 October 2026**.

## First: the fact that saves you a year

**Five of the six programmes require no TOPIK level at application:**

- **The Global Korea Scholarship (GKS)** does not ask for TOPIK at application, and the award itself includes a **full year** of Korean language training.
- **KAIST** teaches and communicates in English.
- **KOICA** requires English, and adds Korean classes.
- **The exchange programme** sets its language requirement with the Korean host university.

The only programme that asks for Korean up front is the **Korea Foundation Korean Language Training Fellowship**, which requires applicants to understand and speak basic Korean.

> In practice: if GKS is the target, your Korean level is not what stands in the way today — the file is: age, average, documents and deadlines.

## At a glance

| Programme | Stage | Language at application | What it covers |
|---|---|---|---|
| GKS - Undergraduate | Bachelor's | None required | Airfare + language year + tuition + allowance + insurance |
| GKS - Graduate | Master's / doctoral | None required | Airfare + language year + tuition + allowance + insurance |
| KAIST Scholarship | Bachelor's | English | 8 semesters of tuition + KRW 350,000 a month + insurance |
| Korea Foundation language fellowship | Language only | **Basic Korean** | Monthly allowance + travel allowance + tuition + insurance |
| KOICA Scholarship Program | Master's | English | Tuition + airfare + dormitory + allowance + insurance + completion grant |
| GKS Exchange Students | One semester | Set by the host university | Monthly allowance + round-trip airfare |

## Second: the six programmes, one by one

### 1. Global Korea Scholarship - Undergraduate (GKS-U)

Run by the Korean Ministry of Education through NIIED.

- **Who qualifies:** under **25 years old**, a high-school certificate, and an average of **80%** or a top-20% class rank. Holding a university degree makes an applicant **ineligible**.
- **What it covers:** round-trip airfare, a full year of Korean language training, full tuition, a monthly allowance, health insurance, and a settlement allowance on arrival.
- **Language:** no TOPIK level at application.
- **Egypt:** an annual quota on this track — two places in the 2026 cycle (one general, one R-GKS).
- **Timing:** applications run September–October. Egypt's embassy track closed **15–30 September** in the 2026 cycle, narrower than the global window, and the university track follows its own date.

### 2. Global Korea Scholarship - Graduate (GKS-G)

- **Who qualifies:** under **40 years old**, a completed bachelor's for a master's or a master's for a doctorate, and an average of **80%** in the most recent degree.
- **Duration:** master's = one language year + two years; doctoral = one language year + three. The Global Network master's track is taught in English with no language year.
- **Egypt:** seven places through the embassy and eight through the universities in the 2026 cycle.
- **Timing:** applications in February–March, final results in June.

### 3. KAIST Scholarship

- **What it covers:** a full tuition exemption for eight semesters, **KRW 350,000** a month, and medical insurance — as stated on the university's own scholarship page.
- **How it is awarded:** automatically with admission, provided the student keeps a GPA above **2.7 out of 4.3** after the first year.
- **Who it is for:** high-school leavers applying to an undergraduate science or engineering degree; instruction is in English.

### 4. Korea Foundation Korean Language Training Fellowship

- **Not a degree:** six months, extendable to twelve.
- **What it covers:** a monthly living allowance of **KRW 1,000,000** for bachelor's holders or those with under three years of experience, and **KRW 1,200,000** for master's or doctoral holders or those with three years or more, plus a one-time **KRW 300,000** travel allowance, tuition and health insurance.
- **Who it is for:** students or researchers in Korean studies or the Korean language; the **Middle East is named as an eligible region**. Anyone planning to enrol in a degree programme in Korea is not eligible.
- **Language:** basic Korean is required at application, and a recipient must advance one level each term.
- **Timing:** training starts in March or September, announced each year.

### 5. KOICA Scholarship Program

- **What it covers:** a fully funded master's — tuition, airfare, a settlement allowance, dormitory accommodation, a monthly allowance, national and private medical insurance, a completion grant and Korean language classes. The programme runs **seventeen months**.
- **Who it is for:** government officials, with **official nomination by the employer mandatory**; the preferred age is under 40, and English is required.
- **Important caveat:** KOICA re-issues the eligible-country list **every year**, and **Egypt was not confirmed** on the Agency's pages at verification time. Eligibility must be confirmed with the KOICA office or the Korean embassy in Cairo before applying.
- **Timing:** screening in March through the KOICA office or embassy, then university screening from April to June.

### 6. GKS Exchange Students Program

- **Duration:** one semester (four months), with no extension.
- **What it covers:** **KRW 630,000** a month, and round-trip economy airfare.
- **Who it is for:** students enrolled at a university that holds an agreement with a designated Korean university, with an average of 80% or above, in a degree exchange programme.
- **Note:** there is no direct application — the home university nominates the student.

## Third: why the GKS monthly figures are not in this guide

Because NIIED publishes its amounts in an **annual PDF guideline**, not on a web page, and because official university pages quote **different** figures for the same year: the University of Seoul lists KRW 800,000 a month for the undergraduate track, Kumoh National Institute of Technology lists 900,000, and for the graduate track Sunchon lists 1,000,000 against Kumoh's figure of about 1,130,000. Printing one of them as "the" figure would be passing on a disagreement as a fact.

The figures that do appear here — KAIST, the Korea Foundation fellowship and the exchange programme — each come from a single official page that states them.

**The practical rule:** read the amount from the current cycle's official guideline, not from an article and not from an agency site.

## Fourth: the route, in five steps

1. **Choose the track:** embassy or university. They run on different deadlines, and the embassy window is usually the shorter one.
2. **Read the current annual guideline:** it is the only document carrying the amounts and the eligible-country list.
3. **Sort the language proof:** GKS does not ask for TOPIK at application and includes a language year; the Korea Foundation fellowship does ask; KAIST and KOICA run in English.
4. **Prepare the documents:** transcripts, apostilled certificates, recommendation letters and a study plan. Legalisation and translation are the slowest part.
5. **Watch the deadlines:** undergraduate in September–October, graduate in February–March, re-issued every cycle.

## Fifth: two recurring mistakes

**Copying numbers from agency sites.** Amounts, dates and country lists are re-issued every cycle; the funding body's own page is the only source worth relying on.

**Treating a deadline as fixed.** An embassy window can be far narrower than the global one, exactly as happened in Egypt in the 2026 cycle.

## Official sources

- NIIED / Study in Korea - the GKS programmes: https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab1
- Korean Embassy in Cairo - Egypt's quotas: https://overseas.mofa.go.kr/eg-ko/brd/m_11508/view.do?seq=1343892
- KAIST - the scholarship page: https://admission.kaist.ac.kr/intl-undergraduate/support/scholarships/kaist
- The Korea Foundation - language training fellowship: https://kf.or.kr/kfEng/cm/cntnts/cntntsView.do?cntntsId=1637
- KOICA - the Scholarship Program: https://www.koica.go.kr/ciat/7806/subview.do
- GKS Exchange Students Program: https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab3

## The next step

Every programme above sets a different language bar: one asks for basic Korean, four ask for no Korean at all, and the exchange requirement is set by the host university. To see which ones **your current level** can reach, start with the free Klovers placement test — it turns this guide into the programmes that fit you, and how far off each one is.$$,
  'Klovers Team',
  'en',
  false,
  NULL
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  keywords = EXCLUDED.keywords,
  article_type = EXCLUDED.article_type,
  hero_image = EXCLUDED.hero_image,
  hero_alt = EXCLUDED.hero_alt,
  cta_text = EXCLUDED.cta_text,
  cta_url = EXCLUDED.cta_url,
  content = EXCLUDED.content,
  author = EXCLUDED.author,
  lang = EXCLUDED.lang,
  updated_at = NOW();
