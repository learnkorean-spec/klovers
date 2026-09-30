/**
 * Shop prices: US dollars everywhere, Egyptian pounds for visitors in Egypt
 * (Re, 30 Sep 2026).
 *
 * Each Stripe price carries USD plus an EGP currency option; shop-products
 * sends every amount it has (price.options). The page picks one here, and
 * shop-checkout is told the same currency so the Stripe page charges exactly
 * what the shop showed.
 *
 * Egypt is recognised from the browser's time zone (Africa/Cairo) — the same
 * signal the rest of the site uses when no country is on file. Kept tiny and
 * free of imports so the homepage shelf can use it without loading the shop.
 */
export type ShopCurrency = "usd" | "egp";

export function shopCurrency(): ShopCurrency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return /^(africa\/cairo|egypt)$/i.test(tz) ? "egp" : "usd";
  } catch {
    return "usd";
  }
}

export interface ShopPrice {
  id: string;
  amount: number;
  currency: string;
  /** Every currency this Stripe price has, lower-case code → amount in minor units. */
  options?: Record<string, number>;
}

/** The price in the visitor's currency; falls back to dollars, then to Stripe's default. */
export function localPrice<T extends ShopPrice>(price: T, want: ShopCurrency = shopCurrency()): T {
  const opts = price.options ?? {};
  if (typeof opts[want] === "number") return { ...price, amount: opts[want], currency: want };
  if (price.currency === want) return price;
  if (typeof opts.usd === "number") return { ...price, amount: opts.usd, currency: "usd" };
  return price;
}
