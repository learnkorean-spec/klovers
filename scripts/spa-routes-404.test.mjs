import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * spa-routes-404.test.mjs — keeps vercel.json's SPA allowlist in step with
 * the routes in src/App.tsx (25 Sep 2026).
 *
 * Unknown URLs used to get the SPA shell with HTTP 200 (a "soft 404" in the
 * 23 Sep audit). vercel.json now rewrites only the SPA's own routes to
 * /app.html and sends everything else to /api/not-found, which answers 404.
 * The cost is that a new <Route> must also be added to that allowlist, or
 * the page would 404 in production. This test fails first.
 */

const root = process.cwd();
const app = readFileSync(join(root, "src/App.tsx"), "utf-8");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf-8"));

const spaRewrite = vercel.rewrites.find((r) => r.destination === "/app.html");
const allow = new RegExp(`^${spaRewrite.source}$`);

// /blog/:slug has its own rewrite (api/blog-not-found) and "*" is NotFound.
const SKIP = new Set(["/", "*", "/blog/:slug"]);

const paths = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => !SKIP.has(p));

describe("every SPA route is reachable in production", () => {
  it("finds the routes", () => {
    expect(paths.length).toBeGreaterThan(40);
  });
  it.each(paths)("%s is in vercel.json's /app.html allowlist", (path) => {
    const sample = path.replace(/\/:[A-Za-z]+\?/g, "").replace(/:[A-Za-z]+/g, "x1");
    expect(allow.test(sample), `add ${path} to the /app.html rewrite in vercel.json`).toBe(true);
  });
});

describe("unknown URLs get a real 404", () => {
  it("does not allowlist made-up paths", () => {
    for (const p of ["/nope", "/courses/extra", "/admin/a/b/c"]) expect(allow.test(p)).toBe(false);
  });
  it("sends everything else to /api/not-found, after the allowlist", () => {
    const i = vercel.rewrites.indexOf(spaRewrite);
    const last = vercel.rewrites[vercel.rewrites.length - 1];
    expect(last.destination).toBe("/api/not-found");
    expect(vercel.rewrites.indexOf(last)).toBeGreaterThan(i);
  });
});
