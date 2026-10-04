import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * home-meta-sync.test.mjs — the homepage's <title> and description are
 * written twice, and nothing tied the two copies together.
 *
 * src/pages/Index.tsx exports HOME_TITLE / HOME_DESCRIPTION, which useSEO
 * puts in the document head at runtime. scripts/prerender-meta.mjs writes the
 * same two strings into the static HTML of / and /ar — the copy a crawler that
 * never runs JavaScript reads. They are one page's name. When they disagree, a
 * reader who ran JavaScript and a crawler that did not are told two different
 * things about the same URL, and the prerendered copy is the one Google is
 * most likely to have seen first.
 *
 * Until this file, the two were kept in step by hand. The Arabic pair is
 * declared the same way (not exported, since only the English pair is read
 * outside the page) and is matched the same way. Length ceilings are asserted
 * here rather than left to review, because a search result truncates and
 * nothing else in the pipeline would notice.
 */

const root = process.cwd();
const index = readFileSync(join(root, "src/pages/Index.tsx"), "utf-8");
const prerender = readFileSync(join(root, "scripts/prerender-meta.mjs"), "utf-8");

/** `export const NAME = "..."`, or `const NAME = "..."` for the Arabic pair. */
const declared = (name) => {
  const m = index.match(
    new RegExp(`(?:export )?const ${name} =\\s*\\n?\\s*"([^"]+)"`)
  );
  expect(m, `${name} is no longer declared in src/pages/Index.tsx`).not.toBeNull();
  return m[1];
};

/** The MARKETING_ROUTES object literal for one path. */
const entryFor = (path) => {
  const m = prerender.match(
    new RegExp(`path: "${path.replace("/", "\\/")}",[\\s\\S]*?\\n  \\},`)
  );
  expect(m, `no "${path}" entry in MARKETING_ROUTES`).not.toBeNull();
  return m[0];
};

/** `title: "..."` / `description:` on the next line, both as written. */
const fieldOf = (entry, field) => {
  const m = entry.match(new RegExp(`${field}:\\s*\\n?\\s*"([^"]+)"`));
  expect(m, `no ${field} on this route`).not.toBeNull();
  return m[1];
};

const pairs = [
  {
    path: "/",
    titleConst: "HOME_TITLE",
    descriptionConst: "HOME_DESCRIPTION",
    label: "the English homepage",
  },
  {
    path: "/ar",
    titleConst: "HOME_TITLE_AR",
    descriptionConst: "HOME_DESCRIPTION_AR",
    label: "the Arabic homepage",
  },
];

describe("the homepage head is one string, not two copies of it", () => {
  for (const { path, titleConst, descriptionConst, label } of pairs) {
    it(`${label}: the prerendered title is the one Index.tsx declares`, () => {
      expect(fieldOf(entryFor(path), "title")).toBe(declared(titleConst));
    });

    it(`${label}: the prerendered description is the one Index.tsx declares`, () => {
      expect(fieldOf(entryFor(path), "description")).toBe(
        declared(descriptionConst)
      );
    });
  }

  it("both titles fit a search result", () => {
    // Counted in code points, not UTF-16 units: the Arabic title is entirely
    // non-ASCII and would otherwise be measured at double its length.
    for (const { titleConst } of pairs) {
      expect([...declared(titleConst)].length).toBeLessThanOrEqual(60);
    }
  });

  it("both descriptions fit a search result", () => {
    for (const { descriptionConst } of pairs) {
      expect([...declared(descriptionConst)].length).toBeLessThanOrEqual(160);
    }
  });

  it("each language's head names only that language", () => {
    // One language per page (Re, 27 Sep 2026). The Arabic pair is the one that
    // can regress here, because the English brand is the tempting thing to
    // leave in place.
    expect(declared("HOME_TITLE_AR")).not.toMatch(/[A-Za-z]/);
    expect(declared("HOME_DESCRIPTION_AR")).not.toMatch(/[A-Za-z]/);
    expect(declared("HOME_TITLE_AR").startsWith("كلوفرز")).toBe(true);
  });
});

/**
 * THE PRICE IN THE CRAWLER COPY IS A THIRD COPY OF A NUMBER THAT LIVES IN CODE.
 *
 * The prerendered homepage now states the USD price, because a crawler that
 * runs no JavaScript is the one reader who cannot be shown a price by
 * PriceTeaser - and until 4 Oct 2026 the homepage said only "priced by
 * country", so the delivered HTML carried no figure at all.
 *
 * That number is written in scripts/prerender-meta.mjs and owned by
 * src/lib/stripePrices.ts. This is exactly the shape that drifted before (see
 * the head note above), so it is asserted rather than left to review: change
 * the global group price in stripePrices and this fails until the crawler copy
 * says the same thing.
 */
const stripe = readFileSync(join(root, "src/lib/stripePrices.ts"), "utf-8");

const globalGroupMonthlyUsd = () => {
  const m = stripe.match(/global:\s*\{\s*group:\s*\{\s*1:\s*\{[^}]*amount:\s*(\d+)/);
  expect(m, "the global group 1-month USD amount is no longer readable in stripePrices.ts").not.toBeNull();
  return Number(m[1]);
};

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const toArabicIndic = (n) => String(n).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]);

describe("the price the crawler is told is the price the code charges", () => {
  it("the English crawler copy states the global USD group price", () => {
    const usd = globalGroupMonthlyUsd();
    const body = readFileSync(join(root, "scripts/prerender-meta.mjs"), "utf-8");
    const homeBody = body.slice(body.indexOf("const HOME_BODY_HTML ="), body.indexOf("const HOME_BODY_HTML_AR ="));
    expect(homeBody, `HOME_BODY_HTML should quote $${usd}`).toContain(`$${usd}`);
  });

  it("the Arabic crawler copy states it in Arabic-Indic digits", () => {
    const usd = globalGroupMonthlyUsd();
    const body = readFileSync(join(root, "scripts/prerender-meta.mjs"), "utf-8");
    const homeBodyAr = body.slice(body.indexOf("const HOME_BODY_HTML_AR ="));
    expect(homeBodyAr, `the Arabic body should quote ${toArabicIndic(usd)}`).toContain(
      toArabicIndic(usd),
    );
  });
});
