import { Send, Facebook } from "lucide-react";
import { logLeadEvent } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { GIRL_WAVE } from "@/assets/band/girlWave";
import { BOY_WAVE } from "@/assets/band/boyWave";
import { KLOBI_WAVE } from "@/assets/band/klobiWave";

/**
 * The community band: Telegram and Facebook, between the testimonials and the
 * culture block.
 *
 * 2026-09-20 (a): it was painted in Telegram's blue and Facebook's blue.
 * Neither is a Klovers colour and the brand owns exactly five; the icon in
 * each button already names its platform, so the buttons went Charcoal.
 *
 * 2026-09-20 (b): THE NUMBER IS GONE. It read "Join 2,000+ Korean Learners"
 * and, in Arabic, "انضم لأكثر من ٢٠٠٠+ متعلم" - a figure nothing on this site
 * supports, hedged twice over in the Arabic ("more than 2,000+"). The one
 * verified count Klovers has is 200+ students in 13 years, it lives in the
 * hero, and it counts STUDENTS - not community members, which nobody has
 * measured. A band that asks people to join a community does not need to
 * claim its size. Same call as the referral card's invented "+10,000" and
 * the five invented leaderboard players that were deleted rather than scaled
 * up. If the platforms' own member counts are ever pulled, a real number can
 * come back here with its source.
 *
 * 2026-09-20 (c): THREE CUTOUTS, NOT ONE PICTURE. Re first supplied a single
 * composite illustration of the three characters with speech bubbles. It was
 * lovely and it is the wrong shape for a band: a composite bakes in the
 * arrangement, the spacing and the background it was drawn on. These three
 * transparent cutouts stand on the Mint itself, so the band's colour shows
 * between them; they can be re-ordered or re-spaced; and they shrink
 * independently on a phone instead of becoming one unreadable strip.
 *
 * Klobi is SHORTER IN HIS OWN FILE rather than scaled down here, so
 * `items-end` alone puts the three at the right relative heights. Do not
 * "fix" that by giving all three the same height class.
 *
 * They are decoration: the band's meaning is the heading and the two links,
 * so every one of them is alt="" and aria-hidden.
 */

/**
 * The cast, in the order they stand: Klobi between the two of them, as on the
 * brand sheet. Literal class strings - Tailwind's scanner only keeps what it
 * can see, so these must never be assembled from fragments.
 */
const CAST = [
  { src: GIRL_WAVE, cls: "h-[92px] sm:h-[120px]" },
  { src: KLOBI_WAVE, cls: "-ms-2 h-[58px] sm:h-[76px]" },
  { src: BOY_WAVE, cls: "-ms-2 h-[92px] sm:h-[120px]" },
];

const CommunityBand = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="border-y border-charcoal/10 bg-mint/60 py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center md:flex-row md:justify-between md:gap-10 md:text-start">

          {/* The three of them, standing on the band. */}
          <div className="flex shrink-0 items-end" aria-hidden="true">
            {CAST.map((c, i) => (
              <img
                key={i}
                src={c.src}
                alt=""
                loading="lazy"
                decoding="async"
                className={`w-auto ${c.cls}`}
              />
            ))}
          </div>

          <div className="md:flex-1">
            <p className="text-xl font-extrabold leading-tight text-charcoal md:text-2xl">
              {isAr ? "انضم لمجتمع كلوفرز" : "Join the Klovers community"}
            </p>
            <p className="mt-1 text-sm text-charcoal/65 md:text-base">
              {isAr
                ? "على تيليغرام وفيسبوك — أسئلة، تدريب، وناس بتتعلم معاك"
                : "On Telegram and Facebook — questions, practice, and people learning alongside you"}
            </p>

            {/* These two stay on logLeadEvent: clicking through to the
                community is something a person chose to do, which is what a
                Lead is. The cta_label values are unchanged and must stay
                unchanged - they are what the funnel is measured on. */}
            <div className="mt-4 flex justify-center gap-3 md:justify-start">
              <a
                href="https://t.me/+Fu5T7d4wLMsxNDY9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-charcoal/90"
                onClick={() => { try { logLeadEvent({ source_type: "community", cta_label: "community_band_telegram" }); } catch {} }}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {isAr ? "تيليغرام" : "Telegram"}
              </a>
              <a
                href="https://www.facebook.com/kloversegy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-charcoal/90"
                onClick={() => { try { logLeadEvent({ source_type: "community", cta_label: "community_band_facebook" }); } catch {} }}
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
                {isAr ? "فيسبوك" : "Facebook"}
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CommunityBand;
