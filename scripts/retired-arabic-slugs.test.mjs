/**
 * Keeps scripts/lib/retired-arabic-slugs.mjs and the redirects in vercel.json
 * from drifting apart. vercel.json is static JSON — it cannot import the
 * module — so this test is the only thing that would catch someone editing
 * one without the other.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { RETIRED_ARABIC_SLUGS, RETIRED_SLUGS } from "./lib/retired-arabic-slugs.mjs";

const vercelConfig = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf-8"));
const blogRedirects = new Map(
  vercelConfig.redirects
    .filter((r) => r.source.startsWith("/blog/"))
    .map((r) => [r.source.replace(/^\/blog\//, ""), r])
);

describe("retired Arabic duplicates (RETIRED_ARABIC_SLUGS) vs vercel.json", () => {
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

  it("retires either the legacy ar- prefix form or a -ar/-ar suffix duplicate, always to a -ar suffix survivor", () => {
    // Pairs #1-10 retire the ar-<base> prefix form. Pair #11 (2026-08-27,
    // see the module docstring) retires a second -ar suffix slug instead —
    // same underlying duplicate-content problem, a different naming shape
    // that the original prefix-only sweep couldn't catch. Every `to` still
    // ends in -ar either way.
    for (const { from, to } of RETIRED_ARABIC_SLUGS) {
      expect(from.startsWith("ar-") || from.endsWith("-ar")).toBe(true);
      expect(to.endsWith("-ar")).toBe(true);
    }
  });

  it("pair #11 retires the shorter, unpaired, colloquial-register duplicate", () => {
    const pair11 = RETIRED_ARABIC_SLUGS.find((r) => r.from === "korean-learning-apps-comparison-2026-ar");
    expect(pair11).toBeDefined();
    expect(pair11.to).toBe("korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar");
  });

  it("covers all 11 confirmed duplicates", () => {
    expect(RETIRED_ARABIC_SLUGS).toHaveLength(11);
  });
});

describe("RETIRED_SLUGS (the sitemap/prerender exclusion set)", () => {
  it("is exactly the set of retired duplicate slugs", () => {
    const expected = new Set(RETIRED_ARABIC_SLUGS.map((r) => r.from));
    expect(RETIRED_SLUGS).toEqual(expected);
    expect(RETIRED_SLUGS.size).toBe(11);
  });
});

describe("vercel.json has no unaccounted-for /blog redirect", () => {
  it("every /blog redirect traces back to RETIRED_ARABIC_SLUGS", () => {
    const known = new Set(RETIRED_ARABIC_SLUGS.map((r) => r.from));
    for (const source of blogRedirects.keys()) {
      expect(known.has(source), `unexpected /blog/${source} redirect not in RETIRED_ARABIC_SLUGS`).toBe(true);
    }
  });
});
