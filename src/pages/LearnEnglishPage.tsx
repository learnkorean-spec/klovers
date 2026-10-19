import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import PersonalTrialBooking from "@/components/PersonalTrialBooking";

/**
 * /learn-english and /ar/learn-english
 *
 * Added 19 Oct 2026, alongside /learn-hungarian — Reham also teaches English
 * one-on-one (as well as Hungarian and Arabic-for-foreigners) outside the
 * Korean courses Klovers is built around. Built the same way as the
 * Hungarian page: same domain, same Header/Footer, its own quiet palette —
 * a visitor here isn't looking for the Korean product, and no claim to
 * credentials (TEFL/CELTA etc.) that haven't actually been confirmed.
 *
 * Shares PersonalTrialBooking + book-personal-trial + personal_trial_slots
 * with the Hungarian page — one calendar, one teacher, parameterized by
 * language — per the scope agreed when that system was built.
 */

const LearnEnglishPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  useSEO({
    title: isAr
      ? "تعلّم الإنجليزية بشرح بالعربية — مع ريهام الشرقاوي"
      : "Learn English, explained in Arabic — with Reham Elshrkawy",
    description: isAr
      ? "دروس إنجليزية فردية عبر الإنترنت، بشرح بالعربية، تركّز على المحادثة الحقيقية والثقة في الحديث — للعمل، أو المقابلات، أو السفر، أو التحضير للامتحانات."
      : "One-on-one online English lessons, explained in Arabic, focused on real conversation and speaking confidence — for work, interviews, travel, or exam preparation.",
    canonical: isAr ? "https://kloversegy.com/ar/learn-english" : "https://kloversegy.com/learn-english",
    alternates: {
      en: "https://kloversegy.com/learn-english",
      ar: "https://kloversegy.com/ar/learn-english",
    },
    // Own hero image for link previews (19 Oct 2026, SEO/GEO pass) — not the
    // site-wide Seoul skyline default.
    ogImage: "https://images.unsplash.com/photo-1758525225676-329ddcedf78f?fm=jpg&q=80&w=1200&auto=format&fit=crop",
  });

  const faq = [
    {
      q: tr(
        "Can these lessons help me pass IELTS, TOEFL, or a job interview?",
        "هل يمكن أن تساعدني هذه الدروس في اجتياز IELTS أو TOEFL أو مقابلة عمل؟",
      ),
      a: tr(
        "Yes — lessons are built around your actual goal, whether that's an exam section, interview questions, or everyday work English, not a fixed textbook order.",
        "نعم — تُبنى الدروس حول هدفك الفعلي، سواء كان قسمًا في اختبار، أو أسئلة مقابلة، أو إنجليزية العمل اليومية، لا ترتيب كتاب ثابت.",
      ),
    },
    {
      q: tr(
        "I already study Korean at Klovers — can I add English lessons too?",
        "أدرس الكورية بالفعل في كلوفرز — هل يمكنني إضافة دروس الإنجليزية أيضًا؟",
      ),
      a: tr(
        "Yes — this is the same teacher's personal 1:1 lessons, separate from your Korean classes. Message us and we'll fit a schedule around both.",
        "نعم — هذه دروس فردية خاصة بالمعلمة نفسها، منفصلة عن حصص الكورية. راسلنا ونرتّب جدولًا يناسب الاثنين.",
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
        "We talk about why you're learning English and where you're starting from — beginner to advanced, it's fine either way.",
        "نتحدث عن سبب رغبتك في تعلّم الإنجليزية ومستواك الحالي — من المبتدئ إلى المتقدم، كله مناسب.",
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
        "Job interviews, exam sections, or everyday conversation — the lessons follow your actual situation, not a fixed textbook order.",
        "مقابلات العمل، أو أقسام الاختبار، أو المحادثة اليومية — تتبع الدروس وضعك الفعلي لا ترتيب كتاب ثابت.",
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-24 pb-16 bg-[#f2f7f7] dark:bg-muted/20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2d6a6a]/30 bg-[#2d6a6a]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#2d6a6a]">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr("English lessons · real conversation, not just grammar", "دروس إنجليزية · محادثة حقيقية لا قواعد فقط")}
                </span>
                <h1 className="mt-5 text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  {tr(
                    "Learn English, explained in Arabic",
                    "تعلّم الإنجليزية بشرح بالعربية",
                  )}
                </h1>
                <p className="mt-5 text-lg md:text-xl text-foreground/70 leading-relaxed">
                  {tr(
                    "I've used English professionally for years — interpreting, international operations, and running an academy that teaches across three languages. I know exactly where Arabic speakers get stuck, because I've watched it happen for years, not guessed at it.",
                    "استخدمت الإنجليزية مهنيًا لسنوات — في الترجمة، والعمليات الدولية، وإدارة أكاديمية تُدرّس بثلاث لغات. أعرف بالضبط أين يتعثّر متحدثو العربية، لأنني شاهدت ذلك لسنوات، لا لأنني أخمّن.",
                  )}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="rounded-full font-bold bg-[#2d6a6a] hover:bg-[#235252] text-white"
                  >
                    <Link to="/contact?subject=English+lessons">
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
                  src="https://images.unsplash.com/photo-1758525225676-329ddcedf78f?fm=jpg&q=80&w=1600&auto=format&fit=crop"
                  width={1600}
                  height={900}
                  alt={
                    isAr
                      ? "شخصان يتحدثان الإنجليزية في جلسة محادثة"
                      : "Two people in an English conversation practice session"
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
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2d6a6a]" aria-hidden="true" />
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
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2d6a6a] font-bold text-white">
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
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                {tr("Not a textbook — a guide who's done this", "ليست كتابًا مدرسيًا، بل مرشدة عاشت التجربة")}
              </h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                {tr(
                  "Years of Korean-Arabic interpreting and international operations meant English was never optional for me — it was the language a deadline or a document had to be right in. That's the same standard I bring to a lesson.",
                  "سنوات من الترجمة الكورية-العربية والعمليات الدولية جعلت الإنجليزية ليست خيارًا بالنسبة لي — بل اللغة التي كان يجب أن يكون فيها الموعد النهائي أو المستند دقيقًا. وهذا هو المعيار نفسه الذي أحمله إلى الدرس.",
                )}
              </p>
              <p className="text-foreground/70 leading-relaxed">
                {tr(
                  "I also founded and run Klovers, an online academy teaching Korean to students in more than fifteen countries since 2013 — English lessons follow the same one-on-one, real-conversation approach.",
                  "أسست وأدير أيضًا كلوفرز، أكاديمية إلكترونية تُدرّس الكورية لطلاب في أكثر من خمس عشرة دولة منذ عام 2013 — وتتبع دروس الإنجليزية الأسلوب نفسه القائم على الحصص الفردية والمحادثة الحقيقية.",
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
              language="english"
              accentColor="#2d6a6a"
              accentHoverColor="#235252"
              whatsappMessage={{
                en: "Hi! I'd like to book a free trial English lesson but none of the available times work for me — can we find another time?",
                ar: "مرحبًا، أرغب في حجز حصة إنجليزية تجريبية مجانية لكن المواعيد المتاحة لا تناسبني — هل يمكننا الاتفاق على موعد آخر؟",
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
                "A job interview, an exam, a move abroad — send a message and we'll start from there.",
                "مقابلة عمل، أو اختبار، أو سفر — أرسل رسالة ولنبدأ من وضعك فعليًا.",
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-[#2d6a6a] hover:bg-[#235252] text-white rounded-full font-bold" asChild>
                <Link to="/contact?subject=English+lessons" className="flex items-center gap-2">
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

export default LearnEnglishPage;
