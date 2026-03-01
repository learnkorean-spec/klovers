import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import rehamKorea1 from "@/assets/reham-korea-1.jpg";
import rehamKorea2 from "@/assets/reham-korea-2.jpg";

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
              <div className="rounded-xl overflow-hidden shadow-md">
                <img src={rehamKorea1} alt="Reham Elshrkawy visiting traditional Korean architecture" className="w-full h-72 object-cover" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-md">
                <img src={rehamKorea2} alt="Reham Elshrkawy at the Korean seaside" className="w-full h-72 object-cover" />
              </div>
            </div>

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
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
