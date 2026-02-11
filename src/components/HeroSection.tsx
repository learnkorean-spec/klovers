import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign } from "lucide-react";
import heroVideo from "@/assets/hero-korea-video.mp4";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
    >
      <div className="absolute inset-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/75" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium border border-white/20 backdrop-blur-md tracking-wide uppercase">
            {t("hero", "badge")}
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]">
            {t("hero", "title1")}{" "}
            <span className="text-primary drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
              {t("hero", "title2")}
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/80 max-w-xl mx-auto leading-relaxed drop-shadow-md">
            {t("hero", "subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gap-2">
              <a href="#enroll">
                <ArrowRight className="h-5 w-5" />
                {t("hero", "startNow")}
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 bg-white/10 border-white/40 text-white hover:bg-white/20 backdrop-blur-sm">
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
