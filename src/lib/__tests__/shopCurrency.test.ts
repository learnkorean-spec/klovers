/**
 * Shop currency follows the page language (Re, 1 Oct 2026):
 * Arabic page → Egyptian pounds, English page → US dollars, for every visitor.
 */
import { describe, it, expect, afterEach } from "vitest";
import { currencyForLanguage, localPrice, shopCurrency } from "../shopCurrency";

const price = { id: "price_1", amount: 700, currency: "usd", options: { usd: 700, egp: 14900 } };

describe("shop currency by page language", () => {
  afterEach(() => { document.documentElement.lang = ""; });

  it("Arabic page shows EGP, English page shows USD", () => {
    expect(currencyForLanguage(true)).toBe("egp");
    expect(currencyForLanguage(false)).toBe("usd");
  });

  it("picks the Stripe amount for that currency", () => {
    expect(localPrice(price, currencyForLanguage(true))).toMatchObject({ amount: 14900, currency: "egp" });
    expect(localPrice(price, currencyForLanguage(false))).toMatchObject({ amount: 700, currency: "usd" });
  });

  it("reads the page language when no language is passed", () => {
    document.documentElement.lang = "ar";
    expect(shopCurrency()).toBe("egp");
    document.documentElement.lang = "en";
    expect(shopCurrency()).toBe("usd");
  });

  it("falls back to dollars when a price has no EGP amount", () => {
    const usdOnly = { id: "p2", amount: 499, currency: "usd", options: { usd: 499 } };
    expect(localPrice(usdOnly, "egp")).toMatchObject({ amount: 499, currency: "usd" });
  });
});
