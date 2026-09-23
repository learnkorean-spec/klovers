import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Charts must not load on marketing pages.
 *
 * Until 24 Sep 2026 vite.config.ts named recharts in manualChunks. The object
 * form of manualChunks also pulls the package's dependencies (clsx among them)
 * into that chunk, and the entry needs clsx for cn(), so the entry imported
 * and modulepreloaded ~411 KB of charting code on every public page.
 *
 * These are source-level checks, so they run without a build.
 */
const read = (p) => readFileSync(resolve(process.cwd(), p), "utf-8");

describe("chunking keeps charts off the marketing pages", () => {
  it("does not force recharts into a manual chunk", () => {
    const config = read("vite.config.ts");
    expect(config).not.toMatch(/["']recharts["']/);
    expect(config).not.toMatch(/["']vendor-charts["']/);
  });

  it("does not import charts from the eager app shell", () => {
    for (const file of ["src/main.tsx", "src/App.tsx", "src/components/CookieBanner.tsx"]) {
      const src = read(file);
      expect(src, file).not.toMatch(/from\s+["']recharts["']/);
      expect(src, file).not.toMatch(/components\/ui\/chart["']/);
    }
  });
});
