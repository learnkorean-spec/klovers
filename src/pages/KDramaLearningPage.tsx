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
 * 25 Sep 2026 (QA pass): rewritten. The page it replaces was made of claims
 * nobody measured - "the secret method used by 500K+ K-drama fans", "40%
 * faster than textbooks", "3x faster results", "your brain learns Korean
 * automatically" - told readers to take "Klovers lessons 3x per week" (classes
 * are once a week), recommended Squid Game to A1 beginners, and promised a
 * "drama journal template" that was never attached.
 *
 * What it says now is a plain, repeatable way to study with a drama, how to
 * pick one, and where live classes fit. No numbers that were not measured.
 * Palette only; copy inline in both languages.
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

  const card = "rounded-2xl border border-charcoal/10 bg-card p-5 md:p-6";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16">
        {/* Hero */}
        <section className="bg-charcoal text-ivory py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <span className="inline-block rounded-full bg-klovers-yellow px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-charcoal">
              {tr("K-dramas", "الدراما الكورية")}
            </span>
            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight">
              {tr("Learn Korean from the dramas you already watch", "اتعلم كوري من المسلسلات اللي بتتفرج عليها")}
            </h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-ivory/80 leading-relaxed">
              {tr(
                "Watching alone will not teach you Korean, but studying one scene at a time will. Here is a way to do it that you can repeat with any show.",
                "الفرجة لوحدها مش هتعلمك كوري، لكن مذاكرة مشهد واحد في المرة هتعلمك. دي طريقة تقدر تكررها مع أي مسلسل.",
              )}
            </p>
          </div>
        </section>

        {/* Method */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">
              {tr("One scene at a time", "مشهد واحد في المرة")}
            </h2>
            <ol className="space-y-4">
              {STEPS.map((s, i) => {
                const [title, body] = isAr ? s.ar : s.en;
                return (
                  <li key={s.en[0]} className={`${card} flex items-start gap-4`}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-klovers-yellow font-extrabold text-charcoal">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-foreground">{title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 rounded-2xl bg-muted px-5 py-4">
              <p className="text-sm font-bold text-foreground">{tr("A notebook line looks like this", "سطر في الكشكول شكله كده")}</p>
              <p className="mt-2 text-sm text-foreground" lang="ko">정말이야?</p>
              <p className="text-sm text-muted-foreground">
                {tr("\"Really?\" — a character hears surprising news. Mine: 정말이야? 내일 시험이야?", "«بجد؟» — شخصية بتسمع خبر مفاجئ. جملتي: 정말이야? 내일 시험이야؟")}
              </p>
            </div>
          </div>
        </section>

        {/* Choosing a drama */}
        <section className="py-14 md:py-20 bg-card border-y border-border">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">
              {tr("Choosing a drama to study", "تختار مسلسل تذاكر بيه إزاي")}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className={card}>
                <h3 className="font-bold text-foreground">{tr("Easier to start with", "أسهل للبداية")}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {tr(
                    "Modern stories set at work, at school or at home, with standard Seoul speech and everyday conversation — romantic comedies and slice-of-life shows are a good fit.",
                    "قصص حديثة في الشغل أو المدرسة أو البيت، بلهجة سيول العادية وكلام يومي — الكوميديا الرومانسية والمسلسلات الاجتماعية مناسبة.",
                  )}
                </p>
              </div>
              <div className={card}>
                <h3 className="font-bold text-foreground">{tr("Better saved for later", "أحسن تأجلها لبعدين")}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
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
        <section className="py-14 md:py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">
              {tr("Where live classes fit", "الحصص المباشرة مكانها فين")}
            </h2>
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
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="rounded-full font-bold">
                <Link to="/free-trial">
                  {tr("Book a free class", "احجز حصة مجانية")}
                  <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full">
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
