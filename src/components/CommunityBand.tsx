import { Send, Facebook } from "lucide-react";
import { logLeadEvent } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";

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
 * claim its size.
 *
 * This is the same call as the referral card's invented "+10,000" and the
 * five invented leaderboard players that were deleted rather than scaled up.
 * If the Telegram and Facebook member counts are ever pulled from the
 * platforms themselves, a real number can come back here with its source.
 *
 * 2026-09-20 (c): THE CHARACTERS. Re supplied the artwork - the girl, the boy
 * and Klobi the dragon, greeting the reader in Korean with English glosses,
 * and "Same Journey, New Friend" lettered into the picture. That line is the
 * band's whole argument, so the copy beside it does not repeat it.
 *
 * The image is decorative: the speech bubbles inside it are pictures of
 * words, not text a screen reader can reach, and the band's meaning is
 * carried by the heading and the two links. Hence the empty alt. If it ever
 * becomes the only place something is said, that has to change.
 */

/**
 * Lives in public/, not inlined as a data URI like src/assets/characters.ts.
 * That file explains the rule it was breaking: above roughly 20KB an image
 * belongs in public/ as a real file, and this one is ~47KB.
 */
const CHARACTERS_IMAGE = "/assets/klovers-characters.webp";

const CommunityBand = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="border-y border-charcoal/10 bg-mint/60 py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:gap-10 md:text-start">
          <img
            src={CHARACTERS_IMAGE}
            alt=""
            aria-hidden="true"
            width={537}
            height={432}
            loading="lazy"
            decoding="async"
            className="w-56 shrink-0 rounded-2xl shadow-sm sm:w-64 md:w-72"
          />

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
