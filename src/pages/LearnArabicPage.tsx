import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import PersonalTrialBooking from "@/components/PersonalTrialBooking";

/**
 * /learn-arabic and /ar/learn-arabic
 *
 * Added 19 Oct 2026, completing the trio planned alongside /learn-hungarian
 * and /learn-english: Reham teaches Arabic (spoken Egyptian Arabic, in
 * practice) to non-native speakers one-on-one, explained in English. Unlike
 * the other two pages, the primary audience here doesn't already speak
 * Arabic — but the site's own bilingual toggle still applies for anyone who
 * reads this in Arabic (a friend sharing the link, a bilingual visitor).
 *
 * Same quiet, non-Klovers visual identity as the other two personal-lesson
 * pages, its own distinct palette, and the same shared trial-booking system
 * (PersonalTrialBooking + book-personal-trial + personal_trial_slots) with
 * language="arabic".
 */

const LearnArabicPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: isAr
      ? "تعلّم العربية المصرية بشرح بالإنجليزية — مع ريهام الشرقاوي"
      : "Learn Egyptian Arabic, explained in English — with Reham Elshrkawy",
    description: isAr
      ? "دروس عربية مصرية فردية عبر الإنترنت، بشرح بالإنجليزية، للمقيمين في مصر أو زائريها أو المهتمين باللهجة المصرية الحقيقية للمحادثة، لا الفصحى الكتابية فقط."
      : "One-on-one online Egyptian Arabic lessons, explained in English, for people living in or visiting Egypt, or anyone who wants real spoken Arabic rather than textbook Classical Arabic alone.",
    canonical: isAr ? "https://kloversegy.com/ar/learn-arabic" : "https://kloversegy.com/learn-arabic",
    alternates: {
      en: "https://kloversegy.com/learn-arabic",
      ar: "https://kloversegy.com/ar/learn-arabic",
    },
  });

  const audience = [
    tr("Moving to, or already living in, Egypt for work or family", "الانتقال إلى مصر أو الإقامة فيها للعمل أو الأسرة"),
    tr("Visiting often and tired of not understanding the street around you", "تزور مصر كثيرًا وتشعر بالتعب من عدم فهم ما يدور حولك في الشارع"),
    tr("Studied Classical Arabic before but can't actually hold a conversation", "درست العربية الفصحى من قبل لكنك لا تستطيع فعليًا إجراء محادثة"),
    tr("Just curious about Egyptian Arabic after films, shows, or a trip", "الفضول لتعلّم العربية المصرية بعد مشاهدة أفلام أو مسلسلات أو بعد رحلة"),
  ];

  const steps = [
    {
      title: tr("A free 20-minute call", "مكالمة تعارف مجانية مدتها عشرون دقيقة"),
      body: tr(
        "We talk about why you're learning Arabic and where you're starting from — zero is completely fine.",
        "نتحدث عن سبب رغبتك في تعلّم العربية ومستواك الحالي — البدء من الصفر أمر طبيعي تمامًا.",
      ),
    },
    {
      title: tr("Real spoken Egyptian Arabic, explained in English", "عربية مصرية حقيقية منطوقة، بشرح بالإنجليزية"),
      body: tr(
        "Egyptian Arabic sounds nothing like a Classical-Arabic textbook, so every phrase is explained in English first, then practiced the way people actually speak it.",
        "العربية المصرية تختلف تمامًا عن الفصحى في الكتب، لذا تُشرح كل عبارة بالإنجليزية أولًا، ثم تُمارَس بالطريقة التي يتحدث بها الناس فعلًا.",
      ),
    },
    {
      title: tr("Built around what you actually need", "مبنية على ما تحتاجه فعلًا"),
      body: tr(
        "The market, a taxi, your neighbors, a work meeting — the lessons follow your actual situation, not a fixed textbook order.",
        "السوق، أو سيارة الأجرة، أو الجيران، أو اجتماع عمل — تتبع الدروس وضعك الفعلي لا ترتيب كتاب ثابت.",
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-24 pb-16 bg-[#f6f5f2] dark:bg-muted/20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3d4f7d]/30 bg-[#3d4f7d]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#3d4f7d]">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr("Arabic lessons · spoken Egyptian Arabic, not textbook only", "دروس عربية · لهجة مصرية منطوقة لا كتابًا فقط")}
                </span>
                <h1 className="mt-5 text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  {tr(
                    "Learn Egyptian Arabic, explained in English",
                    "تعلّم العربية المصرية بشرح بالإنجليزية",
                  )}
                </h1>
                <p className="mt-5 text-lg md:text-xl text-foreground/70 leading-relaxed">
                  {tr(
                    "I'm a native Egyptian Arabic speaker who's spent years explaining languages across cultures — Korean-Arabic interpreting, international operations, and teaching students in more than fifteen countries. I know exactly what gets lost between a textbook and an actual conversation.",
                    "أنا متحدثة أصلية للعربية المصرية، أمضيت سنوات في شرح اللغات بين الثقافات — ترجمة كورية-عربية، وعمليات دولية، وتدريس طلاب في أكثر من خمس عشرة دولة. أعرف بالضبط ما يضيع بين الكتاب المدرسي والمحادثة الفعلية.",
                  )}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="rounded-full font-bold bg-[#3d4f7d] hover:bg-[#2f3d61] text-white"
                  >
                    <Link to="/contact?subject=Arabic+lessons">
                      {tr("Message me about lessons", "راسلني بخصوص الدروس")}
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
                  src="https://images.unsplash.com/photo-1762249236589-b97477bb4cf2?fm=jpg&q=80&w=1600&auto=format&fit=crop"
                  width={1600}
                  height={900}
                  alt={
                    isAr
                      ? "الأهرامات وأفق مدينة القاهرة في الخلفية"
                      : "The pyramids with the Cairo skyline in the background"
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
              {tr("Who these lessons are for", "لمن هذه الدروس")}
            </h2>
            <ul className="space-y-3">
              {audience.map((line) => (
                <li key={line} className="flex items-start gap-3 text-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#3d4f7d]" aria-hidden="true" />
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
              {tr("How lessons work", "كيف تسير الدروس")}
            </h2>
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="p-6 rounded-2xl border bg-card flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3d4f7d] font-bold text-white">
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
                src="https://images.unsplash.com/photo-1760630857110-64c264a7dc54?fm=jpg&q=80&w=1600&auto=format&fit=crop"
                width={1600}
                height={1067}
                alt={isAr ? "كتب قديمة بخط يد عربي" : "Old books with handwritten Arabic script"}
                className="h-full w-full object-cover aspect-[4/3]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                {tr("Not a textbook — a guide who's done this", "ليست كتابًا مدرسيًا، بل مرشدة عاشت التجربة")}
              </h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                {tr(
                  "Years of Korean-Arabic interpreting and international operations taught me exactly where a translation breaks down between languages — the same gap that makes textbook Arabic feel nothing like the street outside.",
                  "سنوات من الترجمة الكورية-العربية والعمليات الدولية علّمتني بالضبط أين تنهار الترجمة بين اللغات — الفجوة نفسها التي تجعل العربية الكتابية لا تشبه إطلاقًا ما يُسمع في الشارع.",
                )}
              </p>
              <p className="text-foreground/70 leading-relaxed">
                {tr(
                  "I also founded and run Klovers, an online academy teaching Korean to students in more than fifteen countries since 2013 — Arabic lessons follow the same one-on-one, real-conversation approach.",
                  "أسست وأدير أيضًا كلوفرز، أكاديمية إلكترونية تُدرّس الكورية لطلاب في أكثر من خمس عشرة دولة منذ عام 2013 — وتتبع دروس العربية الأسلوب نفسه القائم على الحصص الفردية والمحادثة الحقيقية.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Trial booking */}
        <section className="py-16 border-b bg-muted/30">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-3xl font-bold mb-2 text-foreground text-center">
              {tr("Book your free trial lesson", "احجز حصتك التجريبية المجانية")}
            </h2>
            <p className="text-foreground/70 text-center mb-8">
              {tr(
                "Pick a time that works for you — or message us directly if nothing matches.",
                "اختر موعدًا يناسبك — أو راسلنا مباشرة إن لم يناسبك أي موعد.",
              )}
            </p>
            <PersonalTrialBooking
              language="arabic"
              accentColor="#3d4f7d"
              accentHoverColor="#2f3d61"
              whatsappMessage={{
                en: "Hi! I'd like to book a free trial Arabic lesson but none of the available times work for me — can we find another time?",
                ar: "مرحبًا، أرغب في حجز حصة عربية تجريبية مجانية لكن المواعيد المتاحة لا تناسبني — هل يمكننا الاتفاق على موعد آخر؟",
              }}
            />
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-foreground text-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {tr("Tell me what you're working toward", "أخبرني بما تسعى إليه")}
            </h2>
            <p className="text-lg mb-8 text-background/80 max-w-2xl mx-auto">
              {tr(
                "A move to Egypt, a trip, or just real conversation — send a message and we'll start from there.",
                "انتقال إلى مصر، أو رحلة، أو مجرد محادثة حقيقية — أرسل رسالة ولنبدأ من وضعك فعليًا.",
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-[#3d4f7d] hover:bg-[#2f3d61] text-white rounded-full font-bold" asChild>
                <Link to="/contact?subject=Arabic+lessons" className="flex items-center gap-2">
                  {tr("Message me about lessons", "راسلني بخصوص الدروس")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
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

export default LearnArabicPage;
