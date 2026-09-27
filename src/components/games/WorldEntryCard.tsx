import { Link, useLocation } from "react-router-dom";
import { WORLD_COPY } from "@/game/config/copy";

interface WorldEntryCardProps {
  isAr: boolean;
  /** Dashboard size: a shorter picture, the same door. */
  compact?: boolean;
}

/**
 * The door into KLOVERS World (3D prototype) from the games hub.
 *
 * A plain link: nothing 3D is downloaded until /world opens, and hovering
 * does not prefetch it either, so this card costs the games page one image.
 * The picture is the existing egg-teaser scene — the same hanok courtyard
 * and plinth the 3D lobby is built on.
 */
export default function WorldEntryCard({ isAr, compact = false }: WorldEntryCardProps) {
  const copy = WORLD_COPY[isAr ? "ar" : "en"];
  const { pathname } = useLocation();

  return (
    <section className={compact ? "" : "px-4 pt-4"} aria-labelledby="world-entry-title">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-border bg-charcoal text-ivory md:grid-cols-[1.1fr_1fr]">
        <img
          src="/assets/story/egg-teaser.webp"
          alt={isAr ? "الصديقان أمام بيضة البرسيم في ساحة الهانوك" : "The two friends beside the clover egg in the hanok courtyard"}
          width={1600}
          height={900}
          loading="lazy"
          decoding="async"
          className={`${compact ? "h-36" : "h-48"} w-full object-cover md:h-full`}
        />
        <div className={`flex flex-col justify-center gap-3 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-klovers-yellow">{copy.entryEyebrow}</p>
          <h2 id="world-entry-title" className="font-display text-2xl font-extrabold leading-tight md:text-3xl">
            {copy.entryTitle}
          </h2>
          <p className="text-sm text-ivory/80">{copy.entryLine}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              to="/world"
              state={{ from: pathname }}
              className="inline-flex min-h-11 items-center rounded-full border-2 border-klovers-yellow bg-klovers-yellow px-6 text-sm font-bold text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
            >
              {copy.entryCta}
            </Link>
            <span className="text-xs text-ivory/70">{copy.entryNote}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
