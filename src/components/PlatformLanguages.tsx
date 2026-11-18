import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/*
 * 18 Nov 2026 (Re, StartIT incubation review): the page used to read as one
 * Korean teacher's site, with the three sibling schools hidden in the "More"
 * menu. This band, straight under the hero, says what Klovers is: one
 * teaching platform that already runs four language schools, and the proof.
 *
 * Canon: homepage slot 2 ("live-class-trust", no characters). Deliberately
 * typographic, no mascot and no illustration.
 *
 * Every number is real and checked against the live database on 18 Nov 2026:
 * textbook_lessons = 314, lesson_vocabulary = 4,329, profiles with a real
 * country = Egypt, US, Japan, Oman, Vietnam (5). 200+ is the students Reham
 * has taught herself (same figure as the hero/teacher section). Re-check
 * before raising any of them; never round up past what the data says.
 */

type School = {
  script: string;
  scriptDir?: "rtl" | "ltr";
  brand: string;
  en: { lang: string; note: string };
  ar: { lang: string; note: string };
  href: string;
  flagship?: boolean;
};

const SCHOOLS: School[] = [
  {
    script: "한국어",
    brand: "Klovers",
    en: { lang: "Korean", note: "Live small-group classes, Hangul to Level 6" },
    ar: { lang: "الكورية", note: "حصص جماعية مباشرة، من الهانغول إلى المستوى السادس" },
    href: "/courses",
    flagship: true,
  },
  {
    script: "العربية",
    scriptDir: "rtl",
    brand: "maktub",
    en: { lang: "Arabic", note: "1:1 lessons for non-native speakers" },
    ar: { lang: "العربية", note: "دروس فردية لغير الناطقين بها" },
    href: "/learn-arabic",
  },
  {
    script: "English",
    brand: "Voca",
    en: { lang: "English", note: "1:1 lessons, grammar to fluency" },
    ar: { lang: "الإنجليزية", note: "دروس فردية، من القواعد إلى الطلاقة" },
    href: "/learn-english",
  },
  {
    script: "Magyar",
    brand: "Buda",
    en: { lang: "Hungarian", note: "1:1 lessons from the first word" },
    ar: { lang: "المجرية", note: "دروس فردية من الكلمة الأولى" },
    href: "/learn-hungarian",
  },
];

const STATS = [
  { value: "200+", valueAr: "+٢٠٠", en: "students taught live", ar: "طالب درسوا مباشرة" },
  { value: "314", valueAr: "٣١٤", en: "textbook lessons written in-house", ar: "درسًا في كتبنا الخاصة" },
  { value: "4,300+", valueAr: "+٤٣٠٠", en: "vocabulary items with audio and practice", ar: "كلمة مع النطق والتدريب" },
  { value: "5", valueAr: "٥", en: "countries our learners join from", ar: "دول يدرس منها طلابنا" },
];

const PlatformLanguages = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section aria-labelledby="platform-title" className="bg-background px-4 pt-20 pb-16 md:pt-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-charcoal px-3 py-1 text-xs font-bold uppercase tracking-widest text-klovers-yellow">
            {isAr ? "منصة واحدة · أربع لغات" : "One platform · Four languages"}
          </span>
          <h2 id="platform-title" className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-charcoal md:text-5xl">
            {isAr ? "منصة تعليم واحدة، تدير أربع مدارس لغات" : "One teaching platform. Four language schools."}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {isAr
              ? "بدأت Klovers بالكورية. والمنظومة نفسها (الحصص المباشرة، اختبار تحديد المستوى، الكتب، الألعاب ولوحة الطالب) تعمل الآن لأربع لغات، وتُبنى عليها كل لغة جديدة."
              : "Klovers started with Korean. The same system (live classes, placement testing, our own textbooks, practice games and a student dashboard) now runs four languages, and every new one is built on it."}
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCHOOLS.map((s) => {
            const copy = isAr ? s.ar : s.en;
            return (
              <li key={s.brand}>
                <Link
                  to={s.href}
                  className={`group flex h-full flex-col rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(46,46,46,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal ${
                    s.flagship ? "border-charcoal bg-klovers-yellow" : "border-charcoal/10 bg-ivory"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-charcoal/70">{s.brand}</span>
                    {s.flagship && (
                      <span className="rounded-full bg-charcoal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-klovers-yellow">
                        {isAr ? "الأساسية" : "Flagship"}
                      </span>
                    )}
                  </div>
                  <p dir={s.scriptDir ?? "auto"} lang={s.brand === "Klovers" ? "ko" : undefined} className="mt-6 font-display text-4xl font-extrabold text-charcoal">
                    {s.script}
                  </p>
                  <p className="mt-4 text-lg font-bold text-charcoal">{copy.lang}</p>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-charcoal/80">{copy.note}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-charcoal">
                    {isAr ? "اكتشف" : "Explore"}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-charcoal/10 bg-charcoal/10 lg:grid-cols-4">
          {STATS.map((st) => (
            <div key={st.en} className="bg-background px-5 py-6 text-center">
              <dt className="sr-only">{isAr ? st.ar : st.en}</dt>
              <dd className="font-display text-3xl font-extrabold text-charcoal md:text-4xl">{isAr ? st.valueAr : st.value}</dd>
              <dd className="mt-1 text-sm text-muted-foreground">{isAr ? st.ar : st.en}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default PlatformLanguages;
