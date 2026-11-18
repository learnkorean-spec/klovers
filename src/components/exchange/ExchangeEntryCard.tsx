import { Link } from "react-router-dom";
import { MessageCircle, Sparkles } from "lucide-react";
import { FaceSvg } from "@/components/exchange/AvatarArt";

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
    note: "Free · avatars only, no photos.",
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
 * The picture is a small illustrated scene built from the feature's own
 * cartoon-avatar cast (AvatarArt — see that file's header comment: original
 * flat-vector characters, never a real photo, nothing romantic) rather than
 * a stock photo: it reuses an asset the feature already ships, costs nothing
 * extra to load, and keeps the same "friends and study companions" framing
 * CLAUDE.md's story canon draws for the two learners.
 */
export default function ExchangeEntryCard({ isAr, compact = false }: ExchangeEntryCardProps) {
  const copy = COPY[isAr ? "ar" : "en"];

  // Styled in PolyglotMatch's "Midnight" identity (see PolyglotMatchLandingPage):
  // the card is the door into /exchange, so it should look like the place it
  // opens onto, not like the cream Klovers chrome around it.
  return (
    <section className={compact ? "" : "px-4 pt-4"} aria-labelledby="exchange-entry-title">
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0C0A16] text-[#F3F1FA] shadow-[0_0_0_1px_rgba(255,62,165,0.18),0_20px_60px_-20px_rgba(139,92,246,0.45)] md:grid-cols-[1.1fr_1fr]"
      >
        {/* ambient glow, same two blobs as the landing page. They live inside
            their own clipping layer: left loose they stick out past the card,
            which makes the card (overflow-hidden) a scrollable box, and then
            scrollIntoView / Tab-focus on the CTA slides the whole card up and
            to the left. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,62,165,0.30),transparent_70%)] blur-xl" />
          <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_70%)] blur-xl" />
        </div>

        <div
          className={`relative flex items-center justify-center gap-3 overflow-hidden bg-gradient-to-br from-[#2A1F4D] via-[#512A6B] to-[#8B5CF6]/80 ${compact ? "h-36" : "h-48"} md:h-auto`}
          aria-hidden="true"
        >
          <FaceSvg
            face={{ skin: "#D8A26A", hair: "#2B1B12", hairStyle: "short", glasses: true }}
            className="h-20 w-20 md:h-28 md:w-28 drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] -rotate-3"
          />
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF3EA5] to-[#8B5CF6] shadow-[0_8px_24px_-6px_rgba(255,62,165,0.7)] md:h-14 md:w-14">
            <MessageCircle className="h-5 w-5 text-white md:h-7 md:w-7" strokeWidth={2.5} />
          </span>
          <FaceSvg
            face={{ skin: "#F1C27D", hair: "#2F6F62", hairStyle: "hijab" }}
            className="h-20 w-20 md:h-28 md:w-28 drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] rotate-3"
          />
        </div>

        <div className={`relative flex flex-col justify-center gap-3 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1 text-[12px] font-bold text-[#D9D4F0]">
            <Sparkles className="h-3.5 w-3.5 text-[#FF8FC8]" />
            {copy.eyebrow}
          </span>
          <h2
            id="exchange-entry-title"
            className="text-2xl font-bold leading-tight md:text-3xl"
            style={{ fontFamily: "'Poppins', 'Cairo', sans-serif" }}
          >
            {copy.titleLead}{" "}
            <span className="bg-gradient-to-r from-[#FF3EA5] via-[#8B5CF6] to-[#22D3EE] bg-clip-text text-transparent">
              {copy.titleAccent}
            </span>
          </h2>
          <p className="text-sm leading-relaxed text-[#C3BEDB]">{copy.line}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              to="/exchange/app"
              className="inline-flex min-h-11 items-center rounded-full bg-gradient-to-r from-[#FF3EA5] to-[#8B5CF6] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(255,62,165,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8FC8]"
            >
              {copy.cta}
            </Link>
            <span className="text-xs text-[#A79FC9]">{copy.note}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
