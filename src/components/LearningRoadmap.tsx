import { useState, useRef, useEffect } from "react";
import { ChevronDown, BookOpen, MessageCircle, Zap, Star, Trophy, Flame, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const LEVEL_META: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; emoji: string }> = {
  A0: { color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/40", icon: BookOpen,      emoji: "🇰🇷" },
  "TOPIK 1 / A1": { color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/40",   icon: MessageCircle, emoji: "🌱" },
  "TOPIK 2 / A2": { color: "text-cyan-500",   bg: "bg-cyan-500/10",   border: "border-cyan-500/40",   icon: Zap,           emoji: "⚡" },
  "TOPIK 3 / B1": { color: "text-green-500",  bg: "bg-green-500/10",  border: "border-green-500/40",  icon: Star,          emoji: "🔥" },
  "TOPIK 4 / B2": { color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/40",  icon: Flame,         emoji: "💪" },
  "TOPIK 5 / C1": { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/40", icon: Trophy,        emoji: "🏅" },
  "TOPIK 6 / C2": { color: "text-rose-500",   bg: "bg-rose-500/10",   border: "border-rose-500/40",   icon: GraduationCap, emoji: "🏆" },
};

const getMeta = (level: string) =>
  LEVEL_META[level] ?? { color: "text-primary", bg: "bg-primary/10", border: "border-primary/40", icon: Star, emoji: "⭐" };

const LearningRoadmap = () => {
  const { t, tArray } = useLanguage();
  const stages = tArray("roadmap", "stages") as { title: string; description: string; level: string }[];
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
  }, [stages.length]);

  const toggle = (index: number) =>
    setActiveStep((prev) => (prev === index ? null : index));

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-4">
            Your Journey
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("roadmap", "title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("roadmap", "subtitle")}
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-2xl mx-auto relative">
          {/* Vertical line — visible on all sizes */}
          <div className="absolute left-5 md:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/40 to-transparent" />

          <div className="space-y-4">
            {stages.map((stage, index) => {
              const isActive = activeStep === index;
              const isVisible = visibleItems.has(index);
              const meta = getMeta(stage.level);
              const Icon = meta.icon;

              return (
                <div
                  key={index}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  style={{ transitionDelay: `${index * 60}ms` }}
                  className={`relative flex items-start gap-4 transition-all duration-700 ease-out ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                >
                  {/* Step circle */}
                  <button
                    onClick={() => toggle(index)}
                    aria-label={`Step ${index + 1}: ${stage.title}`}
                    className={`relative z-10 flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring border-2 ${
                      isActive
                        ? `${meta.bg} ${meta.border} scale-110 shadow-lg`
                        : `bg-background border-border hover:${meta.border} hover:${meta.bg}`
                    }`}
                  >
                    <span className={`text-lg`}>{meta.emoji}</span>
                  </button>

                  {/* Card */}
                  <div
                    onClick={() => toggle(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && toggle(index)}
                    className={`flex-1 rounded-xl p-4 md:p-5 cursor-pointer transition-all duration-300 border mb-1 ${
                      isActive
                        ? `${meta.bg} ${meta.border} shadow-lg`
                        : "bg-card border-border hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${meta.color}`} />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>
                            {stage.level}
                          </span>
                          <h3 className="text-sm md:text-base font-bold text-foreground leading-tight truncate">
                            {stage.title}
                          </h3>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${
                          isActive ? `rotate-180 ${meta.color}` : "text-muted-foreground"
                        }`}
                      />
                    </div>

                    {/* Expandable description */}
                    <div
                      className={`overflow-hidden transition-all duration-400 ease-in-out ${
                        isActive ? "max-h-40 mt-3 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed pl-[42px]">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" asChild className="gap-2 text-base font-bold h-12 px-8">
            <Link to="/placement-test">
              Find Your Level
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-3">Take our free placement test</p>
        </div>
      </div>
    </section>
  );
};

export default LearningRoadmap;
