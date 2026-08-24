/**
 * Keeps scripts/lib/retired-arabic-slugs.mjs and the redirects in vercel.json
 * from drifting apart. vercel.json is static JSON — it cannot import the
 * module — so this test is the only thing that would catch someone editing
 * one without the other.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { RETIRED_ARABIC_SLUGS, PENDING_SLUG_RENAMES } from "./lib/retired-arabic-slugs.mjs";

const vercelConfig = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf-8"));
const blogRedirects = new Map(
  vercelConfig.redirects
    .filter((r) => r.source.startsWith("/blog/"))
    .map((r) => [r.source.replace(/^\/blog\//, ""), r])
);

describe("retired Arabic slugs vs vercel.json", () => {
  it("has a permanent redirect for every retired slug, to the right target", () => {
    for (const { from, to } of RETIRED_ARABIC_SLUGS) {
      const r = blogRedirects.get(from);
      expect(r, `no /blog/${from} redirect in vercel.json`).toBeDefined();
      expect(r.destination).toBe(`/blog/${to}`);
      expect(r.permanent).toBe(true);
    }
  });

  it("has no /blog redirect that isn't accounted for by the retired list", () => {
    const known = new Set(RETIRED_ARABIC_SLUGS.map((r) => r.from));
    // /hangul-guide -> /blog/... is a pre-existing non-Arabic-duplicate redirect
    // and lives at the top level, not under /blog/, so it never reaches this map.
    for (const source of blogRedirects.keys()) {
      expect(known.has(source), `unexpected /blog/${source} redirect not in RETIRED_ARABIC_SLUGS`).toBe(true);
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

  it("keeps the two unique posts out of the retired list until their rename lands", () => {
    const retiredFrom = new Set(RETIRED_ARABIC_SLUGS.map((r) => r.from));
    for (const { from } of PENDING_SLUG_RENAMES) {
      expect(retiredFrom.has(from)).toBe(false);
      expect(blogRedirects.has(from)).toBe(false);
    }
  });
});
