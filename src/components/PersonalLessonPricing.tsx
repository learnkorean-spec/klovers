import { tierPrices, tierCountries, type TierKey } from "@/lib/stripePrices";

/**
 * Pricing for the three personal-lesson pages (maktub/Arabic, Voca/English,
 * Buda/Hungarian) — added 24 Oct 2026 at Re's request ("add prices that
 * matches"). Re confirmed: reuse her existing private-lesson tiers exactly
 * as already priced for her private 1:1 Korean lessons in
 * src/lib/stripePrices.ts (local/regional/global, $50/$80/$120 per month of
 * 4 classes), rather than a new number invented for this page. Per-lesson
 * figures below are derived from that same table — $12.50 / $20 / $30 — so a
 * future change to those canonical prices updates this section too instead
 * of silently drifting out of sync.
 *
 * These three pages have no checkout of their own (unlike the Korean
 * courses): the only conversion path is PersonalTrialBooking's free trial /
 * WhatsApp message, so this section is informational, not a purchase flow.
 * All three tiers are shown explicitly rather than auto-detecting the
 * visitor's country — the sitewide country-guess (stripePrices'
 * normalizeCountry) only ever trusts an Africa/Cairo timezone or a signed-in
 * profile, so for an anonymous visitor on one of these marketing pages it
 * would silently default to the Egypt/local tier for almost everyone,
 * including the international visitors Voca and the repositioned maktub
 * page are written for. Letting the visitor pick their own region is more
 * honest than a guess that's wrong most of the time for this audience.
 */

type TrFn = (en: string, ar: string) => string;

const TIER_ORDER: TierKey[] = ["local", "regional", "global"];

const TIER_LABEL: Record<TierKey, { en: string; ar: string; regionsEn: string; regionsAr: string }> = {
  local: {
    en: "Egypt & nearby",
    ar: "مصر والمنطقة",
    regionsEn: "Egypt, Morocco, Tunisia, Algeria, Jordan, Iraq, and nearby",
    regionsAr: "مصر، المغرب، تونس، الجزائر، الأردن، العراق، وما حولها",
  },
  regional: {
    en: "Southeast Asia & Latin America",
    ar: "جنوب شرق آسيا وأمريكا اللاتينية",
    regionsEn: "Malaysia, Indonesia, India, Brazil, Mexico, Turkey, and nearby",
    regionsAr: "ماليزيا، إندونيسيا، الهند، البرازيل، المكسيك، تركيا، وما حولها",
  },
  global: {
    en: "Gulf, US, UK & Europe",
    ar: "الخليج وأمريكا والمملكة المتحدة وأوروبا",
    regionsEn: "UAE, Saudi Arabia, the US, the UK, Germany, and nearby",
    regionsAr: "الإمارات، السعودية، الولايات المتحدة، المملكة المتحدة، ألمانيا، وما حولها",
  },
};

interface PersonalLessonPricingProps {
  tr: TrFn;
  /** Anchor id so a header nav / "See pricing" link can jump here. */
  id?: string;
  /** Section background. */
  background?: string;
  /** Heading / accent ink color. */
  ink: string;
  /** The one highlighted tier's accent color (brand "signal" color). */
  signal: string;
  /** Text color on top of `signal` (usually a dark or white depending on the brand). */
  signalText?: string;
  /** Heading font, matching whatever the rest of the page uses. */
  headingStyle?: React.CSSProperties;
  /** Which tier to visually highlight as "most students" — defaults to local. */
  highlightTier?: TierKey;
  /** Anchor href for the "Book a free trial" button below the prices. */
  trialHref?: string;
}

const PersonalLessonPricing = ({
  tr,
  id,
  background,
  ink,
  signal,
  signalText = "#111111",
  headingStyle,
  highlightTier = "local",
  trialHref = "#trial",
}: PersonalLessonPricingProps) => {
  return (
    <section className="py-20 border-b" style={background ? { backgroundColor: background } : undefined} id={id}>
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-semibold" style={{ ...headingStyle, color: ink }}>
          {tr("Pricing", "الأسعار")}
        </h2>
        <p className="mt-3 max-w-xl text-sm" style={{ color: `${ink}99` }}>
          {tr(
            "Priced by region, same lessons everywhere: 4 lessons a month, billed monthly. Not sure which is yours? Ask on the free call.",
            "الأسعار حسب المنطقة، نفس الدروس في كل مكان: ٤ دروس شهريًا، بفاتورة شهرية. غير متأكد من فئتك؟ اسأل في المكالمة المجانية.",
          )}
        </p>
        <div className="mt-9 grid gap-5 sm:grid-cols-3">
          {TIER_ORDER.map((tier) => {
            const perLesson = tierPrices[tier].private[1] / 4;
            const monthly = tierPrices[tier].private[1];
            const isHighlighted = tier === highlightTier;
            const label = TIER_LABEL[tier];
            return (
              <div
                key={tier}
                className="rounded-2xl border p-6"
                style={
                  isHighlighted
                    ? { backgroundColor: signal, borderColor: signal, color: signalText }
                    : { borderColor: `${ink}26`, color: ink }
                }
              >
                <p className="text-sm font-semibold opacity-80">{tr(label.en, label.ar)}</p>
                <p className="mt-3 text-3xl font-bold">
                  ${perLesson % 1 === 0 ? perLesson : perLesson.toFixed(2)}
                  <span className="text-base font-medium opacity-70">{tr(" / lesson", " / درس")}</span>
                </p>
                <p className="mt-1 text-xs opacity-70">
                  {tr(`$${monthly}/month, 4 lessons`, `${monthly}$ شهريًا، ٤ دروس`)}
                </p>
                <p className="mt-4 text-xs leading-relaxed opacity-70">
                  {tr(label.regionsEn, label.regionsAr)}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-xs" style={{ color: `${ink}80` }}>
          {tr(
            `Countries not listed above fall under the nearest tier — ${tierCountries.local.length + tierCountries.regional.length + tierCountries.global.length} countries covered in total.`,
            `الدول غير المذكورة أعلاه تندرج تحت أقرب فئة.`,
          )}
        </p>
        <div className="mt-8">
          <a
            href={trialHref}
            className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold hover:brightness-95"
            style={{ backgroundColor: signal, color: signalText }}
          >
            {tr("Book a free trial lesson", "احجز حصة تجريبية مجانية")}
          </a>
        </div>
      </div>
    </section>
  );
};

export default PersonalLessonPricing;
