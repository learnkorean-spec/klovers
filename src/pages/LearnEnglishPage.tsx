import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import PersonalTrialBooking from "@/components/PersonalTrialBooking";
import { VOCA_THEME_CLASS, VocaSiteHeader } from "@/components/voca/VocaBrand";
import rehamPhoto from "@/assets/reham-teacher.jpg";

/**
 * /learn-english and /ar/learn-english
 *
 * Added 19 Oct 2026, alongside /learn-hungarian — Reham also teaches English
 * one-on-one (as well as Hungarian and Arabic-for-foreigners) outside the
 * Korean courses Klovers is built around.
 *
 * Redesigned 22 Oct 2026 (Re: "create the english page... must be
 * impressive, out of the box" — the same ask that produced the bespoke
 * Arabic-page redesign on 20 Oct 2026). Re also referenced "the same idea
 * like maktub"; maktub is a separate, purpose-built Arabic-teaching site
 * whose own branding (forest green / klovers-green) the Arabic page now
 * deliberately matches, because the two are literal siblings — maktub's
 * trial-booking CTAs link straight into klovers' /learn-arabic page. There
 * is no English-teaching equivalent of maktub, so matching its colors here
 * would be decoration with no referent. Confirmed with Re (22 Oct 2026):
 * what she wants carried over is the IDEA — a bespoke, one-off visual
 * identity per personal-lesson page, not a shared template — applied to
 * English with its own identity, same URL, same structure otherwise.
 *
 * This page's identity: English, for an Arabic-speaking learner, is above
 * all the language of *going somewhere* — a job, an exam score, a flight,
 * a conversation you can finally have. The one deliberate visual device
 * (used exactly twice: framing the hero photo, and on the trial-booking
 * card) is a thin two-colour rule lifted from classic airmail stationery —
 * literally the paper that carried a language across a border — rather
 * than a stock globe/plane cliché. Ink navy + warm paper + a single signal
 * red keep everything else quiet around that one idea. Display type is
 * Fraunces, already loaded sitewide for the v1 Arabic redesign and unused
 * anywhere live since the Arabic page moved to Poppins/Cairo in v2 — no new
 * font request.
 *
 * UPDATE, 23 Oct 2026 (Re, via Claude): the paragraph above no longer holds.
 * Re decided this page should get the maktub treatment after all — its own
 * sibling-brand identity, "Voca" — see the recolor note further down and
 * the VocaHeader/Voca footer near the end of this file. Header is now
 * VocaHeader, not the sitewide one; same URL and route structure otherwise.
 *
 * All copy that states a fact — the SEO title/description, the FAQ
 * question/answer pairs, the audience list, and the three lesson steps —
 * is unchanged from the previous version, word for word, and the static
 * prerendered HTML in scripts/lib/marketing-bodies.mjs is untouched. Only
 * the hero tagline/badge and section framing (copy whose only job is to
 * introduce the sections below it) were rewritten for this pass.
 *
 * Shares PersonalTrialBooking + book-personal-trial + personal_trial_slots
 * with the Hungarian and Arabic pages — one calendar, one teacher,
 * parameterized by language — per the scope agreed when that system was
 * built.
 */

// Recolored 23 Oct 2026 (Re, via Claude): overriding the navy/paper/red
// "airmail" identity above with Voca's own maroon + Klovers-yellow pair,
// plus a standalone Voca footer block and an explicit link back to the
// Korean side of Klovers — see the end of this page, just before <Footer />.
const INK = "#650000"; // Voca maroon
const PAPER = "#FFF9EC"; // Voca cream
const SIGNAL = "#FFFF00"; // Klovers yellow (primary accent)
const SIGNAL_DEEP = "#4A0000"; // darker maroon, used as a hover/accent shade
const WING = "#FFF9EC"; // cream (secondary accent, same as PAPER)

const displayFont = { fontFamily: "'Fraunces', serif" };

/** The one recurring device: a thin maroon-over-yellow rule, used exactly twice. */
const AirmailRule = () => (
  <div aria-hidden="true">
    <div style={{ height: 4, backgroundColor: INK }} />
    <div style={{ height: 4, backgroundColor: SIGNAL }} />
  </div>
);

// VocaHeader moved to src/components/voca/VocaBrand.tsx as VocaSiteHeader
// (23 Oct 2026) so /learn-english/articles can share it; its history and
// Re's "no Klovers links in the Voca header" rule are documented there.

const LearnEnglishPage = () => {
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: isAr
      ? "تعلّم الإنجليزية بشرح بالعربية مع ريهام الشرقاوي"
      : "Learn English, explained in Arabic, with Reham Elshrkawy",
    description: isAr
      ? "دروس إنجليزية فردية عبر الإنترنت، بشرح بالعربية، تركّز على المحادثة الحقيقية والثقة في الحديث، للعمل، أو المقابلات، أو السفر، أو التحضير للامتحانات."
      : "One-on-one online English lessons, explained in Arabic, focused on real conversation and speaking confidence, for work, interviews, travel, or exam preparation.",
    canonical: isAr ? "https://kloversegy.com/ar/learn-english" : "https://kloversegy.com/learn-english",
    alternates: {
      en: "https://kloversegy.com/learn-english",
      ar: "https://kloversegy.com/ar/learn-english",
    },
    // Own hero image for link previews (19 Oct 2026, SEO/GEO pass) — not the
    // site-wide Seoul skyline default. Unchanged by this redesign.
    ogImage: "https://images.unsplash.com/photo-1758525225676-329ddcedf78f?fm=jpg&q=80&w=1200&auto=format&fit=crop",
  });

  const faq = [
    {
      q: tr(
        "Can these lessons help me pass IELTS, TOEFL, or a job interview?",
        "هل يمكن أن تساعدني هذه الدروس في اجتياز IELTS أو TOEFL أو مقابلة عمل؟",
      ),
      a: tr(
        "Yes, lessons are built around your actual goal, whether that's an exam section, interview questions, or everyday work English, not a fixed textbook order.",
        "نعم، تُبنى الدروس حول هدفك الفعلي، سواء كان قسمًا في اختبار، أو أسئلة مقابلة، أو إنجليزية العمل اليومية، لا ترتيب كتاب ثابت.",
      ),
    },
    {
      q: tr(
        "I already study Korean at Klovers, can I add English lessons too?",
        "أدرس الكورية بالفعل في كلوفرز، هل يمكنني إضافة دروس الإنجليزية أيضًا؟",
      ),
      a: tr(
        "Yes, this is the same teacher's personal 1:1 lessons, separate from your Korean classes. Message us and we'll fit a schedule around both.",
        "نعم، هذه دروس فردية خاصة بالمعلمة نفسها، منفصلة عن حصص الكورية. راسلنا ونرتّب جدولًا يناسب الاثنين.",
      ),
    },
  ];

  // BreadcrumbList, Course and FAQPage JSON-LD for this route are baked into
  // the prerendered static HTML by scripts/prerender-meta.mjs (breadcrumb /
  // pageLd / faq fields on the /learn-english MARKETING_ROUTES entry, with
  // an Arabic-translated twin for /ar/learn-english) rather than injected
  // here client-side. src/lib/jsonLdDedupe.ts removes any id-less (static)
  // block once the client adds one declaring the same @type, so a client
  // useEffect here would silently delete the version that non-JS AI
  // crawlers (GPTBot, ClaudeBot, PerplexityBot) actually see — exactly the
  // audience this page's GEO pass (19 Oct 2026) is for. Keep this page's
  // structured data static-only; the `faq` array above only drives the
  // visible "Common questions" section.

  const audience = [
    tr("Need English for work, interviews, or a new job", "تحتاج الإنجليزية للعمل، أو المقابلات، أو وظيفة جديدة"),
    tr("Preparing for IELTS, TOEFL, or study abroad", "تستعد لاختبار IELTS أو TOEFL أو الدراسة في الخارج"),
    tr("Can read fairly well but freeze up when speaking", "تقرأ الإنجليزية بشكل جيد لكن تتوقف عند الحديث بها"),
    tr("Traveling, moving abroad, or just want real conversational fluency", "تسافر أو تنتقل للخارج، أو تريد طلاقة حقيقية في المحادثة"),
  ];

  const steps = [
    {
      title: tr("A free 20-minute call", "مكالمة تعارف مجانية مدتها عشرون دقيقة"),
      body: tr(
        "We talk about why you're learning English and where you're starting from: beginner to advanced, it's fine either way.",
        "نتحدث عن سبب رغبتك في تعلّم الإنجليزية ومستواك الحالي: من المبتدئ إلى المتقدم، كله مناسب.",
      ),
    },
    {
      title: tr("Grammar explained in Arabic, practice in English", "القواعد تُشرح بالعربية، والتدريب بالإنجليزية"),
      body: tr(
        "Rules that never quite made sense in a classroom get explained plainly in Arabic first, then practiced out loud until they're automatic.",
        "القواعد التي لم تكن واضحة في الفصل تُشرح ببساطة بالعربية أولًا، ثم تُمارَس بصوت عالٍ حتى تصبح تلقائية.",
      ),
    },
    {
      title: tr("Built around what you actually need", "مبنية على ما تحتاجه فعلًا"),
      body: tr(
        "Job interviews, exam sections, or everyday conversation: the lessons follow your actual situation, not a fixed textbook order.",
        "مقابلات العمل، أو أقسام الاختبار، أو المحادثة اليومية: تتبع الدروس وضعك الفعلي لا ترتيب كتاب ثابت.",
      ),
    },
  ];

  return (
    <div className={`${VOCA_THEME_CLASS} min-h-screen bg-background`}>
      <VocaSiteHeader isAr={isAr} tr={tr} toggleLanguage={toggleLanguage} onLanding />
      <main id="main-content">
        {/* Hero — ink navy ground, the airmail rule framing the one photo. */}
        <section className="relative overflow-hidden text-white" style={{ backgroundColor: INK }}>
          <div className="container relative mx-auto px-4 py-20 sm:py-28 max-w-6xl">
            <div className="grid items-center gap-14 lg:grid-cols-2">
              <div>
                <span
                  className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium"
                  style={{ borderColor: `${SIGNAL}99`, color: SIGNAL }}
                >
                  {tr("Real conversation, not just grammar", "محادثة حقيقية لا قواعد فقط")}
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl font-semibold leading-[1.1]" style={displayFont}>
                  {tr("Say it in English.", "قل ما تريد بالإنجليزية.")}
                  <br />
                  <span className="italic font-normal" style={{ color: SIGNAL }}>
                    {tr("Be understood, wherever it takes you.", "ولتُفهم، أينما يأخذك ذلك.")}
                  </span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                  {tr(
                    "I've used English professionally for years: interpreting, international operations, and running an academy that teaches across three languages. I know exactly where Arabic speakers get stuck, because I've watched it happen for years, not guessed at it.",
                    "استخدمت الإنجليزية مهنيًا لسنوات: في الترجمة، والعمليات الدولية، وإدارة أكاديمية تُدرّس بثلاث لغات. أعرف بالضبط أين يتعثّر متحدثو العربية، لأنني شاهدت ذلك لسنوات، لا لأنني أخمّن.",
                  )}
                </p>
                <div className="mt-9 flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    asChild
                    className="rounded-full font-semibold hover:brightness-95"
                    style={{ backgroundColor: SIGNAL, color: "#111111" }}
                  >
                    <Link to="/contact?subject=English+lessons">
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
                  <AirmailRule />
                  <div className="overflow-hidden border-4 border-white/95 bg-muted">
                    <img
                      src="https://images.unsplash.com/photo-1758525225676-329ddcedf78f?fm=jpg&q=80&w=1600&auto=format&fit=crop"
                      width={1600}
                      height={900}
                      alt={
                        isAr
                          ? "شخصان يتحدثان الإنجليزية في جلسة محادثة"
                          : "Two people in an English conversation practice session"
                      }
                      className="h-full w-full object-cover aspect-[4/3]"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>
                <span
                  className="absolute -bottom-5 start-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg"
                  style={{ color: INK }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SIGNAL }} aria-hidden="true" />
                  {tr("Lessons over video call", "الحصص عبر مكالمة فيديو")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Who this is for — stub-style rows, not another checklist card. */}
        <section className="py-20 border-b" style={{ backgroundColor: PAPER }} id="who-its-for">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ ...displayFont, color: INK }}>
              {tr("Who these lessons are for", "لمن هذه الدروس")}
            </h2>
            <ul className="mt-9 grid gap-6 sm:grid-cols-2">
              {audience.map((line, i) => (
                <li
                  key={line}
                  className="border-s-4 ps-4 leading-relaxed"
                  style={{ borderColor: i % 2 === 0 ? SIGNAL : WING, color: `${INK}cc` }}
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
                    style={{ backgroundColor: i === 1 ? WING : SIGNAL, color: "#111111", ...displayFont }}
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

        {/* Not a textbook — second photo, kept as-is but reframed. */}
        <section className="py-20 border-b">
          <div className="container mx-auto px-4 max-w-6xl grid items-center gap-12 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border shadow-lg bg-muted order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1508169351866-777fc0047ac5?fm=jpg&q=80&w=1600&auto=format&fit=crop"
                width={1600}
                height={1067}
                alt={isAr ? "كتاب مفتوح يُستخدم في دراسة الإنجليزية" : "An open book used for studying English"}
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
                  "Years of Korean-Arabic interpreting and international operations meant English was never optional for me. It was the language a deadline or a document had to be right in. That's the same standard I bring to a lesson.",
                  "سنوات من الترجمة الكورية-العربية والعمليات الدولية جعلت الإنجليزية ليست خيارًا بالنسبة لي، بل اللغة التي كان يجب أن يكون فيها الموعد النهائي أو المستند دقيقًا. وهذا هو المعيار نفسه الذي أحمله إلى الدرس.",
                )}
              </p>
              <p className="text-foreground/70 leading-relaxed">
                {tr(
                  "I also founded and run Klovers, an online academy teaching Korean to students in more than fifteen countries since 2013, and English lessons follow the same one-on-one, real-conversation approach.",
                  "أسست وأدير أيضًا كلوفرز، أكاديمية إلكترونية تُدرّس الكورية لطلاب في أكثر من خمس عشرة دولة منذ عام 2013، وتتبع دروس الإنجليزية الأسلوب نفسه القائم على الحصص الفردية والمحادثة الحقيقية.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Meet Reham — ink panel, same figure as the hero's palette. */}
        <section className="py-20 border-b text-white" style={{ backgroundColor: INK }}>
          <div className="container mx-auto px-4 max-w-5xl grid gap-10 md:grid-cols-[12rem_1fr] md:items-center">
            <div
              className="relative mx-auto h-44 w-44 shrink-0 overflow-hidden rounded-full border-4 md:mx-0"
              style={{ borderColor: `${SIGNAL}cc` }}
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
              <p className="text-lg italic leading-snug" style={{ ...displayFont, color: SIGNAL }}>
                {tr(
                  "“English was never optional for me, it was the language a deadline or a document had to be right in.”",
                  "«الإنجليزية لم تكن أبدًا خيارًا بالنسبة لي، بل اللغة التي كان يجب أن يكون فيها الموعد النهائي أو المستند دقيقًا.»",
                )}
              </p>
              <p className="mt-5 text-sm font-semibold text-white/70">
                {tr("Reham Elshrkawy — Founder, Klovers", "ريهام الشرقاوي — مؤسسة كلوفرز")}
              </p>
            </div>
          </div>
        </section>

        {/* Trial booking — the second and last use of the airmail rule. */}
        <section className="py-20 border-b" style={{ backgroundColor: PAPER }} id="trial">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="overflow-hidden rounded-t-2xl">
              <AirmailRule />
              <div className="bg-background px-6 pt-10 pb-2 sm:px-10">
                <h2 className="text-2xl sm:text-3xl font-semibold text-center" style={{ ...displayFont, color: INK }}>
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
                language="english"
                accentColor={INK}
                accentHoverColor={SIGNAL_DEEP}
                whatsappMessage={{
                  en: "Hi! I'd like to book a free trial English lesson but none of the available times work for me. Can we find another time?",
                  ar: "مرحبًا، أرغب في حجز حصة إنجليزية تجريبية مجانية لكن المواعيد المتاحة لا تناسبني. هل يمكننا الاتفاق على موعد آخر؟",
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
        <section className="py-24 text-white" style={{ backgroundColor: INK }}>
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-semibold" style={displayFont}>
              {tr("Tell me what you're working toward.", "أخبرني بما تسعى إليه.")}
            </h2>
            <p className="mt-5 text-lg text-white/75 max-w-xl mx-auto">
              {tr(
                "A job interview, an exam, a move abroad: send a message and we'll start from there.",
                "مقابلة عمل، أو اختبار، أو سفر: أرسل رسالة ولنبدأ من وضعك فعليًا.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="rounded-full font-semibold hover:brightness-95"
                style={{ backgroundColor: SIGNAL, color: "#111111" }}
              >
                <Link to="/contact?subject=English+lessons" className="flex items-center gap-2">
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

      {/* Voca is Klovers' English-lessons identity — added 23 Oct 2026 at Re's
         request, matching the sibling-brand idea used for maktub (Arabic).
         Sits above the sitewide Footer below, which is left untouched. */}
      <div
        className="py-4 px-4 flex flex-wrap items-center justify-center gap-2 text-sm border-y"
        style={{ backgroundColor: PAPER, borderColor: "#ecddc4" }}
      >
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-md font-extrabold text-xs"
          style={{ backgroundColor: SIGNAL, color: "#111111" }}
          aria-hidden="true"
        >
          K
        </span>
        <span style={{ color: "#555555" }}>
          {tr("Also learning Korean? Voca is part of", "هل تتعلم الكورية أيضًا؟ فوكا جزء من")}
        </span>
        <Link to="/" className="font-bold underline" style={{ color: INK }}>
          {tr("Klovers — back to Korean lessons", "كلوفرز — العودة إلى دروس الكورية")}
        </Link>
      </div>

      <footer className="py-10 px-4" style={{ backgroundColor: "#0a0a0a", color: "#d9d9d9" }}>
        <div className="container mx-auto flex flex-wrap gap-8 justify-between items-start">
          <div className="flex flex-col gap-2 max-w-xs">
            <div className="flex items-center gap-2">
              <svg width="26" height="26" viewBox="0 0 200 200" role="img" aria-label="Voca logo">
                <rect x="0" y="0" width="200" height="200" rx="44" fill={INK} />
                <circle cx="100" cy="92" r="58" fill={SIGNAL} />
                <circle cx="100" cy="92" r="34" fill={INK} />
                <rect x="78" y="76" width="8" height="32" rx="4" fill={SIGNAL} />
                <rect x="91" y="64" width="8" height="56" rx="4" fill={SIGNAL} />
                <rect x="104" y="72" width="8" height="40" rx="4" fill={SIGNAL} />
                <rect x="117" y="80" width="8" height="24" rx="4" fill={SIGNAL} />
                <path d="M120 142 L150 142 L128 168 Z" fill={SIGNAL} />
              </svg>
              <span className="text-[15px] font-bold text-white">Voca</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/60">
                {tr("by Klovers", "من كلوفرز")}
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              {tr(
                "English, explained in Arabic. Voca is the English-lessons side of Klovers.",
                "الإنجليزية، بشرح بالعربية. فوكا هو جانب دروس الإنجليزية في كلوفرز.",
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#b33b4a" }}>
              Voca
            </h4>
            <a href="#how-it-works" className="text-white/70 hover:text-white">
              {tr("How it works", "كيف تسير الدروس")}
            </a>
            <a href="#faq" className="text-white/70 hover:text-white">
              {tr("FAQ", "الأسئلة الشائعة")}
            </a>
            <Link to="/learn-english/articles" className="text-white/70 hover:text-white">
              {tr("Articles", "مقالات")}
            </Link>
            <a href="#trial" className="text-white/70 hover:text-white">
              {tr("Book a trial", "احجز حصة تجريبية")}
            </a>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wide" style={{ color: SIGNAL }}>
              {tr("Klovers family", "عائلة كلوفرز")}
            </h4>
            <Link to="/" className="text-white/70 hover:text-white">
              {tr("◂ Klovers — Learn Korean", "◂ كلوفرز — تعلّم الكورية")}
            </Link>
            <a href="https://mkatub.kloversegy.com" className="text-white/70 hover:text-white">
              {tr("Mkatub — Learn Arabic", "مكتوب — تعلّم العربية")}
            </a>
            <Link to="/" className="text-white/70 hover:text-white">
              kloversegy.com
            </Link>
          </div>
        </div>
      </footer>

      <Footer />
    </div>
  );
};

export default LearnEnglishPage;
