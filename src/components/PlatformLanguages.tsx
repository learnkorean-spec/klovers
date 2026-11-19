import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/*
 * 18 Nov 2026 (Re, StartIT incubation review): the page used to read as one
 * Korean teacher's site, with the three sibling schools hidden in the "More"
 * menu. This band, straight under the hero, says what Klovers is: one
 * teaching platform that already runs four language schools, and the proof.
 *
 * 19 Nov 2026 (Re, later the same day): after an earlier pass limited group
 * classes to Korean, Re confirmed that all four languages (Korean, Arabic,
 * English, Hungarian) offer private AND group classes. The cards and the
 * /learn-arabic, /learn-english and /learn-hungarian copy (including the
 * prerendered meta in scripts/) now say so. The placement test, the books and
 * the games are still Korean-only; do not claim them for the other three
 * until they really exist.
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
    en: { lang: "Korean", note: "Live private and group classes, Hangul to Level 6" },
    ar: { lang: "الكورية", note: "حصص خاصة وجماعية مباشرة، من الهانغول إلى المستوى السادس" },
    href: "/courses",
    flagship: true,
  },
  {
    script: "العربية",
    scriptDir: "rtl",
    brand: "maktub",
    en: { lang: "Arabic", note: "Private and group classes for non-native speakers" },
    ar: { lang: "العربية", note: "حصص خاصة وجماعية لغير الناطقين بها" },
    href: "/learn-arabic",
  },
  {
    script: "English",
    brand: "Voca",
    en: { lang: "English", note: "Private and group classes, grammar to fluency" },
    ar: { lang: "الإنجليزية", note: "حصص خاصة وجماعية، من القواعد إلى الطلاقة" },
    href: "/learn-english",
  },
  {
    script: "Magyar",
    brand: "Buda",
    en: { lang: "Hungarian", note: "Private and group classes from the first word" },
    ar: { lang: "المجرية", note: "حصص خاصة وجماعية من الكلمة الأولى" },
    href: "/learn-hungarian",
  },
];

const STATS = [
  { value: "200+", valueAr: "+٢٠٠", en: "students taught live", ar: "طالب درسوا مباشرة" },
  { value: "314", valueAr: "٣١٤", en: "textbook lessons written in-house", ar: "درسًا في كتبنا الخاصة" },
  { value: "4,300+", valueAr: "+٤٣٠٠", en: "vocabulary items across our lessons", ar: "كلمة في دروسنا" },
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
              ? "بدأت Klovers بالكورية: حصص جماعية وفردية مباشرة، واختبار تحديد مستوى، وكتب من تأليفنا، وألعاب، ولوحة طالب. والعربية والإنجليزية والمجرية تعمل اليوم بالأسعار نفسها واللوحة نفسها كحصص خاصة وجماعية، وكل لغة منها تكبر حتى تكتمل لها المنظومة كلها. وفي حكاية كلوفرز، تبدأ رحلة آدم ولينا وكلوبي من كوريا، ثم يسافرون مع كل لغة جديدة."
              : "Klovers started with Korean: live group and private classes, a placement test, our own textbooks, games and a student dashboard. Arabic, English and Hungarian run on the same pricing and dashboard with private and group classes today, and each one grows into the full system next. In the Klovers story, Adam, Lina and Cluby start their journey in Korea, then travel with every new language."}
          </p>
          {/* 18 Nov 2026 (Re): the language-journey line (canon languageJourney).
              Text only: slot 2 stays typographic, no characters drawn here. */}
          <p className="mt-5 font-display text-xl font-extrabold text-charcoal md:text-2xl">
            <span className="bg-klovers-yellow px-2 box-decoration-clone">
              {isAr ? "كوريا أولًا. ثم العالم." : "Korea first. Then the world."}
            </span>
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
                  {/* The script sits in an inline span with its own dir, so an RTL
                      word (العربية) still lines up with the other three cards. */}
                  <p className="mt-6 font-display text-4xl font-extrabold text-charcoal">
                    <span dir={s.scriptDir ?? "ltr"} lang={s.brand === "Klovers" ? "ko" : undefined} className="inline-block">
                      {s.script}
                    </span>
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
