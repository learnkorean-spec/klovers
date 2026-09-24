import { useState } from "react";
import { Search, BookOpen, Gift, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
 * 24 Sep 2026 (STORY CONFLICT, resolved): Re initially asked for taps to
 * count toward "their league." This page has no auth context and renders
 * for logged-out visitors, so a real per-student count can't live here —
 * canon says marketing teases, the logged-in product is where progress is
 * real (CLAUDE.md KLOVERS STORY CANON). Re confirmed: visual-only counter
 * for now. A real counter tied to an actual student league is a separate,
 * bigger feature that belongs in the logged-in product if she wants it
 * later — not a homepage teaser.
 *
 * 24 Sep 2026: tap now opens a popup (shadcn Dialog) instead of showing
 * the clue inline. Same client-side-only rotating clue + tap count, no
 * backend/league change.
 *
 * 24 Sep 2026 (this pass): Re said the photo needs to "merge into the
 * background" instead of sitting in a framed/rounded box, and that the
 * egg itself should have movement and be directly tappable ("i pressed
 * nothing happened" — she was tapping the egg in the photo, not the text
 * button below it). Changes:
 *   - The photo is now a full-bleed background for the top of the section
 *     (edge-to-edge, no rounded corners) with a bottom gradient fading it
 *     straight into bg-charcoal, so there's no visible frame/seam.
 *   - A real tap target sits directly over the egg in the photo (~50% / 57%,
 *     eyeballed from the reference screenshot). It calls the same
 *     revealClue() as the button below.
 *   - Kept the labelled "Tap the Egg" button underneath too, since the
 *     on-photo hotspot alone isn't reliably discoverable (small target,
 *     motion-sensitive users, screen readers) — both trigger the same
 *     popup.
 *
 * 24 Sep 2026 (this pass, round 2): Re said the egg hotspot wasn't obvious
 * ("the egg is not obvious, and where i go clicking there") - the fading
 * ping-only glow read as decorative, not clickable. Made it a persistent
 * ring (border-2 border-klovers-yellow, always visible, not just the
 * animated pulse) plus a small "👇 Tap here" label above it (moved off the
 * "A hidden chapter" eyebrow text it originally overlapped), so it's
 * unmistakably an interactive spot instead of a subtle sparkle.
 *
 * 24 Sep 2026 (STORY CANON CHANGE): Re supplied 3 new illustrated images —
 * a calm egg with a clover mark, the same egg cracking with dramatic light,
 * and Cluby hatching out of it — and confirmed ("1 yes") they should appear
 * inside this popup, one per tap, alongside the existing clue text. This
 * OVERRIDES the canon rule at the top of this file ("Cluby is explicitly
 * EXCLUDED from this beat"): Cluby now appears here, on the 3rd/hatching
 * reveal only, as the payoff image. The background photo (girl + boy in the
 * courtyard) is unchanged — Re explicitly said to keep it as-is, just make
 * sure it reads clearly, not to replace it with any of these new images.
 * REVEAL_IMAGES below is ordered to match CLUES: calm egg → cracking egg →
 * Cluby hatching, so the popup visually escalates in step with the text.
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

// Ordered to match CLUES: calm egg → cracking egg → Cluby hatching out of it.
const REVEAL_IMAGES = [
  {
    src: "/assets/story/egg-plain-clover.webp",
    alt: { en: "An ivory egg with a faint clover mark", ar: "بيضة عاجية عليها علامة كلوفر خفيفة" },
  },
  {
    src: "/assets/story/egg-cracked-glow.webp",
    alt: { en: "The egg cracking open, glowing from within", ar: "البيضة بتتكسر وبتضوي من جواها" },
  },
  {
    src: "/assets/story/cluby-hatching.webp",
    alt: { en: "Cluby hatching out of the egg", ar: "كلوبي بيفقس من البيضة" },
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
  const [clueIndex, setClueIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [open, setOpen] = useState(false);

  const revealClue = () => {
    const next = tapCount + 1;
    setTapCount(next);
    setClueIndex((next - 1) % CLUES.length);
    setOpen(true);
  };

  return (
    <section
      className="relative overflow-hidden bg-charcoal text-center"
      aria-labelledby="egg-teaser-title"
    >
      {/* Full-bleed photo merging into bg-charcoal below — no frame, no rounded box */}
      <div className="absolute inset-x-0 top-0 h-[380px] md:h-[520px]">
        <img
          src="/assets/story/egg-teaser.webp"
          alt={
            isAr
              ? "طالبة وطالب بيبصوا على بيضة عاجية متوهجة فوق حجر في حديقة هانوك بالليل"
              : "Two learners looking at a glowing ivory egg resting on a stone in a hanok courtyard at night"
          }
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-charcoal/5 via-charcoal/60 to-charcoal"
        />

        {/* Real tap target sitting directly on the egg in the photo. A persistent
            ring (not just the fading ping pulse) plus a small "tap here" label
            make it obvious this is clickable, not just decorative glow. */}
        <div className="absolute left-1/2 top-[57%] -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={revealClue}
            aria-label={isAr ? "دوسي على البيضة" : "Tap the egg"}
            className="relative flex h-20 w-20 items-center justify-center rounded-full outline-none"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-klovers-yellow/30"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-klovers-yellow bg-klovers-yellow/10"
            />
          </button>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-klovers-yellow/50 bg-charcoal/90 px-3 py-1 text-xs font-bold text-klovers-yellow"
          >
            {isAr ? "👇 دوسي هنا" : "👇 Tap here"}
          </span>
        </div>
      </div>

      <div className="relative z-10 px-4 pb-16 pt-[260px] md:pb-20 md:pt-[360px]">
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
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={revealClue}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-klovers-yellow px-7 text-sm font-bold text-klovers-yellow transition-colors hover:bg-klovers-yellow hover:text-charcoal"
            >
              {isAr ? "دوسي على البيضة" : "Tap the Egg"}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>

            {tapCount > 0 && (
              <p className="text-xs font-semibold text-ivory/50">
                {isAr
                  ? `دُست عليها ${tapCount === 1 ? "مرة" : `${tapCount} مرات`}`
                  : `Tapped ${tapCount} ${tapCount === 1 ? "time" : "times"}`}
              </p>
            )}
          </div>

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm border-2 border-klovers-yellow/30 bg-charcoal text-ivory sm:rounded-2xl"
          dir={isAr ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-2xl border-2 border-klovers-yellow bg-charcoal">
              <img
                key={REVEAL_IMAGES[clueIndex].src}
                src={REVEAL_IMAGES[clueIndex].src}
                alt={isAr ? REVEAL_IMAGES[clueIndex].alt.ar : REVEAL_IMAGES[clueIndex].alt.en}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mx-auto -mt-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-klovers-yellow bg-charcoal">
              <Sparkles className="h-4 w-4 text-klovers-yellow" aria-hidden="true" />
            </div>
            <DialogTitle className="text-center text-lg font-extrabold text-ivory">
              {isAr ? "فصل مخفي" : "A hidden chapter"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm italic leading-relaxed text-ivory/80">
              {isAr ? CLUES[clueIndex].ar : CLUES[clueIndex].en}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 pt-1">
            <p className="text-xs font-semibold text-ivory/50">
              {isAr
                ? `دُست عليها ${tapCount === 1 ? "مرة" : `${tapCount} مرات`}`
                : `Tapped ${tapCount} ${tapCount === 1 ? "time" : "times"}`}
            </p>
            <button
              type="button"
              onClick={revealClue}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border-2 border-klovers-yellow px-6 text-sm font-bold text-klovers-yellow transition-colors hover:bg-klovers-yellow hover:text-charcoal"
            >
              {isAr ? "دلوقتي دليل تاني" : "Reveal another clue"}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default EggTeaser;
