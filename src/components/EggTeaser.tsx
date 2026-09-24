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
 * 24 Sep 2026: restyled to match a reference layout Re shared (eyebrow tag,
 * two-line heading, CTA button, 3-icon feature row) — rebuilt here with the
 * REAL 3-colour Klovers palette (klovers-yellow / charcoal / ivory, plus
 * klovers-green as a fill/border-only accent — see
 * claude/BRAND_PALETTE_REFERENCE.md), not the reference's own colours.
 *
 * No illustrated girl+boy courtyard scene exists yet (character art today
 * is cutout-only busts — see docs/KLOVERS-STORY-BIBLE.md /
 * CHARACTER_ASSET_SPEC.md). This ships an inline SVG mystery visual
 * (glowing ivory egg, four-leaf clover mark, hanok courtyard at dusk) so
 * the section is live and on-brand today. Once the real two-learner scene
 * is generated (prompt already written for Re) and uploaded to
 * public/assets/story/egg-teaser.webp, swap the <EggMysteryArt /> block
 * below for a <picture>/<img> and delete this note.
 *
 * The "Tap the Egg" button is intentionally OUTLINED, not filled yellow:
 * FinalCTA sits directly below with a solid yellow "Book Your Free Class"
 * button, and the palette rule is never two solid-yellow buttons in one
 * view. Clicking it reveals one rotating clue line — still no explanation,
 * just a bit of texture, matching the "earn a surprise" feature row.
 */

const CloverMark = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
    <g fill="#39FF14">
      <ellipse cx="6.5" cy="6.5" rx="3.6" ry="5" transform="rotate(-40 6.5 6.5)" />
      <ellipse cx="13.5" cy="6.5" rx="3.6" ry="5" transform="rotate(40 13.5 6.5)" />
      <ellipse cx="6.5" cy="13.5" rx="3.6" ry="5" transform="rotate(40 6.5 13.5)" />
      <ellipse cx="13.5" cy="13.5" rx="3.6" ry="5" transform="rotate(-40 13.5 13.5)" />
    </g>
  </svg>
);

const EggMysteryArt = () => (
  <svg
    viewBox="0 0 400 260"
    role="img"
    aria-hidden="true"
    className="mx-auto w-full max-w-sm"
  >
    <defs>
      <radialGradient id="eggGlow" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stopColor="#FFF9EC" stopOpacity="0.9" />
        <stop offset="55%" stopColor="#FFFF00" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FFFF00" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="courtyardSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2E2E2E" />
        <stop offset="100%" stopColor="#171712" />
      </linearGradient>
    </defs>

    {/* dusk courtyard */}
    <rect x="0" y="0" width="400" height="260" fill="url(#courtyardSky)" rx="18" />
    {/* hanok roofline silhouette */}
    <path
      d="M0 150 L60 150 L90 118 L120 150 L180 150 L210 110 L240 150 L300 150 L330 122 L360 150 L400 150 L400 260 L0 260 Z"
      fill="#2E2E2E"
      opacity="0.85"
    />
    {/* stone step */}
    <rect x="140" y="196" width="120" height="14" rx="4" fill="#3a3a3a" />

    {/* glow behind the egg */}
    <circle cx="200" cy="182" r="70" fill="url(#eggGlow)" />

    {/* the egg */}
    <ellipse cx="200" cy="188" rx="26" ry="34" fill="#FFF9EC" stroke="#FFFF00" strokeWidth="2" strokeOpacity="0.6" />

    {/* four-leaf clover mark on the shell */}
    <g transform="translate(200 186)" fill="#39FF14" opacity="0.95">
      <ellipse cx="-4" cy="-4" rx="4.2" ry="6" transform="rotate(-40)" />
      <ellipse cx="4" cy="-4" rx="4.2" ry="6" transform="rotate(40)" />
      <ellipse cx="-4" cy="4" rx="4.2" ry="6" transform="rotate(40)" />
      <ellipse cx="4" cy="4" rx="4.2" ry="6" transform="rotate(-40)" />
    </g>

    {/* two small lantern glows either side, standing in for the learners without drawing them */}
    <circle cx="118" cy="176" r="5" fill="#FFFF00" opacity="0.85" />
    <circle cx="282" cy="176" r="5" fill="#FFFF00" opacity="0.85" />
  </svg>
);

const CLUES = [
  {
    en: "The shell is warm to the touch, though no one has ever seen it move.",
    ar: "القشرة دافية لما تلمسها، مع إن حد ما شافهاش اتحركت خالص.",
  },
  {
    en: "The clover mark matches a symbol carved above the oldest gate in the courtyard.",
    ar: "علامة الكلوفر شبه رمز محفور فوق أقدم باب في الحديقة.",
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
      className="relative overflow-hidden bg-charcoal py-16 px-4 text-center md:py-20"
      aria-labelledby="egg-teaser-title"
    >
      <div className="mx-auto max-w-2xl">
        <EggMysteryArt />

        {/* Eyebrow: clover + dashes either side */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-ivory/25" />
          <CloverMark className="h-4 w-4" />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-klovers-yellow">
            {isAr ? "فصل مخفي" : "A hidden chapter"}
          </p>
          <CloverMark className="h-4 w-4" />
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
            ? "اتنين من طلابنا لقوا حاجة عمرها ما حد فسّرها — بيضة عاجية عليها علامة ورقة نبات بأربع فصوص. القصة بتتكشف شوية شوية جوه رحلتك مع كلوفرز."
            : "Two of our learners found something no one has explained yet — an ivory egg marked with a four-leaf clover. The story unfolds slowly, inside your own Klovers journey."}
        </p>

        {/* Tap the egg — outlined, not filled yellow (FinalCTA below already owns the solid-yellow button) */}
        <button
          type="button"
          onClick={revealClue}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-klovers-yellow px-7 text-sm font-bold text-klovers-yellow transition-colors hover:bg-klovers-yellow hover:text-charcoal"
        >
          <CloverMark className="h-4 w-4" />
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
    </section>
  );
};

export default EggTeaser;
