import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const FinalCTA = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-20 bg-primary relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary-foreground/5 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <Sparkles className="h-8 w-8 text-primary-foreground/60 mx-auto mb-4" />
        <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-3">
          {t("finalCta", "title")}
        </h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-sm md:text-base">
          {t("finalCta", "subtitle")}
        </p>
        <Button size="lg" variant="secondary" asChild className="gap-2 h-12 px-8 text-base shadow-lg">
          <Link to="/enroll-now">
            {t("finalCta", "button")}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default FinalCTA;
