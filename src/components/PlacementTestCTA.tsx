import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EXAM_MAX } from "@/constants/topikPapers";
import { toArabicDigits } from "@/lib/trustFigures";

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
 *
 * 24 Sep 2026: the 3D Cluby, holding a gold star, perches on the end-side top
 * corner of the test card. The "instant" badge moved to the start-side corner
 * so the two do not sit on top of each other.
 */
const PlacementTestCTA = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [animate, setAnimate] = useState(false);
  const [activeLevel, setActiveLevel] = useState(0);

  const LEVELS = [
    // 25 Sep 2026 (QA): Klovers levels, the ones /placement-test measures
    // (Hangul to Level 4). The card showed CEFR A1-C2, which the test does not.
    { label: isAr ? "تأسيس الهانغول" : "Hangul Foundation", color: "bg-klovers-yellow/35", width: "w-[20%]" },
    { label: isAr ? "المستوى ١" : "Level 1", color: "bg-klovers-yellow/55", width: "w-[40%]" },
    { label: isAr ? "المستوى ٢" : "Level 2", color: "bg-klovers-yellow/75", width: "w-[60%]" },
    { label: isAr ? "المستوى ٣" : "Level 3", color: "bg-klovers-yellow", width: "w-[80%]" },
    { label: isAr ? "المستوى ٤" : "Level 4", color: "bg-foreground", width: "w-[100%]" },
  ];

  const FEATURES = [
    { icon: "game-checklist-pencil" as KloverIconName, label: isAr ? "أسئلة بأسلوب الامتحانات" : "Real exam-style questions" },
    { icon: "calendar-check" as KloverIconName, label: isAr ? "إنهاء الاختبار في أي وقت" : "Finish when you like" },
    { icon: "growth-chart" as KloverIconName, label: isAr ? "حسب مستويات كلوفرز" : "Matched to our levels" },
    { icon: "lightbulb-sprout" as KloverIconName, label: t("placementCta.featureInstant") },
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
      {/* Background glow.
          Two radial-gradients, not two `blur-3xl` discs. A 64px blur over a
          24rem layer makes the compositor rasterise a blur pass every time
          this section repaints, and this section repaints for two seconds
          (the bar animation below) - the most expensive thing on the page on
          a low-end Android, which is a real device for this audience. This
          paints the same soft falloff directly, no filter. Same technique as
          WhyLearnKorean.tsx and CommunityBand.tsx. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundImage: "radial-gradient(circle, hsl(var(--klovers-yellow) / 0.40), transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[20rem] w-[20rem] translate-x-1/3 translate-y-1/3 rounded-full"
        style={{ backgroundImage: "radial-gradient(circle, hsl(var(--klovers-yellow) / 0.15), transparent 70%)" }}
      />

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
              <KloverIcon name="badge-blossom" className="h-5 w-5" />
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
                ? "اختبار قراءة مجاني يحدّد المستوى من الهانغول حتى المستوى الرابع، ويوضّح نقطة البداية المناسبة. الإجابة عمّا هو معروف، والتوقف عندما تصبح الأسئلة أصعب."
                : "A free reading test that places you from Hangul to Level 4 and tells you where to start with us. Answer what you can, and stop when the questions get ahead of you."}
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-muted/60 rounded-xl px-3 py-2.5 text-sm text-foreground font-medium">
                  <KloverIcon name={icon} className="h-7 w-7" />
                  {label}
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/placement-test")}
              className="text-base px-8 gap-2 h-12 rounded-full shadow-lg shadow-charcoal/20 hover:shadow-charcoal/30 transition-shadow"
            >
              {t("placementCta.cta")}
            </Button>

            <p className="text-xs text-muted-foreground">
              {t("placementCta.note")}
            </p>
          </div>

          {/* ── Right: Animated Level Card (decorative) ── */}
          {/* Top padding leaves room for Cluby above the card when stacked. */}
          <div className="flex justify-center pt-24 md:pt-20">
            <div className="relative w-full max-w-sm">
              {/* 3D Cluby with a gold star, perched on the card's top corner. */}
              <img
                src="/assets/cluby/cluby-star.webp"
                alt={isAr ? "كلوبي يمسك نجمة ذهبية" : "Cluby holding a gold star"}
                width={333}
                height={440}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="pointer-events-none absolute bottom-full -end-2 z-20 h-auto w-24 translate-y-4 select-none drop-shadow-[0_12px_16px_rgba(46,46,46,0.35)] sm:w-28"
              />

              <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-charcoal px-5 py-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center">
                    <KloverIcon name="game-checklist-pencil" className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{isAr ? "اختبار تحديد المستوى" : "Korean Placement Test"}</p>
                    <p className="text-white/70 text-xs">{isAr ? "كلوفرز" : "Klovers"}</p>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                  {LEVELS.map((lvl, idx) => (
                    <div key={lvl.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${idx === activeLevel ? "text-foreground" : "text-muted-foreground"}`}>
                          {lvl.label}
                        </span>
                        {idx === activeLevel && idx < LEVELS.length - 1 && (
                          <span className="text-[10px] bg-klovers-yellow text-charcoal px-2 py-0.5 rounded-full font-medium animate-pulse border border-charcoal/10">
                            {t("placementCta.detecting")}
                          </span>
                        )}
                        {idx < activeLevel && (
                          <span className="h-2 w-2 rounded-full bg-klovers-green" aria-hidden="true" />
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
                  {/* Read from the bank, not typed. topikPapers.ts throws at
                      import if EXAM_MAX stops being 52, so this line and the
                      real test can never disagree. */}
                  <span className="text-xs text-muted-foreground">{isAr ? `${toArabicDigits(EXAM_MAX)} سؤالًا · الإنهاء متاح في أي وقت` : `${EXAM_MAX} questions · finish early any time`}</span>
                  <span className="text-xs font-bold text-foreground">{t("placementCta.free")}</span>
                </div>
              </div>

              <div className="absolute -top-3 -start-3 bg-klovers-yellow text-charcoal text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
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
