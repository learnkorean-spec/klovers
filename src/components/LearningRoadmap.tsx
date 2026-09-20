import { useState, useRef, useEffect } from "react";
import { BookOpen, MessageCircle, Zap, Star, Trophy, Flame, GraduationCap, ArrowRight, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { COURSE_CARDS } from "@/constants/courseCards";
import { LEVEL_KEYS } from "@/constants/levels";
import { JourneyScene, JOURNEY_STOPS, JOURNEY_VIEW, JOURNEY_SUMMIT } from "./roadmapScenery";

/**
 * The homepage "your journey" map.
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
 * 2026-09-20 (a) — it looks like a journey, not a stack of identical cards.
 * A rail runs down the side with one node per level, and the full-colour
 * emoji are gone.
 *
 * 2026-09-20 (b) — Re's mockup: the ladder now stands in a scene, the nodes
 * are round on a dashed rail, and the cards sit on a soft shadow.
 *
 * 2026-09-20 (c) — RE'S SECOND MOCKUP REPLACED THE LADDER ENTIRELY. It is a
 * map now: a road climbs from a hanok gate at the bottom-left to a summit
 * banner at the top, past Namsan tower and cherry trees, and each level is a
 * stop on it. Seven stops, one per level key, drawn in `roadmapScenery.tsx`
 * from the same coordinates this file places its nodes at.
 *
 * WHAT THE MOCKUP SHOWED AND THIS DOES NOT: A PADLOCK ON EVERY STOP. In the
 * mockup only "Start Hangeul" is lit and the other six are locked. On a page
 * whose job is to make a stranger book a free trial, six padlocks read as a
 * paywall — "you cannot have this" — and Klovers does not gate levels that
 * way. Re chose the open path: every stop shows its own icon, and locks are
 * for the signed-in student's real progress, not for a visitor. If that lands
 * later, lock from the student's level, never from zero.
 *
 * ALSO NOT COPIED: THE MOCKUP'S LEVEL NAMES. It reads "Beginner 1 / Beginner 2
 * / Intermediate / Advanced / TOPIK". The canonical names are Hangul
 * Foundation and Levels 1-6 (`constants/levels.ts`); "TOPIK" as a level name
 * is the exact equation — level = band — that the certificate and the old
 * roadmap were fixed to stop making. The summit banner says "toward TOPIK 6
 * and beyond", which is a destination, not a claim.
 *
 * THE MOCKUP'S HANDWRITTEN MARGIN NOTE ("Same Curiosity, Brighter Tomorrows")
 * IS NOT BUILT, for the same reason it was cut in (b): in English, set in
 * Caveat, it works. In Arabic there is no Caveat — the face carries no Arabic
 * glyphs — and the best available substitute, Aref Ruqaa, reads as a thin
 * formal serif rather than as a hand. Re saw it rendered and cut it. Do not
 * re-propose handwriting on this site until there is an Arabic face that
 * actually looks handwritten at 20px; the feature is only as good as its
 * weakest script, and Arabic is the majority script here.
 *
 * THE MAP IS PHONE-SHAPED ON PURPOSE. Its aspect ratio is fixed to the scene's
 * viewBox so the nodes stay on the road at every width, which means width and
 * height move together — a card wide enough for a desktop column would be
 * nearly a metre tall. It is capped at 26rem and centred instead, exactly as
 * the mockup is drawn.
 */

/**
 * Per-level ornament. Keyed by canonical level key, so adding a level cannot
 * shift the palette, and a renamed badge string cannot silently blank it.
 * Literal class strings, because Tailwind's scanner only keeps what it sees.
 *
 * The ramp is one colour getting stronger: pale yellow at Hangul up to full
 * Klovers Yellow at Level 4, and Level 6 - the end of the path - is full yellow
 * with a Charcoal ring, so it does not look like another step on it.
 * (Was Mint -> Neon green -> Yellow -> Pink; the brand is three colours.)
 */
const LEVEL_META: Record<string, { icon: React.ElementType; tile: string }> = {
  hangul: { icon: BookOpen, tile: "bg-amber-100" },
  l1: { icon: MessageCircle, tile: "bg-amber-200" },
  l2: { icon: Zap, tile: "bg-amber-300" },
  l3: { icon: Star, tile: "bg-amber-400" },
  l4: { icon: Flame, tile: "bg-klovers-yellow" },
  l5: { icon: Trophy, tile: "bg-klovers-yellow" },
  l6: { icon: GraduationCap, tile: "bg-klovers-yellow ring-2 ring-charcoal" },
};

const getMeta = (key: string) =>
  LEVEL_META[key] ?? { icon: Star, tile: "bg-amber-100" };

/** The ladder only — the two special tracks are not stops on the road. */
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

/** Scene units → a physical percentage. Physical, not logical: see the note on
 *  direction in `roadmapScenery.tsx`. */
const pctX = (x: number) => `${(x / JOURNEY_VIEW.w) * 100}%`;
const pctY = (y: number) => `${(y / JOURNEY_VIEW.h) * 100}%`;

const LearningRoadmap = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [activeStep, setActiveStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const active = STAGES[activeStep] ?? STAGES[0];
  const activeMeta = getMeta(active.key);
  const ActiveIcon = activeMeta.icon;
  const activeChips = chipsFrom(isAr ? active.eyebrow_ar : active.eyebrow_en);

  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28">
      {/* A wash of yellow behind the map. On a wide screen the journey used to
          float as one narrow card in a big empty field; the wash and the
          two-column layout below are what fill it. Decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 hidden h-[34rem] w-[34rem] -translate-y-1/2 rounded-full bg-klovers-yellow/25 blur-3xl lg:block"
      />

      <div className="container relative mx-auto px-4">
        {/* Mobile: heading, map, stop, button, in that order. Desktop: the words
            on the start side, the map on the other, spanning all three rows. */}
        <div className="mx-auto grid max-w-5xl items-center gap-x-16 gap-y-8 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto]">

          <div className="text-start lg:col-start-1 lg:row-start-1 lg:self-end">
            <span className="inline-block rounded-md bg-charcoal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ivory">
              {isAr ? "7 محطات · A1 ← C2" : "7 stops · A1 → C2"}
            </span>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
              {t("roadmap", "title")}
            </h2>

            {/* Yellow as a mark under the heading, never as the heading. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 240 18"
              fill="none"
              className="mb-3 mt-2 h-4 w-48 text-klovers-yellow"
            >
              <path d="M7 12C60 4 134 3 197 8c14 1 27 3 36 2" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            </svg>

            <p className="text-base text-muted-foreground md:text-lg">
              {t("roadmap", "subtitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground/80">
              {isAr ? "اضغط على أي محطة في الطريق لتفاصيلها" : "Tap any stop on the path for its details"}
            </p>
          </div>

          <div className="mx-auto w-full max-w-[26rem] overflow-hidden rounded-3xl border-2 border-charcoal bg-card lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:justify-self-center dark:border-border">
          {/* The map. Its aspect ratio is the scene's viewBox, so a node placed
              at a percentage of these two numbers lands on the road at every
              width. Do not change one without the other. */}
          <div
            ref={mapRef}
            className="relative mt-3 w-full"
            style={{ aspectRatio: `${JOURNEY_VIEW.w} / ${JOURNEY_VIEW.h}` }}
          >
            <JourneyScene />

            {/* Summit banner — a destination, not a level. */}
            <div
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
              style={{ left: pctX(JOURNEY_SUMMIT.x), top: pctY(JOURNEY_SUMMIT.y), transitionDelay: "560ms" }}
            >
              <span className="flex flex-col items-center gap-0.5 rounded-2xl bg-charcoal px-3 py-2 text-center text-[11px] font-bold leading-tight text-ivory shadow-md">
                <Star className="h-3.5 w-3.5 text-klovers-yellow" fill="currentColor" aria-hidden="true" />
                <span>{isAr ? "TOPIK ٦" : "TOPIK 6"}</span>
                <span className="font-medium text-ivory/70">{isAr ? "وما بعده" : "and beyond"}</span>
              </span>
            </div>

            {/* One node per stop */}
            {STAGES.map((stage, i) => {
              const stop = JOURNEY_STOPS[i];
              if (!stop) return null;
              const meta = getMeta(stage.key);
              const Icon = meta.icon;
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
                  style={{ left: pctX(stop.x), top: pctY(stop.y), transitionDelay: `${i * 80}ms` }}
                >
                  {/* The first stop carries a soft yellow halo — the mockup's
                      "start here", without the six padlocks. */}
                  {isStart && (
                    <span aria-hidden="true" className="absolute -inset-1.5 animate-pulse rounded-full bg-klovers-yellow/35" />
                  )}
                  <span
                    className={`relative grid h-11 w-11 place-items-center rounded-full ring-4 ring-card transition-transform duration-300 sm:h-14 sm:w-14 ${meta.tile} ${
                      isActive ? "scale-110 shadow-md" : "shadow-sm"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-charcoal sm:h-6 sm:w-6" aria-hidden="true" />
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
          </div>
          </div>

          {/* The open stop — its own card now, beside the map on desktop. */}
          <div className="w-full rounded-3xl border border-border bg-card lg:col-start-1 lg:row-start-2">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${activeMeta.tile}`}>
                <ActiveIcon className="h-5 w-5 text-charcoal" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold leading-tight text-foreground sm:text-lg">
                  {isAr ? active.title_ar : active.title_en}
                </h3>

                {/* Chips — the two facts a visitor actually weighs */}
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
              </div>
            </div>
          </div>
          </div>

          {/* CTA */}
          <div className="text-center lg:col-start-1 lg:row-start-3 lg:self-start lg:text-start">
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
    </section>
  );
};

export default LearningRoadmap;
