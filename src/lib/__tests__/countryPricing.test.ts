/**
 * The country price table moved out of PricingSection.tsx into stripePrices.ts
 * so the public pricing page and the admin bundle picker read one table.
 *
 * A move like that is only safe if it is provably a move. The literals below
 * are copied verbatim from PricingSection.tsx as it stood before the change
 * (git show d9f0a0b:src/components/PricingSection.tsx). If a price ever drifts,
 * these tests fail with the country and duration that changed.
 *
 * Deliberately duplicated data. This is the one place where a second copy earns
 * its keep: it is the control sample.
 */
import { describe, it, expect } from "vitest";
import {
  buildCountryLocalPrices,
  getBundleOptions,
  getCurrencyForCountry,
  tierCountries,
  PRICED_COUNTRIES,
} from "@/lib/stripePrices";

// --- verbatim from the pre-move PricingSection.tsx ---------------------------
const DURATION_ROWS = [
  { duration: "1 Month", classes: "4 classes" },
  { duration: "3 Months", classes: "12 classes" },
  { duration: "6 Months", classes: "24 classes" },
];

function mkLocal(currency: string, g: [number, number, number], p: [number, number, number]) {
  return {
    group: DURATION_ROWS.map((d, i) => ({ ...d, local: g[i], currency })),
    private: DURATION_ROWS.map((d, i) => ({ ...d, local: p[i], currency })),
  };
}

const ORIGINAL = {
  "Egypt":   mkLocal("EGP", [1200,  3300,   6100],  [2350,  6600,  11750]),
  "Morocco": mkLocal("MAD", [250,    700,   1300],   [500,   1400,   2500]),
  "Tunisia": mkLocal("TND", [78,     217,    403],   [155,    435,    775]),
  "Algeria": mkLocal("DZD", [3400,  9500,  17500],  [6750, 18900,  33750]),
  "Libya":   mkLocal("LYD", [122,    343,    637],   [245,    686,   1225]),
  "Jordan":  mkLocal("JOD", [18,      50,     92],   [36,      99,    178]),
  "Iraq":    mkLocal("IQD", [32750, 91700, 170300],  [65500, 183400, 327500]),

  "Malaysia":    mkLocal("MYR", [175,     485,     880],    [350,     970,    1672]),
  "Indonesia":   mkLocal("IDR", [648000, 1782000, 3240000], [1296000, 3564000, 6156000]),
  "Thailand":    mkLocal("THB", [1320,   3630,    6600],    [2640,    7260,   12540]),
  "Vietnam":     mkLocal("VND", [1016000, 2794000, 5080000],[2032000, 5588000, 9652000]),
  "Philippines": mkLocal("PHP", [2240,   6160,   11200],    [4480,   12320,   21280]),
  "India":       mkLocal("INR", [3360,   9240,   16800],    [6720,   18480,   31920]),
  "Pakistan":    mkLocal("PKR", [11160, 30690,   55800],    [22320,  61380,  106020]),
  "Brazil":      mkLocal("BRL", [228,    627,    1140],     [456,    1254,    2166]),
  "Mexico":      mkLocal("MXN", [680,   1870,    3400],     [1360,   3740,    6460]),
  "Colombia":    mkLocal("COP", [168000, 462000,  840000],  [336000,  924000, 1596000]),
  "Turkey":      mkLocal("TRY", [1520,  4180,    7600],     [3040,   8360,   14440]),

  "UAE":            mkLocal("AED", [220,     624,    1100],   [440,    1210,    2130]),
  "Saudi Arabia":   mkLocal("SAR", [225,     638,    1125],   [450,    1238,    2175]),
  "Qatar":          mkLocal("QAR", [218,     619,    1092],   [436,    1200,    2110]),
  "Bahrain":        mkLocal("BHD", [22.6,   63.9,   112.8],  [45.1,   124.6,   218.5]),
  "Oman":           mkLocal("OMR", [23.1,   65.5,   115.5],  [46.2,   127,     223]),
  "Kuwait":         mkLocal("KWD", [18.4,   52.2,    92.1],  [36.8,   101.3,   178]),
  "United Kingdom": mkLocal("GBP", [47,     134,     237],   [95,     261,     458]),
  "Germany":        mkLocal("EUR", [55,     156,     276],   [110,    304,     534]),
  "France":         mkLocal("EUR", [55,     156,     276],   [110,    304,     534]),
  "Canada":         mkLocal("CAD", [83,     235,     414],   [165,    455,     800]),
  "Australia":      mkLocal("AUD", [93,     264,     465],   [186,    512,     899]),
  "Japan":          mkLocal("JPY", [8940,  25330,  44700],   [17880, 49170,   86420]),
  "South Korea":    mkLocal("KRW", [82500, 233750, 412500],  [165000, 453750, 797500]),
  "China":          mkLocal("CNY", [436,   1236,    2181],   [872,   2399,    4217]),
};

const ORIGINAL_TIER_COUNTRIES = {
  local: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "Jordan", "Lebanon", "Iraq", "Syria", "Sudan", "Yemen"],
  regional: ["Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "India", "Pakistan", "Brazil", "Mexico", "Colombia", "Argentina", "Turkey"],
  global: ["UAE", "Saudi Arabia", "Qatar", "Bahrain", "Oman", "Kuwait", "United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan", "South Korea", "China"],
};
// ----------------------------------------------------------------------------

describe("the country price table survived the move intact", () => {
  it("matches the pre-move literals exactly, country for country", () => {
    expect(buildCountryLocalPrices()).toEqual(ORIGINAL);
  });

  it("covers the same countries, no more and no fewer", () => {
    expect(Object.keys(buildCountryLocalPrices()).sort()).toEqual(Object.keys(ORIGINAL).sort());
  });

  it("keeps the tier-to-country map PricingSection used", () => {
    expect(tierCountries).toEqual(ORIGINAL_TIER_COUNTRIES);
  });
});

describe("getCurrencyForCountry", () => {
  it("returns the local currency where one exists", () => {
    expect(getCurrencyForCountry("Egypt")).toBe("EGP");
    expect(getCurrencyForCountry("Saudi Arabia")).toBe("SAR");
    expect(getCurrencyForCountry("Malaysia")).toBe("MYR");
  });

  it("returns null for a country priced only in USD, and for nothing at all", () => {
    // Deliberately omitted upstream as unstable currencies.
    expect(getCurrencyForCountry("Lebanon")).toBeNull();
    expect(getCurrencyForCountry("United States")).toBeNull();
    expect(getCurrencyForCountry(null)).toBeNull();
    expect(getCurrencyForCountry("Atlantis")).toBeNull();
  });
});

describe("getBundleOptions", () => {
  it("offers six bundles — three durations across group and private", () => {
    const opts = getBundleOptions("Egypt");
    expect(opts).toHaveLength(6);
    expect(opts.filter(o => o.classType === "group")).toHaveLength(3);
    expect(opts.filter(o => o.classType === "private")).toHaveLength(3);
  });

  it("prices Egypt in EGP, matching the live egp_prices rows", () => {
    const opts = getBundleOptions("Egypt");
    const find = (t: string, m: number) => opts.find(o => o.classType === t && o.months === m)!;
    expect(find("group", 1)).toMatchObject({ price: 1200, currency: "EGP", classes: 4 });
    expect(find("group", 3)).toMatchObject({ price: 3300, currency: "EGP", classes: 12 });
    expect(find("group", 6)).toMatchObject({ price: 6100, currency: "EGP", classes: 24 });
    expect(find("private", 1)).toMatchObject({ price: 2350, currency: "EGP", classes: 4 });
    expect(find("private", 3)).toMatchObject({ price: 6600, currency: "EGP", classes: 12 });
    expect(find("private", 6)).toMatchObject({ price: 11750, currency: "EGP", classes: 24 });
  });

  it("prices the same six in SAR for Saudi Arabia — no conversion, its own numbers", () => {
    const opts = getBundleOptions("Saudi Arabia");
    expect(opts.every(o => o.currency === "SAR")).toBe(true);
    expect(opts.find(o => o.classType === "private" && o.months === 3)!.price).toBe(1238);
  });

  it("falls back to the USD tier price where a country has no local row", () => {
    const opts = getBundleOptions("United States");
    expect(opts).toHaveLength(6);
    expect(opts.every(o => o.currency === "USD")).toBe(true);
    expect(opts.every(o => o.isLocal === false)).toBe(true);
    // Global tier, private 3 months.
    expect(opts.find(o => o.classType === "private" && o.months === 3)!.price).toBe(330);
  });

  it("marks local rows as local", () => {
    expect(getBundleOptions("Egypt").every(o => o.isLocal)).toBe(true);
  });

  it("returns nothing for an unknown or absent country, so the picker offers Custom only", () => {
    expect(getBundleOptions("Atlantis")).toEqual([]);
    expect(getBundleOptions(null)).toEqual([]);
    expect(getBundleOptions("")).toEqual([]);
  });

  it("gives every option a stable, unique key", () => {
    const keys = getBundleOptions("Egypt").map(o => o.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("Egypt|private|3");
  });

  it("always uses 4 classes a month, the rule the live enrollments follow", () => {
    for (const country of ["Egypt", "Malaysia", "Japan"]) {
      for (const o of getBundleOptions(country)) {
        expect(o.classes).toBe(o.months * 4);
      }
    }
  });
});

describe("PRICED_COUNTRIES", () => {
  it("lists every country from every tier, sorted", () => {
    const expected = Object.values(ORIGINAL_TIER_COUNTRIES).flat().sort((a, b) => a.localeCompare(b));
    expect(PRICED_COUNTRIES).toEqual(expected);
  });
});
