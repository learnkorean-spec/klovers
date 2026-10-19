/**
 * arabic-page-meta.mjs - which marketing pages have an Arabic URL twin, and
 * their Arabic title and description (GEO-03, 27 Sep 2026).
 *
 * Deliberately tiny: the browser bundle imports it (src/lib/arabicRoutes.ts)
 * for routing, the language switch and the Arabic <title>, so the Arabic body
 * copy lives next door in arabic-pages.mjs, which only the build reads.
 * Consumers: scripts/prerender-meta.mjs, api/sitemap.xml.js,
 * src/lib/arabicRoutes.ts, and (by test) src/App.tsx and vercel.json.
 */

import { JOURNEY_ARABIC_PAGES } from "./arabic-journey.mjs";

export const ARABIC_PAGE_META = [
  { path: "/courses", title: "دورات الكورية من الهانغول إلى المستوى ٦ | كلوفرز", description: "دورات كلوفرز للغة الكورية من الهانغول حتى المستوى السادس: حصص مباشرة مع معلمة حقيقية، ٦٠ دقيقة أسبوعيًا، في مجموعات صغيرة، بالعربية أو بالإنجليزية." },
  { path: "/pricing", title: "أسعار دورات الكورية وخططها | كلوفرز", description: "أسعار كلوفرز حسب البلد وبالعملة المحلية: حصص جماعية مرة أسبوعيًا لشهر أو ٣ أو ٦ أشهر، وحصص خاصة بجدولة مرنة." },
  { path: "/free-trial", title: "حجز حصة كورية مجانية | كلوفرز", description: "حصة كورية مجانية مباشرة مدتها ٣٠ دقيقة مع معلمة حقيقية، بالعربية أو بالإنجليزية، دون بطاقة ائتمان ودون حساب." },
  { path: "/faq", title: "الأسئلة الشائعة عن دورات الكورية | كلوفرز", description: "إجابات عن تعلّم الكورية مع كلوفرز: المستوى المناسب، ومواعيد الحصص، وطرق الدفع، والشهادات، والتحضير لاختبار TOPIK." },
  { path: "/about", title: "عن كلوفرز والمعلمة ريهام الشرقاوي | كلوفرز", description: "أسست كلوفرز المعلمة ريهام الشرقاوي، خريجة قسم اللغة الكورية بكلية الألسن، التي تُدرّس الكورية منذ ١٣ عامًا لأكثر من ٢٠٠ طالب." },
  { path: "/placement-test", title: "اختبار تحديد مستوى الكورية المجاني | كلوفرز", description: "اختبار مجاني لتحديد مستوى اللغة الكورية بصيغ قراءة TOPIK: ٥٢ سؤالًا من الهانغول حتى المستوى الرابع، دون تسجيل." },
  // The blog index (28 Sep 2026): /blog lists the English articles only and
  // /ar/blog the Arabic ones. Same title and description as BlogPage's Arabic useSEO.
  { path: "/blog", title: "مجلة كلوفرز: كوريا واللغة الكورية", description: "مقالات وكلمات وقصص وتجارب عن كوريا واللغة الكورية بالعربية، في رحلة من ست محطات مع كلوفرز." },
  // Scholarships in Korea (4 Oct 2026). Same title and description as
  // ScholarshipsPage's Arabic useSEO, so the static head and the live page agree.
  { path: "/scholarships", title: "منح كوريا: ستة برامج رسمية | كلوفرز", description: "ست منح كورية رسمية: منحة الحكومة الكورية، وKAIST، ومؤسسة كوريا، وKOICA، والتبادل الطلابي — التغطية والشروط والمواعيد والمصادر الرسمية." },
  // Contact and the three landing pages (5 Oct 2026, GEO re-score). Same
  // title and description as their bodies in arabic-pages.mjs.
  { path: "/contact", title: "التواصل مع كلوفرز بشأن دورات الكورية", description: "التواصل مع كلوفرز بشأن دورات اللغة الكورية والتسجيل والدفع، عبر واتساب أو نموذج الرسائل أو البريد الإلكتروني، والرد يصل في أقرب وقت." },
  { path: "/learn-korean-arabic-speakers", title: "تعلّم الكورية للناطقين بالعربية | كلوفرز", description: "تعلّم الكورية انطلاقًا من العربية: ما تمنحه العربية مسبقًا، وما هو جديد، ومسار كلوفرز من الهانغول إلى المستوى السادس مع شرح بالعربية." },
  { path: "/topik-exam-preparation", title: "التحضير لاختبار TOPIK: الأقسام والدرجات | كلوفرز", description: "كيف يعمل اختبار TOPIK: الاختباران الأول والثاني، والأقسام والتوقيت، والدرجة المطلوبة لكل مستوى، ومسار كلوفرز للتحضير بنماذج سابقة وتدريب على الكتابة." },
  { path: "/learn-korean-kdramas", title: "تعلّم الكورية من المسلسلات الكورية | كلوفرز", description: "طريقة بسيطة لدراسة الكورية بالمسلسلات: مشهد واحد في كل مرة، وترجمة كورية، وترديد بصوت عالٍ، ودفتر عبارات، مع حصص مباشرة لشرح القواعد." },
  // Hungarian lessons (19 Oct 2026). Same title and description as
  // LearnHungarianPage's Arabic useSEO.
  { path: "/learn-hungarian", title: "تعلّم المجرية بالعربية أو الإنجليزية — مع ريهام الشرقاوي", description: "دروس مجرية فردية عبر الإنترنت، بشرح بالعربية أو الإنجليزية، مع معلمة عاشت في بودابست وتعرف تمامًا ما يحتاجه المبتدئ: من أجل السفر، أو منحة مجرية، أو أسرة مجرية." },
  // English lessons (19 Oct 2026). Same title and description as
  // LearnEnglishPage's Arabic useSEO.
  { path: "/learn-english", title: "تعلّم الإنجليزية بشرح بالعربية — مع ريهام الشرقاوي", description: "دروس إنجليزية فردية عبر الإنترنت، بشرح بالعربية، تركّز على المحادثة الحقيقية والثقة في الحديث — للعمل، أو المقابلات، أو السفر، أو التحضير للامتحانات." },
  // Arabic lessons for non-native speakers (19 Oct 2026). Same title and
  // description as LearnArabicPage's Arabic useSEO.
  { path: "/learn-arabic", title: "تعلّم العربية المصرية بشرح بالإنجليزية — مع ريهام الشرقاوي", description: "دروس عربية مصرية فردية عبر الإنترنت، بشرح بالإنجليزية، للمقيمين في مصر أو زائريها أو المهتمين باللهجة المصرية الحقيقية للمحادثة، لا الفصحى الكتابية فقط." },
  // Klovers Supply (6 Oct 2026). Same title and description as ShopPage's
  // Arabic useSEO for the shop index, so the static head and the live page agree.
  { path: "/shop", title: "متجر كلوفرز — كتب ومستلزمات لتعلّم الكورية", description: "كتب ومستلزمات من كلوفرز تحمل الكورية إلى ما بعد الحصة. الكتب الرقمية تُضاف مباشرة إلى «كتبي» في لوحة الطالب." },
  { path: "/hangul-starter", title: "ورقة الهانغول المجانية: الأبجدية الكورية | كلوفرز", description: "تعلُّم الأبجدية الكورية (الهانغول) مجانًا: الحروف الساكنة والمتحركة كاملة مع مقطع مثال لكل حرف وشرح مبسّط، وقابلة للطباعة." },
  // Seven more twins (15 Oct 2026). Each title and description is the page's
  // own Arabic useSEO, so the static head and the live page agree.
  { path: "/enroll-now", title: "التسجيل في حصص الكورية", description: "التسجيل في كلوفرز: اختيار نوع الحصة والجدول، ثم بدء التحدث بالكورية بثقة في حصص مباشرة عبر الإنترنت مع معلمة حقيقية." },
  { path: "/games", title: "ألعاب تعلّم الكورية", description: "تدريب على الكورية بألعاب تفاعلية في كلوفرز: الذاكرة، والهانغول، وترتيب الكلمات، وغيرها." },
  { path: "/affiliate", title: "برنامج الشركاء: عمولة ٢٠٪", description: "الانضمام إلى برنامج شركاء كلوفرز: رابط إحالة خاص وعمولة ٢٠٪ من أول دفعة لكل طالب جديد في دورات اللغة الكورية." },
  { path: "/interview-training", title: "التدريب على مقابلة العمل بالكورية", description: "تدريب على أسئلة مقابلات العمل بالكورية: أسئلة وأجوبة مخصّصة بالذكاء الاصطناعي، مع سؤالين مجانيين وإمكانية فتح أسئلة إضافية." },
  { path: "/welcome-back", title: "أهلًا بالعودة — عرض الطلاب العائدين", description: "خصم ٢٠٪ للطلاب العائدين إلى كلوفرز، وخصم إضافي عند مشاركة الصفحة مع الأصدقاء. اختبار المستوى اختياري." },
  { path: "/privacy-policy", title: "سياسة الخصوصية", description: "كيف تجمع كلوفرز بياناتك الشخصية وتستخدمها وتحميها، والخدمات التي تُشارَك معها، وطريقة الاطلاع عليها أو حذفها." },
  { path: "/terms", title: "شروط الخدمة", description: "شروط حصص كلوفرز المباشرة للغة الكورية عبر الإنترنت: الحسابات والمدفوعات وضمان الحصة الأولى والاسترداد والحصص الفائتة وقواعد السلوك." },
  // The journey hub and its five stations (6 Oct 2026), from arabic-journey.mjs.
  ...JOURNEY_ARABIC_PAGES.map(({ path, title, description }) => ({ path, title, description })),
];

/** The English paths that have an Arabic twin (the homepage pair is separate). */
export const ARABIC_TWIN_PATHS = ARABIC_PAGE_META.map((p) => p.path);

/** "/pricing" -> "/ar/pricing"; null when the page has no Arabic twin. */
export const arabicTwinOf = (path) =>
  ARABIC_TWIN_PATHS.includes(path) ? "/ar" + path : null;
