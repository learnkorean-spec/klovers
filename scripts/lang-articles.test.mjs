/**
 * scripts/lib/lang-articles.mjs must list exactly the articles in
 * src/content/vocaArticles.ts and src/content/budaArticles.ts, and every one
 * of them must reach the sitemap.
 */
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  ENGLISH_ARTICLE_SLUGS,
  HUNGARIAN_ARTICLE_SLUGS,
} from "./lib/lang-articles.mjs";
import { buildSitemap } from "../api/sitemap.xml.js";

const slugsIn = (file) =>
  [...readFileSync(file, "utf-8").matchAll(/^\s{4}slug: "([^"]+)"/gm)].map((m) => m[1]);

describe("lang-articles", () => {
  it("matches the English articles in vocaArticles.ts", () => {
    expect(ENGLISH_ARTICLE_SLUGS).toEqual(slugsIn("src/content/vocaArticles.ts"));
  });

  it("matches the Hungarian articles in budaArticles.ts", () => {
    expect(HUNGARIAN_ARTICLE_SLUGS).toEqual(slugsIn("src/content/budaArticles.ts"));
  });

  it("puts both index pages and every article in the sitemap", () => {
    const { xml } = buildSitemap([], "2026-11-18");
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = [
      "/learn-english/articles",
      ...ENGLISH_ARTICLE_SLUGS.map((s) => `/learn-english/articles/${s}`),
      "/learn-hungarian/articles",
      ...HUNGARIAN_ARTICLE_SLUGS.map((s) => `/learn-hungarian/articles/${s}`),
    ];
    for (const path of expected) {
      expect(locs).toContain(`https://kloversegy.com${path}`);
    }
    expect(new Set(locs).size).toBe(locs.length);
  });
});
