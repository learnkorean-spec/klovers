/**
 * src/constants/courseCards.ts — the public "choose your level" cards.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The levels grid on / and /courses used to read its copy from
 * `translations.courses.items`, a hand-written array that had drifted away
 * from `src/constants/levels.ts`. That is how the site came to advertise
 * "Level 2 — TOPIK 2 / A2": copy nobody had reconciled with the source of
 * truth, in a file too large for anyone to notice.
 *
 * So the cards are now DERIVED from `LEVELS`. The level number, the TOPIK
 * band, the CEFR band and the class count all come from `levels.ts`; only the
 * marketing sentences live here, keyed by the same canonical keys. Change a
 * level there and the card follows.
 *
 * TWO CLAIMS THIS COPY IS CAREFUL ABOUT
 * -------------------------------------
 *  1. A level PREPARES a student toward a TOPIK band. It does not equal one,
 *     and it certainly does not certify one — see the hours note at the top
 *     of `levels.ts`. Every blurb reads "prepares you toward", never "=".
 *  2. CEFR is shown with "≈". The TOPIK↔CEFR table is a convenience, not a
 *     standard, and the TOPIK 6 = C2 end of it is disputed.
 *
 * Hangul is a real four-class course a student can buy on its own — several
 * people ask for the alphabet and nothing else — so it carries its own
 * session-by-session outline rather than a vague "foundations" blurb.
 */

import { LEVELS, SPECIAL_TRACKS, type Level } from "@/constants/levels";
import { WHATSAPP_BASE } from "@/lib/siteConfig";

export interface CourseCard {
  /** Canonical level key, or the special-track key. Also the React list key. */
  key: string;
  /** Small label above the title: how many classes, over how long. */
  eyebrow_en: string;
  eyebrow_ar: string;
  title_en: string;
  title_ar: string;
  blurb_en: string;
  blurb_ar: string;
  features_en: string[];
  features_ar: string[];
  /** Where "book this level" goes. */
  href: string;
  /**
   * True when `href` leaves the site (WhatsApp). Router <Link> cannot carry an
   * absolute URL, so the component renders a plain <a> for these.
   */
  external?: boolean;
  /** Label for that button. */
  cta_en: string;
  cta_ar: string;
}

/** Marketing copy per level key. Everything factual comes from `levels.ts`. */
const LEVEL_COPY: Record<
  string,
  { blurb_en: string; blurb_ar: string; features_en: string[]; features_ar: string[] }
> = {
  hangul: {
    blurb_en:
      "Read and write Korean from zero. Four classes, complete in itself — take it on its own, or as the step before Level 1.",
    blurb_ar:
      "قراءة الكورية وكتابتها من الصفر. أربع حصص كاملة بذاتها — تُدرس وحدها، أو خطوةً قبل المستوى الأول.",
    features_en: [
      "Class 1 — the basic vowels and consonants, and how a syllable is built",
      "Class 2 — tense and aspirated consonants, and combined vowels",
      "Class 3 — the final consonant (batchim)",
      "Class 4 — pronunciation rules, and reading your first sentences",
    ],
    features_ar: [
      "الحصة ١ — الحروف المتحركة والساكنة الأساسية وتركيب المقطع",
      "الحصة ٢ — الحروف المشددة والمهموسة والحروف المتحركة المركبة",
      "الحصة ٣ — الحرف الأخير (batchim)",
      "الحصة ٤ — قواعد النطق وقراءة أول جملك",
    ],
  },
  l1: {
    blurb_en:
      "Greetings, the present and past, and the sentences you need for everyday situations.",
    blurb_ar: "التحيات، والمضارع والماضي، والجمل التي تحتاجها في المواقف اليومية.",
    features_en: [
      "Introduce yourself and ask simple questions",
      "Numbers, time, dates and prices",
      "Core everyday vocabulary",
      "Read and write short sentences with confidence",
    ],
    features_ar: [
      "تعرّف بنفسك واسأل أسئلة بسيطة",
      "الأرقام والوقت والتواريخ والأسعار",
      "المفردات اليومية الأساسية",
      "قراءة وكتابة جمل قصيرة بثقة",
    ],
  },
  l2: {
    blurb_en: "Longer sentences, and enough language to handle a day on your own in Korean.",
    blurb_ar: "جمل أطول، ولغة تكفي لتدبير يوم كامل بالكورية.",
    features_en: [
      "Joining clauses with connectors",
      "Talking about plans, reasons and the past",
      "Shops, transport and appointments",
      "Reading short texts and simple messages",
    ],
    features_ar: [
      "ربط الجمل بأدوات الربط",
      "الحديث عن الخطط والأسباب والماضي",
      "التسوق والمواصلات والمواعيد",
      "قراءة نصوص قصيرة ورسائل بسيطة",
    ],
  },
  l3: {
    blurb_en: "Real topics, more complex grammar, and the difference between formal and casual speech.",
    blurb_ar: "مواضيع حقيقية وقواعد أعقد، والفرق بين الأسلوب الرسمي وغير الرسمي.",
    features_en: [
      "Give an opinion and back it with a reason",
      "Formal and informal registers",
      "Study and workplace situations",
      "Reading short article-length texts",
    ],
    features_ar: [
      "إبداء الرأي ودعمه بسبب",
      "الأسلوب الرسمي وغير الرسمي",
      "مواقف الدراسة والعمل",
      "قراءة نصوص بطول المقال القصير",
    ],
  },
  l4: {
    blurb_en: "Discussion rather than exchange: abstract topics, longer listening, structured writing.",
    blurb_ar: "نقاش لا مجرد تبادل: مواضيع مجردة واستماع أطول وكتابة مترابطة.",
    features_en: [
      "Discuss abstract and social topics",
      "Longer listening: interviews and reports",
      "Writing structured paragraphs",
      "Common idioms and set phrases",
    ],
    features_ar: [
      "مناقشة مواضيع مجردة واجتماعية",
      "استماع أطول: مقابلات وتقارير",
      "كتابة فقرات مترابطة",
      "التعبيرات والاصطلاحات الشائعة",
    ],
  },
  l5: {
    blurb_en: "Nuance — tone, politeness and what a sentence implies as well as what it says.",
    blurb_ar: "الفروق الدقيقة — النبرة والتأدب، وما تلمّح إليه الجملة لا ما تقوله فقط.",
    features_en: [
      "Tone, politeness and implication",
      "Academic and professional language",
      "Debate and structured argument",
      "Long-form reading",
    ],
    features_ar: [
      "النبرة والتأدب والمعنى الضمني",
      "اللغة الأكاديمية والمهنية",
      "النقاش وبناء الحجة",
      "قراءة النصوص الطويلة",
    ],
  },
  l6: {
    blurb_en: "Near-native comprehension, and the confidence to meet unfamiliar Korean without translating it.",
    blurb_ar: "فهم شبه أصلي، وقدرة على مواجهة نص كوري جديد دون ترجمته.",
    features_en: [
      "Near-native comprehension across topics",
      "Idioms, proverbs and Sino-Korean vocabulary",
      "Writing at length in your own voice",
      "Handling unfamiliar material without translation",
    ],
    features_ar: [
      "فهم شبه أصلي في مختلف المواضيع",
      "الاصطلاحات والأمثال والمفردات الصينية-الكورية",
      "الكتابة المطوّلة بأسلوبك الخاص",
      "التعامل مع نصوص جديدة دون ترجمة",
    ],
  },
};

/** Arabic ordinals for level names — only 1-6 are ever needed. */
const ARABIC_ORDINAL: Record<number, string> = {
  1: "الأول",
  2: "الثاني",
  3: "الثالث",
  4: "الرابع",
  5: "الخامس",
  6: "السادس",
};

/** Arabic-Indic digits, to match the rest of the Arabic copy on these cards. */
const ar = (n: number): string => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

/**
 * The line above the card title.
 *
 * It carries the COMMERCIAL fact — how many classes, over how long — because
 * that is the question a student actually has at this point and the one the
 * site could not answer. The TOPIK band moved down into the blurb: it is
 * context for the course, not the headline, and putting a band where the price
 * question belongs is how "level = TOPIK band" starts sounding true again.
 *
 * Months are derived, not stored: the purchasable bundles are 4 / 12 / 24
 * classes for 1 / 3 / 6 months, i.e. four classes a month (see stripePrices).
 */
const monthsFor = (sessions: number): number => Math.round(sessions / 4);

const eyebrowEn = (l: Level): string => {
  const n = l.sessions ?? 0;
  if (l.topik === null) return `${n} classes · ${l.cefr}`;
  return `${n} classes · ${monthsFor(n)} months`;
};

const eyebrowAr = (l: Level): string => {
  const n = l.sessions ?? 0;
  if (l.topik === null) return `${ar(n)} حصص · تمهيدي (${l.cefr})`;
  return `${ar(n)} حصة · ${ar(monthsFor(n))} شهور`;
};

/**
 * "Prepares you toward TOPIK n" — generated, so it cannot drift from `levels.ts`
 * and cannot accidentally be written as an equation in one card and not another.
 */
const preparesEn = (l: Level): string =>
  l.topik ? ` Prepares you toward TOPIK ${l.topik} (≈ CEFR ${l.cefr}).` : "";

const preparesAr = (l: Level): string =>
  l.topik ? ` يجهّزك لـ TOPIK ${l.topik} (يقابل تقريبًا ${l.cefr}).` : "";

const levelCards: CourseCard[] = LEVELS.map((l) => {
  const copy = LEVEL_COPY[l.key];
  return {
    key: l.key,
    eyebrow_en: eyebrowEn(l),
    eyebrow_ar: eyebrowAr(l),
    title_en: l.name,
    title_ar: l.key === "hangul" ? "تأسيس الهانغل" : `المستوى ${ARABIC_ORDINAL[l.id] ?? l.id}`,
    blurb_en: (copy?.blurb_en ?? l.description_en) + preparesEn(l),
    blurb_ar: (copy?.blurb_ar ?? l.description_ar) + preparesAr(l),
    features_en: copy?.features_en ?? [],
    features_ar: copy?.features_ar ?? [],
    // EnrollNowPage reads ?level= and preselects it (canonical key).
    href: `/enroll-now?level=${l.key}`,
    cta_en: l.key === "hangul" ? "Book the 4 classes" : "Book this level",
    cta_ar: l.key === "hangul" ? "حجز الحصص الأربع" : "حجز هذا المستوى",
  };
});

const specialCards: CourseCard[] = [
  {
    key: "reading_speaking",
    eyebrow_en: "Special track · private",
    eyebrow_ar: "مسار خاص · فردي",
    title_en: SPECIAL_TRACKS[0].label,
    title_ar: SPECIAL_TRACKS[0].label_ar,
    blurb_en: "Fluency practice for students who already have the grammar and want to use it.",
    blurb_ar: "تدريب على الطلاقة لمن يملك القواعد بالفعل ويريد استخدامها.",
    features_en: [
      "One-to-one, or a very small group",
      "Reading aloud with pronunciation correction",
      "Free conversation on topics you choose",
      "Runs alongside any level",
    ],
    features_ar: [
      "فردي أو مجموعة صغيرة جدًا",
      "قراءة جهرية مع تصحيح النطق",
      "محادثة حرة في مواضيع تختارها",
      "يمكن دراسته مع أي مستوى",
    ],
    // A private track is arranged by conversation, not by a booking form, so it
    // goes where that conversation actually happens.
    href: WHATSAPP_BASE,
    external: true,
    cta_en: "Ask about times on WhatsApp",
    cta_ar: "اسأل عن المواعيد على واتساب",
  },
  {
    key: "topik_prep",
    eyebrow_en: "Special track · exam",
    eyebrow_ar: "مسار خاص · امتحان",
    title_en: SPECIAL_TRACKS[1].label,
    title_ar: SPECIAL_TRACKS[1].label_ar,
    blurb_en: "Exam technique, for a TOPIK date you have already put in the calendar.",
    blurb_ar: "تدريب على تقنية الامتحان، لموعد TOPIK محدد بالفعل عندك.",
    features_en: [
      "Past papers under real exam timing",
      "Listening and reading strategy",
      "Writing: questions 51-54",
      "A study plan up to your exam date",
    ],
    features_ar: [
      "نماذج امتحانات سابقة بتوقيت حقيقي",
      "استراتيجية الاستماع والقراءة",
      "الكتابة: أسئلة ٥١–٥٤",
      "خطة مذاكرة حتى موعد الامتحان",
    ],
    href: "/topik-exam-preparation",
    cta_en: "See the TOPIK track",
    cta_ar: "شاهد مسار TOPIK",
  },
];

export const COURSE_CARDS: CourseCard[] = [...levelCards, ...specialCards];

/** Section header copy, kept beside the cards so the two cannot drift. */
export const COURSE_SECTION_COPY = {
  badge_en: "Our courses",
  badge_ar: "دوراتنا",
  title_en: "Choose the level that fits your journey",
  title_ar: "المستوى المناسب لكل رحلة",
  subtitle_en:
    "From the alphabet to advanced. Every class is 60 minutes, once a week. A level is 24 classes over 6 months — except Hangul Foundation, which is 4.",
  subtitle_ar:
    "من الأبجدية حتى المستوى المتقدم. كل حصة ٦٠ دقيقة، مرة في الأسبوع. المستوى ٢٤ حصة على ٦ شهور — ما عدا تأسيس الهانغل، ٤ حصص.",
  /**
   * The honest caveat, once under the grid rather than on all nine cards.
   *
   * It is what stops "Level 1 → TOPIK 1" reading as a promise. 24 classes is
   * 24 hours; institutes budget roughly 200 hours a level, and the published
   * range from zero to TOPIK 1-2 is 300-400 hours. Without this line, naming a
   * class count next to a TOPIK band quietly makes the claim the certificate
   * was just stopped from making.
   */
  note_en: "Classes cover the level's syllabus. Reaching TOPIK exam standard needs study between them.",
  note_ar: "الحصص بتغطي منهج المستوى. الوصول لمستوى امتحان TOPIK بيحتاج مذاكرة بينها كمان.",
  /** Shown under the grid for anyone who cannot place themselves. */
  unsure_en: "Not sure where you are?",
  unsure_ar: "المستوى غير واضح؟",
  placement_en: "Take the placement test",
  placement_ar: "اختبار تحديد المستوى",
  trial_en: "or try a free class first",
  trial_ar: "أو تجربة حصة مجانية أولًا",
  /**
   * The last exit on the page. Someone who has read nine cards and still has a
   * question will not fill in a form; they will message. Wording matches the
   * floating WhatsApp button so the two read as the same offer.
   */
  wa_en: "Can't find what you're looking for?",
  wa_ar: "لم تجد المطلوب؟",
  waCta_en: "Chat with us on WhatsApp",
  waCta_ar: "التواصل معنا عبر واتساب",
  waMessage_en: "Hi! I have a question about the Korean courses.",
  waMessage_ar: "السلام عليكم، عندي استفسار عن دورات الكورية.",
};

// ---------------------------------------------------------------------------
// Dev-only validation — the same guard `levels.ts` uses, applied to the copy
// that students actually read.
// ---------------------------------------------------------------------------

export const validateCourseCards = (): void => {
  if (COURSE_CARDS.length !== LEVELS.length + SPECIAL_TRACKS.length) {
    throw new Error("Course cards do not cover every level and special track");
  }
  COURSE_CARDS.forEach((c) => {
    if (c.features_en.length !== c.features_ar.length) {
      throw new Error(`Card ${c.key}: Arabic and English feature lists differ in length`);
    }
    if (c.features_en.length === 0) throw new Error(`Card ${c.key} has no features`);
    // No card may claim a level EQUALS a TOPIK band — the hours do not support
    // it, and this is exactly the claim the old translations file was making.
    // Checked on the blurb as well as the eyebrow, because that is where the
    // TOPIK sentence now lives.
    const equates = (s: string) => /TOPIK\s*\d\s*\/\s*[ABC]\d/.test(s) || /=\s*TOPIK/i.test(s) || /\bis TOPIK\b/i.test(s);
    if (equates(c.eyebrow_en) || equates(c.blurb_en)) {
      throw new Error(`Card ${c.key} equates a level with a TOPIK band`);
    }
  });
  COURSE_CARDS.forEach((c) => {
    if (c.external && !/^https?:\/\//.test(c.href)) {
      throw new Error(`Card ${c.key} is marked external but its href is not absolute`);
    }
    if (!c.external && !c.href.startsWith("/")) {
      throw new Error(`Card ${c.key} has an absolute href but is not marked external`);
    }
  });
  // Every level must state how many classes it is. A card that names a TOPIK
  // band but not a class count is the shape that sent students to WhatsApp to
  // ask what they were actually buying.
  LEVELS.forEach((l) => {
    if (!l.sessions || l.sessions < 1) {
      throw new Error(`Level ${l.key} has no class count, so its card cannot say what it sells`);
    }
  });
  const hangul = COURSE_CARDS.find((c) => c.key === "hangul");
  if (!hangul) throw new Error("Hangul card missing");
  if (hangul.features_en.length !== 4) {
    throw new Error("The Hangul card must list its four classes — students buy it for the alphabet alone");
  }
};

if (import.meta.env.DEV) {
  validateCourseCards();
}
