import { useState, useRef, useEffect } from "react";
import { ChevronDown, BookOpen, MessageCircle, Zap, Star, Trophy, Flame, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { COURSE_CARDS } from "@/constants/courseCards";
import { LEVEL_KEYS } from "@/constants/levels";

/**
 * The homepage "your journey" ladder.
 *
 * It used to read `translations.roadmap.stages` — a second hand-written copy
 * of the level ladder, which had drifted exactly as the courses array did. It
 * badged the cards "A0" (not a CEFR band) and "TOPIK 1 / A1" (a level does not
 * equal a band), and it described Hangul as what you do "before entering TOPIK
 * Levels", i.e. a gate — when Hangul is optional and four classes long.
 *
 * Now it derives from `COURSE_CARDS`, which derives from `constants/levels`.
 * The roadmap and the levels grid are the same content in two shapes; they
 * should not be able to disagree.
 *
 * The section heading, subtitle and CTA still come from translations — those
 * carry no level claims.
 */

/**
 * Per-level ornament. Keyed by canonical level key, so adding a level cannot
 * shift the palette, and a renamed badge string cannot silently blank it.
 *
 * The accents are the site's own yellow ladder — pale at Hangul, full neon at
 * Level 3, black at Level 6 — matching the levels grid. Written as literal
 * class strings, because Tailwind's scanner only keeps what it can see.
 */
const LEVEL_META: Record<string, { icon: React.ElementType; emoji: string; dot: string }> = {
  hangul: { icon: BookOpen, emoji: "🇰🇷", dot: "bg-[hsl(60_100%_85%)]" },
  l1: { icon: MessageCircle, emoji: "🌱", dot: "bg-[hsl(60_100%_75%)]" },
  l2: { icon: Zap, emoji: "⚡", dot: "bg-[hsl(60_100%_62%)]" },
  l3: { icon: Star, emoji: "🔥", dot: "bg-primary" },
  l4: { icon: Flame, emoji: "💪", dot: "bg-[hsl(60_90%_38%)]" },
  l5: { icon: Trophy, emoji: "🏅", dot: "bg-[hsl(60_80%_25%)]" },
  l6: { icon: GraduationCap, emoji: "🏆", dot: "bg-foreground" },
};

const getMeta = (key: string) =>
  LEVEL_META[key] ?? { icon: Star, emoji: "⭐", dot: "bg-primary" };

/** The ladder only — the two special tracks are not steps on it. */
const STAGES = COURSE_CARDS.filter((c) => (LEVEL_KEYS as string[]).includes(c.key));

const LearningRoadmap = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(i));
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const toggle = (index: number) =>
    setActiveStep((prev) => (prev === index ? null : index));

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-black text-xs font-semibold uppercase tracking-widest mb-4 border border-black/25 shadow-sm">
            Your Journey
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            {t("roadmap", "title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
            {t("roadmap", "subtitle")}
          </p>
        </div>

        {/* Roadmap cards — centered stack, no timeline line */}
        <div className="max-w-xl mx-auto space-y-3">
          {STAGES.map((stage, index) => {
            const isActive = activeStep === index;
            const isVisible = visibleItems.has(index);
            const meta = getMeta(stage.key);
            const Icon = meta.icon;
            const isLast = index === STAGES.length - 1;

            return (
              <div
                key={stage.key}
                ref={(el) => { itemRefs.current[index] = el; }}
                style={{ transitionDelay: `${index * 80}ms` }}
                className={`transition-all duration-700 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                {/* Card */}
                <div
                  onClick={() => toggle(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggle(index)}
                  className={`relative rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-300 border overflow-hidden group ${
                    isActive
                      ? "border-primary shadow-lg ring-1 ring-inset ring-primary"
                      : "border-border hover:border-primary/30 hover:shadow-md"
                  }`}
                >
                  {/* Subtle gradient background when active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 pointer-events-none" />
                  )}

                  {/* Top row */}
                  <div className="relative flex items-center gap-4">
                    {/* Step number + emoji */}
                    <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive ? "bg-primary/15 shadow-md" : "bg-muted/50 group-hover:bg-muted"
                    }`}>
                      <span className="text-2xl">{meta.emoji}</span>
                      <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-background ${
                        isActive ? "bg-primary text-black" : "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-foreground/25 ${meta.dot}`} />
                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-foreground" : "text-muted-foreground"} transition-colors`} />
                        <span className={`text-[11px] font-bold tracking-wide ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        } transition-colors`}>
                          {isAr ? stage.eyebrow_ar : stage.eyebrow_en}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-foreground leading-tight">
                        {isAr ? stage.title_ar : stage.title_en}
                      </h3>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                        isActive ? "rotate-180 text-foreground" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* Expandable description */}
                  <div
                    className={`relative overflow-hidden transition-all duration-400 ease-in-out ${
                      isActive ? "max-h-52 mt-4 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className={`text-sm text-muted-foreground leading-relaxed ${isAr ? "pr-[72px]" : "pl-[72px]"}`}>
                      {isAr ? stage.blurb_ar : stage.blurb_en}
                    </p>
                  </div>
                </div>

                {/* Connector line between cards */}
                {!isLast && (
                  <div className="flex justify-center py-1">
                    <div className={`w-0.5 h-3 rounded-full transition-colors duration-300 ${
                      isActive || activeStep === index + 1 ? "bg-primary/60" : "bg-border"
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" asChild className="gap-2 text-base font-bold h-12 px-8">
            <Link to="/placement-test">
              {t("roadmap", "cta")}
              <ArrowRight className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-3">{t("roadmap", "ctaSub")}</p>
        </div>
      </div>
    </section>
  );
};

export default LearningRoadmap;
