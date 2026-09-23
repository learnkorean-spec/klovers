import { Send, Facebook } from "lucide-react";
import { logLeadEvent } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";

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
 * 2026-09-24: ONE PAINTED SCENE, NOT CUT-OUTS. The flat girl / Klobi / boy
 * cut-outs and their ivory dome are gone (the 3D Cluby is the only mascot).
 * The picnic scene fills the start half of the band and dissolves into the
 * yellow through a CSS mask, so the band's own colour is what it fades into
 * in both themes. On phones it sits on top and fades downward. Two <img>
 * elements carry the two mask directions (the mask cannot be responsive
 * inline); they share one file, and the hidden one is never fetched.
 */

const FADE_DOWN = {
  WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
  maskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
};
const FADE_RIGHT = {
  WebkitMaskImage: "linear-gradient(to right, #000 55%, transparent 100%)",
  maskImage: "linear-gradient(to right, #000 55%, transparent 100%)",
};
const FADE_LEFT = {
  WebkitMaskImage: "linear-gradient(to left, #000 55%, transparent 100%)",
  maskImage: "linear-gradient(to left, #000 55%, transparent 100%)",
};

const CommunityBand = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const alt = isAr
    ? "صديقان مع كلوبي في نزهة على ضفاف نهر الهان"
    : "Two friends and Cluby at a picnic by the Han river";

  return (
    <section className="relative overflow-hidden border-y border-charcoal/10 bg-primary dark:bg-[#E8E000]">
      {/* The picnic scene: on top on phones, the start half of the band on md+. */}
      <div className="md:absolute md:inset-y-0 md:start-0 md:w-1/2">
        <img
          src="/assets/cluby/picnic.webp"
          alt={alt}
          width={1600}
          height={900}
          loading="lazy"
          decoding="async"
          className="block h-56 w-full object-cover sm:h-72 md:hidden"
          style={FADE_DOWN}
        />
        <img
          src="/assets/cluby/picnic.webp"
          alt={alt}
          width={1600}
          height={900}
          loading="lazy"
          decoding="async"
          className="hidden h-full w-full object-cover md:block"
          style={isAr ? FADE_LEFT : FADE_RIGHT}
        />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mx-auto flex max-w-5xl md:min-h-[320px] md:items-center md:justify-end lg:min-h-[380px]">
          <div className="w-full pb-7 pt-1 text-center md:w-1/2 md:py-12 md:ps-10 md:text-start">
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
