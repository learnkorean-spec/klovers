import { STUDENTS_TAUGHT, TEACHING_SINCE, TEACHING_YEARS_COUNT, toArabicDigits } from "@/lib/trustFigures";
import type { WorldLang } from "./copy";
import { VILLAGE, type TourStop } from "./rooms";

/**
 * The Klovers tour, an exhibition along the Hangul Village street: what
 * each of its six boards says (VILLAGE.tour; drawn on the boards by
 * environment/TourExhibit). The words are the site's own —
 * the About page, the homepage ("Why Klovers", "How it works", "Why
 * Korean"), the courses and free-trial pages (src/i18n/translations.ts,
 * src/pages/AboutPage.tsx) — so the world never says more than the site
 * does. No prices: they depend on the visitor's country (/pricing).
 */
export interface TourSlide {
  stop: TourStop;
  title: string;
  lead: string;
  points?: string[];
  /** Small pictures with a caption (why Korean). */
  pictures?: { src: string; label: string; line: string }[];
  /** Out to the site; the world reopens in the house on the way back. */
  links?: { label: string; to: string; primary?: boolean }[];
}

const n = (lang: WorldLang, v: string | number) => (lang === "ar" ? toArabicDigits(v) : String(v));
const students = STUDENTS_TAUGHT.replace("+", "");

export function tourSlides(lang: WorldLang): TourSlide[] {
  const ar = lang === "ar";
  const slides: Record<TourStop, TourSlide> = {
    about: ar
      ? {
          stop: "about",
          title: "من نحن",
          lead: `أسّست كلوفرز ريهام الشرقاوي، خريجة الألسن قسم اللغة والأدب الكوري، وتدرّس الكورية منذ ${n(lang, TEACHING_YEARS_COUNT)} عامًا لأكثر من ${n(lang, students)} طالب.`,
          points: [
            "ليسانس اللغة والأدب الكوري، كلية الألسن",
            `أكثر من ${n(lang, TEACHING_YEARS_COUNT)} سنة في تدريس الكورية (من ${n(lang, TEACHING_SINCE)})`,
            `أكثر من ${n(lang, students)} طالب درّستهم بنفسها`,
            "حصص بالعربية أو الإنجليزية",
          ],
          links: [{ label: "صفحة من نحن", to: "/about" }],
        }
      : {
          stop: "about",
          title: "Who we are",
          lead: `Klovers was founded by Reham Elshrkawy, an Al-Alsun Korean language and literature graduate who has taught Korean for ${TEACHING_YEARS_COUNT} years and more than ${students} students.`,
          points: [
            "Korean language and literature degree, Faculty of Al-Alsun",
            `${TEACHING_YEARS_COUNT}+ years teaching Korean (since ${TEACHING_SINCE})`,
            `${students}+ students taught personally`,
            "Classes in English or Arabic",
          ],
          links: [{ label: "About us", to: "/about" }],
        },
    why: ar
      ? {
          stop: "why",
          title: "ما الذي يميّز كلوفرز",
          lead: "حصص كورية مباشرة أونلاين مع معلمة متخصصة، والشرح بالعربية بالكامل، للفهم الحقيقي لا للحفظ فقط.",
          points: ["مستويات منظمة", "حصص مرنة: خيارات جماعية وخاصة متاحة", "تركيز على المحادثة", "إعداد TOPIK", "مجتمع داعم"],
        }
      : {
          stop: "why",
          title: "Why Klovers",
          lead: "Live Korean classes online with a specialist teacher, taught entirely in Arabic — so it actually clicks, not just gets memorized.",
          points: ["Structured levels", "Flexible classes: group and private options", "Speaking-focused", "TOPIK prep", "A supportive community"],
        },
    courses: ar
      ? {
          stop: "courses",
          title: "الدورات والمستويات",
          lead: "حصص مباشرة ومجموعات صغيرة، مستوى بعد مستوى، من الهانغول حتى التوبيك.",
          points: [
            "تأسيس الهانغول: القراءة والكتابة والنطق قبل مستويات TOPIK",
            "المستوى ١: تحيات وقواعد أساسية وتعبيرات يومية",
            "المستوى ٢: توسيع بناء الجمل ومحادثات الحياة اليومية",
            "المستوى ٣: مواضيع واقعية مع قواعد أكثر تعقيدًا",
            "المستويات ٤ إلى ٦: من المحادثة المنظّمة حتى الفهم شبه الأصلي",
            "ومساران إضافيان: القراءة والمحادثة، وتحضير TOPIK",
          ],
          links: [{ label: "كل الدورات", to: "/courses" }],
        }
      : {
          stop: "courses",
          title: "Courses and levels",
          lead: "Live classes in small groups, level by level, from Hangul up to TOPIK.",
          points: [
            "Hangul Foundation: reading, writing and pronunciation before the TOPIK levels",
            "Level 1: core greetings, basic grammar and daily expressions",
            "Level 2: longer sentences and everyday conversations",
            "Level 3: real-life topics with more complex grammar",
            "Levels 4 to 6: from structured conversation to near-native understanding",
            "Plus two tracks: Reading & Speaking, and TOPIK Preparation",
          ],
          links: [{ label: "All courses", to: "/courses" }],
        },
    method: ar
      ? {
          stop: "method",
          title: "كيف نعلّم",
          lead: "صُمّمت الحصة للكلام من الدقيقة الأولى: تُشرح كل نقطة ببساطة بالعربية، ويُصحَّح النطق أثناء الكلام، وبعد كل حصة تتضح الخطوة التالية.",
          points: [
            "مجموعات صغيرة: المجموعة صغيرة بما يكفي ليتكلم كل طالب في كل حصة",
            "تصحيح فوري: المعلمة تصحح النطق مباشرة، وترسل تمارين على قدر المستوى بعد الحصة",
            "كل أسبوع: درس مباشر، ثم تمارين وواجبات، ثم مراجعة",
            "الحصة هي البداية، والتدريب والألعاب والثقافة لتثبيت الدروس",
          ],
          links: [{ label: "الألعاب", to: "/games" }],
        }
      : {
          stop: "method",
          title: "How we teach",
          lead: "Each class is built for speaking from the first minute: every point explained simply in Arabic, pronunciation corrected as you speak, and the next step clear after every class.",
          points: [
            "Small groups: small enough for everyone to speak in every class",
            "Live correction: the teacher corrects pronunciation on the spot and sends exercises for your level after class",
            "Every week: a live lesson, then practice and homework, then review",
            "The class is where it starts. Practice, games and culture make it stick",
          ],
          links: [{ label: "Games", to: "/games" }],
        },
    korean: ar
      ? {
          stop: "korean",
          title: "لماذا الكورية؟",
          lead: "اللغة الكورية تفتح أبوابًا لفرص جديدة.",
          pictures: [
            { src: "/assets/world/why-culture.webp", label: "الثقافة الكورية", line: "متابعة الدراما والكيبوب بالكورية" },
            { src: "/assets/world/why-study.webp", label: "الدراسة", line: "الوصول إلى الجامعات والمنح الكورية" },
            { src: "/assets/world/why-career.webp", label: "المهنة", line: "العمل مع الشركات الكورية حول العالم" },
            { src: "/assets/world/why-travel.webp", label: "السفر", line: "التنقّل في كوريا بثقة" },
          ],
          links: [{ label: "منح الدراسة في كوريا", to: "/scholarships" }],
        }
      : {
          stop: "korean",
          title: "Why Korean?",
          lead: "Open doors to new opportunities with the Korean language.",
          pictures: [
            { src: "/assets/world/why-culture.webp", label: "K-Culture", line: "Enjoy K-Drama, K-Pop and more in Korean" },
            { src: "/assets/world/why-study.webp", label: "Study", line: "Korean universities and scholarships" },
            { src: "/assets/world/why-career.webp", label: "Career", line: "Work with Korean companies worldwide" },
            { src: "/assets/world/why-travel.webp", label: "Travel", line: "Get around Korea with confidence" },
          ],
          links: [{ label: "Scholarships in Korea", to: "/scholarships" }],
        },
    trial: ar
      ? {
          stop: "trial",
          title: "ابدأ الدراسة",
          lead: "حصة مباشرة واحدة. معلمة حقيقية. دون بطاقة ائتمان. وفي الوقت المناسب.",
          points: [`حصة تجريبية مجانية مدتها ${n(lang, 30)} دقيقة`, "نقطة البداية غير واضحة؟ اختبار تحديد المستوى المجاني يوضّحها."],
          links: [
            { label: "حجز الحصة الكورية المجانية", to: "/free-trial", primary: true },
            { label: "بدء الاختبار المجاني", to: "/placement-test" },
          ],
        }
      : {
          stop: "trial",
          title: "Start learning",
          lead: "One live class. Real teacher. No credit card. Pick a time that works for you.",
          points: ["A free 30-minute trial class", "Not sure where to begin? The free placement test shows where to start."],
          links: [
            { label: "Book your free Korean class", to: "/free-trial", primary: true },
            { label: "Take the free test", to: "/placement-test" },
          ],
        },
  } as Record<string, TourSlide>;
  return VILLAGE.tour.map((b) => slides[b.id]);
}
