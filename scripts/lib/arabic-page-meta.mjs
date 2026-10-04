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
];

/** The English paths that have an Arabic twin (the homepage pair is separate). */
export const ARABIC_TWIN_PATHS = ARABIC_PAGE_META.map((p) => p.path);

/** "/pricing" -> "/ar/pricing"; null when the page has no Arabic twin. */
export const arabicTwinOf = (path) =>
  ARABIC_TWIN_PATHS.includes(path) ? "/ar" + path : null;
