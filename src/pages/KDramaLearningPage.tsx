import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * /learn-korean-kdramas
 *
 * 25 Sep 2026 (QA pass): the copy is rewritten; the look from "Story style
 * batch 1" (ivory hero with the painted culture-street scene, palette cards,
 * charcoal final CTA) is kept.
 *
 * What went: claims nobody measured - "the secret method used by 500K+ K-drama
 * fans", "40% faster than textbooks", "3x faster results", "your brain learns
 * Korean automatically", "200-400 words per drama" - advice to take "Klovers
 * lessons 3x per week" (classes are once a week), Squid Game recommended to
 * A1 beginners, and a "drama journal template" that was never attached.
 *
 * What it says now: a plain, repeatable way to study one scene at a time, how
 * to pick a drama, and where live classes fit. Copy is inline in both
 * languages (translations.ts `kdrama.*` is no longer read).
 */

const STEPS: { en: [string, string]; ar: [string, string] }[] = [
  {
    en: ["Watch for the story", "First watch with subtitles in your language. Enjoy it — you need to know what happens before you can study how it is said."],
    ar: ["اتفرج على القصة", "أول مرة اتفرج بترجمة بلغتك واستمتع — لازم تعرف اللي بيحصل قبل ما تذاكر إزاي بيتقال."],
  },
  {
    en: ["Pick one short scene", "Choose two or three minutes you liked. Short enough to replay many times."],
    ar: ["اختار مشهد قصير", "اختار دقيقتين أو تلاتة عجبوك. قصير كفاية إنك تعيده كذا مرة."],
  },
  {
    en: ["Replay it with Korean subtitles", "Pause on each line. Write down the words and endings you recognise, and look up the rest."],
    ar: ["عيده بترجمة كوري", "وقّف عند كل جملة. اكتب الكلمات والنهايات اللي عارفها، ودوّر على الباقي."],
  },
  {
    en: ["Say the lines out loud", "Repeat each line after the actor, copying the rhythm. Then try the scene with no subtitles at all."],
    ar: ["قول الجمل بصوت عالي", "كرر كل جملة بعد الممثل وقلّد الإيقاع. وبعدين جرّب المشهد من غير ترجمة خالص."],
  },
  {
    en: ["Keep a phrase notebook", "One line per phrase: the Korean, what it means, the scene it came from, and one sentence of your own with it."],
    ar: ["خلي عندك كشكول جمل", "سطر لكل جملة: الكوري، معناها، المشهد اللي جت منه، وجملة من عندك بيها."],
  },
];

const KDramaLearningPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: "Learn Korean Through K-Dramas",
    description:
      "A simple, repeatable way to study Korean with K-dramas: one scene at a time, with Korean subtitles, shadowing and a phrase notebook, and how live classes fill in the grammar.",
    canonical: "https://kloversegy.com/learn-korean-kdramas",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        {/* Hero - the painted culture street from Story style batch 1 */}
        <section className="pt-24 pb-16 bg-ivory dark:bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="inline-block rounded-full bg-klovers-yellow px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-charcoal">
                  {tr("K-dramas", "الدراما الكورية")}
                </span>
                <h1 className="mt-5 text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  {tr("Learn Korean from the dramas you already watch", "اتعلم كوري من المسلسلات اللي بتتفرج عليها")}
                </h1>
                <p className="mt-5 text-lg md:text-xl text-foreground/70 leading-relaxed">
                  {tr(
                    "Watching alone will not teach you Korean, but studying one scene at a time will. Here is a way to do it that you can repeat with any show.",
                    "الفرجة لوحدها مش هتعلمك كوري، لكن مذاكرة مشهد واحد في المرة هتعلمك. دي طريقة تقدر تكررها مع أي مسلسل.",
                  )}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button size="lg" asChild className="rounded-full font-bold">
                    <Link to="/free-trial">
                      {tr("Book a free class", "احجز حصة مجانية")}
                      <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="rounded-full">
                    <Link to="/placement-test">{tr("Find your level", "اعرف مستواك")}</Link>
                  </Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border shadow-xl bg-muted">
                <img
                  src="/assets/story/world-culture-street.webp"
                  width={1600}
                  height={900}
                  alt={
                    isAr
                      ? "شارع ثقافي كوري مرسوم بألوان دافئة، كأنه مشهد من دراما"
                      : "A painted Korean culture street glowing like a scene from a drama"
                  }
                  className="h-full w-full object-cover aspect-video"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Method */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">{tr("One scene at a time", "مشهد واحد في المرة")}</h2>
            <ol className="space-y-4">
              {STEPS.map((s, i) => {
                const [title, body] = isAr ? s.ar : s.en;
                return (
                  <li key={s.en[0]} className="p-6 rounded-2xl border bg-card flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal font-bold text-klovers-yellow">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{title}</h3>
                      <p className="mt-1 text-foreground/70 leading-relaxed">{body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-8 p-6 rounded-2xl bg-card border-2 border-foreground/80">
              <p className="font-bold mb-3">{tr("A notebook line looks like this", "سطر في الكشكول شكله كده")}</p>
              <div className="bg-muted p-4 rounded-xl text-sm text-foreground/80 space-y-1">
                <p lang="ko" className="font-bold text-foreground">정말이야?</p>
                <p>{tr("\"Really?\" — a character hears surprising news.", "«بجد؟» — شخصية بتسمع خبر مفاجئ.")}</p>
                <p>{tr("Mine: 정말이야? 내일 시험이야? (Really? The exam is tomorrow?)", "جملتي: 정말이야? 내일 시험이야؟ (بجد؟ الامتحان بكرة؟)")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Choosing a drama */}
        <section className="py-16 border-b bg-muted/40">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">{tr("Choosing a drama to study", "تختار مسلسل تذاكر بيه إزاي")}</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl border bg-card">
                <h3 className="inline-block text-sm font-bold mb-3 px-3 py-1 rounded-full bg-klovers-yellow text-charcoal">
                  {tr("Easier to start with", "أسهل للبداية")}
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  {tr(
                    "Modern stories set at work, at school or at home, with standard Seoul speech and everyday conversation — romantic comedies and slice-of-life shows are a good fit.",
                    "قصص حديثة في الشغل أو المدرسة أو البيت، بلهجة سيول العادية وكلام يومي — الكوميديا الرومانسية والمسلسلات الاجتماعية مناسبة.",
                  )}
                </p>
              </div>
              <div className="p-6 rounded-2xl border bg-card">
                <h3 className="inline-block text-sm font-bold mb-3 px-3 py-1 rounded-full bg-charcoal text-klovers-yellow">
                  {tr("Better saved for later", "أحسن تأجلها لبعدين")}
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  {tr(
                    "Historical dramas (old-fashioned speech), shows in strong regional dialects, and fast thrillers full of slang or technical words — medical, legal, military.",
                    "المسلسلات التاريخية (لغة قديمة)، والمسلسلات بلهجات محلية قوية، والإثارة السريعة المليانة عامية أو مصطلحات — طبية أو قانونية أو عسكرية.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Where classes fit */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">{tr("Where live classes fit", "الحصص المباشرة مكانها فين")}</h2>
            <ul className="space-y-3">
              {[
                tr("Dramas give you listening and real phrases. A class explains the grammar behind them.", "المسلسلات بتديك استماع وجمل حقيقية. الحصة بتشرح القواعد اللي وراها."),
                tr("You can bring a line you did not understand and ask about it.", "تقدر تجيب جملة مفهمتهاش وتسأل عنها."),
                tr("One live class a week, plus a scene or two between classes, is a pace most people can keep.", "حصة مباشرة في الأسبوع، ومشهد أو اتنين بين الحصص، ده إيقاع أغلب الناس تقدر تحافظ عليه."),
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-charcoal text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {tr("Bring a scene to your first class", "هات مشهد معاك في أول حصة")}
            </h2>
            <p className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
              {tr(
                "The first class is free. Meet your teacher, try a real class, and ask about a line from the drama you are watching.",
                "أول حصة مجانية. اتعرّف على معلمتك، وجرّب حصة حقيقية، واسأل عن جملة من المسلسل اللي بتتفرج عليه.",
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-klovers-yellow text-charcoal hover:bg-klovers-yellow/90 rounded-full font-bold" asChild>
                <Link to="/free-trial" className="flex items-center gap-2">
                  {tr("Book a free class", "احجز حصة مجانية")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10 hover:text-white rounded-full" asChild>
                <Link to="/blog/best-kdrama-learn-korean-difficulty-ranked">{tr("Drama picks by difficulty", "ترشيحات حسب الصعوبة")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default KDramaLearningPage;
