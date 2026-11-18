import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

interface ExchangeEntryCardProps {
  isAr: boolean;
  /** Dashboard size: a shorter picture, same door — matches WorldEntryCard's own prop. */
  compact?: boolean;
}

const COPY = {
  en: {
    eyebrow: "New · PolyglotMatch by Klovers",
    titleLead: "Find a",
    titleAccent: "language exchange partner",
    line: "Match with another Klovers learner, pick a free-time slot that works for both of you, and start chatting — right here on Klovers, nothing to install.",
    cta: "Find a partner",
    note: "Free · learners show avatars, never photos.",
  },
  ar: {
    eyebrow: "جديد · PolyglotMatch من كلوفرز",
    titleLead: "ابحث عن",
    titleAccent: "شريك لتبادل اللغة",
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
 * The picture is a photo of Adam and Lina at a language-exchange meetup
 * (public/assets/exchange/exchange-meetup.webp, 18 Nov 2026), friends and
 * study companions per the story canon, never posed as a couple.
 */
export default function ExchangeEntryCard({ isAr, compact = false }: ExchangeEntryCardProps) {
  const copy = COPY[isAr ? "ar" : "en"];

  /*
   * 18 Nov 2026 (Re: "fix and must be merged"): the card used to wear
   * PolyglotMatch's own "Midnight" identity (near-black, pink/violet/cyan
   * gradients, flat cartoon faces), which read as a different, younger brand
   * sitting in the middle of Klovers. It now speaks Klovers: ivory card,
   * charcoal type, one yellow CTA, and a real photo of Adam and Lina at a
   * language-exchange meetup, dressed for the café (mustard knit, cream
   * cardigan). /exchange itself keeps its own look; only the door matches
   * the house it sits in.
   */
  return (
    <section className={compact ? "" : "px-4 pt-4"} aria-labelledby="exchange-entry-title">
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[22px] border border-charcoal/10 bg-ivory text-charcoal shadow-[0_18px_40px_-24px_rgba(46,46,46,0.6)] md:grid-cols-[1.1fr_1fr]"
      >
        <div className={`relative overflow-hidden ${compact ? "h-40" : "h-56"} md:h-auto md:min-h-[300px]`}>
          <img
            src="/assets/exchange/exchange-meetup.webp"
            alt={isAr ? "آدم ولينا في لقاء تبادل لغة في مقهى في سول" : "Adam and Lina at a language-exchange meetup in a Seoul café"}
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className={`relative flex flex-col justify-center gap-3 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-klovers-yellow px-3.5 py-1 text-[12px] font-bold text-charcoal">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.eyebrow}
          </span>
          <h2 id="exchange-entry-title" className="font-display text-2xl font-extrabold leading-tight md:text-3xl">
            {copy.titleLead} <span className="underline decoration-klovers-yellow decoration-4 underline-offset-4">{copy.titleAccent}</span>
          </h2>
          <p className="text-sm leading-relaxed text-charcoal/80">{copy.line}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              to="/exchange/app"
              className="inline-flex min-h-11 items-center rounded-full bg-klovers-yellow px-6 text-sm font-bold text-charcoal ring-1 ring-charcoal/10 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(46,46,46,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
            >
              {copy.cta}
            </Link>
            <span className="text-xs text-charcoal/70">{copy.note}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
