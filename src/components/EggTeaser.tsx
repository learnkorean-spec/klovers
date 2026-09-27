import { useState } from "react";
import { Link } from "react-router-dom";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { toArabicDigits } from "@/lib/trustFigures";
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
 * learning (Re, 24 Sep 2026). Cluby is not drawn in this beat
 * (homepageNarrative slot 7), though Re allows him on public pages
 * before he hatches (25 Sep 2026).
 *
 * 25 Sep 2026 (Arabic voice): Re chose Modern Standard Arabic, neutral in
 * gender. No verb here is aimed at "you" as male or female: buttons are
 * verbal nouns (مصدر) and the text speaks about the egg and the account.
 * Keep that rule when adding a line.
 * Palette: klovers-yellow / charcoal / ivory only.
 * Tap count is visual-only — a real per-student count lives in the
 * logged-in product.
 *
 * 25 Sep 2026 (account link): the beat was a dead end (tap → clue →
 * nothing). The egg only hatches on the dashboard, so the popup now ends
 * with the honest next step: guests → free account (signup → /dashboard)
 * or sign in; signed-in students → their dashboard egg.
 *
 * 25 Sep 2026 (no overlap): Re — "the egg is not shown from the picture and
 * i hate the overlap". The ring, the "Tap here" pill and the heading all sat
 * ON the photo's egg. The photo (public/assets/story/egg-teaser.webp, 16:9,
 * egg centred at ~50% / 61%) is now its own block with NOTHING on top of it:
 *   - 4:3 on mobile (crops the sides only, egg stays centred and larger),
 *     16:9 from md, capped at 620px tall; object-position 50% 60% keeps the
 *     egg in frame when the cap crops top/bottom.
 *   - Only a thin fade at the very bottom (below the stone) so it still
 *     meets bg-charcoal without a hard seam.
 *   - The whole photo is the tap target (no ring, no label) — plus the
 *     labelled "Tap the Egg" button under it.
 *   - Heading and copy start BELOW the photo.
 */

const CLUES = [
  {
    en: "The shell is warm to the touch, though no one has ever seen it move.",
    ar: "القشرة دافئة عند لمسها، مع أن أحدًا لم يرها تتحرك قط.",
  },
  {
    en: "The mark on the shell matches a symbol carved above the oldest gate in the courtyard.",
    ar: "العلامة على القشرة تطابق رمزًا محفورًا فوق أقدم بوابة في الفناء.",
  },
  {
    en: "Every learner who finds it swears the story changes slightly the second time.",
    ar: "كل من وجدها من المتعلّمين يُقسم أن القصة تتغيّر قليلًا في المرة الثانية.",
  },
];

// The same egg images as the student dashboard. Tap 1 → dormant, tap 2 →
// small crack, tap 3 and every later tap → glowing. It never hatches here.
const EGG_IMAGES = [
  {
    src: "/assets/story/egg-0.webp",
    alt: { en: "A dormant ivory egg with a small clover mark", ar: "بيضة عاجية ساكنة عليها علامة برسيم صغيرة" },
  },
  {
    src: "/assets/story/egg-1.webp",
    alt: { en: "The egg with a small crack in its shell", ar: "البيضة وفي قشرتها شقّ صغير" },
  },
  {
    src: "/assets/story/egg-2.webp",
    alt: { en: "The egg glowing softly from within", ar: "البيضة تتوهّج بهدوء من داخلها" },
  },
];

const FEATURES = [
  { icon: "lightbulb-sprout" as KloverIconName, en: "Reveal a clue", ar: "كشف دليل جديد" },
  { icon: "student-girl-heart" as KloverIconName, en: "Hatch it in your free account", ar: "الفقس داخل الحساب المجاني" },
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
      {/* The photo on its own — nothing drawn on top of it. The whole picture
          is the tap target, so tapping the egg itself works. */}
      <button
        type="button"
        onClick={revealClue}
        aria-label={isAr ? "لمس البيضة" : "Tap the egg"}
        className="group relative block aspect-[4/3] max-h-[620px] w-full cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-klovers-yellow md:aspect-[16/9]"
      >
        <img
          src="/assets/story/egg-teaser.webp"
          alt={
            isAr
              ? "طالبة وطالب ينظران إلى بيضة عاجية متوهجة فوق حجر في فناء هانوك ليلًا"
              : "Two learners looking at a glowing ivory egg resting on a stone in a hanok courtyard at night"
          }
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-[50%_60%] transition-[filter] duration-300 group-hover:brightness-110"
        />
        {/* Thin fade only at the very bottom, below the stone */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-b from-transparent to-charcoal"
        />
      </button>

      <div className="relative px-4 pb-16 pt-8 md:pb-20 md:pt-10">
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
              <>شيء غامض ينتظر <span className="text-klovers-yellow">في فناء الهانوك</span></>
            ) : (
              <>Something Is Waiting <span className="text-klovers-yellow">in the Hanok Courtyard</span></>
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ivory/70 md:text-base">
            {isAr
              ? "وجد اثنان من طلابنا شيئًا لم يفسّره أحد بعد: بيضة عاجية عليها علامة غريبة. تستيقظ البيضة هنا، لكنها لا تفقس إلا داخل الحساب الشخصي، مع التقدّم في التعلّم."
              : "Two of our learners found something no one has explained yet — an ivory egg with a strange mark. It stirs here, but it only hatches inside your own account, as you learn."}
          </p>

          {/* Tap the egg — outlined, not filled yellow (FinalCTA below already owns the solid-yellow button) */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={revealClue}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-klovers-yellow px-7 text-sm font-bold text-klovers-yellow transition-colors hover:bg-klovers-yellow hover:text-charcoal"
            >
              {isAr ? "لمس البيضة" : "Tap the Egg"}
            </button>

            {tapCount > 0 && (
              <p className="text-xs font-semibold text-ivory/50">
                {isAr
                  ? `عدد مرات اللمس: ${toArabicDigits(tapCount)}`
                  : `Tapped ${tapCount} ${tapCount === 1 ? "time" : "times"}`}
              </p>
            )}

            {user ? (
              <Link to="/dashboard" className="text-xs font-semibold text-ivory/70 underline-offset-4 hover:text-klovers-yellow hover:underline">
                {isAr ? "عرض البيضة في لوحة التحكم" : "See your egg on your dashboard"}
              </Link>
            ) : (
              <p className="text-xs text-ivory/60">
                {isAr ? "لا يوجد حساب بعد؟ " : "No account yet? "}
                <Link to={SIGNUP_HREF} className="font-bold text-klovers-yellow underline-offset-4 hover:underline">
                  {isAr ? "إنشاء حساب مجاني — البيضة في الانتظار" : "Create one free — your egg is waiting"}
                </Link>
              </p>
            )}
          </div>

          {/* Feature row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {FEATURES.map(({ icon, en, ar }) => (
              <div key={en} className="flex items-center gap-2 text-xs font-semibold text-ivory/60">
                <KloverIcon name={icon} className="h-6 w-6" />
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
              <KloverIcon name="badge-blossom" className="h-6 w-6" />
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
                ? `عدد مرات اللمس: ${toArabicDigits(tapCount)}`
                : `Tapped ${tapCount} ${tapCount === 1 ? "time" : "times"}`}
            </p>
            <button
              type="button"
              onClick={revealClue}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border-2 border-klovers-yellow px-6 text-sm font-bold text-klovers-yellow transition-colors hover:bg-klovers-yellow hover:text-charcoal"
            >
              {isAr ? "كشف دليل آخر" : "Reveal another clue"}
            </button>

            {/* The honest next step: the egg only hatches in an account. */}
            <div className="mt-2 w-full border-t border-ivory/10 pt-4 text-center">
              <p className="text-sm font-semibold text-ivory">
                {isAr ? "لن تفقس البيضة هنا…" : "It won't hatch here…"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ivory/60">
                {isAr
                  ? "تفقس داخل الحساب، مع كل درس يكتمل."
                  : "It hatches in your account, with every lesson you finish."}
              </p>

              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-klovers-yellow px-6 text-sm font-bold text-charcoal transition-opacity hover:opacity-90"
                >
                  {isAr ? "عرض البيضة في لوحة التحكم" : "See your egg on your dashboard"}
                </Link>
              ) : (
                <>
                  <Link
                    to={SIGNUP_HREF}
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-klovers-yellow px-6 text-sm font-bold text-charcoal transition-opacity hover:opacity-90"
                  >
                    <KloverIcon name="student-boy-thumbsup" className="h-6 w-6" />
                    {isAr ? "إنشاء حساب مجاني" : "Create a free account"}
                  </Link>
                  <p className="mt-2 text-xs text-ivory/60">
                    {isAr ? "يوجد حساب بالفعل؟ " : "Already have one? "}
                    <Link
                      to={LOGIN_HREF}
                      onClick={() => setOpen(false)}
                      className="font-bold text-klovers-yellow underline-offset-4 hover:underline"
                    >
                      {isAr ? "تسجيل الدخول" : "Sign in"}
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
