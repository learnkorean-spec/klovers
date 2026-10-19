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
 * and /learn-english: Reham teaches Arabic to non-native speakers
 * one-on-one, explained in English. Unlike the other two pages, the primary
 * audience here doesn't already speak Arabic — but the site's own bilingual
 * toggle still applies for anyone who reads this in Arabic (a friend sharing
 * the link, a bilingual visitor).
 *
 * Repositioned 20 Oct 2026 (Re): the original copy framed this as Egyptian
 * dialect only, for people connected to Egypt specifically. Re's instruction
 * was explicit — this is Arabic lessons for foreigners from anywhere in the
 * world, covering BOTH Modern Standard Arabic (Fusha) and spoken dialect
 * (Egyptian, which Reham teaches as a native speaker and which is the
 * dialect most widely understood across the Arab world thanks to Egyptian
 * film and TV), not an Egypt-only offering. The "which one do I need"
 * question is now its own FAQ entry rather than left for the visitor to
 * guess.
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
      ? "تعلّم العربية الفصحى أو العامية المصرية — مع ريهام الشرقاوي"
      : "Learn Arabic — Standard (Fusha) or Egyptian Dialect — with Reham Elshrkawy",
    description: isAr
      ? "دروس عربية فردية عبر الإنترنت لغير الناطقين بها من أي مكان في العالم، بشرح بالإنجليزية — الفصحى أو العامية المصرية المنطوقة، مع معلمة أصلية."
      : "One-on-one online Arabic lessons for non-native speakers anywhere in the world, explained in English — Modern Standard Arabic (Fusha) for reading, writing and formal use, or spoken Egyptian dialect for real conversation, with a native teacher who has taught students in more than fifteen countries.",
    canonical: isAr ? "https://kloversegy.com/ar/learn-arabic" : "https://kloversegy.com/learn-arabic",
    alternates: {
      en: "https://kloversegy.com/learn-arabic",
      ar: "https://kloversegy.com/ar/learn-arabic",
    },
    // Own hero image for link previews (19 Oct 2026, SEO/GEO pass) — not the
    // site-wide Seoul skyline default.
    ogImage: "https://images.unsplash.com/photo-1762249236589-b97477bb4cf2?fm=jpg&q=80&w=1200&auto=format&fit=crop",
  });

  const faq = [
    {
      q: tr(
        "What's the difference between Standard Arabic (Fusha) and Egyptian dialect — which should I learn?",
        "ما الفرق بين الفصحى والعامية المصرية — وأيهما يجب أن أتعلم؟",
      ),
      a: tr(
        "Fusha is the formal, written Arabic used in media, religious texts and official documents, and it's the same everywhere in the Arab world. Egyptian dialect is how people actually speak day to day, and it's the dialect most widely understood across the Arab world, thanks to Egyptian film and TV. Many students learn both — we'll figure out the right mix for your goal.",
        "الفصحى هي العربية الرسمية المكتوبة المستخدمة في الإعلام والنصوص الدينية والمستندات الرسمية، وهي نفسها في كل أنحاء العالم العربي. أما العامية المصرية فهي كيف يتحدث الناس فعليًا يوميًا، وهي اللهجة الأكثر فهمًا في العالم العربي بفضل السينما والتلفزيون المصري. كثير من الطلاب يتعلمون الاثنين معًا — يمكننا تحديد المزيج المناسب لهدفك.",
      ),
    },
    {
      q: tr(
        "I'm already learning Korean at Klovers — can I also book these Arabic lessons?",
        "أدرس الكورية بالفعل في كلوفرز — هل يمكنني حجز هذه الدروس العربية أيضًا؟",
      ),
      a: tr(
        "Yes — this is the same teacher's personal 1:1 lessons, separate from the Korean group classes. It's a common pairing for Korean speakers with an interest in Arabic, whether for travel, work, or just the language itself.",
        "نعم — هذه دروس فردية خاصة بالمعلمة نفسها، منفصلة عن حصص الكورية الجماعية. وهذا جمع شائع للناطقين بالكورية المهتمين بالعربية، سواء للسفر أو العمل أو لمجرد اللغة نفسها.",
      ),
    },
    {
      q: tr(
        "Do I need to know any Arabic already to start?",
        "هل أحتاج إلى معرفة سابقة بالعربية للبدء؟",
      ),
      a: tr(
        "No — lessons start from zero, whether you're learning Fusha or spoken dialect, even if you've studied Classical Arabic before. Everything is explained in English first.",
        "لا — تبدأ الدروس من الصفر، سواء كنت تتعلم الفصحى أو العامية المنطوقة، حتى لو درست الفصحى من قبل. يُشرح كل شيء بالإنجليزية أولًا.",
      ),
    },
  ];

  // BreadcrumbList, Course and FAQPage JSON-LD for this route are baked into
  // the prerendered static HTML by scripts/prerender-meta.mjs (breadcrumb /
  // pageLd / faq fields on the /learn-arabic MARKETING_ROUTES entry, with an
  // Arabic-translated twin for /ar/learn-arabic) rather than injected here
  // client-side. src/lib/jsonLdDedupe.ts removes any id-less (static) block
  // once the client adds one declaring the same @type, so a client useEffect
  // here would silently delete the version that non-JS AI crawlers (GPTBot,
  // ClaudeBot, PerplexityBot) actually see — exactly the audience this
  // page's GEO pass (19 Oct 2026) is for. Keep this page's structured data
  // static-only; the `faq` array above only drives the visible "Common
  // questions" section.

  const audience = [
    tr(
      "Want to speak Arabic for travel, work, or family — wherever in the world you are",
      "ترغب في التحدث بالعربية للسفر أو العمل أو الأسرة — أينما كنت في العالم",
    ),
    tr(
      "Need Modern Standard Arabic (Fusha) for study, media, religious texts, or formal use",
      "تحتاج الفصحى للدراسة أو الإعلام أو النصوص الدينية أو الاستخدام الرسمي",
    ),
    tr(
      "Want real spoken Egyptian dialect — the version most widely understood across the Arab world",
      "ترغب في العامية المصرية المنطوقة الحقيقية — وهي اللهجة الأكثر فهمًا في العالم العربي",
    ),
    tr(
      "Studied Classical Arabic before but can't actually hold a conversation",
      "درست الفصحى من قبل لكنك لا تستطيع فعليًا إجراء محادثة",
    ),
  ];

  const steps = [
    {
      title: tr("A free 20-minute call", "مكالمة تعارف مجانية مدتها عشرون دقيقة"),
      body: tr(
        "We talk about your goal — Fusha, Egyptian dialect, or both — and where you're starting from. Zero is completely fine.",
        "نتحدث عن هدفك: الفصحى أو العامية المصرية أو كلاهما، ومستواك الحالي — البدء من الصفر أمر طبيعي تمامًا.",
      ),
    },
    {
      title: tr("Explained in English, in the register you actually need", "تُشرح بالإنجليزية، بالمستوى الذي تحتاجه فعليًا"),
      body: tr(
        "Fusha grammar and script, or real spoken dialect — every phrase is explained in English first, then practiced the way it's actually used.",
        "قواعد الفصحى والكتابة، أو العامية المنطوقة الحقيقية — تُشرح كل عبارة بالإنجليزية أولًا، ثم تُمارَس بالطريقة المستخدمة فعليًا.",
      ),
    },
    {
      title: tr("Built around what you actually need", "مبنية على ما تحتاجه فعلًا"),
      body: tr(
        "Exam prep, reading religious texts, travel, work, family, or everyday conversation — the lessons follow your actual goal, not a fixed textbook order.",
        "التحضير لاختبار، أو قراءة نصوص دينية، أو السفر، أو العمل، أو الأسرة، أو المحادثة اليومية — تتبع الدروس هدفك الفعلي لا ترتيب كتاب ثابت.",
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
                  {tr("Arabic lessons · Standard Arabic or Egyptian dialect, for learners worldwide", "دروس عربية · الفصحى أو العامية المصرية، لمتعلمين من كل أنحاء العالم")}
                </span>
                <h1 className="mt-5 text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  {tr(
                    "Learn Arabic — Standard (Fusha) or Egyptian Dialect",
                    "تعلّم العربية الفصحى أو العامية المصرية",
                  )}
                </h1>
                <p className="mt-5 text-lg md:text-xl text-foreground/70 leading-relaxed">
                  {tr(
                    "I'm a native Egyptian Arabic speaker who's spent years explaining languages across cultures — Korean-Arabic interpreting, international operations, and teaching students in more than fifteen countries. Whether you need Modern Standard Arabic for reading, writing and formal use, or real spoken Egyptian dialect for conversation, I'll help you find the one that matches what you're actually trying to do.",
                    "أنا متحدثة أصلية للعربية المصرية، أمضيت سنوات في شرح اللغات بين الثقافات — ترجمة كورية-عربية، وعمليات دولية، وتدريس طلاب في أكثر من خمس عشرة دولة. سواء احتجت الفصحى للقراءة والكتابة والاستخدام الرسمي، أو العامية المصرية المنطوقة للمحادثة الحقيقية، سأساعدك على تحديد ما يناسب هدفك فعليًا.",
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
                  "Years of Korean-Arabic interpreting and international operations taught me exactly where a translation breaks down between languages — the same gap that makes textbook Arabic feel nothing like real use, whether you're writing formally or speaking day to day.",
                  "سنوات من الترجمة الكورية-العربية والعمليات الدولية علّمتني بالضبط أين تنهار الترجمة بين اللغات — نفس الفجوة التي تجعل العربية الفصحى في الكتب لا تشبه الاستخدام الفعلي، سواء في الكتابة الرسمية أو في العامية المنطوقة.",
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

        {/* Common questions — visible text backing the FAQPage schema above */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              {tr("Common questions", "أسئلة شائعة")}
            </h2>
            <div className="space-y-6">
              {faq.map(({ q, a }) => (
                <div key={q}>
                  <h3 className="font-bold text-lg text-foreground">{q}</h3>
                  <p className="mt-1 text-foreground/70 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
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
                "Fusha for study or formal use, Egyptian dialect for real conversation, or both — send a message and we'll start from there.",
                "الفصحى للدراسة أو الاستخدام الرسمي، أو العامية المصرية للمحادثة الحقيقية، أو كلاهما معًا — أرسل رسالة ولنبدأ من وضعك فعليًا.",
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
