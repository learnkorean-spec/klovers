import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OptimizedImage from "@/components/OptimizedImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Users, Award, ArrowRight, BarChart3, Clock } from "lucide-react";

const LearnKoreanArabicSpeakersPage = () => {
  useSEO({
    title: "Learn Korean as an Arabic Speaker | Difficulty Guide & Study Methods",
    description: "Discover why Korean is easier for Arabic speakers than English speakers. Find grammar similarities, shared sounds, and proven study methods tailored to Arabic learners.",
    canonical: "https://kloversegy.com/learn-korean-arabic-speakers"
  });

  useEffect(() => {
    // JSON-LD: FAQPage Schema for featured snippets
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is Korean hard for Arabic speakers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Korean is actually easier for Arabic speakers than for English speakers. Korean grammar is agglutinative (like Arabic), uses formal/informal speech levels (like Arabic), and Hangul is a phonetic alphabet designed for non-native speakers. Most Arabic speakers reach intermediate (B1) level in 6-8 months vs 12+ months for English speakers."
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
            text: "Following Klovers' structured curriculum: A1-A2 (beginner) = 3-4 months, B1-B2 (intermediate) = 6-8 months total, C1 (advanced) = 12-15 months. Compared to English speakers who need 12-24 months for similar levels."
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
      description: "Why Korean is easier for Arabic speakers and proven methods to accelerate learning from A1 to B2 level",
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
        <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <Badge className="mb-4" variant="outline">For Arabic Learners</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Learn Korean as an Arabic Speaker
            </h1>
            <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
              Korean is actually <span className="font-semibold text-blue-600">easier for Arabic speakers</span> than English speakers. Discover why, and reach intermediate fluency in 6-8 months instead of 12+.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <a href="/enroll-now">Start Learning Today</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/placement-test">Take Free Assessment</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Key Advantages Section */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">Why Korean is Easier for You</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <Zap className="h-8 w-8 text-amber-500" />,
                  title: "Grammar You Already Understand",
                  desc: "SOV word order + agglutinative suffixes = Arabic structure. You won't learn grammar, you'll recognize it."
                },
                {
                  icon: <Award className="h-8 w-8 text-blue-500" />,
                  title: "Formal/Informal Levels (Like Arabic)",
                  desc: "Korean has respect words and formal/casual speech just like Arabic. This is intuitive for you."
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-green-500" />,
                  title: "3x Faster Progress",
                  desc: "Arabic speakers typically progress 3x faster than English speakers. B1 in 6-8 months vs 12+ months."
                },
                {
                  icon: <Users className="h-8 w-8 text-purple-500" />,
                  title: "Hangul is the Easiest Alphabet",
                  desc: "Created as a phonetic script. Learn it in 2 hours, not years. Designed specifically for ease."
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
            <h2 className="text-3xl font-bold mb-4">Grammar Similarities: Arabic ↔ Korean</h2>
            <p className="text-foreground/70 mb-12">These patterns feel natural to you because you already speak Arabic.</p>

            <div className="space-y-8">
              {[
                {
                  ar: "الكتاب أحمر",
                  ar_parse: "[ الكتاب (subject) | أحمر (adjective) ]",
                  ko: "책이 빨강이다",
                  ko_parse: "[ 책 (subject) | 이 (particle) | 빨강 (adjective) | 이다 (copula) ]",
                  concept: "Subject-Adjective: Adjectives follow nouns in both languages"
                },
                {
                  ar: "أنا أحب الكتاب",
                  ar_parse: "[ أنا (I) | أحب (love) | الكتاب (book) ]",
                  ko: "나는 책을 사랑한다",
                  ko_parse: "[ 나 (I) | 는 (particle) | 책 (book) | 을 (particle) | 사랑 (love) | 한다 (verb ending) ]",
                  concept: "Particles mark case: Like Arabic's tanween/case endings, Korean uses particles (은/는, 을/를, 에게, etc)"
                },
                {
                  ar: "يا أحمد، كيف حالك؟ (formal) vs أنت بخير؟ (casual)",
                  ar_parse: "Formal + Informal address",
                  ko: "안녕하세요? (formal) vs 안녕? (casual)",
                  ko_parse: "Formal + Informal speech",
                  concept: "Speech Levels: Like Arabic, Korean marks social respect through word choice and endings"
                }
              ].map((ex, i) => (
                <div key={i} className="p-6 rounded-lg border bg-white dark:bg-slate-900">
                  <p className="font-bold mb-4 text-foreground">{ex.concept}</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-semibold text-foreground/60 mb-2">Arabic</p>
                      <p className="text-lg font-bold mb-1">{ex.ar}</p>
                      <p className="text-sm text-foreground/70">{ex.ar_parse}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/60 mb-2">Korean</p>
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
            <h2 className="text-3xl font-bold mb-12 text-center">Your Learning Timeline</h2>
            <div className="space-y-6">
              {[
                { month: "Month 1-2", level: "A1 (Beginner)", skills: "Hangul alphabet, basic greetings, survival phrases (ordering food, asking directions)" },
                { month: "Month 3-4", level: "A2 (Elementary)", skills: "Present tense, daily conversations, 500+ vocabulary, reading simple dialogues" },
                { month: "Month 5-6", level: "B1 (Intermediate)", skills: "Past/future tenses, explain opinions, watch K-dramas with subtitles, hold 10-minute conversations" },
                { month: "Month 7-8", level: "B1-B2 (Upper Int.)", skills: "Complex sentences, business Korean basics, prepare for TOPIK Level 3-4" }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white font-bold">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-grow pt-1">
                    <p className="font-bold text-lg">{item.month}</p>
                    <p className="text-sm font-semibold text-blue-600 mb-2">{item.level}</p>
                    <p className="text-foreground/70">{item.skills}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Klovers is Perfect for Arabic Speakers */}
        <section className="py-16 border-b bg-blue-50/50 dark:bg-blue-950/10">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">Why Klovers for Arabic Speakers</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Native Arabic-Speaking Teachers",
                  desc: "Instructors who understand Arabic grammar and can explain Korean through that lens. They've walked your path."
                },
                {
                  title: "Contrastive Grammar Lessons",
                  desc: "We explain Korean grammar by comparing it to Arabic — not just comparing to English like other apps."
                },
                {
                  title: "Culturally Relevant Content",
                  desc: "Content about K-drama, Korean culture, and business Korean. Learn the Korea that interests you."
                },
                {
                  title: "Flexible Payment in EGP",
                  desc: "Pricing in Egyptian Pound, payment methods suited for Middle Eastern students. No currency headaches."
                },
                {
                  title: "Live Group Classes (Evening)",
                  desc: "Classes at 8 PM Cairo time, ideal for working professionals. Learn with other Arabic speakers."
                },
                {
                  title: "Personalized 1-on-1 Options",
                  desc: "One-on-one instruction where teachers focus on your specific Arabic-to-Korean learning path."
                }
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
            <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: "Will I need to learn hanja (Korean Chinese characters)?",
                  a: "Not for conversational fluency. Hanja appears on official documents and some news articles, but modern Korean communication (texting, social media, K-dramas) uses only Hangul. Learn hanja after reaching B1 level if needed."
                },
                {
                  q: "How is Hangul different from Arabic script?",
                  a: "Hangul is alphabetic (consonants + vowels combine into blocks), while Arabic is abjadic (mostly consonants). Hangul was intentionally designed for ease and logical structure. You'll master it in 2-3 hours, not weeks."
                },
                {
                  q: "Can I use translation apps to learn Korean?",
                  a: "Not effectively. Apps give you translations, not understanding. Your brain needs to recognize patterns. Use apps only for reference — practice active learning through conversation and writing."
                },
                {
                  q: "What's the best resource for learning Korean as an Arabic speaker?",
                  a: "Combination of: (1) Structured lessons from a teacher (like Klovers), (2) Immersion via K-dramas, (3) Conversation practice with natives, (4) Daily flashcards for vocabulary. We provide all four."
                }
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
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Master Korean Faster?</h2>
            <p className="text-lg mb-8 text-blue-100 max-w-2xl mx-auto">
              Join 500+ Arabic speakers learning Korean with Klovers. Get personalized lessons tailored to your Arabic-speaking background.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <a href="/enroll-now" className="flex items-center gap-2">
                  Enroll Now <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-foreground border-white hover:bg-white/10" asChild>
                <a href="/contact">Chat with us</a>
              </Button>
            </div>
            <p className="text-sm text-blue-100 mt-6">
              <Clock className="h-4 w-4 inline mr-2" />
              Free placement test • No credit card required • Start anytime
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LearnKoreanArabicSpeakersPage;
