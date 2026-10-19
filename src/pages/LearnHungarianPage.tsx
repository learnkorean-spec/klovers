import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * /learn-hungarian and /ar/learn-hungarian
 *
 * Added 19 Oct 2026. Reham also teaches Hungarian (and Arabic-for-foreigners,
 * and English) alongside the Korean courses Klovers is built around — see the
 * "Meet Reham" article (meet-reham-hungarian-arabic-korean-teacher[-ar]).
 * This page exists so someone searching specifically for a Hungarian teacher
 * who explains in Arabic or English lands somewhere real.
 *
 * Deliberately NOT styled like the Korean story pages (no klovers-yellow /
 * charcoal / Cluby world-building) — a visitor here is not looking for the
 * Korean product, and dressing this page in that identity would read as a
 * mismatch rather than reassurance. It keeps the shared Header/Footer (same
 * trusted domain, same site) but uses a quieter, neutral palette of its own.
 *
 * No booking-automation package exists for Hungarian yet (schedule_packages
 * only covers Korean), so the CTA is the contact form, not /free-trial.
 */

const LearnHungarianPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: isAr
      ? "تعلّم المجرية بالعربي أو الإنجليزي — مع ريهام الشرقاوي"
      : "Learn Hungarian in Arabic or English — with Reham Elshrkawy",
    description: isAr
      ? "دروس مجرية أونلاين فردية، بشرح بالعربي أو الإنجليزي، مع مدرّسة عاشت في بودابست وتعرف بالظبط إيه اللي محتاجاه المبتدئة: للسفر، أو منحة هنغارية، أو عيلة مجرية."
      : "One-on-one online Hungarian lessons, explained in Arabic or English, with a teacher who lived in Budapest and knows exactly what a beginner needs — for a move, a Hungarian scholarship, or a Hungarian family.",
    canonical: isAr ? "https://kloversegy.com/ar/learn-hungarian" : "https://kloversegy.com/learn-hungarian",
    alternates: {
      en: "https://kloversegy.com/learn-hungarian",
      ar: "https://kloversegy.com/ar/learn-hungarian",
    },
  });

  const audience = [
    tr("Moving to Hungary for work, study or family", "منتقلة أو منتقل للعيش في المجر للعمل أو الدراسة أو العيلة"),
    tr("Applying for a Balassi Institute or Stipendium Hungaricum scholarship", "بتقدّمي على منحة من معهد بالاسي أو منحة Stipendium Hungaricum"),
    tr("Married into, or dating into, a Hungarian family", "متجوزة أو في علاقة مع حد من عيلة مجرية"),
    tr("Just curious about a language almost nobody around you speaks", "فضولية بس عايزة تتعلمي لغة محدش حواليكي بيتكلمها"),
  ];

  const steps = [
    {
      title: tr("A free 20-minute call", "مكالمة تعارف مجانية ٢٠ دقيقة"),
      body: tr(
        "We talk about why you're learning Hungarian and where you're starting from — zero is completely fine.",
        "بنتكلم عن سبب رغبتك في تعلّم المجرية ومستواك الحالي — تبدئي من الصفر، عادي جدًا.",
      ),
    },
    {
      title: tr("Lessons explained in Arabic or English", "دروس بشرح بالعربي أو الإنجليزي"),
      body: tr(
        "Hungarian grammar is unlike Arabic or English, so every rule is explained in a language you already think in — not in Hungarian itself.",
        "قواعد المجرية مختلفة تمامًا عن العربي والإنجليزي، فكل قاعدة بتتشرح بلغة بتفكري بيها فعلاً، مش بالمجري نفسه.",
      ),
    },
    {
      title: tr("Built around what you actually need", "مبني على اللي محتاجاه فعلاً"),
      body: tr(
        "Scholarship paperwork, everyday survival phrases, or conversation with family — the lessons follow your actual situation, not a fixed textbook order.",
        "أوراق المنحة، أو عبارات الحياة اليومية، أو الكلام مع العيلة — الدروس بتتبع موقفك الفعلي مش ترتيب كتاب ثابت.",
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-24 pb-16 bg-[#faf6f0] dark:bg-muted/20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#a9502f]/30 bg-[#a9502f]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#a9502f]">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr("Hungarian lessons · Cairo to Budapest", "دروس مجرية · من القاهرة لبودابست")}
                </span>
                <h1 className="mt-5 text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  {tr(
                    "Learn Hungarian, explained in Arabic or English",
                    "تعلّمي المجرية بشرح بالعربي أو الإنجليزي",
                  )}
                </h1>
                <p className="mt-5 text-lg md:text-xl text-foreground/70 leading-relaxed">
                  {tr(
                    "I lived in Budapest, studied Hungarian at Ain Shams University on a Balassi Institute scholarship, and have been teaching it ever since. I know what it's like to hold a form in Hungarian and not understand it — I'd rather be the person who explains the next one.",
                    "عشت في بودابست، ودرست المجرية في جامعة عين شمس بمنحة من معهد بالاسي، وبدرّسها منذ ذلك الوقت. أعرف إحساس إنك ماسكة ورقة بالمجري ومش فاهماها — وبفضّل أكون الشخص اللي يشرحلك الورقة الجاية.",
                  )}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="rounded-full font-bold bg-[#a9502f] hover:bg-[#8f4227] text-white"
                  >
                    <Link to="/contact?subject=Hungarian+lessons">
                      {tr("Message me about lessons", "ابعتيلي بخصوص الدروس")}
                      <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="rounded-full">
                    <Link to="/blog/meet-reham-hungarian-arabic-korean-teacher">
                      {tr("Read my story", "اقرأ قصتي")}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border shadow-xl bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1728463460723-61de554e49ba?fm=jpg&q=80&w=1600&auto=format&fit=crop"
                  width={1600}
                  height={900}
                  alt={
                    isAr
                      ? "مبنى البرلمان الهنغاري على ضفاف نهر الدانوب في بودابست"
                      : "The Hungarian Parliament Building on the Danube in Budapest"
                  }
                  className="h-full w-full object-cover aspect-video"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Who this is for */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              {tr("Who these lessons are for", "الدروس دي لمين")}
            </h2>
            <ul className="space-y-3">
              {audience.map((line) => (
                <li key={line} className="flex items-start gap-3 text-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#a9502f]" aria-hidden="true" />
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 border-b bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              {tr("How lessons work", "إزاي الدروس بتتم")}
            </h2>
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="p-6 rounded-2xl border bg-card flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#a9502f] font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{s.title}</h3>
                    <p className="mt-1 text-foreground/70 leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Second image + credibility */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-6xl grid items-center gap-10 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-border shadow-lg bg-muted order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1661247374773-29f7e75d2b35?fm=jpg&q=80&w=1600&auto=format&fit=crop"
                width={1600}
                height={1067}
                alt={isAr ? "قلعة الصيادين في بودابست، المجر" : "Fisherman's Bastion in Budapest, Hungary"}
                className="h-full w-full object-cover aspect-[4/3]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                {tr("Not a textbook — a guide who's done this", "مش كتاب مدرسي — دليل عاشت التجربة")}
              </h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                {tr(
                  "Between Cairo and Budapest I spent years learning Hungarian the hard way, long before I taught it to anyone. I also worked for years doing Korean-Arabic interpreting and international operations, so I know what it means when a deadline or a document genuinely has to be right.",
                  "بين القاهرة وبودابست قضيت سنوات بتعلم المجرية بالطريقة الصعبة، قبل ما أدرّسها لحد. اشتغلت كمان سنين في الترجمة الكورية-العربية وفي عمليات دولية، فعارفة قد إيه ميعاد نهائي أو ورقة رسمية محتاجة تبقى مظبوطة فعلاً.",
                )}
              </p>
              <p className="text-foreground/70 leading-relaxed">
                {tr(
                  "I also founded and run Klovers, an online academy teaching Korean to students in more than fifteen countries since 2013 — Hungarian lessons follow the same one-on-one, real-conversation approach.",
                  "أنا كمان مؤسسة ومديرة Klovers، أكاديمية أونلاين بتدرّس الكورية لطلاب في أكتر من خمستاشر دولة منذ 2013 — ودروس المجرية بتتبع نفس أسلوب الحصص الفردية والمحادثة الحقيقية.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-foreground text-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {tr("Tell me what you're working toward", "قوليلي هدفك إيه")}
            </h2>
            <p className="text-lg mb-8 text-background/80 max-w-2xl mx-auto">
              {tr(
                "A scholarship deadline, a move, a family — send a message and we'll start from there.",
                "ميعاد منحة، سفر، أو عيلة — ابعتيلي رسالة ونبدأ من موقفك فعلاً.",
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-[#a9502f] hover:bg-[#8f4227] text-white rounded-full font-bold" asChild>
                <Link to="/contact?subject=Hungarian+lessons" className="flex items-center gap-2">
                  {tr("Message me about lessons", "ابعتيلي بخصوص الدروس")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-background border-background hover:bg-background/10 hover:text-background rounded-full" asChild>
                <Link to="/blog/meet-reham-hungarian-arabic-korean-teacher">{tr("Read my story", "اقرأ قصتي")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LearnHungarianPage;
