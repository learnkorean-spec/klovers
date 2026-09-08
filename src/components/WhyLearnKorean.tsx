import { useState } from "react";
import { BookOpen, Briefcase, Plane, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * P0-4 of claude/WEBSITE_UX_CRO_ACTION_PLAN_2026-09-07.md.
 *
 * These four cards used to be plain <div>s carrying hover:shadow-xl,
 * hover:-translate-y-1 and a border change - the complete vocabulary of a
 * link - with no href and no onClick. A visitor interested enough to click
 * got nothing. There is no Travel page to point them at, so the card itself
 * is the payoff: front is the motivation and its Korean word, back is the
 * explanation.
 *
 * COLOUR (revised 2026-09-08, Re asked for better colours)
 * -------------------------------------------------------
 * The first pass used Tailwind's sky-900 / emerald-900 / rose-900 /
 * violet-900 over slate-900. Those are desaturated and near-identical in
 * value, so four cards read as one grey-blue smear and the brand yellow sat
 * badly on them.
 *
 * These are drawn from dancheong (단청), the painted decoration on Korean
 * temple eaves and gates: vermillion, cobalt, malachite green and a deep
 * plum. High chroma, distinct hues, all dark enough that the yellow icon
 * bubble and white text sit at full contrast on every one of them.
 *
 * Gradients are INLINE STYLES, not Tailwind classes, on purpose. Tailwind's
 * JIT only emits classes it can see as complete literal strings in source;
 * an arbitrary value assembled at runtime (from-[${hex}]) is not seen and is
 * purged from the production build, so it works locally and ships unstyled.
 * Inline styles cannot be purged.
 *
 * ACCENT: the back face is theme-aware (light and dark), so its icon cannot
 * be the brand yellow - yellow on white is the P0-3 contrast problem, and
 * the first pass of this component shipped exactly that. The accents below
 * are mid-tone versions of each front, picked to stay legible on both a
 * white and a near-black background.
 */

const iconMap: Record<string, React.ReactNode> = {
  study: <BookOpen className="h-8 w-8" />,
  career: <Briefcase className="h-8 w-8" />,
  travel: <Plane className="h-8 w-8" />,
  culture: <Music className="h-8 w-8" />,
};

/** The word itself, in the language being sold. */
const koreanWord: Record<string, string> = {
  study: "학업",
  career: "경력",
  travel: "여행",
  culture: "문화",
};

type Tone = { from: string; to: string; accent: string };

const tones: Record<string, Tone> = {
  // 청 cobalt - the scholar's blue
  study: { from: "#0A4DA6", to: "#061E3D", accent: "#2C74C9" },
  // 녹 malachite - growth
  career: { from: "#0B6E52", to: "#04241C", accent: "#0E8F6F" },
  // 적 vermillion - the dancheong red
  travel: { from: "#B3122E", to: "#3A0812", accent: "#CE3350" },
  // plum - the arts
  culture: { from: "#7B1E6A", to: "#2B0A26", accent: "#A63D96" },
};

const fallbackTone: Tone = { from: "#334155", to: "#0F172A", accent: "#64748B" };

/** Optional photographs, keyed by icon. Empty until real images exist. */
const IMAGES: Record<string, string> = {};

const WhyLearnKorean = () => {
  const { tArray, t } = useLanguage();
  const items = tArray("whyLearn", "items") as { title: string; description: string; icon: string }[];

  // Touch devices have no hover, so the flip is also a real toggle. Keyboard
  // users get the same control for free by it being a <button>.
  const [flipped, setFlipped] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">

        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
            {t("whyLearn", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            {t("whyLearn", "subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-5xl mx-auto">
          {items.map((item, index) => {
            const isFlipped = flipped === index;
            const image = IMAGES[item.icon];
            const tone = tones[item.icon] || fallbackTone;

            return (
              <button
                key={index}
                type="button"
                aria-expanded={isFlipped}
                onClick={() => setFlipped(isFlipped ? null : index)}
                className="group relative h-56 md:h-72 w-full rounded-3xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card [perspective:1200px]"
              >
                <div
                  className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${
                    isFlipped ? "[transform:rotateY(180deg)]" : "md:group-hover:[transform:rotateY(180deg)]"
                  }`}
                >
                  {/* Front */}
                  <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-lg [backface-visibility:hidden]">
                    {image ? (
                      <img src={image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                    {/* Base gradient. Inline, not a Tailwind class - see header. */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `linear-gradient(150deg, ${tone.from} 0%, ${tone.to} 100%)`,
                        opacity: image ? 0.82 : 1,
                      }}
                    />
                    {/* A single soft highlight so the face reads as lit rather
                        than as a flat swatch. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)",
                      }}
                    />
                    <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <span
                        aria-hidden="true"
                        className="text-4xl md:text-5xl font-extrabold text-white/30 leading-none select-none"
                      >
                        {koreanWord[item.icon] || "한국"}
                      </span>
                      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center border border-black/25 shadow-sm">
                        <span className="text-black">
                          {iconMap[item.icon] || <BookOpen className="h-8 w-8" />}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base md:text-lg leading-tight drop-shadow-sm">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 rounded-3xl border border-border bg-background overflow-hidden shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {/* Colour rule, so the back still belongs to its card. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-1.5"
                      style={{ backgroundColor: tone.accent }}
                    />
                    <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-5">
                      {/* Accent, never the brand yellow: this face is white in
                          light mode, and yellow-on-white is the P0-3 problem. */}
                      <span aria-hidden="true" style={{ color: tone.accent }}>
                        {iconMap[item.icon] || <BookOpen className="h-8 w-8" />}
                      </span>
                      <h3 className="font-bold text-foreground text-sm md:text-base leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default WhyLearnKorean;
