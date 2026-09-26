import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildCountryLocalPrices, getTierForCountry, tierPrices } from "@/lib/stripePrices";
import { logLeadEvent } from "@/lib/leadTracking";

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

/** The visitor's starting group price, or null when we cannot name one. */
export const useStartingPrice = (): { amount: number; currency: string } | null =>
  useMemo(() => {
    const country = ZONE_COUNTRY[zone()];
    if (!country) return null;
    const local = localPrices[country]?.group?.[0];
    if (local) return { amount: local.local, currency: local.currency };
    const tier = getTierForCountry(country);
    const usd = tier ? tierPrices[tier]?.group?.[1] : undefined;
    return typeof usd === "number" ? { amount: usd, currency: "USD" } : null;
  }, []);

const PriceTeaser = ({ className = "", source }: { className?: string; source: string }) => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const price = useStartingPrice();

  const amount = price
    ? price.currency === "USD"
      ? isAr ? `${price.amount} دولار` : `$${price.amount}`
      : isAr
        ? `${price.amount.toLocaleString("en-US")} ${CURRENCY_AR[price.currency] ?? price.currency}`
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
        {isAr ? "عرض الأسعار" : "View pricing"}
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
      </Link>
    </p>
  );
};

export default PriceTeaser;
