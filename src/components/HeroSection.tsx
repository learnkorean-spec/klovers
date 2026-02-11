import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign } from "lucide-react";
import heroImage from "@/assets/hero-korean.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Korean landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-5 py-2.5 rounded-full bg-primary/30 text-primary-foreground text-sm font-semibold mb-6 border border-primary/40 backdrop-blur-sm shadow-lg">
            {t("hero", "badge")}
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-primary-foreground mb-6 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {t("hero", "title1")}{" "}
            <span className="text-primary">
              {t("hero", "title2")}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto drop-shadow-md font-medium">
            {t("hero", "subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gap-2">
              <a href="#enroll">
                <ArrowRight className="h-5 w-5" />
                {t("hero", "startNow")}
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm">
              <a href="/pricing">
                <DollarSign className="h-5 w-5" />
                {t("hero", "viewPricing")}
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-accent/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-accent/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
