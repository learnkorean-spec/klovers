import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { COURSE_CARDS, COURSE_SECTION_COPY } from "@/constants/courseCards";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

/**
 * The public "choose your level" grid.
 *
 * What this section is for: the copy comes from `@/constants/courseCards`,
 * which derives the level number, class count, TOPIK band and CEFR band from
 * `@/constants/levels`. It used to come from `translations.courses.items` — a
 * hand-written array that had drifted, which is how the site came to say
 * "Level 2 — TOPIK 2 / A2". A level prepares a student toward a TOPIK band; it
 * does not equal one. Nine cards (seven levels, two special tracks).
 *
 * Every card is bookable: each level links to /enroll-now?level=<key>, which
 * EnrollNowPage reads and preselects. Reading & Speaking is arranged by
 * conversation, so it opens WhatsApp instead.
 *
 * Below the grid: the caveat about study between classes, then the two exits
 * for someone who did not find their answer in a card — the placement test /
 * free trial, and WhatsApp.
 */

/**
 * The dot beside each card title.
 *
 * These are the site's own colours — the neon yellow `hsl(60 100% 50%)` from
 * index.css, plus black and grey — and nothing else. The previous palette
 * (green, blue, orange, red, purple, and three more I added) belonged to no
 * design system on this site.
 *
 * The ladder: ivory at Hangul, Klovers yellow for Levels 1-3, charcoal
 * darkening through Levels 4-6. The two special tracks are grey because they
 * sit outside that ladder. 27 Sep 2026 (brand guard): the three hand-mixed
 * pale yellows (hsl 60 100% 85/75/62%) were outside the palette and are gone.
 *
 * Written as literal class strings — Tailwind's scanner only sees classes that
 * appear verbatim in the source, so these must never be built by concatenation.
 */
const CARD_ACCENT: Record<string, string> = {
  hangul: "bg-ivory",
  l1: "bg-primary",
  l2: "bg-primary",
  l3: "bg-primary",
  l4: "bg-foreground/50",
  l5: "bg-foreground/75",
  l6: "bg-foreground",
  reading_speaking: "bg-foreground/35",
  topik_prep: "bg-foreground/60",
};

/**
 * The painted story world at the top of each card (story canon,
 * /assets/story/world-*.webp, 1600x900). Hangul -> the Hangul village,
 * first words -> the vocabulary market, everyday talk -> the conversation
 * café, culture -> culture street, Levels 4-6 -> the Seoul journey, anything
 * else (TOPIK prep) -> the memory garden.
 */
type CourseWorld = { src: string; en: string; ar: string };
const W = {
  village: { src: "/assets/story/world-hangul-village.webp", en: "Painted hanok village where Hangul begins", ar: "قرية هانوك مرسومة حيث تبدأ الهانغول" },
  market: { src: "/assets/story/world-vocabulary-market.webp", en: "Painted Korean market full of first words", ar: "سوق كوري مرسوم مليء بالكلمات الأولى" },
  cafe: { src: "/assets/story/world-conversation-cafe.webp", en: "Painted Korean café for everyday conversation", ar: "مقهى كوري مرسوم للمحادثة اليومية" },
  street: { src: "/assets/story/world-culture-street.webp", en: "Painted Seoul street of Korean culture", ar: "شارع مرسوم في سيول للثقافة الكورية" },
  garden: { src: "/assets/story/world-memory-garden.webp", en: "Painted memory garden for review", ar: "حديقة الذاكرة المرسومة للمراجعة" },
  seoul: { src: "/assets/story/world-seoul-journey.webp", en: "Painted journey to the Seoul skyline", ar: "رحلة مرسومة نحو أفق سيول" },
} satisfies Record<string, CourseWorld>;

const COURSE_WORLD: Record<string, CourseWorld> = {
  // Unknown keys fall back to the memory garden (see below).
  hangul: W.village,
  l1: W.market,
  l2: W.cafe,
  l3: W.street,
  l4: W.seoul,
  l5: W.seoul,
  l6: W.seoul,
  reading_speaking: W.cafe,
  topik_prep: W.garden,
};

const CoursesSection = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const c = COURSE_SECTION_COPY;

  const openWhatsApp = () =>
    trackAndOpenWhatsApp(
      `${WHATSAPP_BASE}?text=${encodeURIComponent(isAr ? c.waMessage_ar : c.waMessage_en)}`,
      { cta_label: "courses_section_whatsapp" }
    );

  return (
    <section id="courses" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            {isAr ? c.badge_ar : c.badge_en}
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            {isAr ? c.title_ar : c.title_en}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isAr ? c.subtitle_ar : c.subtitle_en}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSE_CARDS.map((course) => {
            const features = isAr ? course.features_ar : course.features_en;
            const label = isAr ? course.cta_ar : course.cta_en;
            const arrow = <ArrowRight className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />;
            const world = COURSE_WORLD[course.key] ?? W.garden;

            return (
              <Card
                key={course.key}
                className="group flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden border-border hover:border-primary/50"
              >
                <div className="relative h-32 overflow-hidden bg-muted sm:h-36">
                  <img
                    src={world.src}
                    alt={isAr ? world.ar : world.en}
                    width={1600}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-foreground/25 ${
                        CARD_ACCENT[course.key] ?? "bg-primary"
                      }`}
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      {isAr ? course.eyebrow_ar : course.eyebrow_en}
                    </span>
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {isAr ? course.title_ar : course.title_en}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? course.blurb_ar : course.blurb_en}
                  </p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-2 flex-1">
                    {features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Router <Link> cannot carry an absolute URL — WhatsApp needs a
                      plain anchor, and rel="noopener" with target="_blank". */}
                  <Button asChild className="w-full mt-5 gap-2 font-semibold">
                    {course.external ? (
                      <a href={course.href} target="_blank" rel="noopener noreferrer">
                        {label}
                        {arrow}
                      </a>
                    ) : (
                      <Link to={course.href}>
                        {label}
                        {arrow}
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* The caveat, once. It is what stops "24 classes · prepares you toward
            TOPIK 1" reading as "24 classes gets you TOPIK 1" — 24 classes is 24
            hours, and institutes budget roughly 200 hours a level. */}
        <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">
          {isAr ? c.note_ar : c.note_en}
        </p>

        {/* The two exits for anyone the cards did not answer. */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-3">
            {isAr ? c.unsure_ar : c.unsure_en}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/placement-test">{isAr ? c.placement_ar : c.placement_en}</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/free-trial">{isAr ? c.trial_ar : c.trial_en}</Link>
            </Button>
          </div>

          <div className="mt-8 pt-7 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              {isAr ? c.wa_ar : c.wa_en}
            </p>
            <button
              type="button"
              onClick={openWhatsApp}
              className="inline-flex items-center gap-2.5 rounded-xl bg-charcoal px-6 py-3 text-[15px] font-bold text-ivory transition-colors hover:bg-charcoal/90 dark:bg-klovers-yellow dark:text-charcoal dark:hover:bg-klovers-yellow/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <svg viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                <path d="M16 2C8.268 2 2 8.268 2 16c0 2.472.658 4.792 1.806 6.8L2 30l7.374-1.786A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.4a11.354 11.354 0 01-5.8-1.594l-.416-.248-4.37 1.058 1.094-4.256-.272-.436A11.362 11.362 0 014.6 16C4.6 9.706 9.706 4.6 16 4.6S27.4 9.706 27.4 16 22.294 27.4 16 27.4zm6.22-8.506c-.34-.17-2.014-.994-2.326-1.108-.312-.112-.54-.17-.768.17-.228.34-.882 1.108-1.08 1.338-.2.228-.398.256-.738.086-.34-.17-1.436-.53-2.734-1.686-1.01-.9-1.692-2.012-1.89-2.352-.198-.34-.022-.524.148-.694.152-.152.34-.396.51-.594.17-.198.226-.34.34-.566.112-.228.056-.426-.028-.596-.086-.17-.768-1.848-1.052-2.532-.278-.666-.56-.576-.768-.586l-.654-.012c-.228 0-.596.086-.908.424-.312.34-1.19 1.162-1.19 2.834s1.218 3.288 1.388 3.516c.17.228 2.396 3.658 5.806 5.13.812.35 1.446.56 1.94.716.814.258 1.556.222 2.142.134.654-.096 2.014-.822 2.298-1.616.284-.792.284-1.472.198-1.614-.084-.14-.312-.226-.652-.396z" />
              </svg>
              {isAr ? c.waCta_ar : c.waCta_en}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
