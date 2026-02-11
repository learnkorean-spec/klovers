import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  Heart,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const stepIcons = [MessageCircle, FileText, CheckCircle2];
const stepLinks = [
  "https://t.me/+Fu5T7d4wLMsxNDY9",
  "https://tally.so/r/nr4eal",
  null,
];

const EnrollSection = () => {
  const { t, tArray } = useLanguage();
  const steps = tArray("enroll", "steps") as {
    title: string; description: string; buttonText?: string;
  }[];

  return (
    <section id="enroll" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-3 text-sm font-medium text-foreground animate-pulse">
            <Clock className="h-5 w-5 text-destructive shrink-0" />
            <span>{t("enroll", "urgency")}</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            {t("enroll", "badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("enroll", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("enroll", "subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            const link = stepLinks[index];
            return (
              <Card
                key={index}
                className="relative group hover:shadow-xl transition-all duration-300 border-border hover:border-primary/50 overflow-hidden"
              >
                <div className="absolute -top-2 -left-2 w-12 h-12 bg-primary rounded-br-2xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">
                    {index + 1}
                  </span>
                </div>

                <CardContent className="pt-12 pb-6 px-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-8 w-8 text-primary-foreground transition-colors" />
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-4">
                    {step.description}
                  </p>

                  {link && step.buttonText && (
                    <Button asChild className="w-full">
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        {step.buttonText}
                      </a>
                    </Button>
                  )}

                  {!link && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Badge variant="outline" className="text-xs border-primary/50">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {t("enroll", "egyptDiscount")}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-primary/50">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {t("enroll", "malaysiaDiscount")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-foreground font-medium">
                        <Heart className="h-4 w-4 text-destructive" />
                        {t("enroll", "reachOut")}
                      </div>
                    </div>
                  )}
                </CardContent>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EnrollSection;
