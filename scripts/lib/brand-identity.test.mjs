import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * brand-identity.test.mjs — guards the two places the business states its own
 * name, and the one rule that decides whether the homepage title gets a suffix.
 *
 * WHY THIS EXISTS
 *
 * "klovers" takes 218 impressions at average position 7.8 and ONE click. The
 * Latin name is contested by entities this site cannot outrank — klovers.net
 * has been a Korean-topic community since 2011, and there is also klovers.io,
 * a Klovers surname, a university society and a fintech app. The Arabic name
 * «كلوفرز — أكاديمية محبي الكورية» is unclaimed: zero impressions, and no
 * competitor in Arabic Korean-learning has a real brand name at all.
 *
 * So the Arabic name is the asset, and the thing that makes it an asset is
 * Google knowing it refers to the same business as the Latin one. That link
 * lives in two JSON-LD blocks and one route title. All three are easy to
 * break silently — an Arabic string is invisible to an English-reading
 * reviewer skimming a diff — which is what these assertions are for.
 *
 * READING index.html FROM scripts/lib/ IS FINE, NOT A CONTORTION
 *
 * index.html sits at the repo root and is plain text with two <script
 * type="application/ld+json"> blocks that JSON.parse handles directly. There
 * is no bundler, alias or JSX in the way — unlike GamesPage.tsx, which
 * games-free-set.test.mjs has to parse as text for exactly those reasons. So
 * this asserts against real parsed JSON, not against source text.
 */

const repoRoot = process.cwd();
const indexHtml = readFileSync(join(repoRoot, "index.html"), "utf-8");
const prerenderSrc = readFileSync(join(repoRoot, "scripts/prerender-meta.mjs"), "utf-8");

/** SITE_NAME as prerender-meta.mjs defines it — read, not assumed. */
const SITE_NAME = prerenderSrc.match(/const SITE_NAME = "([^"]+)"/)[1];

/** Every ld+json block in index.html, parsed. */
const jsonLdBlocks = [...indexHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((m) => JSON.parse(m[1]));

const typeOf = (o) => (Array.isArray(o["@type"]) ? o["@type"] : [o["@type"]]);
const orgLd = jsonLdBlocks.find((o) => typeOf(o).includes("EducationalOrganization"));
const siteLd = jsonLdBlocks.find((o) => typeOf(o).includes("WebSite"));

const hasArabic = (s) => /[؀-ۿ]/.test(s);
const hasLatin = (s) => /[A-Za-z]/.test(s);

/** The `/` entry of MARKETING_ROUTES, as written. */
function parseHomeRoute(src) {
  const m = src.match(/path: "\/",\n\s*title: "([^"]+)",\n\s*description:\n\s*"([^"]+)",/);
  if (!m) throw new Error("could not find the `/` route in MARKETING_ROUTES");
  return { title: m[1], description: m[2] };
}
const home = parseHomeRoute(prerenderSrc);

/** The emit loop's rule, restated here so the test fails if it ever diverges. */
const renderTitle = (title) => (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`);

describe("index.html JSON-LD is well formed", () => {
  it("contains exactly two ld+json blocks and both parse", () => {
    // JSON.parse throwing above would already have failed the file, but assert
    // the count so a third block cannot appear unnoticed.
    expect(jsonLdBlocks.length).toBe(2);
  });

  it("has the Organization block with a stable @id", () => {
    expect(orgLd).toBeDefined();
    expect(typeOf(orgLd)).toEqual(["EducationalOrganization", "LocalBusiness"]);
    expect(orgLd["@id"]).toBe("https://kloversegy.com/#organization");
  });

  it("has the WebSite block", () => {
    expect(siteLd).toBeDefined();
  });
});

describe("the Organization knows its Arabic name", () => {
  it("declares alternateName as an array", () => {
    // schema.org: "By default, any property in Schema.org can have multiple
    // values... In JSON-LD, it is represented as an array of values."
    // (https://schema.org/docs/datamodel.html). alternateName's range is Text
    // and it carries no cardinality restriction.
    expect(Array.isArray(orgLd.alternateName)).toBe(true);
  });

  it("every alternateName is a non-empty Text value", () => {
    for (const n of orgLd.alternateName) {
      expect(typeof n).toBe("string");
      expect(n.trim().length).toBeGreaterThan(0);
    }
  });

  it("carries both a Latin and an Arabic form", () => {
    expect(orgLd.alternateName.some(hasLatin)).toBe(true);
    expect(orgLd.alternateName.some(hasArabic)).toBe(true);
  });

  it("carries the approved bilingual form verbatim", () => {
    // Re approved this exact string. Splitting or re-punctuating it is the
    // failure mode worth catching — an Arabic edit is invisible to a reviewer
    // who does not read Arabic.
    expect(orgLd.alternateName).toContain("كلوفرز — أكاديمية محبي الكورية");
  });

  it("carries the bare Arabic brand word on its own", () => {
    // The single word is what someone actually types.
    expect(orgLd.alternateName).toContain("كلوفرز");
  });

  it("still carries the bare Latin brand", () => {
    expect(orgLd.alternateName).toContain("Klovers");
  });

  it("has no duplicate alternate names", () => {
    expect(new Set(orgLd.alternateName).size).toBe(orgLd.alternateName.length);
  });

  it("leaves the primary name and inLanguage alone", () => {
    expect(orgLd.name).toBe("Klovers — Korean Lovers Academy");
    expect(orgLd.inLanguage).toEqual(["ar", "en"]);
  });
});

describe("the WebSite knows its Arabic name", () => {
  // Google's site-name feature reads WebSite name and alternateName
  // (https://developers.google.com/search/docs/appearance/site-names), and
  // supports more than one alternate "in order of your preference". This block
  // previously had no alternateName at all.
  it("declares alternateName as an array containing an Arabic form", () => {
    expect(Array.isArray(siteLd.alternateName)).toBe(true);
    expect(siteLd.alternateName.some(hasArabic)).toBe(true);
  });

  it("keeps the Latin site name as primary", () => {
    expect(siteLd.name).toBe("Klovers");
  });
});

describe("sameAs is untouched", () => {
  // Both social handles are named after klovers.net, the competitor. That is a
  // real problem and it is Re's to fix — it needs her Google Business Profile
  // URL and her Instagram/YouTube. Pinned here so this PR cannot be blamed for
  // a change it did not make, and so a future edit is deliberate.
  it("still holds exactly the three profiles it held before", () => {
    expect(orgLd.sameAs).toEqual([
      "https://share.google/4pWiAGlbXHCmd8hpi",
      "https://www.facebook.com/Klovers.net/",
      "https://www.tiktok.com/@klovers.net",
    ]);
  });
});

describe("the org JSON-LD stays homepage-only", () => {
  // prerender-meta.mjs strips both blocks from every non-home route so 218
  // subpages do not repeat the same entity markup. An edit that broke the
  // regex would silently duplicate the Organization across the whole site.
  const STRIP = /[ \t]*<!-- JSON-LD[^>]*-->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g;

  it("uses the same strip pattern prerender-meta.mjs does", () => {
    expect(prerenderSrc).toContain('<!-- JSON-LD[^>]*-->');
  });

  it("removes both blocks, Arabic names included", () => {
    const stripped = indexHtml.replace(STRIP, "");
    expect(stripped).not.toMatch(/application\/ld\+json/);
    expect(stripped).not.toContain("كلوفرز");
  });

  it("leaves the rest of the document intact", () => {
    const stripped = indexHtml.replace(STRIP, "");
    expect(stripped).toContain('<div id="root"></div>');
    expect(stripped).toContain("<title>");
  });

  it("contains no literal </script> inside the JSON, which would truncate the block", () => {
    const raw = [...indexHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const [, body] of raw) expect(body).not.toContain("</script>");
  });
});

describe("the homepage title", () => {
  it("contains SITE_NAME, so the emit loop appends no suffix", () => {
    expect(home.title.includes(SITE_NAME)).toBe(true);
    expect(renderTitle(home.title)).toBe(home.title);
    expect(renderTitle(home.title)).not.toMatch(/\| Klovers$/);
  });

  it("leads with the brand rather than burying it", () => {
    expect(home.title.startsWith(SITE_NAME)).toBe(true);
  });

  it("is within a sane SERP length", () => {
    // Google truncates around 60 characters. The old title rendered at 29,
    // which was short but put the brand last.
    const n = [...renderTitle(home.title)].length;
    expect(n).toBeGreaterThan(25);
    expect(n).toBeLessThanOrEqual(60);
  });
});

describe("the homepage description", () => {
  it("names the business in Arabic so a crawler can bind the two forms", () => {
    expect(hasArabic(home.description)).toBe(true);
    expect(home.description).toContain("كلوفرز");
  });

  it("still names the business in Latin", () => {
    expect(home.description).toContain("Klovers");
  });

  it("keeps the original meaning", () => {
    for (const claim of ["interactive", "placement test", "gamified"]) {
      expect(home.description.toLowerCase()).toContain(claim);
    }
  });

  it("fits the meta description budget", () => {
    expect([...home.description].length).toBeLessThanOrEqual(160);
    expect([...home.description].length).toBeGreaterThan(70);
  });
});
