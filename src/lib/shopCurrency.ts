/**
 * Shop prices follow the PAGE LANGUAGE (Re, 1 Oct 2026): the Arabic page shows
 * Egyptian pounds, the English page shows US dollars — for every visitor,
 * wherever they are. This replaces the 30 Sep rule (EGP only for visitors in
 * Egypt, by time zone).
 *
 * Each Stripe price carries USD plus an EGP currency option; shop-products
 * sends every amount it has (price.options). The page picks one here, and
 * shop-checkout is told the same currency so the Stripe page charges exactly
 * what the shop showed.
 *
 * Kept tiny and free of imports so the homepage shelf can use it without
 * loading the shop.
 */
export type ShopCurrency = "usd" | "egp";

/** EGP on the Arabic page, USD on the English page. */
export function currencyForLanguage(isAr: boolean): ShopCurrency {
  return isAr ? "egp" : "usd";
}

/** The currency of the page being shown right now (reads <html lang>). */
export function shopCurrency(): ShopCurrency {
  try {
    return currencyForLanguage(document.documentElement.lang === "ar");
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

/** The price in the page's currency; falls back to dollars, then to Stripe's default. */
export function localPrice<T extends ShopPrice>(price: T, want: ShopCurrency = shopCurrency()): T {
  const opts = price.options ?? {};
  if (typeof opts[want] === "number") return { ...price, amount: opts[want], currency: want };
  if (price.currency === want) return price;
  if (typeof opts.usd === "number") return { ...price, amount: opts.usd, currency: "usd" };
  return price;
}
