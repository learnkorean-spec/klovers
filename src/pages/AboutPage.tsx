import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutPage = () => {
  const { t, tArray } = useLanguage();
  const experienceItems = tArray("aboutPage", "experience.items") as string[];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-16">
              {t("aboutPage", "title")}
            </h1>

            <div className="max-w-3xl mx-auto space-y-12">
              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {t("aboutPage", "story.title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("aboutPage", "story.content")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {t("aboutPage", "philosophy.title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("aboutPage", "philosophy.content")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {t("aboutPage", "experience.title")}
                  </h2>
                  <ul className="space-y-3">
                    {experienceItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
