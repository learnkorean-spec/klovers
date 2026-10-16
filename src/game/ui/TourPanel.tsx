import { useEffect, useRef } from "react";
import type { WorldLang } from "../config/copy";
import { VILLAGE } from "../config/rooms";
import type { TourSlide } from "../config/tour";

/**
 * The Klovers tour in Hangul Village, read like a presentation while walking it:
 * one slide per board, next and back walk the learner to that board, and
 * the tour can be left at any time. On a phone it is a sheet over the lower
 * part of the screen; on a computer, a column at the side — the board the
 * slide belongs to stays in view either way.
 */
const TEXT = {
  en: { eyebrow: "Klovers tour", back: "Back", next: "Next", last: "Explore the world", skip: "Skip the tour", of: "of" },
  ar: { eyebrow: "جولة كلوفرز", back: "السابق", next: "التالي", last: "استكشف العالم", skip: "تخطّي الجولة", of: "من" },
} as const;

export default function TourPanel({
  lang,
  slides,
  index,
  onGo,
  onSkip,
  onFinish,
  onOpen,
}: {
  lang: WorldLang;
  slides: TourSlide[];
  index: number;
  /** Walk to this slide's board. */
  onGo: (i: number) => void;
  onSkip: () => void;
  /** After the last slide: on into the world. */
  onFinish: () => void;
  /** Out to a page of the site. */
  onOpen: (to: string) => void;
}) {
  const t = TEXT[lang];
  const s = slides[index];
  const last = index === slides.length - 1;
  const num = (v: number) => (lang === "ar" ? v.toLocaleString("ar-EG") : String(v));
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headRef.current?.focus(), [index]);
  if (!s) return null;
  return (
    <section
      aria-label={t.eyebrow}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="pointer-events-auto absolute inset-x-2 bottom-2 z-[15] flex max-h-[52vh] flex-col rounded-3xl bg-ivory text-charcoal shadow-2xl sm:inset-x-auto sm:bottom-auto sm:end-4 sm:top-20 sm:max-h-[calc(100%-6rem)] sm:w-[380px] motion-safe:animate-in motion-safe:fade-in"
    >
      <header className="flex items-center gap-3 px-5 pt-4">
        <span aria-hidden="true" className="h-1.5 w-8 rounded-full bg-klovers-yellow" />
        <p className="text-xs font-bold uppercase tracking-wide text-charcoal/60">
          {t.eyebrow} · {num(index + 1)} {t.of} {num(slides.length)}
        </p>
        <button type="button" onClick={onSkip} className="ms-auto min-h-9 rounded-full px-3 text-xs font-bold text-charcoal/70 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-charcoal">
          {t.skip}
        </button>
      </header>
      {/* Progress: one dot per board, the ones seen filled. */}
      <ol className="flex gap-1.5 px-5 pt-2" aria-hidden="true">
        {slides.map((x, i) => (
          <li key={x.stop} className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-charcoal" : "bg-charcoal/15"}`} />
        ))}
      </ol>
      <div className="flex-1 overflow-y-auto px-5 pb-3 pt-3">
        <p lang="ko" dir="ltr" className={`font-ko text-sm font-bold text-charcoal/60 ${lang === "ar" ? "text-right" : ""}`}>
          {VILLAGE.tour.find((b) => b.id === s.stop)?.sign}
        </p>
        <h2 ref={headRef} tabIndex={-1} className="font-display text-2xl font-bold leading-tight outline-none">
          {s.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/85">{s.lead}</p>
        {s.points && (
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {s.points.map((p) => (
              <li key={p} className="flex gap-2">
                <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-klovers-yellow ring-1 ring-charcoal/30" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
        {s.pictures && (
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {s.pictures.map((p) => (
              <li key={p.src} className="overflow-hidden rounded-2xl bg-white">
                <img src={p.src} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <p className="px-2 pt-1.5 text-xs font-bold">{p.label}</p>
                <p className="px-2 pb-2 text-xs text-charcoal/70">{p.line}</p>
              </li>
            ))}
          </ul>
        )}
        {s.links && (
          <div className="mt-3 flex flex-wrap gap-2">
            {s.links.map((l) => (
              <button
                key={l.to}
                type="button"
                onClick={() => onOpen(l.to)}
                className={`min-h-10 rounded-full border-2 px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal ${
                  l.primary ? "border-charcoal bg-klovers-yellow text-charcoal" : "border-charcoal/25 text-charcoal hover:border-charcoal/60"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <footer className="flex gap-2 border-t border-charcoal/10 px-5 py-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onGo(index - 1)}
          className="min-h-11 rounded-full border-2 border-charcoal/25 px-4 text-sm font-bold disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-charcoal"
        >
          {t.back}
        </button>
        <button
          type="button"
          onClick={() => (last ? onFinish() : onGo(index + 1))}
          className="min-h-11 flex-1 rounded-full border-2 border-charcoal bg-charcoal px-4 text-sm font-bold text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-klovers-yellow"
        >
          {last ? t.last : t.next}
        </button>
      </footer>
    </section>
  );
}
