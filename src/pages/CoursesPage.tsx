import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CoursesSection from "@/components/CoursesSection";
import MeetTeacher from "@/components/MeetTeacher";
import TestimonialsSection from "@/components/TestimonialsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { LEVELS } from "@/constants/levels";
import StoryMoment from "@/components/StoryMoment";
import JourneyMap from "@/components/journey/JourneyMap";
import { KOREA_H, KOREA_HOME, KOREA_OTHER, KOREA_PLACES, KOREA_W } from "@/components/journey/data/korea";
import { COURSE_CARDS } from "@/constants/courseCards";

const CoursesPage = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  useSEO({
    title: isAr ? "دورات اللغة الكورية" : "Korean Courses",
    description: isAr
      ? "دورات كلوفرز الكورية: الحروف الكورية (الهانغول) في أربع حصص، ثم المستويات من ١ إلى ٦ تمهيدًا لاختبار TOPIK من ١ إلى ٦. حصص مباشرة مع المعلمة بالعربية أو الإنجليزية."
      : "Klovers Korean courses: the Hangul alphabet in four classes, then Levels 1-6 preparing you toward TOPIK 1-6. Live classes with a teacher, in Arabic or English.",
    canonical: "https://kloversegy.com/courses",
  });

  useEffect(() => {
    /**
     * Structured data is what Google repeats back to people, so it has to be
     * the real catalogue. It used to list three invented courses — "Beginner
     * Korean (A1–A2)", "Intermediate (B1–B2)", "Advanced (C1–C2)" — which
     * named each course as a CEFR band and contradicted the nine cards
     * rendered on this very page.
     *
     * Generated from LEVELS instead, so it cannot drift: seven entries, each
     * saying what the course prepares you toward rather than what it is.
     */
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "courses-schema";
    // On /ar/courses the list is Arabic and points at the Arabic URL, with the
    // same names and blurbs as the visible Arabic cards (28 Sep 2026).
    const pageUrl = isAr ? "https://kloversegy.com/ar/courses" : "https://kloversegy.com/courses";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: isAr ? "دورات اللغة الكورية في كلوفرز" : "Korean Language Courses at Klovers",
      url: pageUrl,
      ...(isAr ? { inLanguage: "ar" } : {}),
      itemListElement: LEVELS.map((level, index) => {
        const card = COURSE_CARDS.find((c) => c.key === level.key);
        return {
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Course",
            name: isAr && card ? card.title_ar : level.name,
            // No CEFR band in public copy (brand rule, 27 Sep 2026).
            description: isAr && card
              ? card.blurb_ar
              : level.description_en.replace(/\s*\(≈ CEFR [A-C][12]\)/, ""),
            inLanguage: ["ar", "en"],
            teaches: isAr ? "اللغة الكورية" : "Korean",
            provider: { "@id": "https://kloversegy.com/#organization" },
            url: `${pageUrl}#${level.key}`,
          },
        };
      }),
    });
    document.head.appendChild(script);
    return () => { document.getElementById("courses-schema")?.remove(); };
  }, [isAr]);

  const tr = (en: string, ar: string) => (isAr ? ar : en);

  // World mode + brand guard (27 Sep 2026): the week is told as three stops
  // in the Klovers world, in neutral MSA, with Klovers icons instead of
  // generic ones. Same facts as before: one live class, practice, review.
  const weeklyItems: { icon: KloverIconName; title: string; description: string }[] = [
    {
      icon: "chat-annyeonghaseyo",
      title: tr("The café table", "طاولة المقهى"),
      description: tr("One live class a week with the teacher.", "حصة مباشرة واحدة كل أسبوع مع المعلمة."),
    },
    {
      icon: "flashcard-ga",
      title: tr("The market", "السوق"),
      description: tr("Homework and practice between classes.", "واجبات وتمارين بين الحصص."),
    },
    {
      icon: "lightbulb-sprout",
      title: tr("The memory garden", "حديقة الذكريات"),
      description: tr("Feedback, questions and review of what was learned.", "ملاحظات وأسئلة ومراجعة لما سبق تعلّمه."),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <CoursesSection />

        {/* Story (canon: progression from real learning; Cluby is the memory keeper). */}
        <StoryMoment
          image="/assets/story/courses-path.webp"
          alt={isAr ? "آدم ولينا وكلوبي يصعدون درجات طريق حجري نحو جناح هانوك على قمة تلّة في سيول" : "Adam, Lina and Cluby climbing a stone path toward a hanok pavilion on a Seoul hilltop"}
          eyebrow={isAr ? "حكاية كلوفرز" : "The Klovers story"}
          title={isAr ? "مستوى بعد مستوى، مثل آدم ولينا" : "One level at a time, like Adam and Lina"}
          body={isAr
            ? "آدم ولينا يصعدان الطريق نفسه الذي تصعده: الهانغول أولًا، ثم المستويات من ١ إلى ٦. وكلوبي يمشي معهما ويتذكّر كل كلمة يتعلّمانها. في كلوفرز، تتقدّم الحكاية فقط عندما يتقدّم تعلّمك الحقيقي."
            : "Adam and Lina climb the same path you do: Hangul first, then Levels 1 to 6. Cluby walks with them and remembers every word they learn. At Klovers, the story moves forward only when your real learning does."}
        />

        {/* The journey map (Re, 18 Nov 2026), same idea on every site. Canon: languageJourney.korean. */}
        <JourneyMap
          isAr={isAr}
          tr={tr}
          theme={{ bg: "#1A1A1A", panel: "#0f0f0f", otherLand: "#2c2c2c", land: "#FFF9EC", hover: "#d9f99d", selected: "#FFFF00", selectedText: "#111111", kicker: "#FFFF00", cta: "#FFFF00", ctaText: "#111111" }}
          width={KOREA_W}
          height={KOREA_H}
          otherLandPath={KOREA_OTHER}
          homeLandPath={KOREA_HOME}
          places={KOREA_PLACES}
          imageDir="journey/korea"
          kickerEn="The Korea journey"
          kickerAr="رحلة كوريا"
          titleEn="Travel Korea with Adam, Lina and Cluby"
          titleAr="سافر في كوريا مع آدم ولينا وكلوبي"
          introEn="From palace hanbok in Seoul to persimmon-dyed clothes on Jeju, every place dresses and talks a little differently. Pick a pin and see the three of them there, and a first Korean phrase to say."
          introAr="من هانبوك القصور في سيول إلى ملابس جيجو المصبوغة بالكاكا، لكل مكان زيّه وطريقة كلامه. اختر نقطة وشاهد الثلاثة هناك، ومعها أول جملة كورية تقولها."
          ctaHref="/free-trial"
          ctaEn="Start your own Korea journey"
          ctaAr="ابدأ رحلتك مع الكورية"
          mapLabelEn="Map of South Korea"
          mapLabelAr="خريطة كوريا الجنوبية"
        />

        <section className="py-20 md:py-28 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-2">
                {tr("A week in the Klovers world", "أسبوع في عالم كلوفرز")}
              </h2>
              <p className="text-muted-foreground">
                {tr("Every week has the same three stops.", "لكل أسبوع المحطات الثلاث نفسها.")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {weeklyItems.map((item) => {
                return (
                  <Card key={item.icon} className="text-center border-border">
                    <CardContent className="p-6">
                      <span className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-ivory">
                        <KloverIcon name={item.icon} className="h-12 w-12" />
                      </span>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <Button size="lg" asChild>
                <Link to="/pricing">{t("courses", "cta")}</Link>
              </Button>
            </div>
          </div>
        </section>
        {/* Trust block: the real teacher bio and the real reviews, same components as the homepage and /pricing. */}
        <MeetTeacher />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default CoursesPage;
