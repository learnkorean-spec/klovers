import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CoursesSection from "@/components/CoursesSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LEVELS } from "@/constants/levels";

const CoursesPage = () => {
  useSEO({
    title: "Korean Courses",
    description:
      "Klovers Korean courses: the Hangul alphabet in four classes, then Levels 1-6 preparing you toward TOPIK 1-6. Live classes with a teacher, in Arabic or English.",
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

  const { t, tArray } = useLanguage();
  const weeklyItems = tArray("courses", "weeklyStructure.items") as { title: string; description: string }[];
  const weeklyIcons = [BookOpen, Clock, RotateCcw];

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <CoursesSection />

        <section className="py-20 md:py-28 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-2">
                {t("courses", "weeklyStructure.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("courses", "weeklyStructure.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {weeklyItems.map((item, index) => {
                const Icon = weeklyIcons[index];
                return (
                  <Card key={index} className="text-center border-border">
                    <CardContent className="p-6">
                      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-klovers-yellow">
                        <Icon className="h-6 w-6 text-charcoal" aria-hidden="true" />
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
