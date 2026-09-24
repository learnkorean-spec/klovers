import { useState } from "react";
import { Search, BookOpen, Gift, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Homepage narrative slot 7 — "egg-teaser" (src/config/klovers-world.ts,
 * KLOVERS_WORLD.homepageNarrative). storyFunction: origin_mystery_teaser.
 *
 * Canon rule: characters are the two human learners only — Cluby is
 * explicitly EXCLUDED from this beat. It is a gentle "something is buried
 * in our story" hook, not a payoff: no explanation, no CTA pressure, just
 * curiosity carried into the rest of the product.
 *
 * 24 Sep 2026: uses the real courtyard photo Re supplied
 * (public/assets/story/egg-teaser.webp — girl + boy, glowing ivory egg,
 * hanok courtyard at night). No clover-mark icons and no green accent
 * color anywhere in this section by her request; the 3-colour brand
 * palette (klovers-yellow / charcoal / ivory) carries the whole thing.
 * See claude/BRAND_PALETTE_REFERENCE.md — green is documented there as a
 * functional state colour (correct/live), not a decorative one, so this
 * is actually the stricter reading of the palette, not a looser one.
 *
 * Note on style: the photo is photorealistic, while the rest of the
 * Klovers cast (docs/KLOVERS-STORY-BIBLE.md / CHARACTER_ASSET_SPEC.md) is
 * illustrated/cartoon. Flagging this as a canon visual-style note rather
 * than blocking on it, since Re supplied and approved this exact image.
 *
 * The "Tap the Egg" button is intentionally OUTLINED, not filled yellow:
 * FinalCTA sits directly below with a solid yellow "Book Your Free Class"
 * button, and the palette rule is never two solid-yellow buttons in one
 * view. Clicking it reveals one rotating clue line — still no explanation,
 * just a bit of texture, matching the "earn a surprise" feature row.
 */

const CLUES = [
  {
    en: "The shell is warm to the touch, though no one has ever seen it move.",
    ar: "القشرة دافية لما تلمسها، مع إن حد ما شافهاش اتحركت خالص.",
  },
  {
    en: "The mark on the shell matches a symbol carved above the oldest gate in the courtyard.",
    ar: "العلامة على القشرة شبه رمز محفور فوق أقدم باب في الحديقة.",
  },
  {
    en: "Every learner who finds it swears the story changes slightly the second time.",
    ar: "كل طالب لقاها بيقسم إن القصة بتتغيّر شوية لما يسمعها تاني.",
  },
];

const FEATURES = [
  { icon: Search, en: "Reveal a clue", ar: "اكشفي عن دليل" },
  { icon: BookOpen, en: "Unlock a story piece", ar: "افتحي جزء من القصة" },
  { icon: Gift, en: "Earn a surprise", ar: "احصلي على مفاجأة" },
];

const EggTeaser = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [clueIndex, setClueIndex] = useState<number | null>(null);

  const revealClue = () => setClueIndex((i) => (i === null ? 0 : (i + 1) % CLUES.length));

  return (
    <section
      className="relative overflow-hidden bg-charcoal text-center"
      aria-labelledby="egg-teaser-title"
    >
      <img
        src="/assets/story/egg-teaser.webp"
        alt={
          isAr
            ? "طالبة وطالب بيبصوا على بيضة عاجية متوهجة فوق حجر في حديقة هانوك بالليل"
            : "Two learners looking at a glowing ivory egg resting on a stone in a hanok courtyard at night"
        }
        width={1600}
        height={900}
        loading="lazy"
        decoding="async"
        className="mx-auto block aspect-[16/9] w-full max-w-4xl object-cover"
      />

      <div className="px-4 pb-16 pt-8 md:pb-20">
        <div className="mx-auto max-w-2xl">
          {/* Eyebrow: plain dashes either side, no icon */}
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-ivory/25" />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-klovers-yellow">
              {isAr ? "فصل مخفي" : "A hidden chapter"}
            </p>
            <span aria-hidden="true" className="h-px w-8 bg-ivory/25" />
          </div>

          <h2
            id="egg-teaser-title"
            className="mt-3 text-2xl font-extrabold leading-tight text-ivory md:text-3xl"
          >
            {isAr ? (
              <>حاجة غريبة مستنية <span className="text-klovers-yellow">في حديقة الهانوك</span></>
            ) : (
              <>Something Is Waiting <span className="text-klovers-yellow">in the Hanok Courtyard</span></>
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ivory/70 md:text-base">
            {isAr
              ? "اتنين من طلابنا لقوا حاجة عمرها ما حد فسّرها — بيضة عاجية عليها علامة غريبة. القصة بتتكشف شوية شوية جوه رحلتك مع كلوفرز."
              : "Two of our learners found something no one has explained yet — an ivory egg with a strange mark. The story unfolds slowly, inside your own Klovers journey."}
          </p>

          {/* Tap the egg — outlined, not filled yellow (FinalCTA below already owns the solid-yellow button) */}
          <button
            type="button"
            onClick={revealClue}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-klovers-yellow px-7 text-sm font-bold text-klovers-yellow transition-colors hover:bg-klovers-yellow hover:text-charcoal"
          >
            {isAr ? "دوسي على البيضة" : "Tap the Egg"}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </button>

          {clueIndex !== null && (
            <p className="mx-auto mt-4 max-w-md text-sm italic leading-relaxed text-ivory/80">
              {isAr ? CLUES[clueIndex].ar : CLUES[clueIndex].en}
            </p>
          )}

          {/* Feature row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {FEATURES.map(({ icon: Icon, en, ar }) => (
              <div key={en} className="flex items-center gap-2 text-xs font-semibold text-ivory/60">
                <Icon className="h-4 w-4 text-klovers-yellow" aria-hidden="true" />
                {isAr ? ar : en}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EggTeaser;
