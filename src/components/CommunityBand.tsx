import { Send, Facebook } from "lucide-react";
import { logLeadEvent } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { GIRL_WAVE } from "@/assets/band/girlWave";
import { BOY_WAVE } from "@/assets/band/boyWave";
import { KLOBI_WAVE } from "@/assets/band/klobiWave";

/**
 * The community band: Telegram and Facebook, between the testimonials and the
 * "why learn Korean" block.
 *
 * 2026-09-20 (a): it was painted in Telegram's blue and Facebook's blue.
 * Neither is a Klovers colour; the icon in each button already names its
 * platform, so the buttons went Charcoal.
 *
 * 2026-09-20 (b): the number was removed as unsupported.
 *
 * 2026-09-23: THE NUMBER IS BACK, WITH ITS SCOPE. Re confirmed the two
 * figures: 200+ is the students she has taught herself (hero), and 2,000+ is
 * the Klovers community across social media (the Facebook page alone showed
 * 2.4K followers when FinalCTA checked it on 18 Sep). They only looked like a
 * contradiction when one was called "students" and the other "learners". This
 * band says "on social media", so it counts followers, never students.
 *
 * 2026-09-20 (c): THREE CUTOUTS, NOT ONE PICTURE. These three transparent
 * cutouts stand on the yellow band itself, so the band's colour shows between
 * them; they can be re-ordered or re-spaced; and they shrink independently on
 * a phone instead of becoming one unreadable strip.
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
    <section className="border-y border-charcoal/10 bg-primary py-6 md:py-8 dark:bg-[#E8E000]">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center md:flex-row md:justify-between md:gap-10 md:text-start">

          {/* The three of them, standing on the band. */}
          <div className="relative flex shrink-0 items-end px-3" aria-hidden="true">
            {/* Ivory dome behind them: their outfits are a warmer yellow than the
                band, and only the outline separates them from it. */}
            <span className="absolute inset-x-0 bottom-0 top-2 rounded-t-full bg-ivory" />
            {CAST.map((c, i) => (
              <img
                key={i}
                src={c.src}
                alt=""
                loading="lazy"
                decoding="async"
                className={`relative w-auto ${c.cls}`}
              />
            ))}
          </div>

          <div className="md:flex-1">
            <p className="text-xl font-extrabold leading-tight text-charcoal md:text-2xl">
              {isAr ? "انضم لأكثر من ٢٠٠٠ متابع في مجتمع كلوفرز" : "Join 2,000+ people in the Klovers community"}
            </p>
            <p className="mt-1 text-sm text-charcoal/65 md:text-base">
              {isAr
                ? "متابعونا على السوشيال ميديا — أسئلة، تدريب، وناس بتتعلم معاك"
                : "Our followers across social media — questions, practice, and people learning alongside you"}
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
