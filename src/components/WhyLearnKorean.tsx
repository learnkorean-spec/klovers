import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Briefcase, Plane, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const iconMap: Record<string, React.ReactNode> = {
  study: <BookOpen className="h-7 w-7" />,
  career: <Briefcase className="h-7 w-7" />,
  travel: <Plane className="h-7 w-7" />,
  culture: <Music className="h-7 w-7" />,
};

const WhyLearnKorean = () => {
  const { tArray, t } = useLanguage();
  const items = tArray("whyLearn", "items") as { title: string; description: string; icon: string }[];

  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            {t("whyLearn", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            {t("whyLearn", "subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
          {items.map((item, index) => (
            <Card key={index} className="group hover:shadow-md transition-all duration-300 border-border hover:border-primary/40 text-center">
              <CardContent className="p-5 md:p-6 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-105 transition-all duration-300">
                  <span className="text-primary group-hover:text-primary-foreground transition-colors">{iconMap[item.icon] || <BookOpen className="h-7 w-7" />}</span>
                </div>
                <h3 className="font-semibold text-foreground text-sm md:text-base">{item.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyLearnKorean;
