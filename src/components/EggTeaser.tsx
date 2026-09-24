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
 * 24 Sep 2026: first version. No illustrated girl+boy courtyard scene
 * exists yet (character art today is cutout-only busts — see
 * docs/KLOVERS-STORY-BIBLE.md / CHARACTER_ASSET_SPEC.md). This ships an
 * inline SVG mystery visual (glowing ivory egg, four-leaf clover mark, a
 * hanok courtyard at dusk) so the section is live and on-brand today.
 * Once the real two-learner scene is generated (prompt already written for
 * Re) and uploaded to public/assets/story/egg-teaser.webp, swap the
 * <EggMysteryArt /> block below for a <picture>/<img> and delete this note.
 */

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
        <stop offset="55%" stopColor="#BEEFCB" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#BEEFCB" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="courtyardSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2E2E2E" />
        <stop offset="100%" stopColor="#4a3f57" />
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
    <ellipse cx="200" cy="188" rx="26" ry="34" fill="#FFF9EC" stroke="#BEEFCB" strokeWidth="2" />

    {/* four-leaf clover mark on the shell */}
    <g transform="translate(200 186)" fill="#25D366" opacity="0.9">
      <ellipse cx="-4" cy="-4" rx="4.2" ry="6" transform="rotate(-40)" />
      <ellipse cx="4" cy="-4" rx="4.2" ry="6" transform="rotate(40)" />
      <ellipse cx="-4" cy="4" rx="4.2" ry="6" transform="rotate(40)" />
      <ellipse cx="4" cy="4" rx="4.2" ry="6" transform="rotate(-40)" />
    </g>

    {/* two small lantern glows either side, standing in for the learners without drawing them */}
    <circle cx="118" cy="176" r="5" fill="#FFF000" opacity="0.85" />
    <circle cx="282" cy="176" r="5" fill="#FFF000" opacity="0.85" />
  </svg>
);

const EggTeaser = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section
      className="relative overflow-hidden bg-charcoal py-16 px-4 text-center md:py-20"
      aria-labelledby="egg-teaser-title"
    >
      <div className="mx-auto max-w-2xl">
        <EggMysteryArt />

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-[#BEEFCB]">
          {isAr ? "سر صغير" : "A small mystery"}
        </p>
        <h2
          id="egg-teaser-title"
          className="mt-2 text-2xl font-extrabold leading-tight text-ivory md:text-3xl"
        >
          {isAr
            ? "حاجة غريبة مستنية في حديقة الهانوك"
            : "Something Is Waiting in the Hanok Courtyard"}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ivory/70 md:text-base">
          {isAr
            ? "اتنين من طلابنا لقوا حاجة عمرها ما حد فسّرها — بيضة عاجية عليها علامة ورقة نبات بأربع فصوص. القصة بتتكشف شوية شوية جوه رحلتك مع كلوفرز."
            : "Two of our learners found something no one has explained yet — an ivory egg marked with a four-leaf clover. The story unfolds slowly, inside your own Klovers journey."}
        </p>
      </div>
    </section>
  );
};

export default EggTeaser;
