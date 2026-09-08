import { useState } from "react";
import { BookOpen, Briefcase, Plane, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * P0-4 of claude/WEBSITE_UX_CRO_ACTION_PLAN_2026-09-07.md.
 *
 * WHAT WAS WRONG: these four cards were plain <div>s with no href and no
 * onClick, while carrying hover:border-primary/50, hover:shadow-xl and
 * hover:-translate-y-1 - lift, glow and border change, the complete
 * vocabulary of a link. A visitor motivated enough to click got nothing.
 * On a section whose whole job is to catch intent, a dead end is worse
 * than a plain paragraph.
 *
 * WHY NOT JUST LINK THEM: there is no Travel page on this site, and the
 * nearest existing pages (/learn-korean-kdramas, /interview-training,
 * /topik-exam-preparation) do not map onto Culture / Study / Career /
 * Travel without inventing content. Four links where one goes nowhere is
 * the same bug with more steps.
 *
 * SO THE CARD IS THE PAYOFF. Front: the motivation and its Korean word.
 * Back: the explanation that used to sit unread under the title. The
 * hover now does what the hover was already promising.
 *
 * IMAGES: `image` on a card renders as the front instead of the gradient.
 * Nothing in the repo supplies one yet, so every card falls back to the
 * designed front. Adding photographs later is filling in IMAGES below -
 * no change to this component.
 *
 * NO NEW TRANSLATION KEYS: front and back both come from the existing
 * whyLearn.items entries, so this ships without touching translations.ts.
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

/** Front-face gradients. Distinct per motivation, all brand-compatible. */
const frontTone: Record<string, string> = {
  study: "from-sky-900 to-slate-900",
  career: "from-emerald-900 to-slate-900",
  travel: "from-rose-900 to-slate-900",
  culture: "from-violet-900 to-slate-900",
};

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
                  <div className="absolute inset-0 rounded-3xl border border-border overflow-hidden [backface-visibility:hidden]">
                    {image ? (
                      <img src={image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${frontTone[item.icon] || "from-slate-800 to-slate-900"} ${
                        image ? "opacity-80" : ""
                      }`}
                    />
                    <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <span
                        aria-hidden="true"
                        className="text-4xl md:text-5xl font-extrabold text-white/25 leading-none select-none"
                      >
                        {koreanWord[item.icon] || "한국"}
                      </span>
                      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center border border-black/25 shadow-sm">
                        <span className="text-black">
                          {iconMap[item.icon] || <BookOpen className="h-8 w-8" />}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base md:text-lg leading-tight">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 rounded-3xl border border-primary/40 bg-background p-5 flex flex-col items-center justify-center text-center gap-3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <span aria-hidden="true" className="text-primary">
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
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default WhyLearnKorean;
