import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBottomSlot } from "@/lib/bottomLayer";

const SESSION_KEY = "interview_banner_dismissed";

const InterviewBannerChip = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  // Fixed at bottom-32 from mount used to sit directly over the hero's own
  // "Free Hangul starter sheet" link on short mobile viewports - every
  // visitor saw an overlap in their very first view of the page. Gating it
  // behind the same scroll threshold HeroSection's stats strip clears keeps
  // it off the hero entirely.
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 500) setScrolledPastHero(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lowest of the three bottom-anchored overlays - see src/lib/bottomLayer.ts.
  // A feature promo is the right thing to drop when the exit nudge or the
  // enrol bar wants the same corner of the screen.
  const allowed = useBottomSlot("interviewChip", scrolledPastHero && !dismissed);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setDismissed(true);
  };

  if (!allowed) return null;

  return (
    <div
      className={`fixed bottom-32 z-40 animate-in slide-in-from-bottom-4 duration-500 ${isAr ? "left-4" : "left-4"}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2 bg-foreground text-background pl-3 pr-2 py-2 rounded-full shadow-xl border border-primary/30 max-w-[260px]">
        <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
          {t("homeBanner.badge")}
        </span>
        <span className="text-xs font-medium truncate flex-1">
          {t("homeBanner.text")}
        </span>
        <Link
          to="/interview-training"
          className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
          aria-label={t("homeBanner.cta")}
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-background/50 hover:text-background transition-colors ml-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default InterviewBannerChip;
