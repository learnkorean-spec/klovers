import { describe, it, expect } from "vitest";
import { toPublicDisplayName, DISPLAY_NAME_FALLBACK } from "./displayName";

/**
 * These cases are the same list that was run against production Postgres to
 * check public.public_display_name(text) before it was written into
 * 20260908160000_leaderboard_display_name_privacy.sql. If you change one side,
 * run the other — the SQL is what actually protects the leaderboard, and a
 * silent divergence between the two is how this bug comes back.
 */
describe("toPublicDisplayName", () => {
  it("never renders a stored email address", () => {
    // The regression this whole module exists for: no space, so the old
    // `split(" ")[0]` returned the entire address.
    expect(toPublicDisplayName("someone@gmail.com")).toBe(DISPLAY_NAME_FALLBACK);
    expect(toPublicDisplayName("a@b")).toBe(DISPLAY_NAME_FALLBACK);
    expect(toPublicDisplayName("   @handle")).toBe(DISPLAY_NAME_FALLBACK);
  });

  it("never renders a stored phone number", () => {
    expect(toPublicDisplayName("01012345678")).toBe(DISPLAY_NAME_FALLBACK);
    expect(toPublicDisplayName("+20 100 123 4567")).toBe(DISPLAY_NAME_FALLBACK);
    expect(toPublicDisplayName("20.100.4567")).toBe(DISPLAY_NAME_FALLBACK);
  });

  it("falls back when there is no usable name", () => {
    expect(toPublicDisplayName(null)).toBe(DISPLAY_NAME_FALLBACK);
    expect(toPublicDisplayName(undefined)).toBe(DISPLAY_NAME_FALLBACK);
    expect(toPublicDisplayName("")).toBe(DISPLAY_NAME_FALLBACK);
    expect(toPublicDisplayName("   ")).toBe(DISPLAY_NAME_FALLBACK);
  });

  it("returns the first name and nothing after it", () => {
    expect(toPublicDisplayName("Reham Elshrkawy")).toBe("Reham");
    expect(toPublicDisplayName("  Sara   Mohamed ")).toBe("Sara");
    expect(toPublicDisplayName("Malaz")).toBe("Malaz");
    expect(toPublicDisplayName("MC")).toBe("MC");
  });

  it("keeps names that are not Latin and names with punctuation in them", () => {
    // A hyphenated first name is one token, not two, and a non-Latin name must
    // not be mistaken for an identifier and thrown away.
    expect(toPublicDisplayName("Jean-Luc Picard")).toBe("Jean-Luc");
    expect(toPublicDisplayName("한지민")).toBe("한지민");
  });

  it("keeps a real first name that happens to be followed by an email", () => {
    // The '@' test applies to the first token, not the whole string — losing
    // 'Ahmed' here would be a privacy fix that quietly degrades the product.
    expect(toPublicDisplayName("Ahmed ahmed@example.com")).toBe("Ahmed");
  });
});
