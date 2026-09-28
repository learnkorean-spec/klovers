import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toArabicDigits } from "@/lib/trustFigures";

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
    ar: ["المشاهدة من أجل القصة", "المشاهدة الأولى بترجمة إلى لغة المشاهد، وللمتعة وحدها. فهم ما يحدث يسبق دراسة طريقة قوله."],
  },
  {
    en: ["Pick one short scene", "Choose two or three minutes you liked. Short enough to replay many times."],
    ar: ["اختيار مشهد قصير", "دقيقتان أو ثلاث من مشهد مفضّل، قصير بما يكفي لإعادته مرات كثيرة."],
  },
  {
    en: ["Replay it with Korean subtitles", "Pause on each line. Write down the words and endings you recognise, and look up the rest."],
    ar: ["الإعادة بترجمة كورية", "التوقف عند كل جملة، وتدوين الكلمات والنهايات المألوفة، ثم البحث عن الباقي."],
  },
  {
    en: ["Say the lines out loud", "Repeat each line after the actor, copying the rhythm. Then try the scene with no subtitles at all."],
    ar: ["نطق الجمل بصوت مسموع", "ترديد كل جملة بعد الممثل مع تقليد إيقاعها، ثم تجربة المشهد كاملًا بلا أي ترجمة."],
  },
  {
    en: ["Keep a phrase notebook", "One line per phrase: the Korean, what it means, the scene it came from, and one sentence of your own with it."],
    ar: ["دفتر للعبارات", "سطر لكل عبارة: الجملة الكورية، ومعناها، والمشهد الذي جاءت منه، وجملة جديدة من تأليف الطالب بها."],
  },
];

const KDramaLearningPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: isAr ? "تعلُّم الكورية من خلال الدراما الكورية" : "Learn Korean Through K-Dramas",
    description: isAr
      ? "طريقة بسيطة قابلة للتكرار لدراسة الكورية بالدراما: مشهد واحد في كل مرة، مع ترجمة كورية، وتقليد النطق، ودفتر للعبارات، ودور الحصص المباشرة في استكمال القواعد."
      : "A simple, repeatable way to study Korean with K-dramas: one scene at a time, with Korean subtitles, shadowing and a phrase notebook, and how live classes fill in the grammar.",
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
                  {tr("Culture Street · K-dramas", "شارع الثقافة · الدراما الكورية")}
                </span>
                <h1 className="mt-5 text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  {tr("Learn Korean from the dramas you already watch", "تعلُّم الكورية من المسلسلات المفضّلة")}
                </h1>
                <p className="mt-5 text-lg md:text-xl text-foreground/70 leading-relaxed">
                  {tr(
                    "Watching alone will not teach you Korean, but studying one scene at a time will. Here is a way to do it that you can repeat with any show.",
                    "المشاهدة وحدها لا تعلّم الكورية، أما دراسة مشهد واحد في كل مرة فتعلّمها. هذه طريقة يمكن تكرارها مع أي مسلسل.",
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
                    <Link to="/placement-test">{tr("Find your level", "معرفة المستوى")}</Link>
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
            <h2 className="text-3xl font-bold mb-8">{tr("One scene at a time", "مشهد واحد في كل مرة")}</h2>
            <ol className="space-y-4">
              {STEPS.map((s, i) => {
                const [title, body] = isAr ? s.ar : s.en;
                return (
                  <li key={s.en[0]} className="p-6 rounded-2xl border bg-card flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal font-bold text-klovers-yellow">
                      {isAr ? toArabicDigits(i + 1) : i + 1}
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
              <p className="font-bold mb-3">{tr("A notebook line looks like this", "هكذا يبدو سطر في الدفتر")}</p>
              <div className="bg-muted p-4 rounded-xl text-sm text-foreground/80 space-y-1">
                <p lang="ko" className="font-bold text-foreground">정말이야?</p>
                <p>{tr("\"Really?\" — a character hears surprising news.", "«حقًّا؟» — شخصية تسمع خبرًا مفاجئًا.")}</p>
                <p>{tr("Mine: 정말이야? 내일 시험이야? (Really? The exam is tomorrow?)", "جملة من تأليفي: 정말이야? 내일 시험이야? (حقًّا؟ الامتحان غدًا؟)")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Choosing a drama */}
        <section className="py-16 border-b bg-muted/40">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">{tr("Choosing a drama to study", "اختيار مسلسل للدراسة")}</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl border bg-card">
                <h3 className="inline-block text-sm font-bold mb-3 px-3 py-1 rounded-full bg-klovers-yellow text-charcoal">
                  {tr("Easier to start with", "أسهل للبداية")}
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  {tr(
                    "Modern stories set at work, at school or at home, with standard Seoul speech and everyday conversation — romantic comedies and slice-of-life shows are a good fit.",
                    "قصص حديثة في العمل أو المدرسة أو البيت، بلهجة سيول المعيارية وحوار يومي؛ الكوميديا الرومانسية ومسلسلات الحياة اليومية مناسبة.",
                  )}
                </p>
              </div>
              <div className="p-6 rounded-2xl border bg-card">
                <h3 className="inline-block text-sm font-bold mb-3 px-3 py-1 rounded-full bg-charcoal text-klovers-yellow">
                  {tr("Better saved for later", "الأفضل تأجيله إلى وقت لاحق")}
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  {tr(
                    "Historical dramas (old-fashioned speech), shows in strong regional dialects, and fast thrillers full of slang or technical words — medical, legal, military.",
                    "المسلسلات التاريخية (لغة قديمة)، والمسلسلات ذات اللهجات المحلية القوية، ومسلسلات الإثارة السريعة المليئة بالعامية أو المصطلحات: الطبية أو القانونية أو العسكرية.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Where classes fit */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">{tr("Where live classes fit", "مكان الحصص المباشرة")}</h2>
            <ul className="space-y-3">
              {[
                tr("Dramas give you listening and real phrases. A class explains the grammar behind them.", "المسلسلات تمنح الاستماع والعبارات الحقيقية، والحصة تشرح القواعد التي وراءها."),
                tr("You can bring a line you did not understand and ask about it.", "يمكن إحضار أي جملة غير مفهومة والسؤال عنها."),
                tr("One live class a week, plus a scene or two between classes, is a pace most people can keep.", "حصة مباشرة في الأسبوع، ومشهد أو اثنان بين الحصص: إيقاع يستطيع معظم الناس المحافظة عليه."),
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
        <section className="py-20 bg-charcoal text-ivory">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {tr("Bring a scene to your first class", "مشهد واحد إلى الحصة الأولى")}
            </h2>
            <p className="text-lg mb-8 text-ivory/80 max-w-2xl mx-auto">
              {tr(
                "The first class is free. Meet your teacher, try a real class, and ask about a line from the drama you are watching.",
                "الحصة الأولى مجانية: تعارف مع المعلمة، وتجربة حصة حقيقية، وسؤال عن جملة من المسلسل المفضّل.",
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-klovers-yellow text-charcoal hover:bg-klovers-yellow/90 rounded-full font-bold" asChild>
                <Link to="/free-trial" className="flex items-center gap-2">
                  {tr("Book a free class", "حجز حصة مجانية")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-ivory border-ivory hover:bg-ivory/10 hover:text-ivory rounded-full" asChild>
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
