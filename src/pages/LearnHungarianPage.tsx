import { Link } from "react-router-dom";
import { ArrowRight, Globe, LayoutDashboard } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import PersonalTrialBooking from "@/components/PersonalTrialBooking";
import PersonalLessonPricing from "@/components/PersonalLessonPricing";

/**
 * /learn-hungarian and /ar/learn-hungarian
 *
 * Added 19 Oct 2026. Reham also teaches Hungarian (and Arabic-for-foreigners,
 * and English) alongside the Korean courses Klovers is built around — see the
 * "Meet Reham" article (meet-reham-hungarian-arabic-korean-teacher[-ar]).
 *
 * Redesigned 24 Oct 2026 (Re: give Hungarian the same sibling-brand
 * treatment as maktub (Arabic) and Voca (English) — asked and confirmed via
 * clarifying questions rather than assumed). Brand name **Buda**, picked
 * from a short list and approved by Re: short for Budapest, where Reham
 * studied (Balassi Institute scholarship) and lived, easy to say in both
 * Arabic and English.
 *
 * Identity: the Chain Bridge (Széchenyi Lánchíd) — the literal bridge
 * connecting Buda and Pest across the Danube — doubles as the bridge
 * between two languages, which is what this page actually does (Hungarian
 * explained in Arabic or English). Deep Danube-night navy + warm
 * lamplight gold + cream, distinct from maktub's forest/lime and Voca's
 * maroon/yellow. Same Fraunces display type Voca already uses (loaded
 * sitewide, no new font request) — the two in-repo sibling brands share
 * type, differ in palette/mark/motif.
 *
 * Unlike maktub (its own separate Next.js app/domain), Buda lives in this
 * same page, the same pattern Voca uses: its own header/footer instead of
 * the sitewide Header/Footer, same URL and route structure otherwise.
 *
 * All copy that states a fact — the SEO title/description, the FAQ
 * question/answer pairs, the audience list, and the three lesson steps —
 * is unchanged from the previous version, word for word, and the static
 * prerendered HTML in scripts/lib/marketing-bodies.mjs is untouched. Only
 * the hero tagline/badge and section framing (copy whose only job is to
 * introduce the sections below it) were rewritten for this pass.
 *
 * Shares PersonalTrialBooking + book-personal-trial + personal_trial_slots
 * with the English and Arabic pages — one calendar, one teacher,
 * parameterized by language — per the scope agreed when that system was
 * built.
 */

const DANUBE = "#0C1D2E"; // ink
const GOLD = "#D9A648"; // signal accent
const CREAM = "#F5F0E6"; // paper
const STEEL = "#3A5668"; // secondary accent

const displayFont = { fontFamily: "'Fraunces', serif" };

/** The one recurring device: a thin gold-over-steel rule, used exactly twice. */
const BridgeRule = () => (
  <div aria-hidden="true">
    <div style={{ height: 4, backgroundColor: GOLD }} />
    <div style={{ height: 4, backgroundColor: STEEL }} />
  </div>
);

type TrFn = (en: string, ar: string) => string;

const BudaLogoMark = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Buda">
    <rect width="48" height="48" rx="12" fill={DANUBE} />
    <rect x="9" y="12" width="4" height="22" rx="1.5" fill={GOLD} />
    <rect x="35" y="12" width="4" height="22" rx="1.5" fill={GOLD} />
    <path
      d="M11 18C16 10 32 10 37 18"
      stroke={GOLD}
      strokeWidth="2.4"
      fill="none"
      strokeLinecap="round"
    />
    <rect x="7" y="31" width="34" height="3.5" rx="1.5" fill={GOLD} />
    <circle cx="11" cy="14" r="1.6" fill="#FFF3DB" />
    <circle cx="37" cy="14" r="1.6" fill="#FFF3DB" />
  </svg>
);

/**
 * Buda's own header — same pattern as Voca's: a page with its own
 * sibling-brand identity gets its own header/nav instead of the sitewide
 * <Header />, whose Courses/Pricing/Textbook/Games/Shop nav is about the
 * Korean platform and doesn't fit a Hungarian-lessons visitor. Nav anchors
 * only to real sections on this one page (no Courses/Articles link to a
 * Klovers/Korean page — Voca's history notes exactly why not).
 */
const BudaHeader = ({ isAr, tr, toggleLanguage }: { isAr: boolean; tr: TrFn; toggleLanguage: () => void }) => {
  const { user } = useAuth();
  const navLinks = [
    { href: "#who-its-for", label: tr("Who it's for", "لمن هذه الدروس") },
    { href: "#how-it-works", label: tr("How it works", "كيف تسير الدروس") },
    { href: "#pricing", label: tr("Pricing", "الأسعار") },
    { href: "#faq", label: tr("FAQ", "الأسئلة الشائعة") },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/90 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        style={{ backgroundColor: GOLD, color: "#111111" }}
      >
        {tr("Skip to content", "الانتقال إلى المحتوى")}
      </a>
      <div className="container mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <a href="#top" className="inline-flex items-center gap-2" aria-label={tr("Buda home", "الصفحة الرئيسية لـ Buda")}>
          <BudaLogoMark className="h-8 w-8 shrink-0" />
          <span className="text-xl font-extrabold tracking-tight text-foreground">Buda</span>
        </a>
        <nav className="hidden items-center gap-6 md:flex" aria-label={tr("Primary", "رئيسي")}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-foreground/75 hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user && (
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs" title={tr("My Dashboard", "لوحة التحكم")}>
              <Link to="/dashboard">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tr("Dashboard", "لوحة التحكم")}</span>
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5" />
            {tr("العربية", "English")}
          </Button>
          <Button
            size="sm"
            asChild
            className="hidden rounded-full font-semibold hover:brightness-95 sm:inline-flex"
            style={{ backgroundColor: GOLD, color: "#111111" }}
          >
            <a href="#trial">{tr("Book a trial", "احجز حصة تجريبية")}</a>
          </Button>
        </div>
      </div>
    </header>
  );
};

const LearnHungarianPage = () => {
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: isAr
      ? "تعلّم المجرية بالعربية أو الإنجليزية مع ريهام الشرقاوي"
      : "Learn Hungarian in Arabic or English, with Reham Elshrkawy",
    description: isAr
      ? "دروس مجرية فردية عبر الإنترنت، بشرح بالعربية أو الإنجليزية، مع معلمة عاشت في بودابست وتعرف تمامًا ما يحتاجه المبتدئ: من أجل السفر، أو منحة مجرية، أو أسرة مجرية."
      : "One-on-one online Hungarian lessons, explained in Arabic or English, with a teacher who lived in Budapest and knows exactly what a beginner needs: for a move, a Hungarian scholarship, or a Hungarian family.",
    canonical: isAr ? "https://kloversegy.com/ar/learn-hungarian" : "https://kloversegy.com/learn-hungarian",
    alternates: {
      en: "https://kloversegy.com/learn-hungarian",
      ar: "https://kloversegy.com/ar/learn-hungarian",
    },
    // Its own hero image for link previews, not the site-wide Seoul skyline
    // default (19 Oct 2026, SEO/GEO pass) — a Korean-skyline preview card for
    // a Hungarian-lessons link reads as a mismatch or a broken share.
    ogImage: "https://images.unsplash.com/photo-1728463460723-61de554e49ba?fm=jpg&q=80&w=1200&auto=format&fit=crop",
  });

  const faq = [
    {
      q: tr(
        "Can these lessons help with a Balassi Institute or Stipendium Hungaricum scholarship application?",
        "هل يمكن أن تساعد هذه الدروس في التقدّم لمنحة من معهد بالاسي أو منحة Stipendium Hungaricum؟",
      ),
      a: tr(
        "Yes, I studied Hungarian myself on a Balassi Institute scholarship, so lessons can focus on the language level and paperwork these applications actually ask for, alongside general conversation.",
        "نعم، درست المجرية بنفسي بمنحة من معهد بالاسي، فيمكن أن تركّز الدروس على مستوى اللغة والأوراق التي تطلبها هذه المنح فعليًا، إلى جانب المحادثة العامة.",
      ),
    },
    {
      q: tr(
        "Do I need to know any Hungarian already to start?",
        "هل أحتاج إلى معرفة سابقة بالمجرية للبدء؟",
      ),
      a: tr(
        "No, lessons start from zero. Everything is explained in Arabic or English first, so you're never lost in a language you don't speak yet.",
        "لا، تبدأ الدروس من الصفر. يُشرح كل شيء بالعربية أو الإنجليزية أولًا، فلن تشعر بالضياع في لغة لا تتحدثها بعد.",
      ),
    },
  ];

  // BreadcrumbList, Course and FAQPage JSON-LD for this route are baked into
  // the prerendered static HTML by scripts/prerender-meta.mjs (breadcrumb /
  // pageLd / faq fields on the /learn-hungarian MARKETING_ROUTES entry, with
  // an Arabic-translated twin for /ar/learn-hungarian) rather than injected
  // here client-side. src/lib/jsonLdDedupe.ts removes any id-less (static)
  // block once the client adds one declaring the same @type, so a client
  // useEffect here would silently delete the version that non-JS AI
  // crawlers (GPTBot, ClaudeBot, PerplexityBot) actually see — exactly the
  // audience this page's GEO pass (19 Oct 2026) is for. Keep this page's
  // structured data static-only; the `faq` array below only drives the
  // visible "Common questions" section.

  const audience = [
    tr("Moving to Hungary for work, study or family", "الانتقال إلى المجر للعمل أو الدراسة أو الأسرة"),
    tr("Applying for a Balassi Institute or Stipendium Hungaricum scholarship", "التقدّم لمنحة من معهد بالاسي أو منحة Stipendium Hungaricum"),
    tr("Married into, or dating into, a Hungarian family", "الزواج من أسرة مجرية أو الارتباط بها"),
    tr("Just curious about a language almost nobody around you speaks", "الفضول لتعلّم لغة لا يتحدث بها أحد من حولك تقريبًا"),
  ];

  const steps = [
    {
      title: tr("A free 20-minute call", "مكالمة تعارف مجانية مدتها عشرون دقيقة"),
      body: tr(
        "We talk about why you're learning Hungarian and where you're starting from: zero is completely fine.",
        "نتحدث عن سبب رغبتك في تعلّم المجرية ومستواك الحالي: البدء من الصفر أمر طبيعي تمامًا.",
      ),
    },
    {
      title: tr("Lessons explained in Arabic or English", "دروس تُشرح بالعربية أو الإنجليزية"),
      body: tr(
        "Hungarian grammar is unlike Arabic or English, so every rule is explained in a language you already think in, not in Hungarian itself.",
        "قواعد المجرية مختلفة تمامًا عن العربية والإنجليزية، لذا تُشرح كل قاعدة بلغة تفكر بها بالفعل، لا بالمجرية نفسها.",
      ),
    },
    {
      title: tr("Built around what you actually need", "مبنية على ما تحتاجينه فعلًا"),
      body: tr(
        "Scholarship paperwork, everyday survival phrases, or conversation with family: the lessons follow your actual situation, not a fixed textbook order.",
        "أوراق المنحة، أو عبارات الحياة اليومية، أو الحديث مع الأسرة: تتبع الدروس وضعك الفعلي لا ترتيب كتاب ثابت.",
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <BudaHeader isAr={isAr} tr={tr} toggleLanguage={toggleLanguage} />
      <main id="main-content">
        {/* Hero — Danube-night navy, the bridge rule framing the one photo. */}
        <section className="relative overflow-hidden text-white" style={{ backgroundColor: DANUBE }}>
          <div className="container relative mx-auto px-4 py-20 sm:py-28 max-w-6xl">
            <div className="grid items-center gap-14 lg:grid-cols-2">
              <div>
                <span
                  className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium"
                  style={{ borderColor: `${GOLD}99`, color: GOLD }}
                >
                  {tr("A bridge between two languages", "جسر بين لغتين")}
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl font-semibold leading-[1.1]" style={displayFont}>
                  {tr("Cross the bridge into Hungarian.", "اعبر الجسر إلى المجرية.")}
                  <br />
                  <span className="italic font-normal" style={{ color: GOLD }}>
                    {tr("Explained in Arabic or English, start to finish.", "تُشرح بالعربية أو الإنجليزية من البداية للنهاية.")}
                  </span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                  {tr(
                    "I lived in Budapest, studied Hungarian at Ain Shams University on a Balassi Institute scholarship, and have been teaching it ever since. I know what it's like to hold a form in Hungarian and not understand it, and I'd rather be the person who explains the next one.",
                    "عشت في بودابست، ودرست المجرية في جامعة عين شمس بمنحة من معهد بالاسي، وأدرّسها منذ ذلك الوقت. أعرف شعور أن تمسك بورقة بالمجرية ولا تفهمها، وأفضّل أن أكون من يشرح الورقة التالية.",
                  )}
                </p>
                <div className="mt-9 flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    asChild
                    className="rounded-full font-semibold hover:brightness-95"
                    style={{ backgroundColor: GOLD, color: "#111111" }}
                  >
                    <Link to="/contact?subject=Hungarian+lessons">
                      {tr("Message me about lessons", "راسلني بخصوص الدروس")}
                      <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="rounded-full font-semibold border-white/70 text-white hover:bg-white/10 bg-transparent"
                  >
                    <Link to="/blog/meet-reham-hungarian-arabic-korean-teacher">
                      {tr("Read my story", "اقرأ قصتي")}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="overflow-hidden rounded-2xl shadow-2xl">
                  <BridgeRule />
                  <div className="overflow-hidden border-4 border-white/95 bg-muted">
                    <img
                      src="https://images.unsplash.com/photo-1728463460723-61de554e49ba?fm=jpg&q=80&w=1600&auto=format&fit=crop"
                      width={1600}
                      height={900}
                      alt={
                        isAr
                          ? "مبنى البرلمان الهنغاري على ضفاف نهر الدانوب في بودابست"
                          : "The Hungarian Parliament Building on the Danube in Budapest"
                      }
                      className="h-full w-full object-cover aspect-[4/3]"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>
                <span
                  className="absolute -bottom-5 start-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg"
                  style={{ color: DANUBE }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GOLD }} aria-hidden="true" />
                  {tr("Lessons over video call", "الحصص عبر مكالمة فيديو")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Who this is for — stub-style rows, not another checklist card. */}
        <section className="py-20 border-b" style={{ backgroundColor: CREAM }} id="who-its-for">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ ...displayFont, color: DANUBE }}>
              {tr("Who these lessons are for", "لمن هذه الدروس")}
            </h2>
            <ul className="mt-9 grid gap-6 sm:grid-cols-2">
              {audience.map((line, i) => (
                <li
                  key={line}
                  className="border-s-4 ps-4 leading-relaxed"
                  style={{ borderColor: i % 2 === 0 ? GOLD : STEEL, color: `${DANUBE}cc` }}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How lessons work — a real sequence, numbered. */}
        <section className="py-20 border-b" id="how-it-works">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground" style={displayFont}>
              {tr("How lessons work", "كيف تسير الدروس")}
            </h2>
            <ol className="mt-10 grid gap-10 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold"
                    style={{ backgroundColor: i === 1 ? STEEL : GOLD, color: i === 1 ? "#FFFFFF" : "#111111", ...displayFont }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing — added 24 Oct 2026, same tiers as Reham's private Korean
            lessons (src/lib/stripePrices.ts), shared across maktub/Voca/Buda. */}
        <PersonalLessonPricing
          tr={tr}
          id="pricing"
          background={CREAM}
          ink={DANUBE}
          signal={GOLD}
          signalText="#111111"
          headingStyle={displayFont}
          trialHref="#trial"
        />

        {/* Not a textbook — second photo, kept as-is but reframed. */}
        <section className="py-20 border-b">
          <div className="container mx-auto px-4 max-w-6xl grid items-center gap-12 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border shadow-lg bg-muted order-2 lg:order-1">
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
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4" style={displayFont}>
                {tr("Not a textbook: a guide who's done this", "ليست كتابًا مدرسيًا، بل مرشدة عاشت التجربة")}
              </h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                {tr(
                  "Between Cairo and Budapest I spent years learning Hungarian the hard way, long before I taught it to anyone. I also worked for years doing Korean-Arabic interpreting and international operations, so I know what it means when a deadline or a document genuinely has to be right.",
                  "بين القاهرة وبودابست، أمضيت سنوات أتعلّم المجرية بالطريقة الصعبة، قبل أن أُدرّسها لأي شخص. عملت أيضًا لسنوات في الترجمة الكورية-العربية والعمليات الدولية، لذا أعرف تمامًا معنى أن يكون الموعد النهائي أو المستند الرسمي بحاجة إلى الدقة فعلًا.",
                )}
              </p>
              <p className="text-foreground/70 leading-relaxed">
                {tr(
                  "I also founded and run Klovers, an online academy teaching Korean to students in more than fifteen countries since 2013, and Hungarian lessons follow the same one-on-one, real-conversation approach.",
                  "أسست وأدير أيضًا كلوفرز، أكاديمية إلكترونية تُدرّس الكورية لطلاب في أكثر من خمس عشرة دولة منذ عام 2013، وتتبع دروس المجرية الأسلوب نفسه القائم على الحصص الفردية والمحادثة الحقيقية.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Trial booking — the second and last use of the bridge rule. */}
        <section className="py-20 border-b" style={{ backgroundColor: CREAM }} id="trial">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="overflow-hidden rounded-t-2xl">
              <BridgeRule />
              <div className="bg-background px-6 pt-10 pb-2 sm:px-10">
                <h2 className="text-2xl sm:text-3xl font-semibold text-center" style={{ ...displayFont, color: DANUBE }}>
                  {tr("Book your free trial lesson", "احجز حصتك التجريبية المجانية")}
                </h2>
                <p className="text-foreground/70 text-center mt-2">
                  {tr(
                    "Pick a time that works for you, or message us directly if nothing matches.",
                    "اختر موعدًا يناسبك، أو راسلنا مباشرة إن لم يناسبك أي موعد.",
                  )}
                </p>
              </div>
            </div>
            <div className="rounded-b-xl bg-background px-6 pb-10 sm:px-10">
              <PersonalTrialBooking
                language="hungarian"
                accentColor={DANUBE}
                accentHoverColor={STEEL}
                whatsappMessage={{
                  en: "Hi! I'd like to book a free trial Hungarian lesson but none of the available times work for me. Can we find another time?",
                  ar: "مرحبًا، أرغب في حجز حصة مجرية تجريبية مجانية لكن المواعيد المتاحة لا تناسبني. هل يمكننا الاتفاق على موعد آخر؟",
                }}
              />
            </div>
          </div>
        </section>

        {/* Common questions — visible text backing the FAQPage schema above */}
        <section className="py-20 border-b" id="faq">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground" style={displayFont}>
              {tr("Common questions", "أسئلة شائعة")}
            </h2>
            <div className="mt-9 divide-y divide-border">
              {faq.map(({ q, a }) => (
                <div key={q} className="py-6 first:pt-0">
                  <h3 className="font-bold text-lg text-foreground">{q}</h3>
                  <p className="mt-1 text-foreground/70 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-white" style={{ backgroundColor: DANUBE }}>
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-semibold" style={displayFont}>
              {tr("Tell me what you're working toward.", "أخبرني بما تسعى إليه.")}
            </h2>
            <p className="mt-5 text-lg text-white/75 max-w-xl mx-auto">
              {tr(
                "A scholarship deadline, a move, a family: send a message and we'll start from there.",
                "موعد منحة، أو سفر، أو أسرة: أرسل رسالة ولنبدأ من وضعك فعليًا.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="rounded-full font-semibold hover:brightness-95"
                style={{ backgroundColor: GOLD, color: "#111111" }}
              >
                <Link to="/contact?subject=Hungarian+lessons" className="flex items-center gap-2">
                  {tr("Message me about lessons", "راسلني بخصوص الدروس")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-full font-semibold border-white/70 text-white hover:bg-white/10 bg-transparent"
              >
                <Link to="/blog/meet-reham-hungarian-arabic-korean-teacher">{tr("Read my story", "اقرأ قصتي")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Buda is Klovers' Hungarian-lessons identity — added 24 Oct 2026 at
         Re's request, matching the sibling-brand pattern used for maktub
         (Arabic) and Voca (English). Sits above the sitewide Footer below,
         which is left untouched. */}
      <div
        className="py-4 px-4 flex flex-wrap items-center justify-center gap-2 text-sm border-y"
        style={{ backgroundColor: CREAM, borderColor: "#e3d9c4" }}
      >
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-md font-extrabold text-xs"
          style={{ backgroundColor: GOLD, color: "#111111" }}
          aria-hidden="true"
        >
          K
        </span>
        <span style={{ color: "#555555" }}>
          {tr("Also learning Korean? Buda is part of", "هل تتعلم الكورية أيضًا؟ بودا جزء من")}
        </span>
        <Link to="/" className="font-bold underline" style={{ color: DANUBE }}>
          {tr("Klovers — back to Korean lessons", "كلوفرز — العودة إلى دروس الكورية")}
        </Link>
      </div>

      <footer className="py-10 px-4" style={{ backgroundColor: "#0a0a0a", color: "#d9d9d9" }}>
        <div className="container mx-auto flex flex-wrap gap-8 justify-between items-start">
          <div className="flex flex-col gap-2 max-w-xs">
            <div className="flex items-center gap-2">
              <BudaLogoMark className="h-[26px] w-[26px]" />
              <span className="text-[15px] font-bold text-white">Buda</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/60">
                {tr("by Klovers", "من كلوفرز")}
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              {tr(
                "Hungarian, explained in Arabic or English. Buda is the Hungarian-lessons side of Klovers.",
                "المجرية، بشرح بالعربية أو الإنجليزية. بودا هو جانب دروس المجرية في كلوفرز.",
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GOLD }}>
              Buda
            </h4>
            <a href="#how-it-works" className="text-white/70 hover:text-white">
              {tr("How it works", "كيف تسير الدروس")}
            </a>
            <a href="#faq" className="text-white/70 hover:text-white">
              {tr("FAQ", "الأسئلة الشائعة")}
            </a>
            <a href="#trial" className="text-white/70 hover:text-white">
              {tr("Book a trial", "احجز حصة تجريبية")}
            </a>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wide" style={{ color: STEEL }}>
              {tr("Klovers family", "عائلة كلوفرز")}
            </h4>
            <Link to="/" className="text-white/70 hover:text-white">
              {tr("◂ Klovers — Learn Korean", "◂ كلوفرز — تعلّم الكورية")}
            </Link>
            <a href="https://mkatub.kloversegy.com" className="text-white/70 hover:text-white">
              {tr("Mkatub — Learn Arabic", "مكتوب — تعلّم العربية")}
            </a>
            <Link to="/learn-english" className="text-white/70 hover:text-white">
              {tr("Voca — Learn English", "فوكا — تعلّم الإنجليزية")}
            </Link>
          </div>
        </div>
      </footer>

      <Footer />
    </div>
  );
};

export default LearnHungarianPage;
