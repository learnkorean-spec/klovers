import { Card, CardContent } from "@/components/ui/card";
import { Video, Users, MessageCircle, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const stepIcons = [Video, Users, MessageCircle, TrendingUp];

const HowItWorks = () => {
  const { t, tArray } = useLanguage();
  const steps = tArray("howItWorks", "steps") as { title: string; description: string }[];

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("howItWorks", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("howItWorks", "subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                </div>
                <CardContent className="pt-10 pb-6 px-4">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
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
