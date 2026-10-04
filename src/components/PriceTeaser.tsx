import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildCountryLocalPrices, getTierForCountry, tierPrices } from "@/lib/stripePrices";
import { logLeadEvent } from "@/lib/leadTracking";
import { toArabicDigits } from "@/lib/trustFigures";

/**
 * "Live group classes from X/month" - the homepage's one line about price.
 *
 * THE NUMBER IS NOT WRITTEN HERE. It is the 1-month group bundle (4 live
 * classes) from src/lib/stripePrices.ts, the same table /pricing renders and
 * the Stripe price IDs are attached to. Change a price there and this line
 * changes with it.
 *
 * Country comes from the browser time zone, because that is all a first-time
 * visitor gives us. The map below is deliberately limited to zones that name
 * one country; anything else (or a zone we do not price) gets no number at all,
 * just a link to /pricing - a wrong price is worse than none.
 *
 * Currency follows /pricing: the country's own currency where the table has a
 * local row (EGP, SAR, AED...), otherwise the USD tier price.
 *
 * The "View pricing" link is a 44px tap target (inline-flex min-h-11): at
 * 375px it measured 20px tall.
 */

const ZONE_COUNTRY: Record<string, string> = {
  "Africa/Cairo": "Egypt",
  "Asia/Riyadh": "Saudi Arabia",
  "Asia/Dubai": "UAE",
  "Asia/Qatar": "Qatar",
  "Asia/Kuwait": "Kuwait",
  "Asia/Bahrain": "Bahrain",
  "Asia/Muscat": "Oman",
  "Asia/Amman": "Jordan",
  "Asia/Baghdad": "Iraq",
  "Africa/Casablanca": "Morocco",
  "Africa/Tunis": "Tunisia",
  "Africa/Algiers": "Algeria",
  "Africa/Tripoli": "Libya",
  "Europe/London": "United Kingdom",
  "Europe/Berlin": "Germany",
  "Europe/Paris": "France",
  "Europe/Istanbul": "Turkey",
  "America/New_York": "United States",
  "America/Chicago": "United States",
  "America/Denver": "United States",
  "America/Phoenix": "United States",
  "America/Los_Angeles": "United States",
  "America/Anchorage": "United States",
  "America/Detroit": "United States",
  "America/Indiana/Indianapolis": "United States",
  "Pacific/Honolulu": "United States",
  "America/Toronto": "Canada",
  "America/Vancouver": "Canada",
  "Australia/Sydney": "Australia",
  "Australia/Melbourne": "Australia",
  "Asia/Tokyo": "Japan",
  "Asia/Seoul": "South Korea",
  "Asia/Shanghai": "China",
  "Asia/Kuala_Lumpur": "Malaysia",
  "Asia/Jakarta": "Indonesia",
  // Asia/Bangkok is left out on purpose: Thailand and parts of Vietnam and
  // Laos share it, so it does not name one country.
  "Asia/Ho_Chi_Minh": "Vietnam",
  "Asia/Saigon": "Vietnam",
  "Asia/Manila": "Philippines",
  "Asia/Kolkata": "India",
  "Asia/Karachi": "Pakistan",
};

const CURRENCY_AR: Record<string, string> = {
  SAR: "ريال",
  AED: "درهم",
  EGP: "جنيه",
  QAR: "ريال قطري",
  KWD: "دينار كويتي",
  BHD: "دينار بحريني",
  OMR: "ريال عماني",
  JOD: "دينار",
  USD: "دولار",
};

const localPrices = buildCountryLocalPrices();

const zone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

/**
 * The visitor's starting group price.
 *
 * This used to return null whenever the timezone did not name a country, and
 * the teaser then rendered "Prices depend on your country" - so the visitors we
 * could not place saw no number at all. That includes every crawler, and anyone
 * in a zone ZONE_COUNTRY does not map (it leaves out Asia/Bangkok on purpose,
 * for one).
 *
 * It now always names a price. An unplaceable visitor falls back to the global
 * tier in USD: that is what the dollar-paying market is actually charged, it is
 * the top tier so the figure is never lower than a real price, and `resolved`
 * tells the teaser whether to point at the country picker.
 *
 * Egypt still gets EGP by default (Re, 30 Sep 2026) - that is the home market
 * and the one currency the local table exists for. Every other country is
 * already quoted in USD, so the default is dollars for everyone else.
 */
export const useStartingPrice = (): { amount: number; currency: string; resolved: boolean } | null =>
  useMemo(() => {
    const country = ZONE_COUNTRY[zone()];
    if (country) {
      // EGP for Egypt, USD for every other country (Re, 30 Sep 2026).
      const local = country === "Egypt" ? localPrices[country]?.group?.[0] : undefined;
      if (local) return { amount: local.local, currency: local.currency, resolved: true };
      const tier = getTierForCountry(country);
      const usd = (tier ? tierPrices[tier]?.group?.[1] : undefined) ?? tierPrices.global?.group?.[1];
      if (typeof usd === "number") return { amount: usd, currency: "USD", resolved: true };
    }
    const fallback = tierPrices.global?.group?.[1];
    return typeof fallback === "number"
      ? { amount: fallback, currency: "USD", resolved: false }
      : null;
  }, []);

const PriceTeaser = ({ className = "", source }: { className?: string; source: string }) => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const price = useStartingPrice();

  /*
   * ONE NUMERAL SYSTEM PER SENTENCE. The Arabic line is "…يبدأ من X شهريًا ·
   * ٤ حصص في الشهر": the count was Arabic-Indic and the price was Western, so
   * an Egyptian reader saw "1,200 جنيه … · ٤ حصص" - the tell of a translation
   * rather than a localisation. The Arabic branch now converts the whole
   * figure, digits and all; English keeps toLocaleString for the thousands
   * separator.
   */
  const amount = price
    ? price.currency === "USD"
      ? isAr
        ? `${toArabicDigits(price.amount.toLocaleString("en-US"))} دولار`
        : `$${price.amount}`
      : isAr
        ? `${toArabicDigits(price.amount.toLocaleString("en-US"))} ${CURRENCY_AR[price.currency] ?? price.currency}`
        : `${price.amount.toLocaleString("en-US")} ${price.currency}`
    : null;

  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {amount ? (
        isAr ? (
          <>الحصص الجماعية المباشرة تبدأ من <strong className="text-foreground">{amount}</strong> شهريًا · ٤ حصص في الشهر</>
        ) : (
          <>Live group classes from <strong className="text-foreground">{amount}/month</strong> · 4 live classes</>
        )
      ) : isAr ? (
        "الأسعار حسب البلد"
      ) : (
        "Prices depend on your country"
      )}
      {" · "}
      <Link
        to="/pricing"
        onClick={() => { try { logLeadEvent({ source_type: "pricing", cta_label: `${source}_view_pricing`, metadata: { language } }); } catch {} }}
        className="inline-flex min-h-11 items-center gap-1 align-middle font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground/70"
      >
        {/* We could not place the visitor, so the figure above is the USD one.
            Say so, and make the country picker the way out of it - the link is
            already where they choose. */}
        {!price
          ? isAr ? "عرض الأسعار" : "View pricing"
          : price.resolved
            ? isAr ? "عرض الأسعار" : "View pricing"
            : isAr ? "الأسعار بالدولار — اختر بلدك للسعر المحلي" : "Prices in USD — choose your country for local pricing"}
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
      </Link>
    </p>
  );
};

export default PriceTeaser;
