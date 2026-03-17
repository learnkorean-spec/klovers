import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Users, Star, Globe, Zap, BookOpen, Trophy } from "lucide-react";
import heroPoster from "@/assets/hero-korean.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const floatingPills = [
  { icon: Zap,           label: "Live Classes",   delay: "0s",   pos: "top-[22%] left-[6%]" },
  { icon: BookOpen,      label: "TOPIK Prep",     delay: "0.5s", pos: "top-[22%] right-[5%]" },
  { icon: Trophy,        label: "Certification",  delay: "1s",   pos: "bottom-[30%] left-[4%]" },
  { icon: Star,          label: "4.9 ★ Rated",   delay: "1.5s", pos: "bottom-[30%] right-[4%]" },
];

const useCountUp = (target: number, duration = 1800) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        setCount(Math.round(t * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
};

const HeroSection = () => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { count: studentCount, ref: studentRef } = useCountUp(2000);
  const { count: ratingCount, ref: ratingRef } = useCountUp(49, 1200);
  const { count: countryCount, ref: countryRef } = useCountUp(15);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { type?: string; effectiveType?: string } }).connection;
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
      className="relative min-h-[100svh] flex flex-col items-center justify-center pt-16 overflow-hidden"
    >
      {/* ── Background layer ─────────────────────────────────── */}
      <img
        src={heroPoster}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      />
      {showVideo && (
        <video
          ref={videoRef}
          poster={heroPoster}
          preload="none"
          loop
          muted
          playsInline
          onCanPlay={() => setVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Cinematic gradient — stronger vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/85" />
      {/* Side vignettes for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

      {/* Primary colour glow behind headline */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[340px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(60 100% 50% / 0.12) 0%, transparent 70%)" }}
      />

      {/* ── Decorative large Korean text (backdrop) ──────────── */}
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: "clamp(180px, 30vw, 420px)",
          fontWeight: 900,
          color: "rgba(255,255,0,0.035)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        한국어
      </span>

      {/* ── Floating feature pills (hidden on mobile) ────────── */}
      {floatingPills.map(({ icon: Icon, label, delay, pos }) => (
        <div
          key={label}
          className={`absolute hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md border border-white/15 bg-white/8 text-white/90 text-sm font-semibold shadow-xl animate-mascot-bounce ${pos}`}
          style={{ animationDelay: delay, animationDuration: `${3 + Math.random() * 1.5}s` }}
        >
          <Icon className="w-4 h-4 text-primary shrink-0" />
          {label}
        </div>
      ))}

      {/* ── Hero text content ─────────────────────────────────── */}
      <div className="relative z-10 w-full px-4 text-center">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-7">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary/20 border border-primary/50 backdrop-blur-md shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="text-primary text-xs md:text-sm font-extrabold tracking-[0.18em] uppercase">
              K-Lovers Korean Academy — Enrolling Now
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="font-black text-white leading-[1.0] tracking-tighter"
            style={{ textShadow: "0 4px 40px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)" }}
          >
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem]">
              {t("hero", "title1")}
            </span>
            <span
              className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem] text-primary mt-1"
              style={{ textShadow: "0 0 100px hsl(60 100% 50% / 0.5), 0 0 40px hsl(60 100% 50% / 0.3), 0 4px 24px rgba(0,0,0,0.7)" }}
            >
              {t("hero", "title2")}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed font-medium"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}
          >
            Live interactive Korean classes with{" "}
            <span className="text-primary font-bold">real progress</span>.
            Join{" "}
            <span className="text-white font-bold">2,000+ students</span>{" "}
            learning Korean the right way.
          </p>

          {/* Level pills */}
          <div className="flex gap-2 flex-wrap justify-center">
            {["Beginner", "Intermediate", "Advanced", "TOPIK"].map((level) => (
              <span
                key={level}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm"
              >
                {level}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-1">
            <Button
              size="lg"
              asChild
              className="relative gap-3 text-base md:text-lg font-bold h-14 px-10 md:px-14 shadow-2xl overflow-hidden"
              style={{ boxShadow: "0 0 40px hsl(60 100% 50% / 0.35), 0 8px 32px rgba(0,0,0,0.4)" }}
            >
              <Link to="/enroll-now">
                {t("hero", "startNow")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="gap-3 text-base md:text-lg font-bold h-14 px-10 md:px-14 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm"
            >
              <Link to="/pricing">
                <DollarSign className="h-5 w-5" />
                {t("hero", "viewPricing")}
              </Link>
            </Button>
          </div>

          {/* Social proof avatars */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex -space-x-2.5">
              {["bg-rose-400","bg-violet-400","bg-sky-400","bg-amber-400","bg-emerald-400"].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-black/50 flex items-center justify-center text-white text-[10px] font-bold shadow`}>
                  {["아","민","소","진","림"][i]}
                </div>
              ))}
            </div>
            <p className="text-white/70 text-sm">
              <span className="text-white font-bold">2,000+</span> students already enrolled
            </p>
          </div>

        </div>
      </div>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <div className="relative z-10 w-full mt-auto pt-10 pb-14 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { icon: Users, ref: studentRef, display: `${studentCount.toLocaleString()}+`, label: "Students Taught" },
              { icon: Star,  ref: ratingRef,  display: `${(ratingCount / 10).toFixed(1)} ★`, label: "Average Rating" },
              { icon: Globe, ref: countryRef, display: `${countryCount}+`, label: "Countries" },
            ].map(({ icon: Icon, ref: itemRef, display, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center group">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary hidden sm:block" />
                  <span
                    ref={itemRef}
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-white group-hover:text-primary transition-colors duration-300"
                    style={{ textShadow: "0 2px 16px rgba(0,0,0,0.8)" }}
                  >
                    {display}
                  </span>
                </div>
                <span className="text-white/55 text-xs sm:text-sm font-medium tracking-wide">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 animate-bounce opacity-60">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1 h-2.5 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
