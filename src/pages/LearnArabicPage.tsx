import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import PersonalTrialBooking from "@/components/PersonalTrialBooking";
import rehamPhoto from "@/assets/reham-teacher.jpg";
import cairoRooftop from "@/assets/arabic-cairo-rooftop.jpg";

/**
 * /learn-arabic and /ar/learn-arabic
 *
 * Added 19 Oct 2026, completing the trio planned alongside /learn-hungarian
 * and /learn-english: Reham teaches Arabic to non-native speakers
 * one-on-one, explained in English.
 *
 * Repositioned 20 Oct 2026 (Re): Fusha AND Egyptian dialect, for anyone in
 * the world — not an Egypt-only offering. (Still true, unchanged below.)
 *
 * Redesigned 20 Oct 2026, v1 (Re: "must be impressive... out of the box"):
 * a one-off "ink and paper" editorial treatment (lapis blue, brass, dark
 * ink panels, parchment, Fraunces/Amiri serif display).
 *
 * Redesigned 20 Oct 2026, v2 (Re: "replace with the new design, green" —
 * i.e. mkatub's design): mkatub (mkatub.vercel.app) is Reham's separate,
 * purpose-built marketing site for this same Arabic-teaching business —
 * its trial-booking CTAs already link straight back to this very page's
 * #trial-booking section (src/lib/content.ts in the mkatub repo), and its
 * own tutor bio/quote was pulled FROM this page's v1 copy. The two are
 * siblings, so this page now matches mkatub's visual language instead of
 * its own bespoke one: a dark forest-green hero over real Cairo rooftop
 * photography, pill-shaped CTAs, dialect cards with an availability badge,
 * numbered steps with a circular badge, and the site's existing
 * Poppins/Inter/Cairo type (no new font load — mkatub's Jakarta/Inter/Cairo
 * stack maps directly onto what index.html already loads sitewide).
 *
 * Brand-colour note: klovers-green (hsl(var(--live-bright)), #39FF14) is
 * sitewide-reserved for live/correct/progress status, never decorative
 * (src/index.css's palette doc, tailwind.config.ts's klovers-green comment).
 * This page is a deliberate, explicit exception — Re chose it specifically
 * to match mkatub's lime-on-forest branding (confirmed 20 Oct 2026, after
 * being told this bends that rule) — not a default to copy onto other
 * pages. FOREST/SAND below are page-local, bespoke to this page only, the
 * same pattern the v1 redesign used for LAPIS/BRASS/PARCHMENT.
 *
 * All copy, facts, FAQ text, SEO metadata, and the static prerendered HTML
 * in scripts/lib/marketing-bodies.mjs and scripts/lib/arabic-pages.mjs are
 * unchanged from v1 — this is a visual/structural pass only, again.
 *
 * Same shared trial-booking system (PersonalTrialBooking +
 * book-personal-trial + personal_trial_slots) with language="arabic" as
 * the other two pages; only the visual presentation here is bespoke.
 */

const FOREST = "#0b2d1f";
const FOREST_DEEP = "#061b17";
const SAND = "#eadfcb";
const KLOVERS_GREEN = "#39FF14";
const KLOVERS_GREEN_DEEP = "#1FB800";

const headingFont = { fontFamily: "Poppins, system-ui, sans-serif" };
const arabicFont = (isAr: boolean) => (isAr ? { fontFamily: "Cairo, system-ui, sans-serif" } : {});

const LearnArabicPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: isAr
      ? "تعلّم العربية الفصحى أو العامية المصرية مع ريهام الشرقاوي"
      : "Learn Arabic: Standard (Fusha) or Egyptian Dialect, with Reham Elshrkawy",
    description: isAr
      ? "دروس عربية فردية عبر الإنترنت لغير الناطقين بها من أي مكان في العالم، بشرح بالإنجليزية، الفصحى أو العامية المصرية المنطوقة، مع معلمة أصلية."
      : "One-on-one online Arabic lessons for non-native speakers anywhere in the world, explained in English: Modern Standard Arabic (Fusha) for reading, writing and formal use, or spoken Egyptian dialect for real conversation, with a native teacher who has taught students in more than fifteen countries.",
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
        "What's the difference between Standard Arabic (Fusha) and Egyptian dialect, and which should I learn?",
        "ما الفرق بين الفصحى والعامية المصرية، وأيهما يجب أن أتعلم؟",
      ),
      a: tr(
        "Fusha is the formal, written Arabic used in media, religious texts and official documents, and it's the same everywhere in the Arab world. Egyptian dialect is how people actually speak day to day, and it's the dialect most widely understood across the Arab world, thanks to Egyptian film and TV. Many students learn both, so we'll figure out the right mix for your goal.",
        "الفصحى هي العربية الرسمية المكتوبة المستخدمة في الإعلام والنصوص الدينية والمستندات الرسمية، وهي نفسها في كل أنحاء العالم العربي. أما العامية المصرية فهي كيف يتحدث الناس فعليًا يوميًا، وهي اللهجة الأكثر فهمًا في العالم العربي بفضل السينما والتلفزيون المصري. كثير من الطلاب يتعلمون الاثنين معًا، ويمكننا تحديد المزيج المناسب لهدفك.",
      ),
    },
    {
      q: tr(
        "I'm already learning Korean at Klovers, can I also book these Arabic lessons?",
        "أدرس الكورية بالفعل في كلوفرز، هل يمكنني حجز هذه الدروس العربية أيضًا؟",
      ),
      a: tr(
        "Yes, this is the same teacher's personal 1:1 lessons, separate from the Korean group classes. It's a common pairing for Korean speakers with an interest in Arabic, whether for travel, work, or just the language itself.",
        "نعم، هذه دروس فردية خاصة بالمعلمة نفسها، منفصلة عن حصص الكورية الجماعية. وهذا جمع شائع للناطقين بالكورية المهتمين بالعربية، سواء للسفر أو العمل أو لمجرد اللغة نفسها.",
      ),
    },
    {
      q: tr(
        "Do I need to know any Arabic already to start?",
        "هل أحتاج إلى معرفة سابقة بالعربية للبدء؟",
      ),
      a: tr(
        "No, lessons start from zero whether you're learning Fusha or spoken dialect, even if you've studied Classical Arabic before. Everything is explained in English first.",
        "لا، تبدأ الدروس من الصفر سواء كنت تتعلم الفصحى أو العامية المنطوقة، حتى لو درست الفصحى من قبل. يُشرح كل شيء بالإنجليزية أولًا.",
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
  // ClaudeBot, PerplexityBot) actually see. Keep this page's structured data
  // static-only; the `faq` array above only drives the visible "Common
  // questions" section.

  const dialects = [
    {
      name: tr("Egyptian Arabic", "العامية المصرية"),
      arabicName: "مصري",
      description: tr(
        "Real spoken Egyptian dialect — how people actually talk, and the dialect most widely understood across the Arab world, thanks to Egyptian film and TV.",
        "العامية المصرية المنطوقة الحقيقية: كيف يتحدث الناس فعليًا، وهي اللهجة الأكثر فهمًا في العالم العربي بفضل السينما والتلفزيون المصري.",
      ),
    },
    {
      name: tr("Modern Standard Arabic", "الفصحى"),
      arabicName: "الفصحى",
      description: tr(
        "The formal, written register: reading, writing, religious texts, media, and official documents. The same everywhere in the Arab world.",
        "المستوى الرسمي المكتوب: القراءة والكتابة والنصوص الدينية والإعلام والمستندات الرسمية. نفسه في كل أنحاء العالم العربي.",
      ),
    },
  ];

  const audience = [
    tr(
      "Want to speak Arabic for travel, work, or family, wherever in the world you are",
      "ترغب في التحدث بالعربية للسفر أو العمل أو الأسرة، أينما كنت في العالم",
    ),
    tr(
      "Need Modern Standard Arabic (Fusha) for study, media, religious texts, or formal use",
      "تحتاج الفصحى للدراسة أو الإعلام أو النصوص الدينية أو الاستخدام الرسمي",
    ),
    tr(
      "Want real spoken Egyptian dialect, the version most widely understood across the Arab world",
      "ترغب في العامية المصرية المنطوقة الحقيقية، وهي اللهجة الأكثر فهمًا في العالم العربي",
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
        "We talk about your goal, Fusha, Egyptian dialect, or both, and where you're starting from. Zero is completely fine.",
        "نتحدث عن هدفك: الفصحى أو العامية المصرية أو كلاهما، ومستواك الحالي، البدء من الصفر أمر طبيعي تمامًا.",
      ),
    },
    {
      title: tr("Explained in English, in the register you actually need", "تُشرح بالإنجليزية، بالمستوى الذي تحتاجه فعليًا"),
      body: tr(
        "Fusha grammar and script, or real spoken dialect: every phrase is explained in English first, then practiced the way it's actually used.",
        "قواعد الفصحى والكتابة، أو العامية المنطوقة الحقيقية: تُشرح كل عبارة بالإنجليزية أولًا، ثم تُمارَس بالطريقة المستخدمة فعليًا.",
      ),
    },
    {
      title: tr("Built around what you actually need", "مبنية على ما تحتاجه فعلًا"),
      body: tr(
        "Exam prep, reading religious texts, travel, work, family, or everyday conversation: the lessons follow your actual goal, not a fixed textbook order.",
        "التحضير لاختبار، أو قراءة نصوص دينية، أو السفر، أو العمل، أو الأسرة، أو المحادثة اليومية: تتبع الدروس هدفك الفعلي لا ترتيب كتاب ثابت.",
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        {/* Hero — mkatub's shape: dark forest panel, real Cairo rooftop
            photo, lime/klovers-green accent, pill CTAs. */}
        <section className="relative isolate overflow-hidden text-white" style={{ backgroundColor: FOREST }}>
          <img
            src={cairoRooftop}
            alt={tr(
              "A Cairo rooftop terrace at sunset, with minarets on the skyline",
              "شرفة على سطح في القاهرة عند الغروب، والمآذن تلوح في الأفق",
            )}
            className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, ${FOREST} 10%, ${FOREST}cc 55%, ${FOREST}4d 100%)` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 h-72 w-72 rounded-full blur-3xl ltr:-right-24 rtl:-left-24"
            style={{ backgroundColor: `${KLOVERS_GREEN}33` }}
          />
          <div className="container relative mx-auto px-4 py-24 sm:py-32 max-w-5xl">
            <div className="max-w-2xl">
              <p className="text-lg" style={{ fontFamily: "Cairo, system-ui, sans-serif", color: KLOVERS_GREEN }} dir="rtl" lang="ar">
                اهلا بيك في كلوفرز
              </p>
              <h1
                className="mt-3 text-4xl sm:text-5xl font-extrabold leading-tight"
                style={{ ...headingFont, ...arabicFont(isAr) }}
              >
                {tr("Speak real Arabic.", "تكلّم عربي حقيقي.")}
                <br />
                <span style={{ color: KLOVERS_GREEN }}>{tr("Connect for real.", "وتواصل فعلًا.")}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/85">
                {tr(
                  "I'm a native Egyptian Arabic speaker who's spent years explaining languages across cultures: Korean-Arabic interpreting, international operations, and teaching students in more than fifteen countries. Whether you need Modern Standard Arabic for reading, writing and formal use, or real spoken Egyptian dialect for conversation, I'll help you find the one that matches what you're actually trying to do.",
                  "أنا متحدثة أصلية للعربية المصرية، أمضيت سنوات في شرح اللغات بين الثقافات: ترجمة كورية-عربية، وعمليات دولية، وتدريس طلاب في أكثر من خمس عشرة دولة. سواء احتجت الفصحى للقراءة والكتابة والاستخدام الرسمي، أو العامية المصرية المنطوقة للمحادثة الحقيقية، سأساعدك على تحديد ما يناسب هدفك فعليًا.",
                )}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  asChild
                  className="rounded-full font-semibold hover:brightness-95"
                  style={{ backgroundColor: KLOVERS_GREEN, color: "#1A1A1A" }}
                >
                  <Link to="#trial-booking">
                    {tr("Book a trial class", "احجز حصة تجريبية")}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  asChild
                  variant="outline"
                  className="rounded-full font-semibold border-white/70 text-white hover:bg-white/10 bg-transparent"
                >
                  <Link to="/contact?subject=Arabic+lessons">
                    {tr("Message me about lessons", "راسلني بخصوص الدروس")}
                    <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pick a dialect — mkatub's card grid, replacing v1's parchment split. */}
        <section className="py-20 border-b">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={headingFont}>
              {tr("Pick your Arabic", "اختر عربيّتك")}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-foreground/60">
              {tr(
                "Most students want a mix of both, and that's exactly what the free call is for.",
                "معظم الطلاب يريدون مزيجًا من الاثنين، ولهذا بالضبط نُخصص المكالمة المجانية.",
              )}
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {dialects.map((d) => (
                <div
                  key={d.name}
                  className="rounded-2xl border border-foreground/10 bg-card p-6 transition hover:shadow-sm"
                  style={{ borderColor: `${KLOVERS_GREEN}00` }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = KLOVERS_GREEN)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-foreground" style={headingFont}>{d.name}</h3>
                    <span className="text-base text-foreground/60" style={{ fontFamily: "Cairo, system-ui, sans-serif" }} lang="ar" dir="rtl">
                      {d.arabicName}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/70">{d.description}</p>
                  <span
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: KLOVERS_GREEN, color: "#1A1A1A" }}
                  >
                    {tr("Open for trial classes", "متاحة للحجز التجريبي")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who this is for */}
        <section className="py-20 border-b" style={{ backgroundColor: SAND }}>
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-[#1A1A1A]" style={headingFont}>
              {tr("Who these lessons are for", "لمن هذه الدروس")}
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {audience.map((line) => (
                <li
                  key={line}
                  className="border-s-4 ps-4 leading-relaxed text-[#1A1A1A]/80"
                  style={{ borderColor: KLOVERS_GREEN_DEEP }}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How lessons work — numbered circle badges, mkatub's HowItWorks shape. */}
        <section className="py-20 border-b">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={headingFont}>
              {tr("How lessons work", "كيف تسير الدروس")}
            </h2>
            <ol className="mt-10 grid gap-10 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold"
                    style={{ backgroundColor: KLOVERS_GREEN, color: "#1A1A1A", ...headingFont }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-foreground" style={headingFont}>{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Meet your tutor — dark forest panel, mkatub's MeetTutor shape. */}
        <section className="py-20 border-b text-white" style={{ backgroundColor: FOREST }}>
          <div className="container mx-auto px-4 max-w-5xl grid gap-10 md:grid-cols-[14rem_1fr] md:items-center">
            <div
              className="relative mx-auto h-56 w-56 shrink-0 overflow-hidden rounded-full border-4 md:mx-0"
              style={{ borderColor: `${KLOVERS_GREEN}cc` }}
            >
              <img
                src={rehamPhoto}
                alt={tr("Reham Elshrkawy", "ريهام الشرقاوي")}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={headingFont}>
                {tr("Meet your tutor", "تعرّف على معلمتك")}
              </h2>
              <p className="mt-4 text-lg italic leading-snug" style={{ color: KLOVERS_GREEN }}>
                {tr(
                  "“I know exactly where a translation breaks down between languages. It's the same gap that makes textbook Arabic feel nothing like real use.”",
                  "«أعرف بالضبط أين تنهار الترجمة بين اللغات، وهي نفس الفجوة التي تجعل العربية الفصحى في الكتب لا تشبه الاستخدام الفعلي.»",
                )}
              </p>
              <p className="mt-5 leading-relaxed text-white/85">
                {tr(
                  "Years of Korean-Arabic interpreting and international operations taught me exactly where that gap is, in formal writing and in everyday speech. I also founded and run Klovers, an online academy teaching Korean to students in more than fifteen countries since 2013, and Arabic lessons follow the same one-on-one, real-conversation approach.",
                  "سنوات من الترجمة الكورية-العربية والعمليات الدولية علّمتني بالضبط مكان هذه الفجوة، سواء في الكتابة الرسمية أو في العامية المنطوقة. أسست وأدير أيضًا كلوفرز، أكاديمية إلكترونية تُدرّس الكورية لطلاب في أكثر من خمس عشرة دولة منذ عام 2013، وتتبع دروس العربية الأسلوب نفسه القائم على الحصص الفردية والمحادثة الحقيقية.",
                )}
              </p>
              <div className="mt-7">
                <Button
                  size="lg"
                  asChild
                  variant="outline"
                  className="rounded-full font-semibold border-white/70 text-white hover:bg-white/10 bg-transparent"
                >
                  <Link
                    to="/blog/meet-reham-hungarian-arabic-korean-teacher"
                    className="flex items-center gap-2"
                  >
                    {tr("Read my story", "اقرأ قصتي")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Trial booking — id targeted by mkatub.kloversegy.com's "Book a
            trial class" CTAs (2026-10-20 linkup), so they deep-link straight
            to this real booking widget instead of a fake one. */}
        <section id="trial-booking" className="py-20 border-b scroll-mt-24">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-2xl font-bold mb-2 text-foreground text-center" style={headingFont}>
              {tr("Book your free trial lesson", "احجز حصتك التجريبية المجانية")}
            </h2>
            <p className="text-foreground/70 text-center mb-8">
              {tr(
                "Pick a time that works for you, or message us directly if nothing matches.",
                "اختر موعدًا يناسبك، أو راسلنا مباشرة إن لم يناسبك أي موعد.",
              )}
            </p>
            <PersonalTrialBooking
              language="arabic"
              accentColor={KLOVERS_GREEN_DEEP}
              accentHoverColor={FOREST}
              whatsappMessage={{
                en: "Hi! I'd like to book a free trial Arabic lesson but none of the available times work for me. Can we find another time?",
                ar: "مرحبًا، أرغب في حجز حصة عربية تجريبية مجانية لكن المواعيد المتاحة لا تناسبني. هل يمكننا الاتفاق على موعد آخر؟",
              }}
            />
          </div>
        </section>

        {/* Common questions */}
        <section className="py-20 border-b" style={{ backgroundColor: SAND }}>
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-2xl font-bold text-[#1A1A1A]" style={headingFont}>
              {tr("Common questions", "أسئلة شائعة")}
            </h2>
            <div className="mt-8 divide-y divide-[#1A1A1A]/10">
              {faq.map(({ q, a }) => (
                <div key={q} className="py-6 first:pt-0">
                  <h3 className="text-lg font-semibold text-[#1A1A1A]" style={headingFont}>{q}</h3>
                  <p className="mt-2 leading-relaxed text-[#1A1A1A]/70">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-white" style={{ backgroundColor: FOREST }}>
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold" style={headingFont}>
              {tr("Tell me what you're working toward.", "أخبرني بما تسعى إليه.")}
            </h2>
            <p className="mt-5 text-lg text-white/75 max-w-xl mx-auto">
              {tr(
                "Fusha for study or formal use, Egyptian dialect for real conversation, or both: send a message and we'll start from there.",
                "الفصحى للدراسة أو الاستخدام الرسمي، أو العامية المصرية للمحادثة الحقيقية، أو كلاهما معًا: أرسل رسالة ولنبدأ من وضعك فعليًا.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="rounded-full font-semibold hover:brightness-95"
                style={{ backgroundColor: KLOVERS_GREEN, color: "#1A1A1A" }}
              >
                <Link to="#trial-booking">
                  {tr("Book a trial class", "احجز حصة تجريبية")}
                </Link>
              </Button>
              <Button
                size="lg"
                asChild
                variant="outline"
                className="rounded-full font-semibold border-white/70 text-white hover:bg-white/10 bg-transparent"
              >
                <Link to="/contact?subject=Arabic+lessons" className="flex items-center gap-2">
                  {tr("Message me about lessons", "راسلني بخصوص الدروس")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
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
