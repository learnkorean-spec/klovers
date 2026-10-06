import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getPriceFor, CARD_IN_LOCAL_CURRENCY } from "@/lib/stripePrices";

// Global-tier students pay by card in their own currency (6 Oct 2026). The
// amounts are duplicated in the create-checkout edge function (it cannot import
// the client bundle), so this reads that file and fails if either side moves.
const edge = readFileSync(resolve(process.cwd(), "supabase/functions/create-checkout/index.ts"), "utf8");
const table = edge.slice(edge.indexOf("const LOCAL_CARD_PRICES"), edge.indexOf("const ZERO_DECIMAL"));
const rows = [...table.matchAll(/"([^"]+)":\s*\{\s*currency:\s*"(\w+)",\s*group:\s*\[([^\]]+)\],\s*private:\s*\[([^\]]+)\]/g)].map((m) => ({
  country: m[1],
  currency: m[2].toUpperCase(),
  group: m[3].split(",").map(Number),
  private: m[4].split(",").map(Number),
}));

describe("getPriceFor: card in local currency for the global tier", () => {
  it("parsed the edge function table", () => {
    expect(rows.length).toBe(14);
  });
  it("covers exactly the countries the client charges locally", () => {
    expect(rows.map((r) => r.country).sort()).toEqual([...CARD_IN_LOCAL_CURRENCY].sort());
  });
  it("charges, for every country and bundle, the same amount and currency the page shows", () => {
    for (const r of rows) {
      ([1, 3, 6] as const).forEach((d, i) => {
        expect(getPriceFor(r.country, "", "group", d)).toEqual({ amount: r.group[i], currency: r.currency });
        expect(getPriceFor(r.country, "", "private", d)).toEqual({ amount: r.private[i], currency: r.currency });
      });
    }
  });
  it("prices the UAE and Saudi Arabia as before", () => {
    expect(getPriceFor("UAE", "", "group", 1)).toEqual({ amount: 220, currency: "AED" });
    expect(getPriceFor("Saudi Arabia", "", "private", 1)).toEqual({ amount: 450, currency: "SAR" });
  });
  it("still prices the United States in dollars, and Egypt in pounds", () => {
    expect(getPriceFor("United States", "", "group", 1)).toEqual({ amount: 60, currency: "USD" });
    expect(getPriceFor("Egypt", "", "group", 1)).toEqual({ amount: 1200, currency: "EGP" });
  });
});
