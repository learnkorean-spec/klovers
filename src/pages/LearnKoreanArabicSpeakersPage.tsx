import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OptimizedImage from "@/components/OptimizedImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Users, Award, ArrowRight, BarChart3, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LearnKoreanArabicSpeakersPage = () => {
  const { t } = useLanguage();
  useSEO({
    title: "Learn Korean as an Arabic Speaker | Difficulty Guide & Study Methods",
    description: "Discover why Korean is easier for Arabic speakers than English speakers. Find grammar similarities, shared sounds, and proven study methods tailored to Arabic learners.",
    canonical: "https://kloversegy.com/learn-korean-arabic-speakers"
  });

  useEffect(() => {
    /**
     * These answers are what Google quotes back as a featured snippet, so they
     * are the most-repeated sentences on the site and the least edited.
     *
     * Two of them described KLOVERS' OWN curriculum in CEFR bands — "A1-A2 =
     * 3-4 months, B1-B2 = 6-8 months, C1 = 12-15 months" — which names our
     * courses by a scale we do not teach in and attaches a duration nobody can
     * promise. They now use the Klovers ladder, say what a level prepares you
     * for rather than what it equals, and admit that pace depends on the work
     * a student does between classes.
     */
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is Korean hard for Arabic speakers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Korean is often easier for Arabic speakers than for English speakers. Korean grammar is agglutinative (like Arabic), it uses formal and informal speech levels (like Arabic), and Hangul is a phonetic alphabet designed to be learned quickly. Arabic speakers tend to move through the early stages faster as a result."
          }
        },
        {
          "@type": "Question",
          name: "What sounds do Arabic and Korean share?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Both languages use emphatic sounds and have no gendered nouns. Korean's guttural ㄱ (g) is similar to Arabic's غ (ghayn). Both have clear consonant-vowel structures. Arabic speakers excel at Korean pronunciation because they understand geminate (doubled) consonants."
          }
        },
        {
          "@type": "Question",
          name: "How long does it take Arabic speakers to learn Korean?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It depends on how much you practise between classes, so treat any figure as a rough guide. At Klovers the alphabet is a four-class Hangul course. After that, Level 1 and Level 2 cover the beginner ground and prepare you toward TOPIK 1 and TOPIK 2; students on two classes a week typically spend a few months on each. Levels 3 to 6 take longer, because the material per level grows. A Klovers level prepares you for a TOPIK band — it does not certify one."
          }
        },
        {
          "@type": "Question",
          name: "What are the grammar similarities between Arabic and Korean?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Both use Subject-Object-Verb (SOV) word order, agglutinative grammar (suffixes change meaning), formal/informal speech levels (respect words), and particles that mark grammatical function. Arabic speakers find Korean grammar intuitive because it mirrors Arabic structure."
          }
        }
      ]
    };

    let faqLd = document.getElementById("faq-jsonld");
    if (!faqLd) {
      faqLd = document.createElement("script");
      faqLd.id = "faq-jsonld";
      faqLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(faqLd);
    }
    faqLd.textContent = JSON.stringify(faqSchema);

    // JSON-LD: Article + Course schema
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Learn Korean as an Arabic Speaker: Difficulty Guide & Study Methods",
      description: "Why Korean is easier for Arabic speakers, and study methods that work from the Hangul alphabet through the intermediate levels",
      image: "https://kloversegy.com/klovers-logo.jpg",
      author: { "@type": "Organization", name: "Klovers" },
      datePublished: "2026-04-08",
      dateModified: "2026-04-08"
    };

    let articleLd = document.getElementById("article-jsonld");
    if (!articleLd) {
      articleLd = document.createElement("script");
      articleLd.id = "article-jsonld";
      articleLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(articleLd);
    }
    articleLd.textContent = JSON.stringify(articleSchema);

    return () => {
      faqLd?.remove();
      articleLd?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        {/* Hero Section */}
        <section className="pt-24 pb-16 bg-muted/50">
          <div className="container mx-auto px-4 max-w-4xl">
            <Badge className="mb-4" variant="outline">{t("learnArabicSpeakers.badge")}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t("learnArabicSpeakers.heroTitle")}
            </h1>
            <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
              {t("learnArabicSpeakers.heroSubtitlePre")} <span className="font-semibold text-primary">{t("learnArabicSpeakers.heroSubtitleBold")}</span> {t("learnArabicSpeakers.heroSubtitlePost")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <a href="/enroll-now">{t("learnArabicSpeakers.heroCtaStart")}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/placement-test">{t("learnArabicSpeakers.heroCtaTest")}</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Key Advantages Section */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("learnArabicSpeakers.advantagesTitle")}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <Zap className="h-8 w-8 text-amber-500" />,
                  title: t("learnArabicSpeakers.advGrammarTitle"),
                  desc: t("learnArabicSpeakers.advGrammarDesc")
                },
                {
                  icon: <Award className="h-8 w-8 text-primary" />,
                  title: t("learnArabicSpeakers.advFormalTitle"),
                  desc: t("learnArabicSpeakers.advFormalDesc")
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-green-500" />,
                  title: t("learnArabicSpeakers.advFastTitle"),
                  desc: t("learnArabicSpeakers.advFastDesc")
                },
                {
                  icon: <Users className="h-8 w-8 text-purple-500" />,
                  title: t("learnArabicSpeakers.advHangulTitle"),
                  desc: t("learnArabicSpeakers.advHangulDesc")
                }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-foreground/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Grammar Similarities Section */}
        <section className="py-16 border-b bg-slate-50/50 dark:bg-slate-950/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">{t("learnArabicSpeakers.grammarTitle")}</h2>
            <p className="text-foreground/70 mb-12">{t("learnArabicSpeakers.grammarSubtitle")}</p>

            <div className="space-y-8">
              {[
                {
                  ar: "الكتاب أحمر",
                  ar_parse: "[ الكتاب (subject) | أحمر (adjective) ]",
                  ko: "책이 빨강이다",
                  ko_parse: "[ 책 (subject) | 이 (particle) | 빨강 (adjective) | 이다 (copula) ]",
                  concept: t("learnArabicSpeakers.concept1")
                },
                {
                  ar: "أنا أحب الكتاب",
                  ar_parse: "[ أنا (I) | أحب (love) | الكتاب (book) ]",
                  ko: "나는 책을 사랑한다",
                  ko_parse: "[ 나 (I) | 는 (particle) | 책 (book) | 을 (particle) | 사랑 (love) | 한다 (verb ending) ]",
                  concept: t("learnArabicSpeakers.concept2")
                },
                {
                  ar: "يا أحمد، كيف حالك؟ (formal) vs أنت بخير؟ (casual)",
                  ar_parse: "Formal + Informal address",
                  ko: "안녕하세요? (formal) vs 안녕? (casual)",
                  ko_parse: "Formal + Informal speech",
                  concept: t("learnArabicSpeakers.concept3")
                }
              ].map((ex, i) => (
                <div key={i} className="p-6 rounded-lg border bg-white dark:bg-slate-900">
                  <p className="font-bold mb-4 text-foreground">{ex.concept}</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-semibold text-foreground/60 mb-2">{t("learnArabicSpeakers.grammarArabicLabel")}</p>
                      <p className="text-lg font-bold mb-1">{ex.ar}</p>
                      <p className="text-sm text-foreground/70">{ex.ar_parse}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/60 mb-2">{t("learnArabicSpeakers.grammarKoreanLabel")}</p>
                      <p className="text-lg font-bold mb-1">{ex.ko}</p>
                      <p className="text-sm text-foreground/70">{ex.ko_parse}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("learnArabicSpeakers.timelineTitle")}</h2>
            <div className="space-y-6">
              {[
                { month: t("learnArabicSpeakers.timelineMonth12"), level: t("learnArabicSpeakers.timelineLvl1"), skills: t("learnArabicSpeakers.timelineSkills1") },
                { month: t("learnArabicSpeakers.timelineMonth34"), level: t("learnArabicSpeakers.timelineLvl2"), skills: t("learnArabicSpeakers.timelineSkills2") },
                { month: t("learnArabicSpeakers.timelineMonth56"), level: t("learnArabicSpeakers.timelineLvl3"), skills: t("learnArabicSpeakers.timelineSkills3") },
                { month: t("learnArabicSpeakers.timelineMonth78"), level: t("learnArabicSpeakers.timelineLvl4"), skills: t("learnArabicSpeakers.timelineSkills4") }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary text-white font-bold">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-grow pt-1">
                    <p className="font-bold text-lg">{item.month}</p>
                    <p className="text-sm font-semibold text-primary mb-2">{item.level}</p>
                    <p className="text-foreground/70">{item.skills}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Klovers is Perfect for Arabic Speakers */}
        <section className="py-16 border-b bg-muted/50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("learnArabicSpeakers.whyKloversTitle")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: t("learnArabicSpeakers.whyCard1Title"), desc: t("learnArabicSpeakers.whyCard1Desc") },
                { title: t("learnArabicSpeakers.whyCard2Title"), desc: t("learnArabicSpeakers.whyCard2Desc") },
                { title: t("learnArabicSpeakers.whyCard3Title"), desc: t("learnArabicSpeakers.whyCard3Desc") },
                { title: t("learnArabicSpeakers.whyCard4Title"), desc: t("learnArabicSpeakers.whyCard4Desc") },
                { title: t("learnArabicSpeakers.whyCard5Title"), desc: t("learnArabicSpeakers.whyCard5Desc") },
                { title: t("learnArabicSpeakers.whyCard6Title"), desc: t("learnArabicSpeakers.whyCard6Desc") }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg border bg-white dark:bg-slate-900">
                  <div className="flex items-start gap-3 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <h3 className="font-bold text-lg">{item.title}</h3>
                  </div>
                  <p className="text-foreground/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("learnArabicSpeakers.faqPageTitle")}</h2>
            <div className="space-y-6">
              {[
                { q: t("learnArabicSpeakers.faqQ1"), a: t("learnArabicSpeakers.faqA1") },
                { q: t("learnArabicSpeakers.faqQ2"), a: t("learnArabicSpeakers.faqA2") },
                { q: t("learnArabicSpeakers.faqQ3"), a: t("learnArabicSpeakers.faqA3") },
                { q: t("learnArabicSpeakers.faqQ4"), a: t("learnArabicSpeakers.faqA4") }
              ].map((item, i) => (
                <details key={i} className="group p-6 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer">
                  <summary className="font-bold text-lg flex items-center justify-between">
                    {item.q}
                    <span className="transition group-open:rotate-180">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </summary>
                  <p className="text-foreground/70 mt-4 pt-4 border-t">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-secondary text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("learnArabicSpeakers.ctaTitle")}</h2>
            <p className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
              {t("learnArabicSpeakers.ctaSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <a href="/enroll-now" className="flex items-center gap-2">
                  {t("learnArabicSpeakers.ctaEnroll")} <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-foreground border-white hover:bg-white/10" asChild>
                <a href="/contact">{t("learnArabicSpeakers.ctaChat")}</a>
              </Button>
            </div>
            <p className="text-sm text-white/80 mt-6">
              <Clock className="h-4 w-4 inline mr-2" />
              {t("learnArabicSpeakers.ctaFooter")}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LearnKoreanArabicSpeakersPage;
