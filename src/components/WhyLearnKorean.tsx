import { useState } from "react";
import { BookOpen, Briefcase, Plane, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { scenery } from "./whyLearnKoreanScenes";
import { CHARACTER_GIRL, CHARACTER_BOY } from "@/assets/characters";

/**
 * P0-4 of claude/WEBSITE_UX_CRO_ACTION_PLAN_2026-09-07.md.
 *
 * These four cards used to be plain <div>s carrying hover:shadow-xl,
 * hover:-translate-y-1 and a border change - the complete vocabulary of a
 * link - with no href and no onClick. A visitor interested enough to click
 * got nothing. There is no Travel page to point them at, so the card itself
 * is the payoff: front is a Korean scene, back is the explanation.
 *
 * THE FRONT, IN FOUR PASSES
 * -------------------------
 * 1. Tailwind's -900 steps: desaturated, near-identical in value, four
 *    motivations reading as one grey-blue smear.
 * 2. Deep dancheong (단청) temple colours, then hanbok pastels.
 * 3. Re asked for pictures of Korea, so the colour became artwork - see
 *    whyLearnKoreanScenes.tsx.
 * 4. The layout itself, which was the part still wrong: three things centred
 *    in a 288px card that held about 110px of content, leaving a third of it
 *    empty at the top and the bottom, with a 56px slab of pure yellow as the
 *    loudest element on a card whose message is its title.
 *
 * SO THE FRONT IS NOW COMPOSED, not centred. Korean word at the top, title
 * at the bottom, scene running the full height between them. The card is
 * full, and among the things a reader can actually parse the title comes
 * first. The yellow is a 32px rule and the icon's stroke - present, brand,
 * and no longer the first thing the eye lands on.
 *
 * THE TEXT FOLLOWS THE BACKGROUND, EVERY TIME. On the pastels white was
 * 1.4:1 and every label had to go dark. On artwork it inverts: the scenes
 * run from a bright spring sky to a night sky, so no single text colour
 * clears all four alone. The scrim is what makes white safe on every card -
 * it is not a darkening effect for taste. Change a scene's brightness and
 * you change whether its title is readable; check it.
 *
 * THE BACK stays theme-aware, so it cannot wear the artwork: a pale panel on
 * a dark page is a white blob. It carries one palette colour as a rule along
 * its top edge.
 *
 * ── 20 Sep 2026: FOUR REASONS BECAME ONE STORY ────────────────────────────
 *
 * Re asked for the Klovers characters here, "to make story sense". The four
 * cards were four unrelated nouns - culture, study, career, travel - each
 * true, none of them leading anywhere. Read in the order they already sat
 * in, they are a life: you fall for the culture, so you study, the studying
 * becomes work, and the work takes you there. The cards now say that out
 * loud. Each one is a numbered stop, and a character stands in it saying the
 * one sentence a learner earns at that stop.
 *
 * THE CHARACTERS ARE BUSTS WITH THEIR OWN BACKGROUND and cannot be cut out -
 * see the note in src/assets/characters.ts, where four background-removal
 * passes each lost a hand, the trousers or the skirt. So they appear as
 * ringed medallions, which is a frame the artwork survives, rather than as
 * figures standing in the scene, which it does not. If transparent full-body
 * poses ever arrive, that is the change to make here.
 *
 * The girl opens and closes (she is waving in both directions); the boy,
 * hands clasped and calm, carries the two working stops in the middle.
 *
 * WHY THIS COPY IS IN THE COMPONENT AND NOT IN translations.ts: that file is
 * 230KB, and the tooling this was written with can only replace a file whole.
 * `koreanWord` below has sat here for the same reason. A session with real
 * git access should move SCRIPT and STORY into translations.ts under
 * `whyLearn`; nothing else has to change when it does.
 */

const iconMap: Record<string, React.ReactNode> = {
  study: <BookOpen className="h-6 w-6" />,
  career: <Briefcase className="h-6 w-6" />,
  travel: <Plane className="h-6 w-6" />,
  culture: <Music className="h-6 w-6" />,
};

/** The word itself, in the language being sold. */
const koreanWord: Record<string, string> = {
  study: "학업",
  career: "경력",
  travel: "여행",
  culture: "문화",
};

/**
 * The story order, and who is standing in each stop.
 *
 * `step` is not decoration — it is the claim the section is making, that
 * these four are sequential rather than a menu. Keep them 1-4 and keep them
 * in the order the translated `items` array already uses.
 */
const STORY: Record<string, { step: number; who: "girl" | "boy" }> = {
  culture: { step: 1, who: "girl" },
  study: { step: 2, who: "boy" },
  career: { step: 3, who: "boy" },
  travel: { step: 4, who: "girl" },
};

const PORTRAIT: Record<"girl" | "boy", string> = {
  girl: CHARACTER_GIRL,
  boy: CHARACTER_BOY,
};

/**
 * What the character says at each stop: the Korean on the front, because
 * this is a Korean school and the sentence is the product; the reader's own
 * language on the back, because a beginner cannot read the front yet and a
 * bubble they cannot read explains nothing.
 *
 * Short on purpose. These sit in a 150px-wide card on a phone.
 */
const SCRIPT: Record<string, { ko: string; ar: string; en: string }> = {
  culture: {
    ko: "가사가 들려!",
    ar: "بقيت أفهم كلمات الأغاني!",
    en: "I can hear the lyrics now!",
  },
  study: {
    ko: "혼자 읽었어!",
    ar: "قريتها لوحدي!",
    en: "I read it on my own!",
  },
  career: {
    ko: "면접은 한국어로.",
    ar: "المقابلة بالكوري.",
    en: "The interview — in Korean.",
  },
  travel: {
    ko: "서울에서 만나!",
    ar: "نتقابل في سيول!",
    en: "See you in Seoul!",
  },
};

/** The section's own framing line, above the translated heading. */
const EYEBROW = {
  ar: "قصة واحدة · أربع محطات",
  en: "One story · four stops",
};

/**
 * Back-face rule colour — the palette, read from the tokens.
 *
 * This was two values from one saturated hue per card (#0A4DA6, #0B6E52,
 * #B3122E, #7B1E6A and a slate fallback): four colours the brand does not
 * own. It then briefly held palette HEXES, which went stale the moment Mint
 * and Peach were tuned on 20 Sep. Tokens cannot go stale.
 *
 * No pink here either, as of the three-colour decision: pink is spent on the
 * roadmap's final level and the games' "hot" badge, and nowhere else.
 *
 * The hue is decorative — it tells the reader nothing — which is why the
 * character, not a coloured icon, is the mark on the back panel now.
 */
const tones: Record<string, string> = {
  study: "hsl(var(--klovers-yellow))",
  career: "hsl(var(--mint-strong))",
  travel: "hsl(var(--charcoal))",
  culture: "hsl(var(--mint))",
};

const fallbackTone = "hsl(var(--charcoal))";

/**
 * Photographs, keyed by icon. Empty: there are none in this repo, and putting
 * images of unchecked provenance on the homepage is not a thing to do quietly.
 * Add one and it renders instead of that card's drawing - nothing else needs
 * to change, the scrim and the white text already assume a picture.
 */
const IMAGES: Record<string, string> = {};

const WhyLearnKorean = () => {
  const { tArray, t, language } = useLanguage();
  const items = tArray("whyLearn", "items") as { title: string; description: string; icon: string }[];
  const lang = language === "ar" ? "ar" : "en";

  // Touch devices have no hover, so the flip is also a real toggle. Keyboard
  // users get the same control for free by it being a <button>.
  const [flipped, setFlipped] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">

        <div className="text-center mb-16 space-y-4">
          <span className="inline-block rounded-full bg-mint px-4 py-1.5 text-xs md:text-sm font-bold text-mint-foreground">
            {EYEBROW[lang]}
          </span>
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
            const story = STORY[item.icon];
            const line = SCRIPT[item.icon];
            const portrait = story ? PORTRAIT[story.who] : null;

            return (
              <button
                key={index}
                type="button"
                aria-expanded={isFlipped}
                onClick={() => setFlipped(isFlipped ? null : index)}
                className="group relative h-56 md:h-72 w-full rounded-3xl text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card [perspective:1200px]"
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
                      // `slice` so the scene fills the card at any aspect and is
                      // cropped rather than letterboxed; each is composed with
                      // its subject low and centred to survive that crop.
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
                        the night one. Weighted to the bottom, where the title
                        now sits over the busiest part of every scene. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(to bottom, rgba(46,46,46,0.10) 0%, rgba(46,46,46,0.22) 38%, rgba(46,46,46,0.82) 100%)",
                      }}
                    />

                    {/* The character. A ringed medallion in the bottom corner,
                        not a figure in the scene — see the note at the top of
                        this file about why they cannot be cut out. */}
                    {portrait && (
                      <img
                        src={portrait}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="absolute bottom-4 end-3 md:bottom-5 md:end-4 h-11 w-11 md:h-14 md:w-14 rounded-full object-cover ring-2 ring-klovers-yellow shadow-md"
                      />
                    )}

                    {/* Composed, not centred: word and step at the top, the
                        character's line and the title at the bottom, scene
                        filling everything between. */}
                    <div className="relative h-full flex flex-col justify-between p-4 pb-5 md:p-5 md:pb-6">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          aria-hidden="true"
                          className="text-3xl md:text-[40px] font-extrabold leading-none select-none text-ivory/[0.34]"
                        >
                          {koreanWord[item.icon] || "한국"}
                        </span>
                        {story && (
                          <span
                            aria-hidden="true"
                            className="shrink-0 grid h-6 w-6 md:h-7 md:w-7 place-items-center rounded-full bg-klovers-yellow text-charcoal text-[11px] md:text-xs font-extrabold"
                          >
                            {story.step}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-2 md:gap-2.5 pe-12 md:pe-16">
                        {line && (
                          <span
                            lang="ko"
                            className="relative inline-block rounded-2xl bg-ivory px-2.5 py-1 text-[11px] md:text-xs font-bold text-charcoal shadow-sm"
                          >
                            {line.ko}
                            {/* Tail, pointing down toward the medallion. */}
                            <span
                              aria-hidden="true"
                              className="absolute -bottom-1 end-3 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-ivory"
                            />
                          </span>
                        )}
                        <span aria-hidden="true" className="block w-8 h-[3px] rounded-full bg-primary" />
                        <span aria-hidden="true" className="block text-primary">
                          {iconMap[item.icon] || <BookOpen className="h-6 w-6" />}
                        </span>
                        <h3
                          className="font-bold text-ivory text-lg md:text-xl leading-snug"
                          style={{ textShadow: "0 1px 6px rgba(46,46,46,0.6)" }}
                        >
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 rounded-3xl border border-border bg-background overflow-hidden shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-1.5"
                      style={{ backgroundColor: tone }}
                    />
                    <div className="h-full flex flex-col items-center justify-center text-center gap-2.5 p-5">
                      {portrait ? (
                        <img
                          src={portrait}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                          className="h-12 w-12 md:h-14 md:w-14 rounded-full object-cover ring-2 ring-border"
                        />
                      ) : (
                        <span aria-hidden="true" className="text-foreground">
                          {iconMap[item.icon] || <BookOpen className="h-6 w-6" />}
                        </span>
                      )}
                      <h3 className="font-bold text-foreground text-sm md:text-base leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                      {line && (
                        <p className="text-xs md:text-sm font-bold text-foreground leading-snug">
                          {`"${line[lang]}"`}
                        </p>
                      )}
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
