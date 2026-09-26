import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CoursesSection from "@/components/CoursesSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { LEVELS } from "@/constants/levels";

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
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Korean Language Courses at Klovers",
      url: "https://kloversegy.com/courses",
      itemListElement: LEVELS.map((level, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Course",
          name: level.name,
          description: level.description_en,
          inLanguage: ["ar", "en"],
          teaches: "Korean",
          provider: { "@id": "https://kloversegy.com/#organization" },
          url: `https://kloversegy.com/courses#${level.key}`,
        },
      })),
    });
    document.head.appendChild(script);
    return () => { document.getElementById("courses-schema")?.remove(); };
  }, []);

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
      </main>
      <Footer />
    </div>
  );
};

export default CoursesPage;
