import JourneyMap, { type JourneyPlace } from "@/components/journey/JourneyMap";
import { JOURNEY_COUNTRIES, JOURNEY_MAP_BG, JOURNEY_MAP_H, JOURNEY_MAP_W } from "./arabicJourneyMapData";

/**
 * maktub's Arabic journey (Re, 18 Nov 2026): the trio in the 22
 * Arabic-speaking countries, in each one's traditional dress. Same map
 * component as Klovers, Voca and Buda (src/components/journey/JourneyMap.tsx);
 * only the data and maktub's colours are local. Canon: languageJourney.arabic.
 */
const PLACES: JourneyPlace[] = JOURNEY_COUNTRIES.map((c) => ({
  key: c.key,
  en: c.en,
  ar: c.ar,
  placeEn: c.placeEn,
  placeAr: c.placeAr,
  d: c.d,
  cx: c.cx,
  cy: c.cy,
  small: c.small,
  facts: [
    { labelEn: "Dialect", labelAr: "اللهجة", valueEn: c.dialectEn, valueAr: c.dialectAr },
    { labelEn: "Saying hello", labelAr: "التحية", valueEn: c.greetEn, valueAr: c.greetEn, native: c.greetAr, nativeDir: "rtl" },
  ],
}));

const ArabicJourneyMap = ({ isAr, tr }: { isAr: boolean; tr: (en: string, ar: string) => string }) => (
  <JourneyMap
    isAr={isAr}
    tr={tr}
    theme={{
      bg: "#0b2d1f",
      panel: "#061b17",
      otherLand: "#16402f",
      land: "#eadfcb",
      hover: "#39FF14",
      selected: "#FFFF00",
      selectedText: "#1A1A1A",
      kicker: "#39FF14",
      cta: "#39FF14",
      ctaText: "#1A1A1A",
    }}
    width={JOURNEY_MAP_W}
    height={JOURNEY_MAP_H}
    otherLandPath={JOURNEY_MAP_BG}
    places={PLACES}
    imageDir="maktub/journey"
    kickerEn="The Arabic journey"
    kickerAr="الرحلة العربية"
    titleEn="Travel the Arabic world with Adam, Lina and Cluby"
    titleAr="سافر في العالم العربي مع آدم ولينا وكلوبي"
    introEn="Arabic is spoken in 22 countries. Pick one on the map and see where the three of them are, dressed the way people dress there, and how they say hello."
    introAr="العربية تُتحدَّث في ٢٢ دولة. اختر دولة على الخريطة وشاهد أين هم الثلاثة، بالزي التقليدي لأهلها، وكيف يلقون التحية هناك."
    ctaHref="#trial-booking"
    ctaEn="Start your own Arabic journey"
    ctaAr="ابدأ رحلتك مع العربية"
    mapLabelEn="Map of the Arabic-speaking countries"
    mapLabelAr="خريطة الدول الناطقة بالعربية"
  />
);

export default ArabicJourneyMap;
