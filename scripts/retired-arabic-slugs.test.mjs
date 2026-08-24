/**
 * Keeps scripts/lib/retired-arabic-slugs.mjs and the redirects in vercel.json
 * from drifting apart. vercel.json is static JSON — it cannot import the
 * module — so this test is the only thing that would catch someone editing
 * one without the other.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { RETIRED_ARABIC_SLUGS, PENDING_SLUG_RENAMES, RETIRED_SLUGS } from "./lib/retired-arabic-slugs.mjs";

const vercelConfig = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf-8"));
const blogRedirects = new Map(
  vercelConfig.redirects
    .filter((r) => r.source.startsWith("/blog/"))
    .map((r) => [r.source.replace(/^\/blog\//, ""), r])
);

describe("confirmed duplicates (RETIRED_ARABIC_SLUGS) vs vercel.json", () => {
  it("has a permanent redirect for every retired slug, to the right target", () => {
    for (const { from, to } of RETIRED_ARABIC_SLUGS) {
      const r = blogRedirects.get(from);
      expect(r, `no /blog/${from} redirect in vercel.json`).toBeDefined();
      expect(r.destination).toBe(`/blog/${to}`);
      expect(r.permanent).toBe(true);
    }
  });

  it("never redirects a slug to itself", () => {
    for (const { from, to } of RETIRED_ARABIC_SLUGS) expect(from).not.toBe(to);
  });

  it("only retires the -ar suffix's duplicate, never the survivor", () => {
    for (const { from, to } of RETIRED_ARABIC_SLUGS) {
      expect(from.startsWith("ar-")).toBe(true);
      expect(to.endsWith("-ar")).toBe(true);
    }
  });
});

describe("pending renames (PENDING_SLUG_RENAMES) vs vercel.json", () => {
  // Unlike RETIRED_ARABIC_SLUGS, these two posts are NOT duplicates - each is
  // the only Arabic translation of its English article. The redirect ships
  // ahead of the rename on purpose (see docs/SEO_GATE1_DUPLICATE_SLUGS.md):
  // it has to exist and be confirmed live in production before the rename
  // runs, so the interval between the two never 404s both URLs.
  it("has a permanent redirect for each pending rename, to its future slug", () => {
    for (const { from, to } of PENDING_SLUG_RENAMES) {
      const r = blogRedirects.get(from);
      expect(r, `no /blog/${from} redirect in vercel.json`).toBeDefined();
      expect(r.destination).toBe(`/blog/${to}`);
      expect(r.permanent).toBe(true);
    }
  });

  it("is kept out of RETIRED_ARABIC_SLUGS - these are not duplicate pairs", () => {
    const duplicateFrom = new Set(RETIRED_ARABIC_SLUGS.map((r) => r.from));
    for (const { from } of PENDING_SLUG_RENAMES) {
      expect(duplicateFrom.has(from)).toBe(false);
    }
  });

  it("targets the confirmed English partner's base with the -ar suffix", () => {
    for (const { to, englishPartner } of PENDING_SLUG_RENAMES) {
      expect(to).toBe(`${englishPartner}-ar`);
    }
  });
});

describe("RETIRED_SLUGS (the sitemap/prerender exclusion set)", () => {
  it("is the union of confirmed duplicates and pending renames", () => {
    const expected = new Set([
      ...RETIRED_ARABIC_SLUGS.map((r) => r.from),
      ...PENDING_SLUG_RENAMES.map((r) => r.from),
    ]);
    expect(RETIRED_SLUGS).toEqual(expected);
    expect(RETIRED_SLUGS.size).toBe(10);
  });
});

describe("vercel.json has no unaccounted-for /blog redirect", () => {
  it("every /blog redirect traces back to either list", () => {
    const known = new Set([
      ...RETIRED_ARABIC_SLUGS.map((r) => r.from),
      ...PENDING_SLUG_RENAMES.map((r) => r.from),
    ]);
    for (const source of blogRedirects.keys()) {
      expect(known.has(source), `unexpected /blog/${source} redirect not in either list`).toBe(true);
    }
  });
});
