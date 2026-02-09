import { Button } from "@/components/ui/button";
import { BookOpen, FileText } from "lucide-react";
import heroVideo from "@/assets/hero-korea-video.mp4";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
    >
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-foreground/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-background text-sm font-medium mb-6 border border-primary/30">
            {t("hero.badge")}
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-background mb-6 leading-tight">
            {t("hero.title1")}{" "}
            <span className="bg-primary text-primary-foreground px-2">
              {t("hero.title2")}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-background/80 mb-8 max-w-2xl mx-auto">
            {t("hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gap-2">
              <a href="#courses">
                <BookOpen className="h-5 w-5" />
                {t("hero.viewCourses")}
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="gap-2 bg-background/10 border-background/30 text-background hover:bg-background/20"
            >
              <a href="#enroll">
                <FileText className="h-5 w-5" />
                {t("nav.enrollNow")}
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-background/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-background/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
