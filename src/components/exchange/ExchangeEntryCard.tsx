import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { FaceSvg } from "@/components/exchange/AvatarArt";

interface ExchangeEntryCardProps {
  isAr: boolean;
  /** Dashboard size: a shorter picture, same door — matches WorldEntryCard's own prop. */
  compact?: boolean;
}

const COPY = {
  en: {
    eyebrow: "New · study partners",
    title: "Find a language exchange partner",
    line: "Match with another Klovers learner, pick a free-time slot that works for both of you, and start chatting — right here on Klovers, nothing to install.",
    cta: "Find a partner",
    note: "Free · avatars only, no photos.",
  },
  ar: {
    eyebrow: "جديد · شركاء دراسة",
    title: "ابحث عن شريك لتبادل اللغة",
    line: "تطابق مع متعلم آخر في كلوفرز، واختارا معًا وقتًا مناسبًا لكما، وابدآ المحادثة — كل ذلك داخل كلوفرز دون الحاجة إلى أي تطبيق آخر.",
    cta: "ابحث عن شريك",
    note: "مجانًا · صور افتراضية فقط، دون صور شخصية.",
  },
} as const;

/**
 * The door into the Language Exchange feature (/exchange) from the student
 * dashboard — mirrors WorldEntryCard's shape exactly (picture left, copy +
 * CTA right) so the dashboard reads as one family of "go do this next"
 * cards, not a page of unrelated widgets.
 *
 * The picture is a small illustrated scene built from the feature's own
 * cartoon-avatar cast (AvatarArt — see that file's header comment: original
 * flat-vector characters, never a real photo, nothing romantic) rather than
 * a stock photo: it reuses an asset the feature already ships, costs nothing
 * extra to load, and keeps the same "friends and study companions" framing
 * CLAUDE.md's story canon draws for the two learners.
 */
export default function ExchangeEntryCard({ isAr, compact = false }: ExchangeEntryCardProps) {
  const copy = COPY[isAr ? "ar" : "en"];

  return (
    <section className={compact ? "" : "px-4 pt-4"} aria-labelledby="exchange-entry-title">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-teal-50 to-indigo-50 dark:from-teal-950/40 dark:to-indigo-950/40 md:grid-cols-[1.1fr_1fr]">
        <div
          className={`relative flex items-center justify-center gap-3 overflow-hidden ${compact ? "h-36" : "h-48"} md:h-full`}
          aria-hidden="true"
        >
          <FaceSvg
            face={{ skin: "#D8A26A", hair: "#2B1B12", hairStyle: "short", glasses: true }}
            className="h-20 w-20 md:h-28 md:w-28 drop-shadow-md -rotate-3"
          />
          <MessageCircle className="h-7 w-7 shrink-0 text-teal-600 dark:text-teal-300 md:h-9 md:w-9" strokeWidth={2.5} />
          <FaceSvg
            face={{ skin: "#F1C27D", hair: "#2F6F62", hairStyle: "hijab" }}
            className="h-20 w-20 md:h-28 md:w-28 drop-shadow-md rotate-3"
          />
        </div>
        <div className={`flex flex-col justify-center gap-3 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">{copy.eyebrow}</p>
          <h2 id="exchange-entry-title" className="font-display text-2xl font-extrabold leading-tight text-charcoal dark:text-foreground md:text-3xl">
            {copy.title}
          </h2>
          <p className="text-sm text-charcoal/80 dark:text-foreground/80">{copy.line}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              to="/exchange/app"
              className="inline-flex min-h-11 items-center rounded-full border-2 border-teal-600 bg-teal-600 px-6 text-sm font-bold text-white hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
            >
              {copy.cta}
            </Link>
            <span className="text-xs text-charcoal/60 dark:text-foreground/60">{copy.note}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
