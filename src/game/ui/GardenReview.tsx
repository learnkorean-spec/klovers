import { useEffect } from "react";
import { VocabularyReview } from "@/components/VocabularyReview";
import { useSRS } from "@/hooks/useSRS";
import { WORLD_COPY, type WorldLang } from "../config/copy";

/**
 * The memory stone in Cluby's Memory Garden: the learner's real review —
 * the same spaced-repetition cards and the same saving as the site's review
 * page (useSRS / VocabularyReview), held up beside the scene like the
 * world's other cards. Each answer reschedules the word (SM-2); on closing,
 * the garden re-reads the schedule and the reviewed words' buds open.
 */
export default function GardenReview({ lang, onClose }: { lang: WorldLang; onClose: () => void }) {
  const { dueCards, loading, recordReview } = useSRS();
  const t = WORLD_COPY[lang].garden;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-charcoal/25 p-4 sm:justify-end sm:pe-10 lg:pe-20" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-3xl bg-ivory p-5 text-charcoal shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/60">{t.title}</p>
          <p className="mt-1 text-sm text-charcoal/80">{loading || dueCards.length ? t.intro : t.resting}</p>
        </div>
        {(loading || dueCards.length > 0) && <VocabularyReview cards={dueCards} onComplete={recordReview} isLoading={loading} />}
        <button
          type="button"
          onClick={onClose}
          className="min-h-10 self-center rounded-full border-2 border-charcoal bg-klovers-yellow px-6 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
