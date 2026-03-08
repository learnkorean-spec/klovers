import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign } from "lucide-react";
import heroPoster from "@/assets/hero-korean.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const conn = (navigator as any).connection;
    const isFast = !conn || conn.type === "wifi" || conn.effectiveType === "4g";
    if (!isFast) return;

    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      setShowVideo(true);
      video.src = "/videos/hero-korea-video-new.mp4";
      video.load();
      video.play().catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-[100svh] flex items-center justify-center pt-16 overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroPoster})` }}
      >
        {showVideo && (
          <video
            ref={videoRef}
            poster={heroPoster}
            preload="none"
            loop
            muted
            playsInline
            onCanPlay={() => setVideoReady(true)}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button size="lg" asChild className="gap-2 text-base h-12 px-8 shadow-lg">
              <Link to="/enroll-now">
                <ArrowRight className="h-5 w-5" />
                {t("hero", "startNow")}
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="gap-2 text-base h-12 px-8">
              <Link to="/pricing">
                <DollarSign className="h-5 w-5" />
                {t("hero", "viewPricing")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
