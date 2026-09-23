import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Brain, Target, Sparkles, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * The free placement test.
 *
 * 23 Sep 2026: four strings read from translations.ts said TOPIK ("Our free
 * TOPIK-aligned test...", "TOPIK-Based", "TOPIK Placement Test", "20
 * questions · TOPIK-aligned"). TOPIK is off the homepage, so those four are
 * written here in both languages instead; every other string still comes from
 * translations.ts. The heading's middle line used to leave a double space
 * before "stand?" - it is one span now.
 *
 * The section also no longer starts at opacity 0 waiting for an observer: the
 * text is visible on first paint (crawlers, screenshots, fast scrolls). Only
 * the level bars still animate, and they are decoration.
 */
const PlacementTestCTA = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [animate, setAnimate] = useState(false);
  const [activeLevel, setActiveLevel] = useState(0);

  const LEVELS = [
    { label: t("placementCta.levelA1"),  color: "bg-klovers-yellow/35", width: "w-[15%]" },
    { label: t("placementCta.levelA2"),  color: "bg-klovers-yellow/55", width: "w-[30%]" },
    { label: t("placementCta.levelB1"),  color: "bg-klovers-yellow/75", width: "w-[50%]" },
    { label: t("placementCta.levelB2"),  color: "bg-klovers-yellow/90", width: "w-[65%]" },
    { label: t("placementCta.levelC1"),  color: "bg-klovers-yellow",  width: "w-[80%]" },
    { label: t("placementCta.levelC2"),  color: "bg-foreground",      width: "w-[100%]" },
  ];

  const FEATURES = [
    { icon: ClipboardCheck, label: t("placementCta.feature20Q") },
    { icon: Clock,          label: t("placementCta.feature5Min") },
    { icon: Target,         label: isAr ? "حسب مستويات كلوفرز" : "Matched to our levels" },
    { icon: Brain,          label: t("placementCta.featureInstant") },
  ];

  // Scroll-triggered bar animation only
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!animate) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= LEVELS.length) { clearInterval(id); return; }
      setActiveLevel(i);
    }, 400);
    return () => clearInterval(id);
  }, [animate, LEVELS.length]);

  return (
    <section
      ref={sectionRef}
      className="py-20 px-4 relative overflow-hidden bg-gradient-to-b from-background to-muted/40"
    >
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-klovers-yellow/40 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-klovers-yellow/15 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

      {/* Floating Korean characters */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        {["한", "국", "어", "급", "수"].map((char, i) => (
          <span
            key={char}
            className="absolute text-5xl font-bold text-foreground/[0.06]"
            style={{ top: `${15 + i * 18}%`, left: `${3 + i * 19}%`, transform: `rotate(${-15 + i * 8}deg)` }}
          >
            {char}
          </span>
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* ── Left: Copy ── */}
          <div className="space-y-6 text-center md:text-start">
            <div className="inline-flex items-center gap-2 bg-klovers-yellow border border-charcoal/10 px-4 py-2 rounded-full text-sm font-semibold text-charcoal">
              <Sparkles className="h-4 w-4" />
              {t("placementCta.badge")}
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              {t("placementCta.titleLine1").trim()}<br />
              {/* Yellow as a marker behind the words, never as the words. */}
              <span className="relative inline-block">
                <span className="relative z-10">{t("placementCta.titleMiddle").trim()}</span>
                <span aria-hidden="true" className="absolute bottom-1 left-0 w-full h-3 bg-klovers-yellow rounded-sm -z-0" />
              </span>
              {" " + t("placementCta.titleEnd").trim()}
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {isAr
                ? "اختبار مجاني من 20 سؤال بيحدد مستواك في أقل من 5 دقايق، وبيقولك تبدأ منين معانا."
                : "A free 20-question test that finds your level in under 5 minutes and tells you exactly where to start with us."}
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-muted/60 rounded-xl px-3 py-2.5 text-sm text-foreground font-medium">
                  <Icon className="h-4 w-4 text-foreground/70 shrink-0" />
                  {label}
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/placement-test")}
              className="text-base px-8 gap-2 h-12 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              {t("placementCta.cta")}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>

            <p className="text-xs text-muted-foreground">
              {t("placementCta.note")}
            </p>
          </div>

          {/* ── Right: Animated Level Card (decorative) ── */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-charcoal px-5 py-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center">
                    <ClipboardCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{isAr ? "اختبار تحديد المستوى" : "Korean Placement Test"}</p>
                    <p className="text-white/70 text-xs">{t("placementCta.cardSubtitle").includes("TOPIK") ? (isAr ? "أكاديمية كلوفرز" : "Klovers Korean Academy") : t("placementCta.cardSubtitle")}</p>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                  {LEVELS.map((lvl, idx) => (
                    <div key={lvl.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${idx === activeLevel ? "text-foreground" : "text-muted-foreground"}`}>
                          {lvl.label}
                        </span>
                        {idx === activeLevel && (
                          <span className="text-[10px] bg-klovers-yellow text-charcoal px-2 py-0.5 rounded-full font-medium animate-pulse border border-charcoal/10">
                            {t("placementCta.detecting")}
                          </span>
                        )}
                        {idx < activeLevel && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-foreground/45" />
                        )}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${lvl.color} ${
                            idx <= activeLevel ? lvl.width : "w-0"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 bg-muted/50 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{isAr ? "20 سؤال · حوالي 5 دقايق" : "20 questions · about 5 minutes"}</span>
                  <span className="text-xs font-bold text-foreground">{t("placementCta.free")}</span>
                </div>
              </div>

              <div className="absolute -top-3 -right-3 bg-klovers-yellow text-charcoal text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                {t("placementCta.instant")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlacementTestCTA;
