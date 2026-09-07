import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

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
const siteConfigSrc = readFileSync(join(repoRoot, "src/lib/siteConfig.ts"), "utf-8");
const replyToSrc = readFileSync(
  join(repoRoot, "supabase/functions/send-confirmation-email/index.ts"),
  "utf-8"
);
const indexPageSrc = readFileSync(join(repoRoot, "src/pages/Index.tsx"), "utf-8");

/** Every .ts/.tsx file under src/, read once and shared by the blocks below. */
function walkSrc(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walkSrc(p, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(p);
  }
  return out;
}

const socialSrcFiles = walkSrc(join(repoRoot, "src")).map((p) => ({
  path: relative(repoRoot, p).split("\\").join("/"),
  text: readFileSync(p, "utf-8"),
}));

/**
 * CONTACT_EMAIL as siteConfig.ts declares it — read, not assumed, exactly as
 * SITE_NAME is read out of prerender-meta.mjs above.
 *
 * Reading siteConfig.ts from here is no more awkward than that: it is plain
 * text at a fixed path with one `export const NAME = "value"` per line, and
 * nothing about it needs a bundler, the "@/" alias or a TS transform to read
 * as source. Parsing it with a regex is the same technique this file already
 * uses, not a contortion adopted to make the assertion possible.
 */
const CONTACT_EMAIL = siteConfigSrc.match(/export const CONTACT_EMAIL = "([^"]+)"/)[1];

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

describe("sameAs points at profiles that still resolve", () => {
  /**
   * sameAs is how Google confirms that this site and a set of social profiles
   * are one entity. An entry that no longer resolves is therefore worse than
   * no entry at all: it does not merely fail to help, it actively weakens the
   * association.
   *
   * Both handles were renamed on 2026-09-07 to unify the brand. They had been
   * named after klovers.net — a Korean-topic community running since 2011,
   * i.e. the competitor this site cannot outrank for the Latin name — and the
   * old Facebook path now redirects to the Facebook home feed rather than to
   * the page. So the flag raised alongside the Arabic brand name is closed:
   * the handles no longer carry a competitor's name.
   *
   * Instagram was added on 2026-09-07 once the live profile was confirmed, so
   * all three social handles are now `kloversegy`. One gap is still open and
   * is deliberately NOT papered over here: the Google entry is a share.google
   * shortlink rather than a stable Google Business Profile URL, which is why
   * it sits last in the array.
   *
   * Pinned exactly rather than by pattern. A pattern would have gone on
   * passing through this rename, which is the failure this pin exists to
   * prevent — the point is that changing a profile URL is a deliberate edit
   * with a visible diff.
   */
  it("holds exactly the four profiles, on the current handles", () => {
    // Ordered strongest first: order in sameAs is a preference signal
    // (https://developers.google.com/search/docs/appearance/site-names), and
    // Facebook (2.4K followers) outweighs Instagram (412). The share.google
    // shortlink is last precisely because it is the weakest entry — it is a
    // share link, not a stable Google Business Profile URL.
    expect(orgLd.sameAs).toEqual([
      "https://www.facebook.com/kloversegy",
      "https://www.tiktok.com/@kloversegy",
      "https://www.instagram.com/kloversegy/",
      "https://share.google/4pWiAGlbXHCmd8hpi",
    ]);
  });

  it("uses one casing for the handle everywhere", () => {
    // Facebook paths are case-insensitive, so a stray "Kloversegy" would
    // resolve and never show up as a broken link — it would just sit in the
    // codebase as a second spelling of one identity. Instagram and TikTok are
    // lowercase, so lowercase is the house form.
    const handles = [...indexHtml.matchAll(/(?:facebook|tiktok|instagram)\.com\/@?([A-Za-z0-9._]+)/g)]
      .map((m) => m[1])
      .filter((h) => /kloversegy/i.test(h));
    expect(handles.length).toBeGreaterThan(0);
    for (const h of handles) expect(h).toBe(h.toLowerCase());
  });

  it("the homepage JSON-LD claims the same profiles as index.html", () => {
    // Index.tsx injects a second EducationalOrganization block at runtime with
    // its own duplicate sameAs array. If the two disagree the page asserts two
    // different identities at once — which is exactly what a rename produces
    // when only one of them is updated.
    const block = indexPageSrc.match(/sameAs: \[([\s\S]*?)\]/);
    expect(block, "no sameAs array found in src/pages/Index.tsx").not.toBeNull();
    const social = (u) => /facebook\.com|tiktok\.com|instagram\.com/.test(u);
    const fromPage = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).filter(social);
    const fromHtml = orgLd.sameAs.filter(social);
    expect(fromPage).toEqual(fromHtml);
  });

  it("no retired handle survives in any social URL", () => {
    // Matches the URL FORMS only, never the bare string. "klovers.net" appears
    // legitimately in prose here and in prerender-meta.mjs describing the
    // competitor, and a blind substring check would fail on an accurate
    // comment — or, worse, invite someone to edit the comment to get green.
    const RETIRED = /(?:facebook\.com\/Klovers\.net|tiktok\.com\/@klovers\.net)/i;
    const offenders = [
      { path: "index.html", text: indexHtml },
      ...socialSrcFiles,
    ].filter((f) => RETIRED.test(f.text)).map((f) => f.path);
    expect(
      offenders,
      `These files still link to a renamed social handle that no longer ` +
        `resolves:\n` + offenders.map((p) => `  ${p}`).join("\n")
    ).toEqual([]);
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

describe("the contact address has exactly one source of truth", () => {
  /**
   * WHY THIS BLOCK EXISTS
   *
   * siteConfig.ts has exported CONTACT_EMAIL as the single source of truth for
   * a while, and Footer.tsx, Index.tsx and ProgressReportPage.tsx each ignored
   * it and hardcoded the address instead — so changing the business email
   * meant finding five literals across four files plus the JSON-LD, and
   * missing one was silent. The three display sites now import the constant;
   * these assertions are what stop the next one from being pasted back in.
   */

  /** Shared with the sameAs block above — one walk, not two. */
  const srcFiles = socialSrcFiles;

  it("siteConfig declares a plausible address", () => {
    expect(CONTACT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it("the Organization JSON-LD email matches siteConfig", () => {
    // The two live in different files and different languages, so nothing but
    // this assertion keeps them equal.
    expect(orgLd.email).toBe(CONTACT_EMAIL);
  });

  it("the transactional reply-to matches siteConfig", () => {
    // supabase/functions/send-confirmation-email/index.ts. This one decides
    // where a student's reply physically lands, and an edge function genuinely
    // cannot import from src/ — so it is a deliberate duplicate, and this is
    // the check that keeps the duplicate honest.
    const m = replyToSrc.match(/const REPLY_TO_EMAIL = "([^"]+)"/);
    expect(m).not.toBeNull();
    expect(m[1]).toBe(CONTACT_EMAIL);
  });

  it("no file under src/ hardcodes the address instead of importing it", () => {
    const offenders = srcFiles
      .filter((f) => f.path !== "src/lib/siteConfig.ts" && f.text.includes(CONTACT_EMAIL))
      .map((f) => f.path);
    expect(
      offenders,
      `These files hardcode the contact address instead of importing ` +
        `CONTACT_EMAIL from @/lib/siteConfig:\n` +
        offenders.map((p) => `  ${p}`).join("\n")
    ).toEqual([]);
  });

  it("the address is declared exactly once in src/", () => {
    const declaring = srcFiles.filter((f) => f.text.includes(CONTACT_EMAIL)).map((f) => f.path);
    expect(declaring).toEqual(["src/lib/siteConfig.ts"]);
  });
});
