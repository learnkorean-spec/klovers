import { useState, useRef, useEffect } from "react";
import { ArrowRight, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { COURSE_CARDS } from "@/constants/courseCards";
import { LEVEL_KEYS } from "@/constants/levels";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { journeyStops, worldLabel, WORLD_NAMES, type WorldId } from "@/lib/dashboardProgress";
import {
  JourneyScene,
  JourneySceneWide,
  JOURNEY_STOPS,
  JOURNEY_VIEW,
  JOURNEY_SUMMIT,
  JOURNEY_WIDE_STOPS,
  JOURNEY_WIDE_VIEW,
  JOURNEY_WIDE_SUMMIT,
} from "./roadmapScenery";

/**
 * The homepage "your journey" map.
 *
 * It derives from `COURSE_CARDS`, which derives from `constants/levels`. The
 * roadmap and the levels grid are the same content in two shapes; they should
 * not be able to disagree.
 *
 * 2026-09-20 (c) — Re's second mockup: a road climbs from a hanok gate at the
 * bottom-left to a summit banner at the top, past Namsan tower and cherry
 * trees, and each level is a stop on it. Seven stops, one per level key, drawn
 * in `roadmapScenery.tsx` from the same coordinates this file places its nodes
 * at.
 *
 * NO PADLOCKS: on a page whose job is to make a stranger book a free trial,
 * six padlocks read as a paywall. Every stop shows its own icon.
 *
 * LEVEL NAMES are the canonical ones (Hangul Foundation, Levels 1-6), not the
 * mockup's "Beginner / Intermediate / TOPIK".
 *
 * NO HANDWRITTEN MARGIN NOTE: there is no Arabic face that looks handwritten
 * at 20px, and Arabic is the majority script here.
 *
 * 2026-09-20 (d) - TWO MAPS, ONE DATA SET: tall below `lg`, wide from `lg` up
 * (mirrored in Arabic). Both share `renderStops`.
 *
 * 2026-09-23 (a) - THE STOPS START VISIBLE, so the map is never caught empty.
 *
 * 2026-09-23 (b) - THE SUMMIT SAYS "LEVEL 6 AND BEYOND". It said "TOPIK 6";
 * TOPIK is off the homepage by decision, and Level 6 is the site's own name
 * for the top of the ladder.
 *
 * 2026-09-24 - PAINTED ICON LIBRARY, not lucide line-icons: the seven stops
 * now use the same KloverIcon set as the rest of the homepage (HowItWorks,
 * MoreThanAClass), so the roadmap doesn't look like a different product.
 *
 * 2026-09-24 (story order) - THE LEVELS ARE THE STORY WORLDS (homepage
 * narrative slot 4, "learning-journey"). Each level also names the canon
 * world it travels through (KLOVERS_WORLD.levelJourney in
 * src/config/klovers-world.ts: Hangul → Hangul Village, L1 → Vocabulary
 * Market, L2 → Conversation Café, L3 → Culture Street, L4–L6 → Seoul
 * Journey parts 1–3), read from lib/dashboardProgress so the homepage and
 * the student's own journey map can't disagree. The level names stay; the
 * world is a small extra line, with a small painting for each world.
 *
 * 2026-09-26 - the chain is now real rather than promised. This file always
 * read the level→world map from lib/dashboardProgress, and that map used to
 * restate canon's levelJourney by hand; it is now DERIVED from it, so a world
 * added to canon reaches the homepage and the dashboard together. See
 * LEVEL_ICON in dashboardProgress.ts for the one thing that stays local (the
 * icon is presentation, not canon) and src/config/__tests__/kloversWorld.test.ts
 * for the guard that keeps the ladder honest.
 */

/**
 * Per-level ornament. Keyed by canonical level key. Literal class strings,
 * because Tailwind's scanner only keeps what it sees. One colour (Klovers yellow tints) getting
 * stronger, with Level 6 ringed in Charcoal as the end of the path.
 */
const LEVEL_META: Record<string, { icon: KloverIconName; tile: string }> = {
  hangul: { icon: "flashcard-ga", tile: "bg-klovers-yellow/25" },
  l1: { icon: "chat-annyeong", tile: "bg-klovers-yellow/45" },
  l2: { icon: "lightbulb-sprout", tile: "bg-klovers-yellow/65" },
  l3: { icon: "badge-blossom", tile: "bg-klovers-yellow/85" },
  l4: { icon: "growth-chart", tile: "bg-klovers-yellow" },
  l5: { icon: "books-stack", tile: "bg-klovers-yellow" },
  l6: { icon: "diploma-scroll", tile: "bg-klovers-yellow ring-2 ring-charcoal" },
};

const getMeta = (key: string) =>
  LEVEL_META[key] ?? { icon: "badge-blossom" as KloverIconName, tile: "bg-klovers-yellow/25" };

/** Level key → its story world (+ part), from the same mapping the dashboard uses. */
const LEVEL_WORLDS = new Map(journeyStops("").stops.map((s) => [s.key, s]));

/** World paintings (1600×900), one per world on the road. */
const WORLD_IMAGES: Partial<Record<WorldId, string>> = {
  "hangul-village": "/assets/story/world-hangul-village.webp",
  "vocabulary-market": "/assets/story/world-vocabulary-market.webp",
  "conversation-cafe": "/assets/story/world-conversation-cafe.webp",
  "culture-street": "/assets/story/world-culture-street.webp",
  "seoul-journey": "/assets/story/world-seoul-journey.webp",
};

/** The ladder only — the two special tracks are not stops on the road. */
const STAGES = COURSE_CARDS.filter((c) => (LEVEL_KEYS as string[]).includes(c.key));

/** Split the courseCards eyebrow ("24 classes · 6 months") into chips. */
const chipsFrom = (eyebrow: string): string[] =>
  eyebrow.split("·").map((s) => s.trim()).filter(Boolean);

const chipIcons = [CalendarDays, Clock];

type View = { w: number; h: number };
type Pt = { x: number; y: number };

const LearningRoadmap = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [activeStep, setActiveStep] = useState(0);
  // Starts true on purpose - see the 2026-09-23 (a) note above.
  const [visible, setVisible] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const wideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = [mapRef.current, wideRef.current].filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const active = STAGES[activeStep] ?? STAGES[0];
  const activeMeta = getMeta(active.key);
  const activeChips = chipsFrom(isAr ? active.eyebrow_ar : active.eyebrow_en);
  const activeWorld = LEVEL_WORLDS.get(active.key);
  const activeWorldImg = activeWorld ? WORLD_IMAGES[activeWorld.world] : undefined;

  /** Scene units -> a physical percentage. `flip` mirrors x for the wide map in Arabic. */
  const place = (view: View, p: Pt, flip: boolean) => ({
    left: `${(((flip ? view.w - p.x : p.x) / view.w) * 100)}%`,
    top: `${(p.y / view.h) * 100}%`,
  });

  /** The summit banner and one node per stop, positioned in `view`'s units. */
  const renderStops = (stops: Pt[], summit: Pt, view: View, flip: boolean) => (
    <>
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
        style={{ ...place(view, summit, flip), transitionDelay: "560ms" }}
      >
        <span className="flex flex-col items-center gap-0.5 whitespace-nowrap rounded-2xl bg-charcoal px-3 py-2 text-center text-[11px] font-bold leading-tight text-ivory shadow-md">
          <KloverIcon name="game-crown" className="h-5 w-5" />
          <span>{isAr ? "المستوى ٦" : "Level 6"}</span>
          <span className="font-medium text-ivory/70">{isAr ? "وما بعده" : "and beyond"}</span>
        </span>
      </div>

      {STAGES.map((stage, i) => {
        const stop = stops[i];
        if (!stop) return null;
        const meta = getMeta(stage.key);
        const isActive = i === activeStep;
        const isStart = i === 0;
        const label = isAr ? stage.title_ar : stage.title_en;

        return (
          <button
            key={stage.key}
            type="button"
            onClick={() => setActiveStep(i)}
            aria-pressed={isActive}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klovers-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            style={{ ...place(view, stop, flip), transitionDelay: `${i * 80}ms` }}
          >
            {isStart && (
              <span aria-hidden="true" className="absolute -inset-1.5 animate-pulse rounded-full bg-klovers-yellow/35" />
            )}
            <span
              className={`relative grid h-11 w-11 place-items-center rounded-full ring-4 ring-card transition-transform duration-300 sm:h-14 sm:w-14 ${meta.tile} ${
                isActive ? "scale-110 shadow-md" : "shadow-sm"
              }`}
            >
              <KloverIcon name={meta.icon} className="h-7 w-7 sm:h-9 sm:w-9" />
            </span>
            <span
              className={`absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur-[2px] transition-colors sm:text-xs ${
                isActive ? "bg-charcoal text-ivory" : "bg-card/85 text-foreground"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </>
  );

  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[30rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-klovers-yellow/20 blur-3xl lg:block"
      />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto grid max-w-5xl gap-8">

          <div className="mx-auto w-full max-w-[26rem] text-start lg:max-w-none lg:text-center">
            <span className="inline-block rounded-md bg-charcoal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ivory">
              {isAr ? "٧ محطات · من الهانغول للمستوى ٦" : "7 stops · Hangul → Level 6"}
            </span>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
              {t("roadmap", "title")}
            </h2>

            <svg
              aria-hidden="true"
              viewBox="0 0 240 18"
              fill="none"
              className="mb-3 mt-2 h-4 w-48 text-klovers-yellow lg:mx-auto"
            >
              <path d="M7 12C60 4 134 3 197 8c14 1 27 3 36 2" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            </svg>

            <p className="text-base text-muted-foreground md:text-lg">
              {t("roadmap", "subtitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground/80">
              {isAr ? "الضغط على أي محطة يعرض تفاصيلها" : "Tap any stop on the path for its details"}
            </p>
          </div>

          <div className="mx-auto w-full max-w-[26rem] overflow-hidden rounded-3xl border-2 border-charcoal bg-card lg:max-w-none dark:border-border">
            <div
              ref={mapRef}
              className="relative w-full lg:hidden"
              style={{ aspectRatio: `${JOURNEY_VIEW.w} / ${JOURNEY_VIEW.h}` }}
            >
              <JourneyScene />
              {renderStops(JOURNEY_STOPS, JOURNEY_SUMMIT, JOURNEY_VIEW, false)}
            </div>

            <div
              ref={wideRef}
              className="relative hidden w-full lg:block"
              style={{ aspectRatio: `${JOURNEY_WIDE_VIEW.w} / ${JOURNEY_WIDE_VIEW.h}` }}
            >
              <JourneySceneWide flip={isAr} />
              {renderStops(JOURNEY_WIDE_STOPS, JOURNEY_WIDE_SUMMIT, JOURNEY_WIDE_VIEW, isAr)}
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-[26rem] gap-6 lg:max-w-none lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${activeMeta.tile}`}>
                  <KloverIcon name={activeMeta.icon} className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold leading-tight text-foreground sm:text-lg">
                    {isAr ? active.title_ar : active.title_en}
                  </h3>
                  {activeWorld && (
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {worldLabel(activeWorld, isAr ? "ar" : "en")}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeChips.map((chip, i) => {
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

                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {isAr ? active.blurb_ar : active.blurb_en}
                  </p>

                  {activeWorld && activeWorldImg && (
                    <img
                      key={activeWorldImg}
                      src={activeWorldImg}
                      alt={
                        isAr
                          ? `رسمة ${WORLD_NAMES[activeWorld.world].ar} من عالم كلوفرز`
                          : `${WORLD_NAMES[activeWorld.world].en}, a painted scene from the Klovers world`
                      }
                      width={1600}
                      height={900}
                      loading="lazy"
                      decoding="async"
                      className="mt-3 h-20 w-36 max-w-full rounded-xl object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button size="lg" asChild className="h-12 gap-2 rounded-full px-8 text-base font-bold">
                <Link to="/placement-test">
                  {t("roadmap", "cta")}
                  <ArrowRight className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} />
                </Link>
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">{t("roadmap", "ctaSub")}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LearningRoadmap;
