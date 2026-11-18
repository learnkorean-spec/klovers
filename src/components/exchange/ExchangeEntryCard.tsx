import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { ExchangeJourneyStrip } from "@/components/exchange/ExchangeJourney";

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
    line: "Match with a learner who shares your interests, pick a time that works for both of you, and start chatting right here on Klovers. Nothing to install.",
    cta: "Find a partner",
    note: "Free · learners show avatars, never photos.",
  },
  ar: {
    eyebrow: "جديد · PolyglotMatch من كلوفرز",
    titleLead: "ابحث عن",
    titleAccent: "شريك لتبادل اللغة",
    line: "تطابق مع متعلم يشاركك اهتماماتك، واختارا وقتًا يناسبكما، وابدآ المحادثة داخل كلوفرز. دون أي تطبيق آخر.",
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
  /*
   * 19 Nov 2026 (Re: "a fusion between the polyglot colors and yellow"):
   * the door is now half PolyglotMatch, half KLOVERS. Night panel and
   * pink/violet glow from PolyglotMatch, KLOVERS yellow for the badge, the
   * CTA and the frame, and Lina, Adam and Cluby continuing their journey
   * (ExchangeJourneyStrip) to say what this is: meeting people who share
   * your interests.
   */
  return (
    <section className={compact ? "" : "px-4 pt-4"} aria-labelledby="exchange-entry-title">
      <div className="pm-fuse mx-auto max-w-6xl rounded-[24px] p-[2px] shadow-[0_24px_50px_-26px_rgba(255,62,165,0.6)]">
        <div
          dir={isAr ? "rtl" : "ltr"}
          className="relative grid overflow-hidden rounded-[22px] bg-[#0C0A16] text-[#F3F1FA] md:grid-cols-[1fr_1.1fr]"
        >
          <div className="pointer-events-none absolute -top-20 end-[-60px] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,62,165,0.35),transparent_70%)] blur-xl" />
          <div className="pointer-events-none absolute -bottom-24 start-[-40px] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,230,0,0.22),transparent_70%)] blur-xl" />

          <div className={`relative flex flex-col justify-center gap-3 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-klovers-yellow px-3.5 py-1 text-[12px] font-bold text-charcoal">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.eyebrow}
            </span>
            <h2 id="exchange-entry-title" className="font-display text-2xl font-extrabold leading-tight md:text-3xl">
              {copy.titleLead} <span className="pm-fuse-text">{copy.titleAccent}</span>
            </h2>
            <p className="text-sm leading-relaxed text-[#C3BEDB]">{copy.line}</p>
            {!compact && <ExchangeJourneyStrip isAr={isAr} />}
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <Link
                to="/exchange/app"
                className="pm-fuse-btn inline-flex min-h-11 items-center rounded-full px-6 text-sm font-extrabold transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(255,62,165,0.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE600]"
              >
                {copy.cta}
              </Link>
              <span className="text-xs text-[#A79FC9]">{copy.note}</span>
            </div>
          </div>

          <div className={`relative order-first overflow-hidden md:order-last ${compact ? "h-40" : "h-56"} md:h-auto md:min-h-[320px]`}>
            <img
              src="/assets/exchange/exchange-meetup.webp"
              alt={isAr ? "آدم ولينا وكلوبي مع أصدقاء جدد في لقاء تبادل لغة في مقهى في سول" : "Adam, Lina and Cluby with new friends at a language-exchange meetup in a Seoul café"}
              width={1376}
              height={768}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A16]/70 via-transparent to-transparent md:bg-gradient-to-r md:rtl:bg-gradient-to-l md:from-[#0C0A16]/80 md:via-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
