import { describe, it, expect } from "vitest";
import { getPriceFor } from "@/lib/stripePrices";

// UAE and Saudi students pay by card in their own currency (6 Oct 2026). These
// are the numbers create-checkout sends to Stripe; if one side moves, this fails.
describe("getPriceFor: card in local currency for UAE and Saudi Arabia", () => {
  it("prices the UAE in AED from the published row", () => {
    expect(getPriceFor("UAE", "", "group", 1)).toEqual({ amount: 220, currency: "AED" });
    expect(getPriceFor("UAE", "", "private", 6)).toEqual({ amount: 2130, currency: "AED" });
  });
  it("prices Saudi Arabia in SAR from the published row", () => {
    expect(getPriceFor("Saudi Arabia", "", "group", 3)).toEqual({ amount: 638, currency: "SAR" });
    expect(getPriceFor("Saudi Arabia", "", "private", 1)).toEqual({ amount: 450, currency: "SAR" });
  });
  it("still prices the United States in dollars, and Egypt in pounds", () => {
    expect(getPriceFor("United States", "", "group", 1)).toEqual({ amount: 60, currency: "USD" });
    expect(getPriceFor("Egypt", "", "group", 1)).toEqual({ amount: 1200, currency: "EGP" });
  });
});
