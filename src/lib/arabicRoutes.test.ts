import { describe, it, expect } from "vitest";
import { arabicTwinOf, englishTwinOf, isArabicUrl, arabicMetaFor, languageFromSearch } from "./arabicRoutes";

describe("arabicRoutes", () => {
  it("pairs the homepage and the seven pages", () => {
    expect(arabicTwinOf("/")).toBe("/ar");
    for (const p of ["/courses", "/pricing", "/free-trial", "/faq", "/about", "/placement-test", "/blog"]) {
      expect(arabicTwinOf(p)).toBe(`/ar${p}`);
      expect(englishTwinOf(`/ar${p}`)).toBe(p);
      expect(isArabicUrl(`/ar${p}`)).toBe(true);
      expect(arabicMetaFor(`/ar${p}`)?.title).toMatch(/[؀-ۿ]/);
    }
  });

  it("does not invent twins", () => {
    expect(arabicTwinOf("/games")).toBeNull();
    // Articles keep their own URLs; only the blog index is paired.
    expect(arabicTwinOf("/blog/korean-numbers-guide")).toBeNull();
    expect(englishTwinOf("/ar/blog/korean-numbers-guide-ar")).toBeNull();
    expect(englishTwinOf("/ar/games")).toBeNull();
    expect(isArabicUrl("/pricing")).toBe(false);
    expect(isArabicUrl("/ar")).toBe(true);
    expect(arabicMetaFor("/ar")).toBeNull();
  });
});

describe("languageFromSearch", () => {
  it("reads an explicit ?lang choice", () => {
    expect(languageFromSearch("?lang=en")).toBe("en");
    expect(languageFromSearch("?utm_source=cv&lang=ar")).toBe("ar");
  });

  it("ignores anything else", () => {
    expect(languageFromSearch("")).toBeNull();
    expect(languageFromSearch("?lang=fr")).toBeNull();
    expect(languageFromSearch("?language=en")).toBeNull();
  });
});
