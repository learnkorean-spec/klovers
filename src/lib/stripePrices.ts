// Maps tier + classType + duration to Stripe price IDs
// Generated from Stripe product creation

type TierKey = "local" | "regional" | "global";
type ClassType = "group" | "private";
type Duration = 1 | 3 | 6;

const DURATION_CLASSES: Record<Duration, number> = { 1: 4, 3: 12, 6: 24 };

interface PriceInfo {
  priceId: string;
  amount: number;
  classesIncluded: number;
}

const priceMap: Record<TierKey, Record<ClassType, Record<Duration, PriceInfo>>> = {
  local: {
    group: {
      1: { priceId: "price_1SzuGyP5xKnfzufHDEWn3gYQ", amount: 25, classesIncluded: 4 },
      3: { priceId: "price_1SzuHIP5xKnfzufHopangw1F", amount: 70, classesIncluded: 12 },
      6: { priceId: "price_1SzuHdP5xKnfzufHOnyjqTdp", amount: 130, classesIncluded: 24 },
    },
    private: {
      1: { priceId: "price_1SzuJfP5xKnfzufHInig8j7K", amount: 50, classesIncluded: 4 },
      3: { priceId: "price_1SzuJxP5xKnfzufHfeHITx65", amount: 140, classesIncluded: 12 },
      6: { priceId: "price_1SzuKHP5xKnfzufHv2F9RQxh", amount: 250, classesIncluded: 24 },
    },
  },
  regional: {
    group: {
      1: { priceId: "price_1SzuHyP5xKnfzufH95Ft0goD", amount: 40, classesIncluded: 4 },
      3: { priceId: "price_1SzuIFP5xKnfzufHVP5B37k0", amount: 110, classesIncluded: 12 },
      6: { priceId: "price_1SzuIVP5xKnfzufHiKQZNrcN", amount: 200, classesIncluded: 24 },
    },
    private: {
      1: { priceId: "price_1SzuKcP5xKnfzufH5GZEy8qJ", amount: 80, classesIncluded: 4 },
      3: { priceId: "price_1SzuKrP5xKnfzufHBdVWXoWm", amount: 220, classesIncluded: 12 },
      6: { priceId: "price_1SzuLKP5xKnfzufHqCc6Z88A", amount: 380, classesIncluded: 24 },
    },
  },
  global: {
    group: {
      1: { priceId: "price_1SzuIkP5xKnfzufHUoR4BcIy", amount: 60, classesIncluded: 4 },
      3: { priceId: "price_1SzuJ3P5xKnfzufHxh1lTYg6", amount: 170, classesIncluded: 12 },
      6: { priceId: "price_1SzuJMP5xKnfzufHERVUIwAG", amount: 300, classesIncluded: 24 },
    },
    private: {
      1: { priceId: "price_1SzuLZP5xKnfzufH4JcNbPF5", amount: 120, classesIncluded: 4 },
      3: { priceId: "price_1SzuLpP5xKnfzufHd9EcgWs2", amount: 330, classesIncluded: 12 },
      6: { priceId: "price_1SzuM4P5xKnfzufHQWJXvZWW", amount: 580, classesIncluded: 24 },
    },
  },
};

export function getStripePrice(tier: TierKey, classType: ClassType, duration: Duration): PriceInfo | null {
  return priceMap[tier]?.[classType]?.[duration] ?? null;
}

/** USD tier prices (amount only) derived from the canonical priceMap */
export const tierPrices: Record<TierKey, Record<ClassType, Record<Duration, number>>> = Object.fromEntries(
  (Object.keys(priceMap) as TierKey[]).map((tier) => [
    tier,
    Object.fromEntries(
      (Object.keys(priceMap[tier]) as ClassType[]).map((ct) => [
        ct,
        Object.fromEntries(
          (Object.keys(priceMap[tier][ct]).map(Number) as Duration[]).map((d) => [d, priceMap[tier][ct][d].amount])
        ),
      ])
    ),
  ])
) as Record<TierKey, Record<ClassType, Record<Duration, number>>>;

/** Tier-to-country mapping — single source of truth */
export const tierCountries: Record<TierKey, string[]> = {
  local: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "Jordan", "Lebanon", "Iraq", "Syria", "Sudan", "Yemen"],
  regional: ["Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "India", "Pakistan", "Brazil", "Mexico", "Colombia", "Argentina", "Turkey"],
  global: ["UAE", "Saudi Arabia", "Qatar", "Bahrain", "Oman", "Kuwait", "United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan", "South Korea", "China"],
};

/** Resolve country name → pricing tier */
export function getTierForCountry(country: string): TierKey | null {
  for (const [tier, countries] of Object.entries(tierCountries)) {
    if (countries.includes(country)) return tier as TierKey;
  }
  return null;
}

export { DURATION_CLASSES };

export type { TierKey, ClassType, Duration, PriceInfo };

// ---------------------------------------------------------------------------
// Local-currency prices per country.
//
// Moved here from PricingSection.tsx so the public pricing page and the admin
// bundle picker read one table. A second copy would have drifted the first time
// a price changed, and the whole point of country pricing is that a student in
// Cairo and a student in Riyadh see different, correct numbers.
//
// Rates are approximate, May 2026. Lebanon, Syria, Sudan, Yemen and Argentina
// appear in tierCountries but deliberately have no local row (unstable
// currencies); callers fall back to the USD tier price.
// ---------------------------------------------------------------------------

/** [1 month, 3 months, 6 months] — matching DURATION_CLASSES of 4 / 12 / 24. */
type PriceTriple = [number, number, number];

interface CountryLocal {
  currency: string;
  group: PriceTriple;
  private: PriceTriple;
}

const COUNTRY_LOCAL_PRICES: Record<string, CountryLocal> = {
  // Local tier
  "Egypt":   { currency: "EGP", group: [1200,   3300,    6100],    private: [2350,    6600,   11750] },
  "Morocco": { currency: "MAD", group: [250,     700,    1300],    private: [500,     1400,    2500] },
  "Tunisia": { currency: "TND", group: [78,      217,     403],    private: [155,      435,     775] },
  "Algeria": { currency: "DZD", group: [3400,   9500,   17500],    private: [6750,   18900,   33750] },
  "Libya":   { currency: "LYD", group: [122,     343,     637],    private: [245,      686,    1225] },
  "Jordan":  { currency: "JOD", group: [18,       50,      92],    private: [36,        99,     178] },
  "Iraq":    { currency: "IQD", group: [32750, 91700,  170300],    private: [65500, 183400,  327500] },

  // Regional tier
  "Malaysia":    { currency: "MYR", group: [175,     485,     880],    private: [350,     970,    1672] },
  "Indonesia":   { currency: "IDR", group: [648000, 1782000, 3240000], private: [1296000, 3564000, 6156000] },
  "Thailand":    { currency: "THB", group: [1320,   3630,    6600],    private: [2640,    7260,   12540] },
  "Vietnam":     { currency: "VND", group: [1016000, 2794000, 5080000], private: [2032000, 5588000, 9652000] },
  "Philippines": { currency: "PHP", group: [2240,   6160,   11200],    private: [4480,   12320,   21280] },
  "India":       { currency: "INR", group: [3360,   9240,   16800],    private: [6720,   18480,   31920] },
  "Pakistan":    { currency: "PKR", group: [11160, 30690,   55800],    private: [22320,  61380,  106020] },
  "Brazil":      { currency: "BRL", group: [228,    627,    1140],     private: [456,    1254,    2166] },
  "Mexico":      { currency: "MXN", group: [680,   1870,    3400],     private: [1360,   3740,    6460] },
  "Colombia":    { currency: "COP", group: [168000, 462000,  840000],  private: [336000,  924000, 1596000] },
  "Turkey":      { currency: "TRY", group: [1520,  4180,    7600],     private: [3040,   8360,   14440] },

  // Global tier
  "UAE":            { currency: "AED", group: [220,     624,    1100],   private: [440,    1210,    2130] },
  "Saudi Arabia":   { currency: "SAR", group: [225,     638,    1125],   private: [450,    1238,    2175] },
  "Qatar":          { currency: "QAR", group: [218,     619,    1092],   private: [436,    1200,    2110] },
  "Bahrain":        { currency: "BHD", group: [22.6,   63.9,   112.8],  private: [45.1,   124.6,   218.5] },
  "Oman":           { currency: "OMR", group: [23.1,   65.5,   115.5],  private: [46.2,   127,     223] },
  "Kuwait":         { currency: "KWD", group: [18.4,   52.2,    92.1],  private: [36.8,   101.3,   178] },
  "United Kingdom": { currency: "GBP", group: [47,     134,     237],   private: [95,     261,     458] },
  "Germany":        { currency: "EUR", group: [55,     156,     276],   private: [110,    304,     534] },
  "France":         { currency: "EUR", group: [55,     156,     276],   private: [110,    304,     534] },
  "Canada":         { currency: "CAD", group: [83,     235,     414],   private: [165,    455,     800] },
  "Australia":      { currency: "AUD", group: [93,     264,     465],   private: [186,    512,     899] },
  "Japan":          { currency: "JPY", group: [8940,  25330,  44700],   private: [17880, 49170,   86420] },
  "South Korea":    { currency: "KRW", group: [82500, 233750, 412500],  private: [165000, 453750, 797500] },
  "China":          { currency: "CNY", group: [436,   1236,    2181],   private: [872,   2399,    4217] },
};

const DURATIONS: Duration[] = [1, 3, 6];

/** Every country that has a price, local or otherwise, sorted for a picker. */
export const PRICED_COUNTRIES: string[] = (Object.values(tierCountries) as string[][])
  .flat()
  .sort((a, b) => a.localeCompare(b));

/**
 * The currency a country pays in, or null where no local row exists.
 * Callers default to USD; the student's stored currency always wins over this.
 */
export function getCurrencyForCountry(country: string | null | undefined): string | null {
  return country ? COUNTRY_LOCAL_PRICES[country]?.currency ?? null : null;
}

/** Shape PricingSection renders. Kept identical to what it built inline. */
export interface LocalPriceRow { duration: string; classes: string; local: number; currency: string }

const DURATION_ROWS: Array<{ duration: string; classes: string }> = [
  { duration: "1 Month",  classes: "4 classes"  },
  { duration: "3 Months", classes: "12 classes" },
  { duration: "6 Months", classes: "24 classes" },
];

/** Rebuilds the exact map PricingSection used to define for itself. */
export function buildCountryLocalPrices(): Record<string, { group: LocalPriceRow[]; private: LocalPriceRow[] }> {
  return Object.fromEntries(
    Object.entries(COUNTRY_LOCAL_PRICES).map(([country, row]) => [
      country,
      {
        group:   DURATION_ROWS.map((d, i) => ({ ...d, local: row.group[i],   currency: row.currency })),
        private: DURATION_ROWS.map((d, i) => ({ ...d, local: row.private[i], currency: row.currency })),
      },
    ])
  );
}

/** One purchasable bundle: a class count for a price, in a currency. */
export interface BundleOption {
  /** Stable identity, "<country>|<group|private>|<months>". */
  key: string;
  classType: ClassType;
  months: Duration;
  classes: number;
  price: number;
  currency: string;
  /** False when this fell back to the USD tier price for want of a local row. */
  isLocal: boolean;
  label: string;
}

/**
 * The six catalogue bundles for a country, priced in its own currency where one
 * exists and in USD where it does not. Returns [] for an unknown country, which
 * is how the picker ends up offering Custom only.
 */
export function getBundleOptions(country: string | null | undefined): BundleOption[] {
  if (!country) return [];
  const tier = getTierForCountry(country);
  if (!tier) return [];
  const local = COUNTRY_LOCAL_PRICES[country];

  return (["group", "private"] as ClassType[]).flatMap(classType =>
    DURATIONS.map(months => {
      const price = local ? local[classType][DURATIONS.indexOf(months)] : tierPrices[tier][classType][months];
      const currency = local?.currency ?? "USD";
      const classes = DURATION_CLASSES[months];
      const noun = classType === "group" ? "Group" : "Private";
      const period = months === 1 ? "1 month" : `${months} months`;
      return {
        key: `${country}|${classType}|${months}`,
        classType,
        months,
        classes,
        price,
        currency,
        isLocal: !!local,
        label: `${noun} · ${period} · ${classes} classes`,
      };
    })
  );
}

/**
 * The currencies Klovers actually takes money in, offered first in any picker.
 *
 * Not the whole set: the country table prices in 25 currencies, and a bundle can
 * legitimately be in any of them. This is the shortlist that covers almost every
 * real student, which is why callers append the student's own currency rather
 * than treating this as exhaustive — see currencyChoicesFor.
 */
export const COMMON_CURRENCIES = ["EGP", "USD", "SAR", "AED", "MYR", "EUR"] as const;

/**
 * What a currency picker should offer for one student: the common list, plus
 * their country's currency, plus whatever is already selected.
 *
 * The last two matter. Choosing "Japan · Private · 3 months" sets JPY, and a
 * picker that could not show JPY would either look broken or silently drop the
 * value — turning a typo-proofing change into a data-loss one.
 */
export function currencyChoicesFor(
  country: string | null | undefined,
  current?: string | null,
): string[] {
  const out = [...COMMON_CURRENCIES] as string[];
  for (const extra of [getCurrencyForCountry(country), current]) {
    if (extra && /^[A-Z]{3}$/.test(extra) && !out.includes(extra)) out.push(extra);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pricing one student: country first, timezone second.
//
// profiles.country is empty for 85 of 107 profiles — the signup form never
// asked for it — so a rule that reads the column alone prices four students in
// five in dollars, or refuses to price them at all. The timezone is the more
// reliable signal, and both enrol pages already capture it, so it is the
// fallback whenever the column is blank or holds a placeholder.
//
// The enrol pages import these instead of reaching for tierPrices themselves.
// Nothing below adds a second copy of the local prices; Egypt's numbers come
// from COUNTRY_LOCAL_PRICES, the same table the pricing page renders.
// ---------------------------------------------------------------------------

/** Country values that carry no information, whatever the student typed. */
const PLACEHOLDER_COUNTRIES = ["", "unknown", "other", "n/a", "na", "none", "-"];

/** Spellings of Egypt that occur in profiles.country, plus its cities. */
const EGYPT_ALIASES = ["egypt", "eg", "egy", "cairo", "ismailia", "alexandria", "giza", "مصر", "القاهرة"];

/** Timezones that name a country when the column does not. */
const TIMEZONE_COUNTRIES: Record<string, string> = {
  "africa/cairo": "Egypt",
};

/**
 * The canonical country name for one student — "Egypt" for every spelling of
 * it, and the timezone's country when the column is blank or a placeholder.
 * Anything else is returned as given (trimmed), so an unrecognised country
 * still reaches getTierForCountry and still fails visibly there.
 */
export function normalizeCountry(country?: string | null, timezone?: string | null): string {
  const raw = (country ?? "").trim();
  const folded = raw.toLowerCase();

  if (EGYPT_ALIASES.includes(folded)) return "Egypt";

  if (PLACEHOLDER_COUNTRIES.includes(folded)) {
    const tz = (timezone ?? "").trim().toLowerCase();
    return TIMEZONE_COUNTRIES[tz] ?? raw;
  }

  return raw;
}

/**
 * The currency one student pays in. EGP for Egypt; otherwise the country's own
 * currency where the table has one, and USD where it does not.
 *
 * Where an amount is involved, take the currency from getPriceFor instead: it
 * returns the two together, and outside Egypt the enrol pages still charge the
 * USD tier price.
 */
export function resolveCurrency(country?: string | null, timezone?: string | null): string {
  const resolved = normalizeCountry(country, timezone);
  if (resolved === "Egypt") return "EGP";
  return getCurrencyForCountry(resolved) ?? "USD";
}

/**
 * What one student is charged for one bundle, and in what currency — EGP from
 * the published Egyptian prices, USD from the tier table everywhere else.
 * Null when the country resolves to no tier at all, which is what leaves the
 * enrol form unpriced and tells it to say so.
 */
export function getPriceFor(
  country: string | null | undefined,
  timezone: string | null | undefined,
  classType: ClassType,
  duration: Duration,
): { amount: number; currency: string } | null {
  const resolved = normalizeCountry(country, timezone);

  if (resolved === "Egypt") {
    const local = COUNTRY_LOCAL_PRICES["Egypt"];
    const amount = local?.[classType]?.[DURATIONS.indexOf(duration)];
    return typeof amount === "number" ? { amount, currency: local.currency } : null;
  }

  const tier = getTierForCountry(resolved);
  const amount = tier ? tierPrices[tier]?.[classType]?.[duration] : undefined;
  return typeof amount === "number" ? { amount, currency: "USD" } : null;
}

/**
 * "$25.00", "1,200 EGP" — the symbol in front for dollars, the code after the
 * number for everything else, matching how PricingSection renders local prices.
 */
// Two currencies, two conventions. A dollar price is a catalogue price with
// cents; an EGP price is a whole number of pounds -- nobody quotes 137.5 EGP,
// and the per-class figure is a division result, not a price anyone pays.
export function formatMoney(amount: number, currency: string): string {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === "EGP") {
    return `${Math.round(amount).toLocaleString("en-US", { maximumFractionDigits: 0 })} EGP`;
  }
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
}
