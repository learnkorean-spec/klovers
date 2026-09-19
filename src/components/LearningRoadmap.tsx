import { useState, useRef, useEffect } from "react";
import { ChevronDown, BookOpen, MessageCircle, Zap, Star, Trophy, Flame, GraduationCap, ArrowRight, Clock, CalendarDays } from "lucide-react";
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
 * 2026-09-20 — it looks like a journey now, not a stack of identical cards.
 * A rail runs down the side with one node per level, and the full-colour
 * emoji are gone: every one of them brought its own palette to a page that
 * owns three, and a lucide icon in Charcoal says the same thing in the
 * brand's.
 */

/**
 * Per-level ornament. Keyed by canonical level key, so adding a level cannot
 * shift the palette, and a renamed badge string cannot silently blank it.
 * Literal class strings, because Tailwind's scanner only keeps what it sees.
 *
 * The ramp is Green → Yellow, and Level 6 is the single Pink on this page
 * besides the games' "hot" badge. That is the point of it: the end of the
 * path should not look like another step on it.
 */
const LEVEL_META: Record<string, { icon: React.ElementType; tile: string }> = {
  hangul: { icon: BookOpen, tile: "bg-mint" },
  l1: { icon: MessageCircle, tile: "bg-mint" },
  l2: { icon: Zap, tile: "bg-mint-strong" },
  l3: { icon: Star, tile: "bg-mint-strong" },
  l4: { icon: Flame, tile: "bg-klovers-yellow" },
  l5: { icon: Trophy, tile: "bg-klovers-yellow" },
  l6: { icon: GraduationCap, tile: "bg-peach-strong" },
};

const getMeta = (key: string) =>
  LEVEL_META[key] ?? { icon: Star, tile: "bg-mint" };

/** The ladder only — the two special tracks are not steps on it. */
const STAGES = COURSE_CARDS.filter((c) => (LEVEL_KEYS as string[]).includes(c.key));

/**
 * The eyebrow is generated in courseCards.ts as "24 classes · 6 months" (or
 * "4 حصص · تمهيدي (Pre-A1)"), derived from levels.ts so it cannot drift. Split
 * on the separator and each half becomes its own chip — no new fields, and
 * nothing here can contradict the levels grid.
 */
const chipsFrom = (eyebrow: string): string[] =>
  eyebrow.split("·").map((s) => s.trim()).filter(Boolean);

const chipIcons = [CalendarDays, Clock];

const LearningRoadmap = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

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
          <span className="inline-block px-4 py-1.5 rounded-full bg-mint text-charcoal text-xs font-semibold uppercase tracking-widest mb-4 border border-charcoal/10">
            {isAr ? "رحلتك" : "Your Journey"}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
            {t("roadmap", "title")}
          </h2>
          {/* Yellow as a mark under the heading, never as the heading. */}
          <span aria-hidden="true" className="mx-auto mt-3 mb-4 block h-2 w-24 rounded-full bg-klovers-yellow" />
          <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
            {t("roadmap", "subtitle")}
          </p>
        </div>

        {/* The rail */}
        <ol className="max-w-2xl mx-auto">
          {STAGES.map((stage, index) => {
            const isActive = activeStep === index;
            const isVisible = visibleItems.has(index);
            const meta = getMeta(stage.key);
            const Icon = meta.icon;
            const isLast = index === STAGES.length - 1;
            const chips = chipsFrom(isAr ? stage.eyebrow_ar : stage.eyebrow_en);

            return (
              <li
                key={stage.key}
                ref={(el) => { itemRefs.current[index] = el; }}
                style={{ transitionDelay: `${index * 70}ms` }}
                className={`flex gap-4 transition-all duration-700 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                }`}
              >
                {/* Node column — the rail lives here, so it never crosses a card */}
                <div className="relative flex w-12 shrink-0 flex-col items-center">
                  {!isLast && (
                    <span aria-hidden="true" className="absolute top-12 bottom-0 w-[2px] bg-charcoal/15" />
                  )}
                  <span
                    className={`relative z-10 grid h-12 w-12 place-items-center rounded-2xl border border-charcoal/10 transition-transform duration-300 ${meta.tile} ${
                      isActive ? "scale-110 shadow-md" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5 text-charcoal" aria-hidden="true" />
                  </span>
                  <span className="relative z-10 mt-1.5 text-[11px] font-bold text-charcoal/45">
                    {index + 1}
                  </span>
                </div>

                {/* Card */}
                <div className="flex-1 pb-5">
                  <div
                    onClick={() => toggle(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && toggle(index)}
                    className={`cursor-pointer rounded-2xl border bg-card p-5 transition-all duration-300 ${
                      isActive
                        ? "border-primary shadow-lg"
                        : "border-border hover:border-primary/40 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <h3 className="min-w-0 flex-1 text-base md:text-lg font-bold text-foreground leading-tight">
                        {isAr ? stage.title_ar : stage.title_en}
                      </h3>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                          isActive ? "rotate-180 text-foreground" : "text-muted-foreground"
                        }`}
                        aria-hidden="true"
                      />
                    </div>

                    {/* Chips — the two facts a visitor actually weighs */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {chips.map((chip, i) => {
                        const ChipIcon = chipIcons[i] ?? CalendarDays;
                        return (
                          <span
                            key={chip}
                            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground"
                          >
                            <ChipIcon className="h-3 w-3" aria-hidden="true" />
                            {chip}
                          </span>
                        );
                      })}
                    </div>

                    {/* Expandable description */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isActive ? "mt-3 max-h-60 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {isAr ? stage.blurb_ar : stage.blurb_en}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button size="lg" asChild className="gap-2 text-base font-bold h-12 px-8 rounded-full">
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
