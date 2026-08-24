/**
 * Tests for api/sitemap.xml.js.
 *
 * This file sits in scripts/ rather than next to the code it tests because
 * Vercel deploys every file under api/ as a serverless function — a test file
 * there would become a public endpoint.
 */
import { describe, it, expect } from "vitest";
import { buildSitemap, pairPosts } from "../api/sitemap.xml.js";

const TODAY = "2026-08-23";

const post = (slug, lang, updated = "2026-08-01T00:00:00Z") => ({
  slug,
  lang,
  updated_at: updated,
  published_at: updated,
});

/** Every <loc> in the document, in order. */
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
/** The <url> block that contains a given href, so alternates can be inspected. */
const blockFor = (xml, slug) =>
  xml.split("<url>").find((b) => b.includes(`<loc>https://kloversegy.com/blog/${slug}</loc>`)) || "";
const altsIn = (block) =>
  [...block.matchAll(/hreflang="([^"]+)"\s+href="([^"]+)"/g)].map((m) => [m[1], m[2]]);

describe("sitemap", () => {
  it("gives every published post its own <loc>, in both languages", () => {
    const posts = [
      post("korean-numbers-guide", "en"),
      post("korean-numbers-guide-ar", "ar"),
      post("korean-slang-words", "en"),
      post("korean-slang-words-ar", "ar"),
    ];
    const { xml } = buildSitemap(posts, TODAY);
    const blogLocs = locs(xml).filter((u) => u.includes("/blog/"));

    expect(blogLocs).toHaveLength(4);
    for (const p of posts) {
      expect(blogLocs).toContain(`https://kloversegy.com/blog/${p.slug}`);
    }
  });

  it("counts Arabic <loc> entries equal to the Arabic posts given", () => {
    const posts = [
      post("a", "en"),
      post("a-ar", "ar"),
      post("b", "en"),
      post("ar-b", "ar"),
      post("c-ar", "ar"), // Arabic with no English original
    ];
    const { xml } = buildSitemap(posts, TODAY);
    const arabicInput = posts.filter((p) => p.lang === "ar");
    const arabicLocs = locs(xml).filter((u) =>
      arabicInput.some((p) => u === `https://kloversegy.com/blog/${p.slug}`)
    );
    expect(arabicLocs).toHaveLength(arabicInput.length);
  });

  it("handles the legacy ar- prefix as well as the -ar suffix", () => {
    const posts = [post("legacy-post", "en"), post("ar-legacy-post", "ar")];
    const { xml } = buildSitemap(posts, TODAY);

    // Both sides carry the identical, reciprocal cluster.
    const expected = [
      ["en", "https://kloversegy.com/blog/legacy-post"],
      ["ar", "https://kloversegy.com/blog/ar-legacy-post"],
      ["x-default", "https://kloversegy.com/blog/legacy-post"],
    ];
    expect(altsIn(blockFor(xml, "legacy-post"))).toEqual(expected);
    expect(altsIn(blockFor(xml, "ar-legacy-post"))).toEqual(expected);
  });

  it("emits the same cluster on both sides of a -ar pair", () => {
    const posts = [post("topic", "en"), post("topic-ar", "ar")];
    const { xml } = buildSitemap(posts, TODAY);
    expect(altsIn(blockFor(xml, "topic"))).toEqual(altsIn(blockFor(xml, "topic-ar")));
    expect(altsIn(blockFor(xml, "topic"))).toHaveLength(3);
  });

  it("emits no alternates when a post has no partner", () => {
    const posts = [post("lonely", "en"), post("lonely-ar-orphan", "ar")];
    const { xml } = buildSitemap(posts, TODAY);
    expect(altsIn(blockFor(xml, "lonely"))).toEqual([]);
    expect(altsIn(blockFor(xml, "lonely-ar-orphan"))).toEqual([]);
  });

  it("decides language from the lang column, not from slug spelling", () => {
    // A post whose slug ends in "-ar" but which is flagged English must not be
    // treated as the Arabic side of anything.
    const posts = [post("seminar", "en")];
    const { pairs } = pairPosts(posts);
    expect(pairs.get("semin")).toBeUndefined();
    expect(pairs.get("seminar").en).toBe("seminar");
  });

  describe("when one English post has two Arabic translations", () => {
    const posts = [post("dup", "en"), post("dup-ar", "ar"), post("ar-dup", "ar")];

    it("still lists both Arabic pages", () => {
      const { xml } = buildSitemap(posts, TODAY);
      expect(locs(xml)).toContain("https://kloversegy.com/blog/dup-ar");
      expect(locs(xml)).toContain("https://kloversegy.com/blog/ar-dup");
    });

    it("puts only the -ar suffix version in the hreflang cluster", () => {
      const { xml, duplicateArabic } = buildSitemap(posts, TODAY);
      expect(duplicateArabic).toEqual(["ar-dup"]);
      expect(altsIn(blockFor(xml, "dup"))).toEqual([
        ["en", "https://kloversegy.com/blog/dup"],
        ["ar", "https://kloversegy.com/blog/dup-ar"],
        ["x-default", "https://kloversegy.com/blog/dup"],
      ]);
      expect(altsIn(blockFor(xml, "ar-dup"))).toEqual([]);
    });

    it("picks the same winner whichever order the rows arrive in", () => {
      const reversed = [post("ar-dup", "ar"), post("dup-ar", "ar"), post("dup", "en")];
      expect(pairPosts(posts).pairs.get("dup").ar).toBe("dup-ar");
      expect(pairPosts(reversed).pairs.get("dup").ar).toBe("dup-ar");
    });
  });

  it("uses updated_at for lastmod and falls back to today", () => {
    const posts = [
      post("dated", "en", "2026-07-04T10:00:00Z"),
      { slug: "undated", lang: "en", updated_at: null, published_at: null },
    ];
    const { xml } = buildSitemap(posts, TODAY);
    expect(blockFor(xml, "dated")).toContain("<lastmod>2026-07-04</lastmod>");
    expect(blockFor(xml, "undated")).toContain(`<lastmod>${TODAY}</lastmod>`);
  });

  it("keeps the static marketing pages", () => {
    const { xml } = buildSitemap([post("x", "en")], TODAY);
    for (const path of ["/", "/courses", "/free-trial", "/topik-exam-preparation", "/blog"]) {
      expect(locs(xml)).toContain(`https://kloversegy.com${path}`);
    }
  });

  it("declares the xhtml namespace it uses for alternates", () => {
    const { xml } = buildSitemap([post("a", "en"), post("a-ar", "ar")], TODAY);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});

describe("retired Arabic duplicates (fix/duplicate-arabic-slugs)", () => {
  it("gives no <loc> to a slug that has its own 301 redirect", () => {
    const posts = [
      post("korean-daily-greetings-ar", "ar"), // survivor
      post("ar-korean-daily-greetings", "ar"), // retired, has a 301
      post("korean-daily-greetings", "en"),
    ];
    const { xml } = buildSitemap(posts, TODAY);
    expect(locs(xml)).not.toContain("https://kloversegy.com/blog/ar-korean-daily-greetings");
    expect(locs(xml)).toContain("https://kloversegy.com/blog/korean-daily-greetings-ar");
  });

  it("still emits a normal hreflang cluster once the retired slug is gone", () => {
    const posts = [
      post("korean-daily-greetings-ar", "ar"),
      post("ar-korean-daily-greetings", "ar"),
      post("korean-daily-greetings", "en"),
    ];
    const { xml } = buildSitemap(posts, TODAY);
    expect(altsIn(blockFor(xml, "korean-daily-greetings"))).toEqual([
      ["en", "https://kloversegy.com/blog/korean-daily-greetings"],
      ["ar", "https://kloversegy.com/blog/korean-daily-greetings-ar"],
      ["x-default", "https://kloversegy.com/blog/korean-daily-greetings"],
    ]);
  });

  it("reports no duplicateArabic for a pair that is already fully retired", () => {
    // Once the retired slug is filtered out before pairPosts runs, there is
    // only one Arabic post left in this pair, so it is not a duplicate at all.
    const posts = [post("korean-daily-greetings-ar", "ar"), post("ar-korean-daily-greetings", "ar")];
    const { duplicateArabic } = buildSitemap(posts, TODAY);
    expect(duplicateArabic).toEqual([]);
  });

  it("all 8 confirmed retired slugs are excluded from every build", () => {
    const RETIRED = [
      "ar-korean-daily-greetings", "ar-korean-food-vocabulary", "ar-korean-grammar-particles",
      "ar-korean-numbers-guide", "ar-korean-slang-words", "ar-seoul-travel-korean-phrases",
      "ar-study-korean-kdramas-method", "ar-topik-exam-guide",
    ];
    const posts = RETIRED.map((s) => post(s, "ar"));
    const { xml } = buildSitemap(posts, TODAY);
    const blogLocs = locs(xml).filter((u) => u.includes("/blog/"));
    expect(blogLocs).toEqual([]);
  });
});
