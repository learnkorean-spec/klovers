import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * /topik-exam-preparation
 *
 * 25 Sep 2026 (QA pass): rewritten. The page it replaces had wrong score bands
 * (Level 1 "0-40", Level 2 "41-100"), wrong timings (Reading + Writing "100
 * min", Writing "2 tasks"), a "next exam" date that had already passed, and
 * offers nobody makes ("200+ practice tests", tutors "who passed TOPIK 6",
 * essays "corrected by native speakers", classes "at 8 PM Cairo time").
 *
 * What stays is what does not go out of date: the structure and pass marks of
 * TOPIK I and TOPIK II, and what the Klovers TOPIK track actually is (the same
 * four lines as /courses). Exam dates are NOT written here - they differ by
 * country and change every year - the page sends people to topik.go.kr.
 *
 * Palette only: yellow, charcoal, ivory. Copy is inline in both languages
 * (translations.ts `topikExam.*` is no longer read).
 */

const TOPIK_I = [
  { level: 1, score: "80–139" },
  { level: 2, score: "140–200" },
];
const TOPIK_II = [
  { level: 3, score: "120–149" },
  { level: 4, score: "150–189" },
  { level: 5, score: "190–229" },
  { level: 6, score: "230–300" },
];

const TopikExamPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: "TOPIK Exam Preparation: Format, Scoring & Study Plan",
    description:
      "How the TOPIK Korean exam works: TOPIK I and II, sections, timing and the score needed for each level, plus the Klovers TOPIK track with past papers and writing practice.",
    canonical: "https://kloversegy.com/topik-exam-preparation",
  });

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "topik-faq-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the TOPIK exam?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TOPIK (Test of Proficiency in Korean) is the official Korean proficiency test, run by Korea's National Institute for International Education (NIIED). TOPIK I covers Levels 1-2 and TOPIK II covers Levels 3-6.",
          },
        },
        {
          "@type": "Question",
          name: "What score do I need for each TOPIK level?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TOPIK I is scored out of 200: Level 1 from 80, Level 2 from 140. TOPIK II is scored out of 300: Level 3 from 120, Level 4 from 150, Level 5 from 190, Level 6 from 230.",
          },
        },
        {
          "@type": "Question",
          name: "When is the next TOPIK exam?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TOPIK is held several times a year, and the dates and test centres differ by country. Check the official site, topik.go.kr, or your local test centre for the next date and its registration window.",
          },
        },
        {
          "@type": "Question",
          name: "How long is a TOPIK score valid?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A TOPIK result is valid for two years from the date results are announced.",
          },
        },
      ],
    });
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  const sectionTitle = "text-2xl md:text-3xl font-extrabold text-foreground mb-6";
  const card = "rounded-2xl border border-charcoal/10 bg-card p-5 md:p-6";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16">
        {/* Hero */}
        <section className="bg-charcoal text-ivory py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <span className="inline-block rounded-full bg-klovers-yellow px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-charcoal">
              {tr("Seoul Journey · TOPIK preparation", "رحلة سيول · التحضير لاختبار TOPIK")}
            </span>
            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight">
              {tr("How the TOPIK exam works, and how to prepare", "كيف يسير اختبار TOPIK، وكيف يكون الاستعداد له")}
            </h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-ivory/80 leading-relaxed">
              {tr(
                "The two tests, their sections and timing, the score each level needs, and a realistic way to get ready.",
                "الاختباران، وأقسام كل منهما ومدته، والدرجة المطلوبة لكل مستوى، وطريقة واقعية للاستعداد.",
              )}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="rounded-full font-bold">
                <Link to="/placement-test">
                  {tr("Find your level first", "معرفة المستوى أولًا")}
                  <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full bg-transparent text-ivory border-ivory/40 hover:bg-ivory/10">
                <Link to="/courses">{tr("See the TOPIK track", "عرض مسار TOPIK")}</Link>
              </Button>
            </div>
            {/* Story scene under the buttons, so it never pushes them down. */}
            <img
              src="/assets/story/world-seoul-journey.webp"
              alt={tr("The Seoul Journey, the last world of the Klovers story", "رحلة سيول، آخر عالم في قصة Klovers")}
              width={1600}
              height={900}
              decoding="async"
              className="mt-10 w-full aspect-[16/7] rounded-3xl border border-ivory/15 object-cover"
            />
          </div>
        </section>

        {/* The two tests */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className={sectionTitle}>{tr("Two tests, six levels", "اختباران، وستة مستويات")}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className={card}>
                <h3 className="text-xl font-bold text-foreground">TOPIK I</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tr("Levels 1–2 · scored out of 200", "المستويان ١ و٢ · الدرجة من ٢٠٠")}</p>
                <ul className="mt-4 space-y-2 text-sm text-foreground">
                  <li>{tr("Listening — 30 questions, 40 minutes", "استماع — ٣٠ سؤالًا، ٤٠ دقيقة")}</li>
                  <li>{tr("Reading — 40 questions, 60 minutes", "قراءة — ٤٠ سؤالًا، ٦٠ دقيقة")}</li>
                  <li>{tr("All multiple choice · 100 minutes in total", "كلها أسئلة اختيار من متعدد · ١٠٠ دقيقة إجمالًا")}</li>
                </ul>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {TOPIK_I.map((l) => (
                    <div key={l.level} className="rounded-xl bg-klovers-yellow px-3 py-2 text-center">
                      <p className="text-xs font-bold text-charcoal">{tr(`Level ${l.level}`, `المستوى ${l.level}`)}</p>
                      <p className="text-sm font-extrabold text-charcoal" dir="ltr">{l.score}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={card}>
                <h3 className="text-xl font-bold text-foreground">TOPIK II</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tr("Levels 3–6 · scored out of 300", "المستويات من ٣ إلى ٦ · الدرجة من ٣٠٠")}</p>
                <ul className="mt-4 space-y-2 text-sm text-foreground">
                  <li>{tr("Listening — 50 questions, 60 minutes", "استماع — ٥٠ سؤالًا، ٦٠ دقيقة")}</li>
                  <li>{tr("Writing — 4 questions (51–54), 50 minutes", "كتابة — ٤ أسئلة (٥١–٥٤)، ٥٠ دقيقة")}</li>
                  <li>{tr("Reading — 50 questions, 70 minutes", "قراءة — ٥٠ سؤالًا، ٧٠ دقيقة")}</li>
                </ul>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {TOPIK_II.map((l) => (
                    <div key={l.level} className="rounded-xl bg-klovers-yellow px-3 py-2 text-center">
                      <p className="text-xs font-bold text-charcoal">{tr(`Level ${l.level}`, `المستوى ${l.level}`)}</p>
                      <p className="text-sm font-extrabold text-charcoal" dir="ltr">{l.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {tr(
                "Your level is decided by your total score, not by any single section. Results are valid for two years. The level a university, employer or visa asks for depends on them — check their own requirement.",
                "يتحدد المستوى من مجموع الدرجات، لا من قسم واحد. والنتيجة صالحة لمدة سنتين. أما المستوى المطلوب للجامعة أو العمل أو التأشيرة فيختلف حسب الجهة، والأفضل التأكد من شرطها مباشرة.",
              )}
            </p>
          </div>
        </section>

        {/* Dates */}
        <section className="py-14 md:py-20 bg-card border-y border-border">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className={sectionTitle}>{tr("Exam dates and registration", "مواعيد الاختبار والتسجيل")}</h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              {tr(
                "TOPIK is held several times a year, but which sessions run, where, and when registration opens differs by country. We don't list dates here because they change — the official site always has the current ones.",
                "يُعقد TOPIK عدة مرات في السنة، لكن المواعيد وأماكن الاختبار وفتح التسجيل تختلف من بلد إلى آخر. لا ننشر المواعيد هنا لأنها تتغير؛ والموقع الرسمي يعرض المواعيد الحالية دائمًا.",
              )}
            </p>
            <a
              href="https://www.topik.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground/70"
            >
              topik.go.kr
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* How to prepare */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className={sectionTitle}>{tr("How to prepare", "طريقة الاستعداد")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                [
                  tr("Take a past paper first", "البدء باختبار سابق"),
                  tr("Sit one full past paper under real timing. It shows which section is costing you points.", "حلّ اختبار سابق كامل بالتوقيت الحقيقي نفسه يكشف أي قسم تضيع فيه الدرجات."),
                ],
                [
                  tr("Build the vocabulary the exam uses", "بناء المفردات التي يستخدمها الاختبار"),
                  tr("Most lost points in reading and listening are unknown words, not unknown grammar.", "معظم الدرجات الضائعة في القراءة والاستماع سببها كلمات غير معروفة، لا قواعد."),
                ],
                [
                  tr("Practise writing 51–54 on its own", "التدرّب على أسئلة الكتابة ٥١–٥٤ منفردة"),
                  tr("Each question has a set format. Short answers, a graph description and a 600–700 character essay all need separate practice.", "لكل سؤال شكل ثابت. والإجابات القصيرة ووصف الرسم البياني والمقال (٦٠٠–٧٠٠ حرف) يحتاج كل منها إلى تدريب منفصل."),
                ],
                [
                  tr("Finish with timed full papers", "الختام باختبارات كاملة بالتوقيت"),
                  tr("In the last weeks, full papers under exam timing, then review every wrong answer.", "في الأسابيع الأخيرة: اختبارات كاملة بتوقيت الاختبار، ثم مراجعة كل إجابة خاطئة."),
                ],
              ].map(([title, body]) => (
                <div key={title} className={card}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
                    <div>
                      <h3 className="font-bold text-foreground">{title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {tr(
                "Past papers are published free on the official TOPIK site.",
                "الاختبارات السابقة منشورة مجانًا على موقع TOPIK الرسمي.",
              )}
            </p>
          </div>
        </section>

        {/* The Klovers track - same four lines as /courses */}
        <section className="py-14 md:py-20 bg-ivory dark:bg-muted border-y border-border">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className={sectionTitle}>{tr("The Klovers TOPIK track", "مسار TOPIK في كلوفرز")}</h2>
            <p className="text-base text-foreground/80 mb-5">
              {tr(
                "Exam technique, for a TOPIK date you have already put in the calendar. Taught live by Reham, in English or Arabic.",
                "أساليب الاختبار، لموعد TOPIK محدد مسبقًا في التقويم. حصص مباشرة مع ريهام، بالعربية أو الإنجليزية.",
              )}
            </p>
            <ul className="space-y-2">
              {[
                tr("Past papers under real exam timing", "اختبارات سابقة بتوقيت الاختبار الحقيقي"),
                tr("Listening and reading strategy", "استراتيجية الاستماع والقراءة"),
                tr("Writing: questions 51–54", "الكتابة: الأسئلة ٥١–٥٤"),
                tr("A study plan up to your exam date", "خطة دراسة حتى موعد الاختبار"),
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">
              {tr(
                "Classes cover the syllabus. Reaching exam standard needs study between them.",
                "تغطي الحصص المنهج، أما بلوغ مستوى الاختبار فيحتاج إلى دراسة بينها.",
              )}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="rounded-full font-bold">
                <Link to="/free-trial">
                  {tr("Book a free class", "حجز حصة مجانية")}
                  <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full">
                <Link to="/blog/topik-exam-guide">{tr("Read the full TOPIK guide", "قراءة دليل TOPIK الكامل")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TopikExamPage;
