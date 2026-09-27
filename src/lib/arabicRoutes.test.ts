import { describe, it, expect } from "vitest";
import { arabicTwinOf, englishTwinOf, isArabicUrl, arabicMetaFor } from "./arabicRoutes";

describe("arabicRoutes", () => {
  it("pairs the homepage and the six pages", () => {
    expect(arabicTwinOf("/")).toBe("/ar");
    for (const p of ["/courses", "/pricing", "/free-trial", "/faq", "/about", "/placement-test"]) {
      expect(arabicTwinOf(p)).toBe(`/ar${p}`);
      expect(englishTwinOf(`/ar${p}`)).toBe(p);
      expect(isArabicUrl(`/ar${p}`)).toBe(true);
      expect(arabicMetaFor(`/ar${p}`)?.title).toMatch(/[؀-ۿ]/);
    }
  });

  it("does not invent twins", () => {
    expect(arabicTwinOf("/games")).toBeNull();
    expect(englishTwinOf("/ar/games")).toBeNull();
    expect(isArabicUrl("/pricing")).toBe(false);
    expect(isArabicUrl("/ar")).toBe(true);
    expect(arabicMetaFor("/ar")).toBeNull();
  });
});
