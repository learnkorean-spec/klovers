import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import PersonalTrialBooking from "@/components/PersonalTrialBooking";
import rehamPhoto from "@/assets/reham-teacher.jpg";

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
 * film and TV), not an Egypt-only offering.
 *
 * Redesigned 20 Oct 2026 (Re: "must be impressive... out of the box"): the
 * original layout was the same SaaS-template shape as the other two
 * personal-lesson pages — hero image + checklist cards + numbered step
 * cards + mirrored image/text block — just reskinned per language. This
 * page now has its own identity instead: an editorial, "ink and paper"
 * treatment that leans on the one thing unique to this subject — the
 * Arabic script itself — rather than another stock photo. The one bold
 * structural idea is the "Two Arabics" split section below the hero, which
 * makes the Fusha-vs-dialect choice (the actual substance of the FAQ) a
 * visible shape instead of another bullet list. Reham's own photo (already
 * used on /about and the homepage's MeetTeacher section) replaces a second
 * stock image for the credibility section. All copy, facts, FAQ text, SEO
 * metadata, and the static prerendered HTML in scripts/lib/marketing-
 * bodies.mjs and scripts/lib/arabic-pages.mjs are unchanged — this is a
 * visual/structural pass only.
 *
 * Fonts: Fraunces (Latin display) and Amiri (Arabic display, a classical
 * naskh face used for religious and literary texts — a deliberate nod to
 * the Fusha side of this page's subject) are loaded sitewide via
 * index.html's async font link and used only on this page, inline via
 * style={{ fontFamily }} rather than a new Tailwind token, to keep the
 * blast radius to this one route.
 *
 * Same shared trial-booking system (PersonalTrialBooking +
 * book-personal-trial + personal_trial_slots) with language="arabic" as
 * the other two pages; only the visual presentation here is bespoke.
 */

const INK = { backgroundColor: "hsl(var(--foreground))" };
const LAPIS = "#2F6690";
const LAPIS_DEEP = "#234F70";
const BRASS = "#AD8A52";
const PARCHMENT = "#ECE2CC";

const displayFont = (isAr: boolean) => ({ fontFamily: isAr ? "'Amiri', serif" : "'Fraunces', serif" });

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
    // site-wide Seoul skyline default. This is social-share metadata only;
    // the on-page hero itself no longer uses a stock photo (20 Oct redesign).
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
  // ClaudeBot, PerplexityBot) actually see — exactly the audience this
  // page's GEO pass (19 Oct 2026) is for. Keep this page's structured data
  // static-only; the `faq` array above only drives the visible "Common
  // questions" section.

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
        {/* Hero — ink block, the script itself as the image. No stock photo. */}
        <section className="relative overflow-hidden pt-28 pb-24 text-background" style={INK}>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 select-none opacity-[0.07] leading-none ltr:-right-6 rtl:-left-6"
            style={{ fontFamily: "'Amiri', serif", fontSize: "clamp(9rem, 30vw, 22rem)" }}
          >
            العربية
          </span>
          <div className="container relative mx-auto px-4 max-w-3xl">
            <h1
              className="text-4xl md:text-6xl font-semibold leading-[1.08]"
              style={displayFont(isAr)}
            >
              {tr("Learn Arabic.", "تعلّم العربية.")}
              <br />
              <span className="italic font-normal" style={{ color: PARCHMENT }}>
                {tr("Formally, or the way Cairo actually speaks it.", "بالفصحى، أو كما تتحدثها القاهرة فعلًا.")}
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-background/80">
              {tr(
                "I'm a native Egyptian Arabic speaker who's spent years explaining languages across cultures: Korean-Arabic interpreting, international operations, and teaching students in more than fifteen countries. Whether you need Modern Standard Arabic for reading, writing and formal use, or real spoken Egyptian dialect for conversation, I'll help you find the one that matches what you're actually trying to do.",
                "أنا متحدثة أصلية للعربية المصرية، أمضيت سنوات في شرح اللغات بين الثقافات: ترجمة كورية-عربية، وعمليات دولية، وتدريس طلاب في أكثر من خمس عشرة دولة. سواء احتجت الفصحى للقراءة والكتابة والاستخدام الرسمي، أو العامية المصرية المنطوقة للمحادثة الحقيقية، سأساعدك على تحديد ما يناسب هدفك فعليًا.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Button
                size="lg"
                asChild
                className="rounded-[4px] font-semibold text-white"
                style={{ backgroundColor: LAPIS }}
              >
                <Link to="/contact?subject=Arabic+lessons">
                  {tr("Message me about lessons", "راسلني بخصوص الدروس")}
                  <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Link
                to="/blog/meet-reham-hungarian-arabic-korean-teacher"
                className="font-medium underline decoration-1 underline-offset-4 text-background/90 hover:decoration-2"
              >
                {tr("Read my story", "اقرأ قصتي")}
              </Link>
            </div>
          </div>
        </section>

        {/* Two Arabics — the one structural idea this page is built around. */}
        <section className="py-20" style={{ backgroundColor: PARCHMENT }}>
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-sm font-medium tracking-wide text-[#5B4636]">
              {tr("Two Arabics, one set of lessons", "عربيّتان، ودروس واحدة")}
            </h2>
            <div className="mt-6 grid gap-0 border-y border-[#5B4636]/20 md:grid-cols-2">
              <div className="border-b border-[#5B4636]/20 py-10 pe-0 md:border-b-0 md:border-e md:pe-12">
                <p className="text-3xl" style={{ fontFamily: "'Amiri', serif", color: "#3A2E22" }}>
                  {tr("الفصحى", "الفصحى")} <span className="text-lg italic text-[#5B4636]">Fusha</span>
                </p>
                <p className="mt-4 leading-relaxed text-[#4A3F35]">
                  {tr(
                    "The formal, written register: reading, writing, religious texts, media, and official documents. The same everywhere in the Arab world.",
                    "المستوى الرسمي المكتوب: القراءة والكتابة والنصوص الدينية والإعلام والمستندات الرسمية. نفسه في كل أنحاء العالم العربي.",
                  )}
                </p>
              </div>
              <div className="py-10 ps-0 md:ps-12">
                <p className="text-3xl" style={{ fontFamily: "'Amiri', serif", color: "#3A2E22" }}>
                  {tr("مصري", "مصري")} <span className="text-lg italic text-[#5B4636]">Masri</span>
                </p>
                <p className="mt-4 leading-relaxed text-[#4A3F35]">
                  {tr(
                    "Real spoken Egyptian dialect: how people actually talk, and the dialect most widely understood across the Arab world, thanks to Egyptian film and TV.",
                    "العامية المصرية المنطوقة الحقيقية: كيف يتحدث الناس فعليًا، وهي اللهجة الأكثر فهمًا في العالم العربي بفضل السينما والتلفزيون المصري.",
                  )}
                </p>
              </div>
            </div>
            <p className="mt-6 italic text-[#5B4636]">
              {tr(
                "Most students want a mix of both, and that's exactly what the free call is for.",
                "معظم الطلاب يريدون مزيجًا من الاثنين، ولهذا بالضبط نُخصص المكالمة المجانية.",
              )}
            </p>
          </div>
        </section>

        {/* Who this is for — a flowing list, not a checklist of cards. */}
        <section className="py-20 border-b">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground" style={displayFont(isAr)}>
              {tr("Who these lessons are for", "لمن هذه الدروس")}
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {audience.map((line) => (
                <li
                  key={line}
                  className="border-s-4 ps-4 leading-relaxed text-foreground/80"
                  style={{ borderColor: BRASS }}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How lessons work — a genuine sequence, numbered, type-led. */}
        <section className="py-20 border-b" style={{ backgroundColor: PARCHMENT }}>
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-semibold text-[#3A2E22]" style={displayFont(isAr)}>
              {tr("How lessons work", "كيف تسير الدروس")}
            </h2>
            <ol className="mt-10 space-y-10">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-6">
                  <span
                    className="shrink-0 text-4xl leading-none"
                    style={{ ...displayFont(false), color: LAPIS }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg text-[#3A2E22]">{s.title}</h3>
                    <p className="mt-1 leading-relaxed text-[#4A3F35]">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Credibility — Reham's own photo, not another stock image. */}
        <section className="py-20 border-b text-background" style={INK}>
          <div className="container mx-auto px-4 max-w-4xl grid gap-10 md:grid-cols-[auto_1fr] md:items-start">
            <img
              src={rehamPhoto}
              width={128}
              height={128}
              alt={tr("Reham Elshrkawy", "ريهام الشرقاوي")}
              className="h-28 w-28 shrink-0 rounded-full object-cover border-2"
              style={{ borderColor: BRASS }}
              loading="eager"
              decoding="async"
            />
            <div>
              <p className="text-2xl italic leading-snug" style={displayFont(isAr)}>
                {tr(
                  "“I know exactly where a translation breaks down between languages. It's the same gap that makes textbook Arabic feel nothing like real use.”",
                  "«أعرف بالضبط أين تنهار الترجمة بين اللغات، وهي نفس الفجوة التي تجعل العربية الفصحى في الكتب لا تشبه الاستخدام الفعلي.»",
                )}
              </p>
              <p className="mt-5 leading-relaxed text-background/75">
                {tr(
                  "Years of Korean-Arabic interpreting and international operations taught me exactly where that gap is, in formal writing and in everyday speech. I also founded and run Klovers, an online academy teaching Korean to students in more than fifteen countries since 2013, and Arabic lessons follow the same one-on-one, real-conversation approach.",
                  "سنوات من الترجمة الكورية-العربية والعمليات الدولية علّمتني بالضبط مكان هذه الفجوة، سواء في الكتابة الرسمية أو في العامية المنطوقة. أسست وأدير أيضًا كلوفرز، أكاديمية إلكترونية تُدرّس الكورية لطلاب في أكثر من خمس عشرة دولة منذ عام 2013، وتتبع دروس العربية الأسلوب نفسه القائم على الحصص الفردية والمحادثة الحقيقية.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Trial booking — id targeted by mkatub.kloversegy.com's "Book a
            trial class" CTAs (2026-10-20 linkup), so they deep-link straight
            to this real booking widget instead of a fake one. */}
        <section id="trial-booking" className="py-20 border-b scroll-mt-24">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-2xl font-semibold mb-2 text-foreground text-center" style={displayFont(isAr)}>
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
              accentColor={LAPIS}
              accentHoverColor={LAPIS_DEEP}
              whatsappMessage={{
                en: "Hi! I'd like to book a free trial Arabic lesson but none of the available times work for me. Can we find another time?",
                ar: "مرحبًا، أرغب في حجز حصة عربية تجريبية مجانية لكن المواعيد المتاحة لا تناسبني. هل يمكننا الاتفاق على موعد آخر؟",
              }}
            />
          </div>
        </section>

        {/* Common questions — visible text backing the FAQPage schema above */}
        <section className="py-20 border-b" style={{ backgroundColor: PARCHMENT }}>
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-2xl font-semibold text-[#3A2E22]" style={displayFont(isAr)}>
              {tr("Common questions", "أسئلة شائعة")}
            </h2>
            <div className="mt-8 divide-y divide-[#5B4636]/20">
              {faq.map(({ q, a }) => (
                <div key={q} className="py-6 first:pt-0">
                  <h3 className="text-lg text-[#3A2E22]" style={displayFont(isAr)}>{q}</h3>
                  <p className="mt-2 leading-relaxed text-[#4A3F35]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-background" style={INK}>
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-semibold" style={displayFont(isAr)}>
              {tr("Tell me what you're working toward.", "أخبرني بما تسعى إليه.")}
            </h2>
            <p className="mt-5 text-lg text-background/75 max-w-xl mx-auto">
              {tr(
                "Fusha for study or formal use, Egyptian dialect for real conversation, or both: send a message and we'll start from there.",
                "الفصحى للدراسة أو الاستخدام الرسمي، أو العامية المصرية للمحادثة الحقيقية، أو كلاهما معًا: أرسل رسالة ولنبدأ من وضعك فعليًا.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <Button size="lg" className="rounded-[4px] font-semibold text-white" style={{ backgroundColor: LAPIS }} asChild>
                <Link to="/contact?subject=Arabic+lessons" className="flex items-center gap-2">
                  {tr("Message me about lessons", "راسلني بخصوص الدروس")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Link
                to="/blog/meet-reham-hungarian-arabic-korean-teacher"
                className="font-medium underline decoration-1 underline-offset-4 text-background/90 hover:decoration-2"
              >
                {tr("Read my story", "اقرأ قصتي")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LearnArabicPage;
