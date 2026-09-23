import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { languageOf, htmlTagFor } from "./document-language.mjs";
import { buildSitemap } from "../../api/sitemap.xml.js";

/**
 * arabic-home-route.test.mjs — the Arabic homepage at /ar (24 Sep 2026).
 *
 * Until this, Arabic had no URL of its own: switching language flipped a
 * localStorage key on the same document, which canonicalised to "/" and so
 * could carry no hreflang (docs/DECISIONS.md 2026-08-19, Option B). /ar is
 * the homepage's real translation, and a translation only counts for search
 * when every piece agrees: the route exists, the document says it is Arabic,
 * both pages name each other, and the sitemap lists both. Each of those is
 * one quiet edit away from breaking, so each is asserted here.
 */

const root = process.cwd();
const prerender = readFileSync(join(root, "scripts/prerender-meta.mjs"), "utf-8");
const app = readFileSync(join(root, "src/App.tsx"), "utf-8");
const index = readFileSync(join(root, "src/pages/Index.tsx"), "utf-8");
const langCtx = readFileSync(join(root, "src/contexts/LanguageContext.tsx"), "utf-8");

describe("the /ar route exists end to end", () => {
  it("the SPA routes /ar to the homepage", () => {
    expect(app).toContain('<Route path="/ar" element={<Index />} />');
  });

  it("the prerender writes an Arabic head for /ar", () => {
    const entry = prerender.match(/path: "\/ar",[\s\S]*?\n  \},/);
    expect(entry, "no /ar entry in MARKETING_ROUTES").not.toBeNull();
    expect(entry[0]).toContain('lang: "ar"');
    expect(entry[0]).toContain("homeTwin: true");
    expect(entry[0]).toContain("body: HOME_BODY_HTML_AR");
    expect(entry[0]).toContain("alternates: HOME_ALTERNATES");
    // Leads with the Arabic brand and names Klovers, so no suffix is added.
    const title = entry[0].match(/title: "([^"]+)"/)[1];
    expect(title.startsWith("كلوفرز")).toBe(true);
    expect(title).toContain("Klovers");
    expect([...title].length).toBeLessThanOrEqual(60);
    const description = entry[0].match(/description:\s*"([^"]+)"/)[1];
    expect([...description].length).toBeLessThanOrEqual(160);
  });

  it("the Arabic body is Arabic and has exactly one h1", () => {
    const body = prerender.match(/const HOME_BODY_HTML_AR = `([\s\S]*?)`;/);
    expect(body).not.toBeNull();
    expect(body[1]).toContain('lang="ar" dir="rtl"');
    expect((body[1].match(/<h1[\s>]/g) || []).length).toBe(1);
  });

  it("the English homepage carries the same pair", () => {
    expect(prerender).toContain('const HOME_ALTERNATES = { en: "/", ar: "/ar" };');
    const home = prerender.match(/path: "\/",[\s\S]*?\n  \},/);
    expect(home[0]).toContain("alternates: HOME_ALTERNATES");
  });

  it("buildHeadTags emits the cluster for marketing pairs", () => {
    expect(prerender).toContain("if (!isPost && route.alternates) {");
  });
});

describe("the document declares the right language", () => {
  it("a route with lang ar is an Arabic document", () => {
    const route = { path: "/ar", lang: "ar" };
    expect(languageOf(route)).toBe("ar");
    expect(htmlTagFor(languageOf(route))).toBe('<html lang="ar" dir="rtl">');
  });

  it("every other marketing route stays English", () => {
    expect(languageOf({ path: "/" })).toBe("en");
    expect(languageOf({ path: "/games" })).toBe("en");
    expect(languageOf({ path: "/x", lang: "ko" })).toBe("en");
  });
});

describe("the client agrees with the raw HTML", () => {
  it("Index declares the reciprocal pair and a per-page canonical", () => {
    expect(index).toContain('en: "https://kloversegy.com/"');
    expect(index).toContain('ar: "https://kloversegy.com/ar"');
    expect(index).toContain('"https://kloversegy.com/ar"');
  });

  it("/ar opens in Arabic and the toggle moves between the two URLs", () => {
    expect(langCtx).toContain('AR_HOME = "/ar"');
    expect(langCtx).toContain("pushState");
  });
});

describe("the sitemap lists both and pairs them", () => {
  const { xml } = buildSitemap([], "2026-09-24");
  const blockFor = (loc) => {
    const m = xml.match(new RegExp(`<url>\\s*<loc>${loc.replace(/[/.]/g, "\\$&")}</loc>[\\s\\S]*?</url>`));
    return m ? m[0] : "";
  };

  it("/ar has a <loc>", () => {
    expect(blockFor("https://kloversegy.com/ar")).not.toBe("");
  });

  it("both pages carry the same en / ar / x-default alternates", () => {
    for (const loc of ["https://kloversegy.com/", "https://kloversegy.com/ar"]) {
      const block = blockFor(loc);
      expect(block).toContain('hreflang="en" href="https://kloversegy.com/"');
      expect(block).toContain('hreflang="ar" href="https://kloversegy.com/ar"');
      expect(block).toContain('hreflang="x-default" href="https://kloversegy.com/"');
    }
  });
});
