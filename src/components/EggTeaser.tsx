import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
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
 * Canon: the homepage only TEASES. The popup shows the egg waking —
 * dormant → small crack → glow — with the same egg images the student
 * dashboard uses (public/assets/story/egg-0/1/2.webp), but it never hatches
 * here: hatching happens on the student dashboard, from the student's real
 * learning (Re, 24 Sep 2026). Cluby stays excluded from this beat
 * (homepageNarrative slot 7, explicitlyExclude: ["cluby"]).
 *
 * Background photo: public/assets/story/egg-teaser.webp (girl + boy, glowing
 * ivory egg, hanok courtyard at night), full-bleed, fading into bg-charcoal.
 * Palette: klovers-yellow / charcoal / ivory only.
 *
 * Tap count is visual-only (no auth on this beat's counter) — a real
 * per-student count lives in the logged-in product.
 *
 * 25 Sep 2026 (account link): Re: "fix this with better idea or link it or
 * advice to make an account". Two problems in the live section:
 *   1. The tap ring floated over blurry bokeh — on screen there was no
 *      visible egg inside it, so it read as an empty circle. The ring now
 *      holds the actual egg (egg-0.webp), gently floating, so the thing to
 *      tap IS the egg.
 *   2. The beat was a dead end: tap → clue → nothing to do. Since the egg
 *      only hatches on the dashboard, the honest next step is an account.
 *      The popup now ends with: guests → "Create a free account" (signup,
 *      redirect to /dashboard) + "Sign in"; signed-in students → "See your
 *      egg on your dashboard". A small "No account yet?" link also sits under
 *      the main button, and the feature row says where it hatches.
 *   No reward is promised beyond what exists: the dashboard egg is real.
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

// The same egg images as the student dashboard. Tap 1 → dormant, tap 2 →
// small crack, tap 3 and every later tap → glowing. It never hatches here.
const EGG_IMAGES = [
  {
    src: "/assets/story/egg-0.webp",
    alt: { en: "A dormant ivory egg with a small clover mark", ar: "بيضة عاجية نايمة عليها علامة كلوفر صغيرة" },
  },
  {
    src: "/assets/story/egg-1.webp",
    alt: { en: "The egg with a small crack in its shell", ar: "البيضة وفي قشرتها شرخ صغير" },
  },
  {
    src: "/assets/story/egg-2.webp",
    alt: { en: "The egg glowing softly from within", ar: "البيضة بتنوّر بهدوء من جواها" },
  },
];

const FEATURES = [
  { icon: Search, en: "Reveal a clue", ar: "اكشفي عن دليل" },
  { icon: UserPlus, en: "Hatch it in your free account", ar: "فقّسيها في حسابك المجاني" },
];

const SIGNUP_HREF = `/signup?redirect=${encodeURIComponent("/dashboard")}`;
const LOGIN_HREF = `/login?redirect=${encodeURIComponent("/dashboard")}`;

const EggTeaser = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [clueIndex, setClueIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [open, setOpen] = useState(false);
  const eggImage = EGG_IMAGES[Math.min(Math.max(tapCount - 1, 0), EGG_IMAGES.length - 1)];

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
          className="h-full w-full scale-[1.7] object-cover object-center md:scale-100"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-charcoal/5 via-charcoal/60 to-charcoal"
        />

        {/* The tap target IS the egg: the real egg image inside a yellow ring,
            floating gently, with a "tap here" label above it. */}
        <div className="absolute left-1/2 top-[57%] -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={revealClue}
            aria-label={isAr ? "دوسي على البيضة" : "Tap the egg"}
            className="group relative flex h-24 w-24 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-klovers-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-klovers-yellow/25 motion-reduce:animate-none"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-klovers-yellow bg-charcoal/50 shadow-[0_0_24px_rgba(255,255,0,0.35)]"
            />
            <img
              src="/assets/story/egg-0.webp"
              alt=""
              aria-hidden="true"
              className="relative h-[4.5rem] w-[4.5rem] rounded-full object-cover animate-bounce [animation-duration:2.5s] transition-transform group-hover:scale-110 motion-reduce:animate-none"
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
              ? "اتنين من طلابنا لقوا حاجة عمرها ما حد فسّرها — بيضة عاجية عليها علامة غريبة. البيضة بتصحى هنا، بس بتفقس جوه حسابك وإنتي بتتعلّمي."
              : "Two of our learners found something no one has explained yet — an ivory egg with a strange mark. It stirs here, but it only hatches inside your own account, as you learn."}
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

            {user ? (
              <Link to="/dashboard" className="text-xs font-semibold text-ivory/70 underline-offset-4 hover:text-klovers-yellow hover:underline">
                {isAr ? "شوفي بيضتك في لوحة التحكم" : "See your egg on your dashboard"}
              </Link>
            ) : (
              <p className="text-xs text-ivory/60">
                {isAr ? "لسه ما عندكيش حساب؟ " : "No account yet? "}
                <Link to={SIGNUP_HREF} className="font-bold text-klovers-yellow underline-offset-4 hover:underline">
                  {isAr ? "اعملي حساب مجاني — بيضتك مستنياكي" : "Create one free — your egg is waiting"}
                </Link>
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
                key={eggImage.src}
                src={eggImage.src}
                alt={isAr ? eggImage.alt.ar : eggImage.alt.en}
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

            {/* The honest next step: the egg only hatches in an account. */}
            <div className="mt-2 w-full border-t border-ivory/10 pt-4 text-center">
              <p className="text-sm font-semibold text-ivory">
                {isAr ? "البيضة مش هتفقس هنا…" : "It won't hatch here…"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ivory/60">
                {isAr
                  ? "بتفقس في حسابك، مع كل درس بتخلّصيه."
                  : "It hatches in your account, with every lesson you finish."}
              </p>

              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-klovers-yellow px-6 text-sm font-bold text-charcoal transition-opacity hover:opacity-90"
                >
                  {isAr ? "شوفي بيضتك في لوحة التحكم" : "See your egg on your dashboard"}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link
                    to={SIGNUP_HREF}
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-klovers-yellow px-6 text-sm font-bold text-charcoal transition-opacity hover:opacity-90"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    {isAr ? "اعملي حساب مجاني" : "Create a free account"}
                  </Link>
                  <p className="mt-2 text-xs text-ivory/60">
                    {isAr ? "عندك حساب؟ " : "Already have one? "}
                    <Link
                      to={LOGIN_HREF}
                      onClick={() => setOpen(false)}
                      className="font-bold text-klovers-yellow underline-offset-4 hover:underline"
                    >
                      {isAr ? "سجّلي دخول" : "Sign in"}
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default EggTeaser;
