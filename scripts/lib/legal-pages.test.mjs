import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { buildSitemap } from "../../api/sitemap.xml.js";

/**
 * legal-pages.test.mjs — /privacy-policy and /terms (24 Sep 2026).
 *
 * The footer linked to both, and the cookie banner to the privacy policy,
 * while neither route existed: every click landed on NotFound. A legal
 * page only counts when every piece agrees — the SPA route, the prerendered
 * head and body crawlers read, and the sitemap entry — so each is asserted.
 */

const root = process.cwd();
const prerender = readFileSync(join(root, "scripts/prerender-meta.mjs"), "utf-8");
const app = readFileSync(join(root, "src/App.tsx"), "utf-8");
const footer = readFileSync(join(root, "src/components/Footer.tsx"), "utf-8");
const banner = readFileSync(join(root, "src/components/CookieBanner.tsx"), "utf-8");

const PAGES = [
  { path: "/privacy-policy", element: "<PrivacyPolicyPage />", body: "PRIVACY_BODY_HTML", h1: "Privacy Policy" },
  { path: "/terms", element: "<TermsPage />", body: "TERMS_BODY_HTML", h1: "Terms of Service" },
];

describe("the links that pointed at nothing", () => {
  it("the footer and the cookie banner still link where the routes now are", () => {
    expect(footer).toContain('to="/privacy-policy"');
    expect(footer).toContain('to="/terms"');
    expect(banner).toContain('href="/privacy-policy"');
  });
});

describe.each(PAGES)("$path", ({ path, element, body, h1 }) => {
  it("is a route in the SPA", () => {
    expect(app).toContain(`<Route path="${path}" element={${element}} />`);
  });

  it("has a MARKETING_ROUTES entry with a head and a body", () => {
    const entry = prerender.match(new RegExp(`path: "${path.replace(/\//g, "\\/")}",[\\s\\S]*?\\n  \\},`));
    expect(entry, `no ${path} entry in MARKETING_ROUTES`).not.toBeNull();
    expect(entry[0]).toContain(`body: ${body}`);
    const description = entry[0].match(/description:\s*"([^"]+)"/)[1];
    expect([...description].length).toBeLessThanOrEqual(160);
  });

  it("prerenders exactly one h1, the page title, plus section headings", () => {
    const fragment = prerender.match(new RegExp(`const ${body} = \`([\\s\\S]*?)\`;`));
    expect(fragment).not.toBeNull();
    expect((fragment[1].match(/<h1[\s>]/g) || []).length).toBe(1);
    expect(fragment[1]).toContain(`<h1>${h1}</h1>`);
    expect(fragment[1]).toMatch(/<p>Last updated: \d{1,2} [A-Z][a-z]+ 20\d\d<\/p>/);
    expect((fragment[1].match(/<h2>/g) || []).length).toBeGreaterThanOrEqual(5);
  });

  it("is listed in the sitemap", () => {
    const { xml } = buildSitemap([], "2026-09-24");
    expect(xml).toContain(`<loc>https://kloversegy.com${path}</loc>`);
  });
});

describe("/privacy", () => {
  it("redirects to /privacy-policy instead of 404ing", () => {
    expect(app).toContain('<Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />');
  });
});
