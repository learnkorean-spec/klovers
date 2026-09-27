import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight } from "lucide-react";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import rehamPhoto from "@/assets/reham-teacher.jpg";
import { logLeadEvent } from "@/lib/leadTracking";
import { STUDENTS_TAUGHT, TEACHING_YEARS, TEACHING_YEARS_COUNT, toArabicDigits } from "@/lib/trustFigures";

/**
 * The teacher.
 *
 * 23 Sep 2026: rewritten to verified facts only, and without TOPIK (off the
 * homepage by decision). What it said before, and why each line went:
 *
 *  - "TOPIK Certified" badge, "TOPIK / Certified Instructors" stat, and
 *    "a TOPIK-certified Korean instructor" in the bio - homepage decision.
 *  - "teaches entirely in Arabic" - classes run in English or Arabic now.
 *  - "Students reach A2 in an average of 3 months" - no data behind it.
 *  - "a hand-picked team of certified instructors" and "every teacher is
 *    assessed..." - no team is listed anywhere; the heading was "Meet Our
 *    Teaching Team" over one teacher. It is "Meet Your Teacher" now.
 *  - "5.0 / 5 Avg. Student Rating" - the Google figure is 5.0 from 7 reviews;
 *    as a teacher stat without its source it overstated. It is not repeated.
 *  - the journey strip promised "Confident B1" at month 6. The levels ladder
 *    (constants/levels) puts Level 1 at 24 classes over about 6 months, so the
 *    strip now names Klovers levels, not CEFR bands.
 *
 * What stays is what Re has stated: 13 years teaching, 200+ students she has
 * taught herself, a Korean language and literature degree from the Faculty of
 * Al-Alsun, classes in English or Arabic, small groups (capacity is internal,
 * never stated - Re, 15 Sep 2026).
 *
 * Copy lives here rather than in translations.ts for the same reason as
 * HowItWorks: that file cannot be edited safely with the tooling available.
 * The two figures come from @/lib/trustFigures, like every other page's.
 */

const HIGHLIGHTS = [
  { icon: "student-girl-heart" as KloverIconName, value: STUDENTS_TAUGHT, en: "Students taught", ar: "طالب تعلّموا معها" },
  { icon: "books-stack" as KloverIconName, value: TEACHING_YEARS, en: "Years teaching Korean", ar: "عامًا في تدريس الكورية" },
  { icon: "chat-annyeong" as KloverIconName, value: "EN · AR", valueAr: "عربي · إنجليزي", en: "Classes in English or Arabic", ar: "حصص بالعربية أو الإنجليزية" },
];

const MeetTeacher = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-klovers-yellow text-charcoal text-xs font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full mb-5 border border-charcoal/10 shadow-sm">
            {isAr ? "المعلمة" : "Your teacher"}
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight">
            {isAr ? "التعرّف على المعلمة" : "Meet Your Teacher"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">

          {/* Photo column */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-klovers-yellow/50 blur-3xl" />
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-3xl border-2 border-klovers-yellow" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-charcoal/10 w-64 sm:w-72 md:w-80 lg:w-96">
                <img
                  src={rehamPhoto}
                  alt={isAr ? "ريهام الشرقاوي، معلمة اللغة الكورية" : "Reham Elshrkawy, Korean teacher"}
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[3/4] object-cover object-top"
                />
                {/* Name overlay. Yellow type is correct HERE: it sits on a
                    near-black scrim, not on a light ground. */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 py-5">
                  <div className="flex items-center gap-2 mb-1">
                    <KloverIcon name="diploma-scroll" className="h-6 w-6" />
                    <span className="text-klovers-yellow text-xs font-bold tracking-wider uppercase">
                      {isAr ? "خريجة الألسن، قسم اللغة الكورية" : "Al-Alsun Korean graduate"}
                    </span>
                  </div>
                  <p className="text-white font-bold text-lg leading-tight">{isAr ? "ريهام الشرقاوي" : "Reham Elshrkawy"}</p>
                  <p className="text-white/85 text-sm font-semibold mt-0.5">{isAr ? "مؤسسة كلوفرز ومعلمة الكورية" : "Founder & Korean teacher"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text column */}
          <div className="flex flex-col gap-8">

            <div className="space-y-4 text-muted-foreground text-base md:text-lg leading-relaxed">
              <p className="text-foreground font-medium">
                {isAr
                  ? `تدرّس ريهام اللغة الكورية منذ ${toArabicDigits(TEACHING_YEARS_COUNT)} عامًا، وتعلّم معها أكثر من ${toArabicDigits(STUDENTS_TAUGHT.replace("+", ""))} طالب. تخرّجت في كلية الألسن، قسم اللغة الكورية وآدابها.`
                  : "Reham has taught Korean for 13 years and has taught more than 200 students herself. She studied Korean language and literature at the Faculty of Al-Alsun."}
              </p>
              <p>
                {isAr
                  ? "الحصة معها حديث حقيقي من الدقيقة الأولى: الشرح بالعربية أو الإنجليزية، وتصحيح النطق أثناء الكلام، وفي المجموعة الصغيرة يأخذ كل طالب دوره."
                  : "Her classes are built around speaking from the first minute: she explains in English or Arabic, corrects your pronunciation while you talk, and in a small group everyone gets their turn."}
              </p>
              <p>
                {isAr
                  ? "بعد كل حصة تتضح الخطوة التالية، من الهانغول حتى المستوى السادس."
                  : "After every class you know what comes next — from Hangul all the way to Level 6."}
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
              {HIGHLIGHTS.map(({ icon, value, valueAr, en, ar }: { icon: KloverIconName; value: string; valueAr?: string; en: string; ar: string }) => (
                <div
                  key={en}
                  className="group flex flex-col items-center text-center bg-card hover:bg-klovers-yellow/40 border border-border hover:border-klovers-yellow rounded-2xl p-3 sm:p-5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-ivory flex items-center justify-center mb-3 border border-klovers-yellow">
                    <KloverIcon name={icon} className="h-10 w-10" />
                  </div>
                  <span className="text-foreground font-extrabold text-base sm:text-xl leading-none" dir={isAr && valueAr ? "rtl" : "ltr"}>{isAr ? (valueAr ?? toArabicDigits(value)) : value}</span>
                  <span className="text-muted-foreground text-xs md:text-sm mt-1 leading-snug">{isAr ? ar : en}</span>
                </div>
              ))}
            </div>

            {/* Typical path — in Klovers levels, see the note above */}
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                {isAr ? "مسار طالب مبتدئ" : "A beginner's first months"}
              </p>
              <div className="flex gap-0 items-stretch">
                {(isAr ? [
                  { m: "الشهر الأول", desc: "الهانغول وأول جمل" },
                  { m: "الشهور ٢–٥", desc: "دروس المستوى الأول وتدريب على التحدّث" },
                  { m: "الشهر السادس", desc: "إتمام المستوى الأول" },
                ] : [
                  { m: "Month 1", desc: "Hangul + first phrases" },
                  { m: "Months 2–5", desc: "Level 1 lessons and speaking practice" },
                  { m: "Month 6", desc: "Level 1 complete" },
                ]).map(({ m, desc }, i, arr) => (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1 text-center relative">
                    <div className="flex items-center w-full">
                      <div className={`h-px flex-1 bg-border ${i === 0 ? "opacity-0" : ""}`} />
                      <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shrink-0" />
                      <div className={`h-px flex-1 bg-border ${i === arr.length - 1 ? "opacity-0" : ""}`} />
                    </div>
                    <p className="text-[11px] font-bold text-foreground/75">{m}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                size="lg"
                asChild
                className="gap-2 text-base font-bold h-12 px-8 rounded-full"
                onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "meet_teacher_cta", metadata: { language } }); } catch {} }}
              >
                <Link to="/free-trial">
                  {isAr ? "حجز حصة مجانية" : "Book a Free Class"}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MeetTeacher;
