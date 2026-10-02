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
