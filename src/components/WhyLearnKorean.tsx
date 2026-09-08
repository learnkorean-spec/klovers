import { useState } from "react";
import { BookOpen, Briefcase, Plane, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { scenery } from "./whyLearnKoreanScenes";

/**
 * P0-4 of claude/WEBSITE_UX_CRO_ACTION_PLAN_2026-09-07.md.
 *
 * These four cards used to be plain <div>s carrying hover:shadow-xl,
 * hover:-translate-y-1 and a border change - the complete vocabulary of a
 * link - with no href and no onClick. A visitor interested enough to click
 * got nothing. There is no Travel page to point them at, so the card itself
 * is the payoff: front is a Korean scene, back is the explanation.
 *
 * HOW THE FRONT ARRIVED HERE (three passes, Re steering each one)
 * ---------------------------------------------------------------
 * 1. Tailwind's -900 steps. Desaturated and near-identical in value, so four
 *    motivations read as one grey-blue smear.
 * 2. Deep dancheong (단청) temple colours, then hanbok pastels with the
 *    Korean word in black, which Re picked from a side-by-side.
 * 3. Re then asked for pictures of Korea instead of a colour. So the front is
 *    now artwork: see whyLearnKoreanScenes.tsx for why these are drawn rather
 *    than photographed, and for the shape of a Korean roof.
 *
 * THE TEXT FOLLOWS THE BACKGROUND, EVERY TIME. That is the whole lesson of
 * those three passes. On the pastels, white text was 1.4:1 and everything had
 * to go dark. On artwork it inverts again: the scenes run from a bright spring
 * sky to a night sky, so no single text colour clears every card on its own.
 * Hence the scrim below - it is what makes white text safe on all four, not a
 * darkening effect for its own sake. Change a scene's brightness and you are
 * changing whether the title is readable; check it.
 *
 * THE BACK stays theme-aware, so it cannot wear the artwork or a pastel: a
 * pale panel on a dark page is a white blob. It takes its front's saturated
 * hue as a rule along the top edge, and a mid-tone of it as the icon colour.
 * Not the brand yellow - in light mode that face is white, and yellow on
 * white is the P0-3 fault this plan already has open. The first version of
 * this component shipped exactly that bug.
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

/**
 * Back-face colour only; the front's colour now comes from its scene.
 *
 * Two values from one hue, because the back renders on both a white and a
 * near-black ground: `deep` for the top rule, which is decorative and so its
 * contrast carries no meaning, and `accent` - a mid-tone - for the icon.
 * `deep` on a dark background is about 2:1, which is why the icon never uses it.
 */
type Tone = { deep: string; accent: string };

const tones: Record<string, Tone> = {
  study: { deep: "#0A4DA6", accent: "#2C74C9" },
  career: { deep: "#0B6E52", accent: "#0E8F6F" },
  travel: { deep: "#B3122E", accent: "#CE3350" },
  culture: { deep: "#7B1E6A", accent: "#A63D96" },
};

const fallbackTone: Tone = { deep: "#334155", accent: "#64748B" };

/**
 * Photographs, keyed by icon. Empty: there are none in this repo, and putting
 * images of unchecked provenance on the homepage is not a thing to do quietly.
 * Add one and it renders instead of that card's drawing - nothing else needs
 * to change, the scrim and the white text already assume a picture.
 */
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
                    ) : (
                      // `slice` so the scene fills the card at any aspect and
                      // is cropped rather than letterboxed; each is composed
                      // with its subject low and centred to survive that crop.
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 200 240"
                        preserveAspectRatio="xMidYMid slice"
                        className="absolute inset-0 h-full w-full"
                      >
                        {scenery[item.icon]}
                      </svg>
                    )}

                    {/* The scrim. Not decoration: it is the only reason white
                        text clears 4.5:1 on the bright spring card as well as
                        the night one. Heaviest at the bottom, where the title
                        sits over the busiest part of every scene. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(to bottom, rgba(8,10,20,0.12) 0%, rgba(8,10,20,0.34) 46%, rgba(8,10,20,0.62) 100%)",
                      }}
                    />

                    <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <span
                        aria-hidden="true"
                        className="text-4xl md:text-5xl font-extrabold leading-none select-none text-white/[0.28]"
                      >
                        {koreanWord[item.icon] || "한국"}
                      </span>
                      <div
                        className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-sm"
                        style={{ border: "2px solid rgba(0,0,0,0.55)" }}
                      >
                        <span className="text-black">
                          {iconMap[item.icon] || <BookOpen className="h-8 w-8" />}
                        </span>
                      </div>
                      <h3
                        className="font-bold text-white text-base md:text-lg leading-tight"
                        style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
                      >
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 rounded-3xl border border-border bg-background overflow-hidden shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-1.5"
                      style={{ backgroundColor: tone.deep }}
                    />
                    <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-5">
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
