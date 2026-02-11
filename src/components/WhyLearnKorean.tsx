import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Briefcase, Plane, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const iconMap: Record<string, React.ReactNode> = {
  study: <BookOpen className="h-8 w-8" />,
  career: <Briefcase className="h-8 w-8" />,
  travel: <Plane className="h-8 w-8" />,
  culture: <Music className="h-8 w-8" />,
};

const WhyLearnKorean = () => {
  const { tArray, t } = useLanguage();
  const items = tArray("whyLearn", "items") as { title: string; description: string; icon: string }[];

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("whyLearn", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("whyLearn", "subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {items.map((item, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50 text-center">
              <CardContent className="p-6 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-primary-foreground">{iconMap[item.icon] || <BookOpen className="h-8 w-8" />}</span>
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyLearnKorean;
