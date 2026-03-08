import { Card, CardContent } from "@/components/ui/card";
import { Video, Users, MessageCircle, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const stepIcons = [Video, Users, MessageCircle, TrendingUp];

const HowItWorks = () => {
  const { t, tArray } = useLanguage();
  const steps = tArray("howItWorks", "steps") as { title: string; description: string }[];

  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            {t("howItWorks", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            {t("howItWorks", "subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <Card key={index} className="group hover:shadow-md transition-all duration-300 border-border hover:border-primary/40 text-center relative overflow-hidden">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                    {index + 1}
                  </span>
                </div>
                <CardContent className="pt-8 pb-6 px-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">{step.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
