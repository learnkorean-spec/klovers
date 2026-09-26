import { describe, it, expect } from "vitest";
import { preloadHrefFor, preloadTagFor, PRELOAD_PATTERN } from "./lcp-preload.mjs";

const attr = (s) => String(s ?? "").replace(/"/g, "&quot;");
const SHIPPED =
  '    <link rel="preload" as="image" href="/hero-world.jpg" fetchpriority="high" />\n';

describe("preloadHrefFor", () => {
  it("leaves the homepage alone — its shipped preload is the right one", () => {
    expect(preloadHrefFor({ isHome: true, heroImage: "/assets/blog/x.jpg" })).toBeNull();
  });

  it("gives an article its own hero", () => {
    expect(preloadHrefFor({ isHome: false, heroImage: "/assets/blog/korean-numbers.jpg" }))
      .toBe("/assets/blog/korean-numbers.jpg");
  });

  it("accepts an absolute hero URL unchanged", () => {
    const u = "https://cdn.example.com/a.jpg";
    expect(preloadHrefFor({ isHome: false, heroImage: u })).toBe(u);
  });

  it("drops the preload on a route with no hero — wrong is worse than absent", () => {
    expect(preloadHrefFor({ isHome: false, heroImage: null })).toBeNull();
    expect(preloadHrefFor({ isHome: false, heroImage: "   " })).toBeNull();
    expect(preloadHrefFor({ isHome: false })).toBeNull();
  });
});

describe("preloadTagFor", () => {
  it("emits a high-priority image preload", () => {
    const tag = preloadTagFor({ isHome: false, heroImage: "/a.jpg" }, { attr });
    expect(tag).toContain('rel="preload"');
    expect(tag).toContain('as="image"');
    expect(tag).toContain('href="/a.jpg"');
    expect(tag).toContain('fetchpriority="high"');
  });

  it("emits nothing when there is nothing worth preloading", () => {
    expect(preloadTagFor({ isHome: false, heroImage: null }, { attr })).toBe("");
  });

  it("escapes the href", () => {
    expect(preloadTagFor({ isHome: false, heroImage: '/a"b.jpg' }, { attr })).toContain("&quot;");
  });
});

describe("PRELOAD_PATTERN", () => {
  const reset = () => (PRELOAD_PATTERN.lastIndex = 0);

  it("matches the tag index.html actually ships", () => {
    reset();
    expect(SHIPPED.replace(PRELOAD_PATTERN, "")).toBe("");
  });

  it("matches regardless of attribute order", () => {
    reset();
    const reordered =
      '    <link rel="preload" fetchpriority="high" as="image" href="/x.jpg">\n';
    expect(reordered.replace(PRELOAD_PATTERN, "")).toBe("");
  });

  it("leaves modulepreload and stylesheet links alone", () => {
    reset();
    const others =
      '    <link rel="modulepreload" crossorigin href="/assets/v.js">\n' +
      '    <link rel="stylesheet" crossorigin href="/assets/i.css">\n' +
      '    <link rel="preconnect" href="https://x.supabase.co" crossorigin />\n';
    expect(others.replace(PRELOAD_PATTERN, "")).toBe(others);
  });

  it("leaves a font preload alone — only as=image is ours", () => {
    reset();
    const font = '    <link rel="preload" as="font" href="/f.woff2" crossorigin>\n';
    expect(font.replace(PRELOAD_PATTERN, "")).toBe(font);
  });

  it("replaces rather than accumulates on a second pass", () => {
    reset();
    const once = SHIPPED.replace(PRELOAD_PATTERN, () =>
      preloadTagFor({ isHome: false, heroImage: "/a.jpg" }, { attr })
    );
    reset();
    const twice = once.replace(PRELOAD_PATTERN, () =>
      preloadTagFor({ isHome: false, heroImage: "/a.jpg" }, { attr })
    );
    expect(twice).toBe(once);
    expect((twice.match(/rel="preload"/g) || []).length).toBe(1);
  });
});
