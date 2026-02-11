import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FinalCTA = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
          {t("finalCta", "title")}
        </h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
          {t("finalCta", "subtitle")}
        </p>
        <Button size="lg" variant="secondary" asChild className="gap-2">
          <a href="#enroll">
            {t("finalCta", "button")}
            <ArrowRight className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </section>
  );
};

export default FinalCTA;
