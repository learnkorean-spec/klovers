import { Link } from "react-router-dom";
import { BookOpen, Briefcase, Plane, Music, ArrowRight, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * P0-4 of claude/WEBSITE_UX_CRO_ACTION_PLAN_2026-09-07.md, finally closed.
 *
 * THE ORIGINAL FAULT: four plain <div>s carrying hover:shadow-xl,
 * hover:-translate-y-1 and a border change - the complete vocabulary of a
 * link - with no href and no onClick. A visitor interested enough to click
 * got nothing.
 *
 * The first repair made the card itself the payoff: a flip card, scene on
 * the front, explanation on the back. That worked, but it answered the
 * question by removing the affordance rather than by earning it.
 *
 * 2026-09-20 - Re sent a mockup of this section and this is it: a dark band,
 * a photograph per card, a coloured badge on the corner of each, the copy
 * underneath, and an arrow. The arrow is the whole point of the change. It
 * is real now: each card goes to a published article, in the reader's own
 * language, and each photograph is that article's own hero.
 *
 * There is no flip any more because there is nothing left to flip to - the
 * description is on the front, where it should always have been.
 *
 * ── ON CHOOSING THE PHOTOGRAPHS ───────────────────────────────────────
 *
 * This file shipped for months with `IMAGES = {}` and a comment: "putting
 * images of unchecked provenance on the homepage is not a thing to do
 * quietly." That was right, and it has been answered rather than ignored -
 * every image below is the hero_image of a PUBLISHED post, the same standard
 * CultureHeritageSection meets.
 *
 * BUT PROVENANCE IS ONLY HALF THE CHECK. The first version of this section
 * shipped korean-study-desk.jpg and kdrama-vocabulary.jpg, both properly
 * published, both carrying AI-generated gibberish Hangul printed inside the
 * picture - "로니 헐치 지", "믹새긴깅", "Heraye 루·착힐 차뭔으럼." On a homepage
 * that teaches people to read Hangul, that is read by every visitor who has
 * finished lesson one. korean-reading.jpg and topik-test.jpg carry the same
 * fault. LOOK AT THE IMAGE, not only at where it came from.
 *
 * Known compromise: korean-education.jpg is a classroom of school-age
 * students under a card about universities and scholarships, where the
 * audience is adults. It is the best text-free published option in the repo.
 * A real photograph would beat it.
 *
 * ON CONTRAST. The scrim and the white-text rules that governed the old SVG
 * scenes are gone with them: nothing is written over a photograph here.
 * Titles are Ivory on Charcoal (12.3:1) and the badge icons are Charcoal on
 * four pale tints (all above 9:1). If a future version puts text back on top
 * of the image, the scrim has to come back with it.
 *
 * ── THREE DEPARTURES FROM THE MOCKUP ──────────────────────────────────────
 *
 * 1. NO "+10,000 LEARNERS" AND NO AVATAR CLUSTER. The mockup's band carries
 *    "+10,000 من متعلمي كلوفرز" over three faces. The site's own figure, in
 *    its own hero, is 200+ students in 13 years, and the faces are not
 *    Klovers students. This is the same thing the five invented leaderboard
 *    players were deleted for rather than scaled up (see
 *    claude/BRAND_SEO_GAMES_RUN_2026-09-07.md). The band carries the offer
 *    and nothing else. Real proof - the Google rating, a student photo with
 *    consent - can go in the moment it exists.
 *
 * 2. NO HANDWRITTEN MARGIN NOTES. Caveat has no Arabic and no Hangul
 *    glyphs, so "من أجل نسخة أفضل منك" and "더 나은 너를 위해" would both have
 *    fallen back to Cairo and rendered as ordinary sentences floating in the
 *    margin - the charm is entirely in the face. Adding an Arabic
 *    handwriting face is a deliberate change of its own, with its own cost
 *    on a page whose LCP is already poor.
 *
 * 3. CHARCOAL, NOT BLACK. The mockup's ground is around #0D0D12 and its
 *    backdrop is a cherry-blossom photograph. Both are outside the palette,
 *    so this is Charcoal #2E2E2E with the brand's yellow glow behind it -
 *    the same device the hero uses.
 */

/**
 * One row per card, keyed by the `icon` string the translations already use.
 *
 * `href` is a pair because the blog is a pair: every published article has an
 * `-ar` twin, and sending an Arabic reader to the English post is worse than
 * sending them nowhere. All four destinations were chosen partly BECAUSE they
 * are clean pairs - exactly one ar row and one en row - so none of them runs
 * into the duplicate-slug problem recorded in docs/ARTICLE_SEO_PLAN.md, where
 * an image can have both a `-ar` original and a newer `ar-` copy with no
 * views. If you swap a destination, check that first.
 *
 * `badge` is a literal class string - Tailwind's scanner only keeps what it
 * can see, so these must never be assembled from fragments.
 *
 * Blush (`bg-peach`), not Rose (`bg-peach-strong`), on culture. The strong
 * pink is still spent on the roadmap's final level and the games' hot badge,
 * and that is the whole reason it reads as an ending.
 */
const CARDS: Record<
  string,
  { image: string; badge: string; Icon: React.ElementType; href: { ar: string; en: string } }
> = {
  travel: {
    image: "/assets/blog/jeju-travel.jpg",
    badge: "bg-ivory",
    Icon: Plane,
    href: {
      ar: "/blog/korean-transportation-guide-seoul-ar",
      en: "/blog/korean-transportation-guide-seoul",
    },
  },
  career: {
    image: "/assets/blog/korean-business.jpg",
    badge: "bg-mint",
    Icon: Briefcase,
    href: {
      ar: "/blog/korean-job-interview-phrases-ar",
      en: "/blog/korean-job-interview-phrases",
    },
  },
  study: {
    image: "/assets/blog/korean-education.jpg",
    badge: "bg-klovers-yellow",
    Icon: BookOpen,
    href: {
      ar: "/blog/korean-education-system-hagwon-culture-ar",
      en: "/blog/korean-education-system-hagwon-culture",
    },
  },
  culture: {
    image: "/assets/blog/korean-listening.jpg",
    badge: "bg-peach",
    Icon: Music,
    href: {
      ar: "/blog/best-kdrama-learn-korean-difficulty-ranked-ar",
      en: "/blog/best-kdrama-learn-korean-difficulty-ranked",
    },
  },
};

/**
 * The framing line and the closing band, in Re's own words from the mockup.
 *
 * These are in the component rather than in translations.ts for the same
 * reason `koreanWord` always was: that file is 230KB and the tooling here can
 * only replace a file whole. A session with real git access should move them.
 */
const COPY = {
  ar: {
    eyebrow: "لغة جديدة ← آفاق أوسع",
    bandTitle: "ابدأ رحلتك في تعلم الكورية اليوم",
    bandSub: "اختر مستواك، واكتشف طريقك مع Klovers",
    bandCta: "ابدأ الآن",
    more: "اقرأ المقال",
  },
  en: {
    eyebrow: "A new language → a wider world",
    bandTitle: "Start your Korean journey today",
    bandSub: "Find your level, and your path, with Klovers",
    bandCta: "Start now",
    more: "Read the article",
  },
};

const WhyLearnKorean = () => {
  const { tArray, t, language } = useLanguage();
  const items = tArray("whyLearn", "items") as { title: string; description: string; icon: string }[];
  const isAr = language === "ar";
  const lang = isAr ? "ar" : "en";
  const copy = COPY[lang];

  return (
    <section className="relative overflow-hidden bg-charcoal py-20 md:py-28">
      {/* The brand's glow, standing in for the mockup's photographic backdrop.
          A gradient is a backgroundImage, so it will not show up in a
          computed-style colour audit — that is expected, not a stray. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--klovers-yellow) / 0.16), transparent 70%)",
        }}
      />

      <div className="container relative mx-auto px-4">

        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-xs font-bold text-charcoal md:text-sm">
            <Sprout className="h-4 w-4" aria-hidden="true" />
            {copy.eyebrow}
          </span>

          <h2 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ivory md:text-5xl lg:text-6xl">
            {t("whyLearn", "title")}
          </h2>

          {/* Yellow as a mark under the heading, never as the heading. The
              mockup underlines one word; the heading is a single translated
              string, so it cannot be split without touching translations.ts. */}
          <span aria-hidden="true" className="mx-auto mt-4 block h-2 w-28 rounded-full bg-klovers-yellow" />

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ivory/70 md:text-lg">
            {t("whyLearn", "subtitle")}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const card = CARDS[item.icon];
            if (!card) return null;
            const { Icon } = card;

            return (
              <Link
                key={index}
                to={card.href[lang]}
                className="group block rounded-3xl border border-ivory/10 bg-ivory/[0.06] p-3 transition-colors duration-300 hover:border-klovers-yellow/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-klovers-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
              >
                <div className="relative">
                  <img
                    src={card.image}
                    alt=""
                    aria-hidden="true"
                    width={400}
                    height={500}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full rounded-2xl object-cover"
                  />
                  {/* The badge sits on the corner of the photograph, half over
                      it — which is why the padding below starts at pt-8. */}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-5 start-2 grid h-12 w-12 place-items-center rounded-full shadow-md ${card.badge}`}
                  >
                    <Icon className="h-5 w-5 text-charcoal" />
                  </span>
                </div>

                <div className="px-2 pb-2 pt-8">
                  <h3 className="text-lg font-bold leading-snug text-ivory">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/65">{item.description}</p>

                  <span
                    className="mt-4 inline-grid h-10 w-10 place-items-center rounded-full bg-ivory/10 text-ivory transition-colors duration-300 group-hover:bg-klovers-yellow group-hover:text-charcoal"
                    aria-label={copy.more}
                  >
                    <ArrowRight className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* The closing band. The mockup's "+10,000 learners" and its three
            faces are deliberately absent — see departure 1 at the top of this
            file. Do not add a number here that the site cannot stand behind. */}
        <div className="mx-auto mt-12 flex max-w-4xl flex-col items-center justify-between gap-5 rounded-3xl border border-ivory/10 bg-ivory/[0.06] p-6 text-center md:mt-16 md:flex-row md:text-start">
          <div>
            <p className="text-lg font-bold text-ivory md:text-xl">{copy.bandTitle}</p>
            <p className="mt-1 text-sm text-ivory/65">{copy.bandSub}</p>
          </div>
          <Button size="lg" asChild className="h-12 shrink-0 gap-2 rounded-full px-8 text-base font-bold">
            <Link to="/placement-test">
              {copy.bandCta}
              <ArrowRight className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} aria-hidden="true" />
            </Link>
          </Button>
        </div>

      </div>
    </section>
  );
};

export default WhyLearnKorean;
