import { useState } from "react";
import {
  JOURNEY_COUNTRIES,
  JOURNEY_MAP_BG,
  JOURNEY_MAP_H,
  JOURNEY_MAP_W,
  type JourneyCountry,
} from "./arabicJourneyMapData";

/**
 * maktub's Arabic journey (Re, 18 Nov 2026): "adam and lina and cluby must
 * travel to maktub to study arabic ... user must have a map of the arabic
 * spoken countries, he wanna see the 3 characters in their traditional
 * clothes".
 *
 * Canon: languageJourney.arabic + wardrobeRule.clubyException in
 * src/config/klovers-world.ts. A marketing tease only: nothing here claims
 * or changes a learner's progress.
 *
 * Pick a country on the map (or from the list under it, which is also the
 * keyboard/screen-reader path and the only easy way to hit Bahrain or
 * Comoros on a phone) and the photo shows the trio there in that country's
 * traditional dress, with its dialect and how people say hello.
 * Pictures: /assets/maktub/journey/<key>.webp, made with the travel-scene
 * mode of /admin/ai-room-lab.
 */

const FOREST = "#0b2d1f";
const FOREST_DEEP = "#061b17";
const SAND = "#eadfcb";
const LIME = "#39FF14";
const KLOVERS_YELLOW = "#FFFF00";

type TrFn = (en: string, ar: string) => string;

const ArabicJourneyMap = ({ isAr, tr }: { isAr: boolean; tr: TrFn }) => {
  const [selected, setSelected] = useState<string>("egypt");
  const [hover, setHover] = useState<string | null>(null);
  const current: JourneyCountry =
    JOURNEY_COUNTRIES.find((c) => c.key === selected) ?? JOURNEY_COUNTRIES[0];

  const fillFor = (key: string) =>
    key === selected ? KLOVERS_YELLOW : key === hover ? LIME : SAND;

  return (
    <section id="journey" className="py-20 border-b text-white scroll-mt-24" style={{ backgroundColor: FOREST }}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: LIME }}>
            {tr("The Arabic journey", "الرحلة العربية")}
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold" style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
            {tr("Travel the Arabic world with Adam, Lina and Cluby", "سافر في العالم العربي مع آدم ولينا وكلوبي")}
          </h2>
          <p className="mt-3 text-white/75 leading-relaxed">
            {tr(
              "Arabic is spoken in 22 countries. Pick one on the map and see where the three of them are, dressed the way people dress there, and how they say hello.",
              "العربية تُتحدَّث في ٢٢ دولة. اختر دولة على الخريطة وشاهد أين هم الثلاثة، بالزي التقليدي لأهلها، وكيف يلقون التحية هناك.",
            )}
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_1fr] items-start">
          {/* Map */}
          <div className="rounded-3xl p-3 md:p-4" style={{ backgroundColor: FOREST_DEEP }}>
            <svg
              viewBox={`0 0 ${JOURNEY_MAP_W} ${JOURNEY_MAP_H}`}
              className="w-full h-auto"
              role="group"
              aria-label={tr("Map of the Arabic-speaking countries", "خريطة الدول الناطقة بالعربية")}
            >
              <path d={JOURNEY_MAP_BG} fill="#16402f" stroke={FOREST_DEEP} strokeWidth={0.6} />
              {JOURNEY_COUNTRIES.map((c) => (
                <path
                  key={c.key}
                  d={c.d}
                  fill={fillFor(c.key)}
                  stroke={FOREST_DEEP}
                  strokeWidth={0.8}
                  className="cursor-pointer transition-colors duration-150"
                  onClick={() => setSelected(c.key)}
                  onMouseEnter={() => setHover(c.key)}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>{isAr ? c.ar : c.en}</title>
                </path>
              ))}
              {/* Small countries get a pin so they can be clicked at all. */}
              {JOURNEY_COUNTRIES.filter((c) => c.small).map((c) => (
                <circle
                  key={`pin-${c.key}`}
                  cx={c.cx}
                  cy={c.cy}
                  r={c.key === selected ? 9 : 7}
                  fill={fillFor(c.key) === SAND ? LIME : fillFor(c.key)}
                  stroke={FOREST_DEEP}
                  strokeWidth={2}
                  className="cursor-pointer"
                  onClick={() => setSelected(c.key)}
                  onMouseEnter={() => setHover(c.key)}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>{isAr ? c.ar : c.en}</title>
                </circle>
              ))}
              {/* Small dot at the centre of the yellow country: where the trio is now. */}
              <circle cx={current.cx} cy={current.cy} r={4} fill={FOREST_DEEP} pointerEvents="none" />
            </svg>

            <div className="mt-4 flex flex-wrap gap-2" role="list">
              {JOURNEY_COUNTRIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="listitem"
                  aria-pressed={c.key === selected}
                  onClick={() => setSelected(c.key)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={
                    c.key === selected
                      ? { backgroundColor: KLOVERS_YELLOW, color: "#1A1A1A" }
                      : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }
                  }
                >
                  {isAr ? c.ar : c.en}
                </button>
              ))}
            </div>
          </div>

          {/* The trio in the chosen country */}
          <div className="overflow-hidden rounded-3xl bg-white text-[#1A1A1A] shadow-xl" aria-live="polite">
            <div className="relative aspect-[3/2] bg-[#eadfcb]">
              <img
                key={current.key}
                src={`/assets/maktub/journey/${current.key}.webp`}
                alt={tr(
                  `Adam, Lina and Cluby in ${current.en} (${current.placeEn}), in traditional dress`,
                  `آدم ولينا وكلوبي في ${current.ar} (${current.placeAr}) بالزي التقليدي`,
                )}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-6">
              <p className="text-sm text-[#1A1A1A]/60">{isAr ? current.placeAr : current.placeEn}</p>
              <h3 className="mt-1 text-2xl font-bold" style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
                {isAr ? current.ar : current.en}
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[#1A1A1A]/60">{tr("Dialect", "اللهجة")}</dt>
                  <dd className="mt-1 font-semibold">{isAr ? current.dialectAr : current.dialectEn}</dd>
                </div>
                <div>
                  <dt className="text-[#1A1A1A]/60">{tr("Saying hello", "التحية")}</dt>
                  <dd className="mt-1 font-semibold">
                    <span dir="rtl" style={{ fontFamily: "Cairo, system-ui, sans-serif" }}>{current.greetAr}</span>
                    {!isAr && <span className="block text-[#1A1A1A]/60 font-normal">{current.greetEn}</span>}
                  </dd>
                </div>
              </dl>
              <a
                href="#trial-booking"
                className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
                style={{ backgroundColor: LIME, color: "#1A1A1A" }}
              >
                {tr("Start your own Arabic journey", "ابدأ رحلتك مع العربية")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArabicJourneyMap;
