import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ERAS } from "@/constants/eras";

/**
 * "A journey through Korea's time" — the two blocks from the Klovers concept
 * board: five eras over a timeline, then five places.
 *
 * Palette only: Green (soft and strong), Klovers Yellow, Charcoal, Ivory.
 * The photographs are files already in public/assets/blog, so this adds no
 * new assets; swap any `image` path for a better shot and nothing else has
 * to change.
 *
 * Each era card links to its own page at /journey/:eraId (EraPage.tsx). The
 * era data, including the photographs, lives in src/constants/eras.ts and is
 * shared with that page. The section used to hold plain blocks because no
 * per-era page existed; a card dressed as a link with nowhere to go is the
 * exact fault WhyLearnKorean.tsx was rebuilt to remove, so keep every card
 * pointing at a real page.
 */

/** The five stops under the era cards. pale → pale Yellow → Yellow → Charcoal. */
const STOPS = [
  { dot: "bg-stone-200", topEn: "Origins", topAr: "الأصول", subEn: "Legend", subAr: "أسطورة" },
  { dot: "bg-amber-100", topEn: "Past", topAr: "الماضي", subEn: "Roots", subAr: "جذور" },
  { dot: "bg-amber-300", topEn: "Tradition", topAr: "التقليد", subEn: "Identity", subAr: "هوية" },
  { dot: "bg-klovers-yellow", topEn: "Modernity", topAr: "الحداثة", subEn: "Change", subAr: "تغيير" },
  { dot: "bg-foreground", topEn: "Your", topAr: "دورك", subEn: "Tomorrow", subAr: "غداً" },
];

const PLACES = [
  {
    image: "/assets/blog/korean-temple.jpg",
    nameEn: "Gyeongju",
    nameAr: "جيونجو",
    lineEn: "Ancient history",
    lineAr: "تاريخ عريق",
    altEn: "A temple in Gyeongju",
    altAr: "معبد في جيونجو",
  },
  {
    image: "/assets/blog/korean-hanok.jpg",
    nameEn: "Jeonju Hanok Village",
    nameAr: "قرية جونجو التقليدية",
    lineEn: "Traditional life",
    lineAr: "حياة تقليدية",
    altEn: "Hanok houses with tiled roofs",
    altAr: "بيوت هانوك بسقوف القرميد",
  },
  {
    image: "/assets/blog/gyeongbokgung.jpg",
    nameEn: "Seoul",
    nameAr: "سيول",
    lineEn: "Modern energy",
    lineAr: "طاقة متجددة",
    altEn: "Gyeongbokgung palace in Seoul",
    altAr: "قصر جيونغبوكغونغ في سيول",
  },
  {
    image: "/assets/blog/korean-haenyeo.jpg",
    nameEn: "Jeju Coast",
    nameAr: "ساحل جيجو",
    lineEn: "Diving traditions",
    lineAr: "تقاليد الغوص",
    altEn: "The Korean coast",
    altAr: "الساحل الكوري",
  },
  {
    image: "/assets/blog/jeju-island.jpg",
    nameEn: "Jeju",
    nameAr: "جيجو",
    lineEn: "Nature and freedom",
    lineAr: "طبيعة وحرية",
    altEn: "Jeju island landscape",
    altAr: "مناظر جزيرة جيجو",
  },
];

const KoreaTimeSection = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-block bg-klovers-yellow text-charcoal text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-charcoal/10 mb-4">
            {isAr ? "رحلة عبر الزمن" : "A journey through Korea's time"}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            {isAr ? "تعلّم اللغة. اكتشف التاريخ. عِش القصة." : "Learn the language. Explore the history. Live the story."}
          </h2>
          <p className="text-muted-foreground mt-3 text-base md:text-lg leading-relaxed">
            {isAr
              ? "كل كلمة بتتعلمها جاية من مكان وزمن حقيقيين."
              : "Every word you learn comes from a real place and a real time."}
          </p>
        </div>

        {/* ── Five eras ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {ERAS.map((era, i) => (
            <Link
              key={era.id}
              to={`/journey/${era.id}`}
              className={`group rounded-2xl overflow-hidden bg-card border border-border shadow-[0_14px_36px_-28px_rgba(46,46,46,0.8)] transition-colors hover:border-foreground/40 ${
                i === 0 ? "col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {era.image ? (
                  <img
                    src={era.image}
                    alt={isAr ? era.altAr : era.altEn}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={isAr ? era.altAr : era.altEn}
                    className="h-full w-full bg-foreground text-background flex items-center justify-center"
                  >
                    <span lang="ko" className="font-display text-3xl font-extrabold">
                      {era.glyph}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display font-bold text-foreground text-sm md:text-base leading-tight">
                  {isAr ? era.titleAr : era.titleEn}
                </h3>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
                  {isAr ? era.datesAr : era.datesEn}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">
                  {isAr ? era.lineAr : era.lineEn}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                  {isAr ? "استكشف" : "Explore"}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── The timeline under them ───────────────────────────── */}
        <div className="relative max-w-6xl mx-auto mt-10 px-2">
          <div aria-hidden="true" className="absolute inset-x-8 top-[7px] border-t-2 border-dashed border-foreground/20" />
          <div className="relative grid grid-cols-5 gap-2">
            {STOPS.map((stop) => (
              <div key={stop.topEn} className="flex flex-col items-center text-center gap-1.5">
                <span className={`h-4 w-4 rounded-full ring-4 ring-background ${stop.dot}`} />
                <span className="text-xs md:text-sm font-bold text-foreground leading-none">
                  {isAr ? stop.topAr : stop.topEn}
                </span>
                <span className="text-[11px] md:text-xs text-muted-foreground leading-none">
                  {isAr ? stop.subAr : stop.subEn}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Five places ─────────────────────────────────── */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <h3 className="font-display text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
              {isAr ? "ورحلتك عبر مدنها" : "And your journey through its places"}
            </h3>
            <p className="cluby-note-lg text-foreground/70" lang={isAr ? "ar" : "en"}>
              {isAr ? "أماكن مختلفة، ونفس الشخص الرائع" : "Different places, same amazing you"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {PLACES.map((place) => (
              <div key={place.nameEn} className="rounded-2xl overflow-hidden bg-card border border-border">
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={place.image}
                    alt={isAr ? place.altAr : place.altEn}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-display font-bold text-foreground text-xs md:text-sm leading-tight">
                    {isAr ? place.nameAr : place.nameEn}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isAr ? place.lineAr : place.lineEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors hover:decoration-foreground/60"
            >
              {isAr ? "اقرأ عن تاريخ كوريا وثقافتها" : "Read more about Korea's history and culture"}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KoreaTimeSection;
