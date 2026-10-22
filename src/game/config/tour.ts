import { STUDENTS_TAUGHT, TEACHING_YEARS_COUNT, toArabicDigits } from "@/lib/trustFigures";
import type { WorldLang } from "./copy";
import { VILLAGE, type TourStop } from "./rooms";
import type { WorldIcon } from "../environment/icons";

/**
 * The Klovers tour, an exhibition along the Hangul Village street: what
 * each of its six boards shows (VILLAGE.tour; drawn by
 * environment/TourExhibit).
 *
 * Posters, not pages (23 Oct 2026, Re: "less text, more presentation"):
 * each board is one short headline and one picture of the idea — big
 * numbers, a row of icons, a staircase of levels, three steps, photos, a
 * big free-class badge — never paragraphs. The facts are still the site's
 * own (About page, homepage, courses and free-trial pages) and the numbers
 * come from lib/trustFigures, so the world never says more than the site
 * does. No prices: they depend on the visitor's country (/pricing).
 */

/** The small drawings on the boards (environment/icons). */
export type TourIcon = WorldIcon;

export type TourLayout = "stats" | "icons" | "ladder" | "steps" | "pictures" | "cta";

export interface TourItem {
  /** A big number or word (stats, the free-class badge). */
  big?: string;
  label: string;
  icon?: TourIcon;
}

export interface TourSlide {
  stop: TourStop;
  title: string;
  /** One short line under the title (a few words). */
  tagline?: string;
  layout: TourLayout;
  items: TourItem[];
  /** Photos with a caption (why Korean). */
  pictures?: { src: string; label: string }[];
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
          tagline: "أسّستها ريهام الشرقاوي، خريجة الألسن",
          layout: "stats",
          items: [
            { big: `+${n(lang, TEACHING_YEARS_COUNT)}`, label: "سنة في تدريس الكورية" },
            { big: `+${n(lang, students)}`, label: "طالب درّستهم بنفسها" },
            { big: "عربي · EN", label: "حصص بالعربية أو الإنجليزية" },
          ],
        }
      : {
          stop: "about",
          title: "Who we are",
          tagline: "Founded by Reham Elshrkawy, Al-Alsun graduate",
          layout: "stats",
          items: [
            { big: `${TEACHING_YEARS_COUNT}+`, label: "years teaching Korean" },
            { big: `${students}+`, label: "students taught personally" },
            { big: "AR · EN", label: "classes in Arabic or English" },
          ],
        },
    why: ar
      ? {
          stop: "why",
          title: "لماذا كلوفرز؟",
          tagline: "فهم حقيقي، لا حفظ فقط",
          layout: "icons",
          items: [
            { icon: "live", label: "حصص مباشرة" },
            { icon: "talk", label: "التركيز على المحادثة" },
            { icon: "group", label: "جماعية أو خاصة" },
            { icon: "medal", label: "إعداد TOPIK" },
          ],
        }
      : {
          stop: "why",
          title: "Why Klovers",
          tagline: "Understand it, don't just memorize it",
          layout: "icons",
          items: [
            { icon: "live", label: "Live classes" },
            { icon: "talk", label: "Speaking-focused" },
            { icon: "group", label: "Group or private" },
            { icon: "medal", label: "TOPIK prep" },
          ],
        },
    courses: ar
      ? {
          stop: "courses",
          title: "من الهانغول إلى TOPIK",
          tagline: "مجموعات صغيرة، مستوى بعد مستوى",
          layout: "ladder",
          items: [
            { big: "한글", label: "الهانغول" },
            { big: "١", label: "المستوى" },
            { big: "٢", label: "المستوى" },
            { big: "٣", label: "المستوى" },
            { big: "٤", label: "المستوى" },
            { big: "٥", label: "المستوى" },
            { big: "٦", label: "المستوى" },
            { big: "TOPIK", label: "" },
          ],
        }
      : {
          stop: "courses",
          title: "From Hangul to TOPIK",
          tagline: "Small live groups, level by level",
          layout: "ladder",
          items: [
            { big: "한글", label: "Hangul" },
            { big: "1", label: "Level" },
            { big: "2", label: "Level" },
            { big: "3", label: "Level" },
            { big: "4", label: "Level" },
            { big: "5", label: "Level" },
            { big: "6", label: "Level" },
            { big: "TOPIK", label: "" },
          ],
        },
    method: ar
      ? {
          stop: "method",
          title: "كيف نعلّم",
          tagline: "الكلام من الدقيقة الأولى",
          layout: "steps",
          items: [
            { icon: "teacher", label: "درس مباشر" },
            { icon: "pencil", label: "تمارين وواجبات" },
            { icon: "repeat", label: "مراجعة" },
          ],
        }
      : {
          stop: "method",
          title: "How we teach",
          tagline: "Speaking from the first minute",
          layout: "steps",
          items: [
            { icon: "teacher", label: "Live lesson" },
            { icon: "pencil", label: "Practice" },
            { icon: "repeat", label: "Review" },
          ],
        },
    korean: ar
      ? {
          stop: "korean",
          title: "لماذا الكورية؟",
          layout: "pictures",
          items: [],
          pictures: [
            { src: "/assets/world/why-culture.webp", label: "الثقافة" },
            { src: "/assets/world/why-study.webp", label: "الدراسة" },
            { src: "/assets/world/why-career.webp", label: "المهنة" },
            { src: "/assets/world/why-travel.webp", label: "السفر" },
          ],
        }
      : {
          stop: "korean",
          title: "Why Korean?",
          layout: "pictures",
          items: [],
          pictures: [
            { src: "/assets/world/why-culture.webp", label: "K-Culture" },
            { src: "/assets/world/why-study.webp", label: "Study" },
            { src: "/assets/world/why-career.webp", label: "Career" },
            { src: "/assets/world/why-travel.webp", label: "Travel" },
          ],
        },
    trial: ar
      ? {
          stop: "trial",
          title: "ابدأ الدراسة",
          layout: "cta",
          items: [
            { big: `${n(lang, 30)} دقيقة`, label: "حصة تجريبية مجانية" },
            { icon: "teacher", label: "معلمة حقيقية" },
            { icon: "card", label: "دون بطاقة ائتمان" },
            { icon: "test", label: "اختبار مستوى مجاني" },
          ],
        }
      : {
          stop: "trial",
          title: "Start learning",
          layout: "cta",
          items: [
            { big: "30 min", label: "free trial class" },
            { icon: "teacher", label: "Real teacher" },
            { icon: "card", label: "No credit card" },
            { icon: "test", label: "Free placement test" },
          ],
        },
  };
  return VILLAGE.tour.map((b) => slides[b.id]);
}
