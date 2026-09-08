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
 * COLOUR (Re chose this on 2026-09-08 from a side-by-side)
 * --------------------------------------------------------
 * Hanbok pastels - 담청 pale blue, 옥색 jade, 연분홍 soft pink, 연자주 soft
 * plum. The first pass used Tailwind's -900 steps, which are desaturated and
 * near-identical in value; the second used deep dancheong temple colours.
 * Re looked at both and picked the pastels, with the Korean word in black.
 *
 * THE TEXT HAD TO FOLLOW THE BACKGROUND. On a pastel face, white text is
 * about 1.4:1 - unreadable - so the title and the Korean watermark are both
 * dark ink. Measured: ink on these grounds is 10.1:1 at the darkest point of
 * every gradient, against a 4.5:1 requirement.
 *
 * THE YELLOW CHIP KEEPS THE BRAND, but its fill is only ~1.2:1 against a
 * pastel, so its edge is a solid dark ring rather than a 25% wash. The icon
 * inside is black on yellow at 19.6:1, which is why the chip still reads
 * instantly - it is the border, not the fill, doing the separating.
 *
 * Gradients are INLINE STYLES, not Tailwind classes, on purpose. Tailwind's
 * JIT only emits classes it can see as complete literal strings in source;
 * an arbitrary value assembled at runtime (from-[${hex}]) is not seen and is
 * purged from the production build, so it works locally and ships unstyled.
 * Inline styles cannot be purged.
 *
 * THE BACK stays theme-aware, so it cannot wear the pastel: a pale panel on
 * a dark page is a white blob. It uses the saturated ancestor of its front
 * instead - as a rule along the top edge and as the icon colour - so the two
 * faces still read as one card in both themes. It is not the brand yellow,
 * because in light mode that face is white and yellow-on-white is the P0-3
 * fault this plan already has open.
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

type Tone = { from: string; to: string; deep: string; accent: string };

/**
 * `from`/`to` paint the pastel front.
 *
 * The back face is theme-aware, so it needs two different values from the
 * same hue: `deep` for the rule along its top edge - decorative, so its
 * contrast does not have to carry meaning - and `accent`, a mid-tone, for
 * the icon. `deep` on a dark background is only about 2:1, which is why the
 * icon does not use it.
 */
const tones: Record<string, Tone> = {
  // 담청 pale blue
  study: { from: "#D6E4F5", to: "#AFC9E9", deep: "#0A4DA6", accent: "#2C74C9" },
  // 옥색 jade
  career: { from: "#C9E8E0", to: "#A3D4C8", deep: "#0B6E52", accent: "#0E8F6F" },
  // 연분홍 soft pink
  travel: { from: "#FADCE0", to: "#F2BFC6", deep: "#B3122E", accent: "#CE3350" },
  // 연자주 soft plum
  culture: { from: "#E9D8ED", to: "#D6BCDD", deep: "#7B1E6A", accent: "#A63D96" },
};

/** Dark ink for everything on a pastel face. Not a theme token: the card is
 *  a light object in both themes, so its text must not follow the theme. */
const INK = "#131A24";

const fallbackTone: Tone = { from: "#E2E8F0", to: "#CBD5E1", deep: "#334155", accent: "#64748B" };

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
                          "radial-gradient(120% 80% at 50% -8%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 62%)",
                      }}
                    />
                    <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <span
                        aria-hidden="true"
                        className="text-4xl md:text-5xl font-extrabold leading-none select-none"
                        style={{ color: INK, opacity: 0.22 }}
                      >
                        {koreanWord[item.icon] || "한국"}
                      </span>
                      <div
                        className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-sm"
                        style={{ border: `2px solid ${INK}` }}
                      >
                        <span className="text-black">
                          {iconMap[item.icon] || <BookOpen className="h-8 w-8" />}
                        </span>
                      </div>
                      <h3 className="font-bold text-base md:text-lg leading-tight" style={{ color: INK }}>
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
                      style={{ backgroundColor: tone.deep }}
                    />
                    <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-5">
                      {/* Mid-tone, not `deep`: this face is white in light
                          mode and near-black in dark, and only the mid-tone
                          clears 3:1 on both. Never the brand yellow. */}
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
