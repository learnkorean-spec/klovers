/**
 * The Voca / Buda articles must reach crawlers with their own head and body,
 * not the generic SPA shell ("Klovers" / "Klovers." / empty body).
 */
import { describe, it, expect } from "vitest";
import {
  LANG_BRANDS,
  buildLangArticleRoutes,
  buildArticleBody,
} from "./lib/lang-article-pages.mjs";

const BASE = "https://kloversegy.com";

const article = (n) => ({
  slug: `slug-${n}`,
  title: `عنوان ${n}`,
  description: `وصف ${n}`,
  minutes: 3,
  sections: [{ heading: `قسم ${n}`, paragraphs: [`فقرة <b>${n}</b> & اختبار`] }],
});

const brands = LANG_BRANDS.map((b) => ({ ...b, articles: [article(1), article(2), article(3)] }));

describe("buildLangArticleRoutes", () => {
  const routes = buildLangArticleRoutes(BASE, brands);

  it("makes one index plus one route per article, per brand", () => {
    expect(routes).toHaveLength(2 * (1 + 3));
  });

  it("gives every route its own Arabic head, never the generic one", () => {
    for (const r of routes) {
      expect(r.lang).toBe("ar");
      expect(r.title).not.toBe("Klovers");
      expect(r.description.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("uses the paths the app and the sitemap use", () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain("/learn-english/articles");
    expect(paths).toContain("/learn-english/articles/slug-2");
    expect(paths).toContain("/learn-hungarian/articles/slug-3");
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("writes exactly one h1 per body (prerender-meta fails the build otherwise)", () => {
    for (const r of routes) {
      expect((r.body.match(/<h1[\s>]/g) || []).length).toBe(1);
    }
  });

  it("marks articles as Article JSON-LD with dates, and the index as a collection", () => {
    const art = routes.find((r) => r.path === "/learn-english/articles/slug-1");
    expect(art.articleLd).toBe(true);
    expect(art.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const idx = routes.find((r) => r.path === "/learn-hungarian/articles");
    expect(idx.pageLd["@type"]).toBe("CollectionPage");
  });

  it("escapes article text and links on to the next article", () => {
    const body = buildArticleBody(brands[0], brands[0].articles[2], brands[0].articles[0]);
    expect(body).toContain("&lt;b&gt;3&lt;/b&gt; &amp; اختبار");
    expect(body).not.toContain("<b>3</b>");
    expect(body).toContain('href="/learn-english/articles/slug-1"');
  });

  it("refuses an empty library instead of shipping an empty index", () => {
    expect(() => buildLangArticleRoutes(BASE, [{ ...LANG_BRANDS[0], articles: [] }])).toThrow();
  });
});
