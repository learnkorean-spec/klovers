import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { ARABIC_PAGES, ARABIC_FAQ, ARABIC_PAGE_META, BLOG_INDEX_ARTICLES_MARKER } from "./arabic-pages.mjs";
import { buildSitemap } from "../../api/sitemap.xml.js";

/**
 * arabic-pages.test.mjs - the Arabic URL twins (GEO-03, 27 Sep 2026).
 *
 * A translation only counts for search when every piece agrees: the route
 * exists in the app and in vercel.json, the static HTML is Arabic, both twins
 * name each other in the sitemap, and the FAQ markup matches the FAQ the page
 * shows. Each is one quiet edit away from breaking, so each is asserted here.
 */
const root = process.cwd();
const app = readFileSync(join(root, "src/App.tsx"), "utf-8");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf-8"));
const translations = readFileSync(join(root, "src/i18n/translations.ts"), "utf-8");
const prerender = readFileSync(join(root, "scripts/prerender-meta.mjs"), "utf-8");
const allow = new RegExp(`^${vercel.rewrites.find((r) => r.destination === "/app.html").source}$`);

// Egyptian-dialect markers the brand guard forbids in Arabic copy.
const DIALECT = /(^|\s)(مش|دلوقتي|عشان|لسه|إزاي|كده|بتاع|أوي|معانا|احجز|اعمل|شوف)(\s|$)/;

describe("the Arabic twins exist end to end", () => {
  it("lists twelve pages, all with the same paths in meta and bodies", () => {
    expect(ARABIC_PAGE_META.map((p) => p.path)).toEqual(ARABIC_PAGES.map((p) => p.path));
    // seven marketing pages + the blog index, then the scholarships page (4 Oct 2026),
    // then contact and the three landing pages (5 Oct 2026).
    expect(ARABIC_PAGES).toHaveLength(12);
  });

  it("the Arabic blog index gets its article list from the prerender (28 Sep 2026)", () => {
    const blog = ARABIC_PAGES.find((p) => p.path === "/blog");
    expect(blog.body).toContain(BLOG_INDEX_ARTICLES_MARKER);
    expect(prerender).toContain("buildArabicBlogListHtml(blogRoutes)");
    // The shell itself is Arabic only (Korean and TOPIK excepted, none here).
    expect(blog.body.replace(/<[^>]+>/g, " ")).not.toMatch(/[A-Za-z]/);
  });

  it.each(ARABIC_PAGES.map((p) => p.path))("%s has an Arabic route in the app and in vercel.json", (path) => {
    expect(app).toMatch(new RegExp(`<Route path="/ar${path}" element=`));
    expect(app).toMatch(new RegExp(`<Route path="${path}" element=`));
    expect(allow.test(`/ar${path}`)).toBe(true);
  });

  it("the prerender builds the twins from this file", () => {
    expect(prerender).toContain('from "./lib/arabic-pages.mjs"');
    expect(prerender).toContain("for (const page of ARABIC_PAGES)");
  });
});

describe("the Arabic copy", () => {
  it.each(ARABIC_PAGES.map((p) => [p.path, p]))("%s: Arabic, one h1, MSA, short head", (path, p) => {
    expect(p.body).toContain('lang="ar" dir="rtl"');
    expect((p.body.match(/<h1[\s>]/g) || []).length).toBe(1);
    expect(p.body).not.toMatch(/[$`]/);
    const text = p.body.replace(/<[^>]+>/g, " ");
    expect(text).not.toMatch(DIALECT);
    expect([...p.title].length).toBeLessThanOrEqual(60);
    expect([...p.description].length).toBeLessThanOrEqual(160);
    // Links to a paired page stay in Arabic.
    for (const other of ARABIC_PAGES) {
      expect(p.body).not.toContain(`href="${other.path}"`);
    }
  });

  it("the scholarships page names its sources in the Arabic crawlable copy", () => {
    // Same defect as the English fragment: the official links lived only in the
    // React card, so the Arabic static HTML made six claims with no sources.
    const body = ARABIC_PAGES.find((p) => p.path === "/scholarships").body;
    for (const host of [
      "studyinkorea.go.kr",
      "koica.go.kr",
      "kf.or.kr",
      "admission.kaist.ac.kr",
      "overseas.mofa.go.kr",
    ]) {
      expect(body.includes(host), host).toBe(true);
    }
  });

  it("the FAQ markup is exactly the Arabic FAQ the page shows", () => {
    const block = translations.slice(translations.lastIndexOf("faqPage: {"));
    const shown = [...block.matchAll(/\{ question: "(.*?)", answer: "(.*?)", category:/g)].map((m) => ({
      q: m[1],
      a: m[2],
    }));
    expect(shown.length).toBeGreaterThan(0);
    expect(ARABIC_FAQ).toEqual(shown.slice(0, ARABIC_FAQ.length));
    expect(ARABIC_FAQ.length).toBe(
      block.slice(0, block.indexOf("contactPage:")).match(/\{ question: /g).length
    );
  });
});

describe("the sitemap pairs every twin", () => {
  const { xml } = buildSitemap([], "2026-09-27");
  const blockFor = (loc) => {
    const m = xml.match(new RegExp(`<url>\\s*<loc>${loc.replace(/[/.]/g, "\\$&")}</loc>[\\s\\S]*?</url>`));
    return m ? m[0] : "";
  };
  it.each(ARABIC_PAGES.map((p) => p.path))("%s and /ar%s name each other", (path) => {
    for (const loc of [`https://kloversegy.com${path}`, `https://kloversegy.com/ar${path}`]) {
      const b = blockFor(loc);
      expect(b, loc).not.toBe("");
      expect(b).toContain(`hreflang="en" href="https://kloversegy.com${path}"`);
      expect(b).toContain(`hreflang="ar" href="https://kloversegy.com/ar${path}"`);
      expect(b).toContain(`hreflang="x-default" href="https://kloversegy.com${path}"`);
    }
  });
});
