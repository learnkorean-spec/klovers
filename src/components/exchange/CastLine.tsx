/**
 * The KLOVERS cast as PolyglotMatch's storytellers (Re, 18 Nov 2026: "keep
 * all colors, just the characters are using the app as they are the
 * storytellers"). A small speech bubble from Lina, Adam or Cluby at the
 * moments where a learner needs a nudge, styled in PolyglotMatch's own night
 * palette (dark glass card, pink #FF3EA5 / violet #8B5CF6 accents), not in
 * Klovers ivory.
 *
 * Who speaks follows each character's canon roles (src/config/klovers-world.ts):
 *   Lina  - curiosity, culture, real-life context  -> how to open a chat, what to ask
 *   Adam  - structure, strategy, confidence        -> safety and how to keep it going
 *   Cluby - motivation, hints, celebrating progress -> matches and empty moments
 * Characters support learning; every line is a practical tip, never lore.
 * Adam and Lina stay friends and study companions: no romantic wording.
 */
type Speaker = "lina" | "adam" | "cluby";

const CAST: Record<Speaker, { en: string; ar: string; img: string }> = {
  lina: { en: "Lina", ar: "لينا", img: "/assets/exchange/avatars/lina-classic.webp" },
  adam: { en: "Adam", ar: "آدم", img: "/assets/exchange/avatars/adam-classic.webp" },
  cluby: { en: "Cluby", ar: "كلوبي", img: "/assets/exchange/avatars/cluby-celebrate.webp" },
};

export function CastLine({
  who,
  isAr,
  children,
  compact = false,
  className = "",
}: {
  who: Speaker;
  isAr: boolean;
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const c = CAST[who];
  const size = compact ? "h-9 w-9" : "h-12 w-12";
  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`flex items-start gap-3 text-start ${className}`}
    >
      <img
        src={c.img}
        alt=""
        aria-hidden="true"
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        className={`${size} shrink-0 rounded-full object-cover ring-2 ring-[#FF3EA5]/60 shadow-[0_0_18px_rgba(255,62,165,0.35)]`}
      />
      <div className="relative min-w-0 flex-1 rounded-2xl rounded-ss-sm border border-white/10 bg-white/[0.05] px-3.5 py-2.5 backdrop-blur-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF7AC6]">
          {isAr ? c.ar : c.en}
        </p>
        <div className={`${compact ? "text-xs" : "text-sm"} mt-0.5 leading-relaxed text-white/85`}>{children}</div>
      </div>
    </div>
  );
}

export default CastLine;
