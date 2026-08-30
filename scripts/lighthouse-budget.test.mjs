import { describe, it, expect } from "vitest";
import { extractMetrics, buildMarkdownTable, TARGETS } from "./lighthouse-budget.mjs";

/** Shape of `lighthouse <url> --output=json`, trimmed to what extractMetrics reads. */
function fakeLhr({ score = 0.87, lcp = 2100, cls = 0.05, tbt = 180 } = {}) {
  return {
    categories: { performance: { score } },
    audits: {
      "largest-contentful-paint": { numericValue: lcp },
      "cumulative-layout-shift": { numericValue: cls },
      "total-blocking-time": { numericValue: tbt },
    },
  };
}

describe("extractMetrics", () => {
  it("reads performance score, LCP, CLS, and TBT from a Lighthouse report", () => {
    const m = extractMetrics(fakeLhr({ score: 0.92, lcp: 1800, cls: 0.02, tbt: 90 }));
    expect(m).toEqual({ performanceScore: 92, lcpMs: 1800, cls: 0.02, tbtMs: 90 });
  });

  it("rounds the 0-1 performance score to a 0-100 integer", () => {
    expect(extractMetrics(fakeLhr({ score: 0.876 })).performanceScore).toBe(88);
  });

  it("returns null for every metric a malformed/missing report doesn't have", () => {
    expect(extractMetrics({})).toEqual({
      performanceScore: null,
      lcpMs: null,
      cls: null,
      tbtMs: null,
    });
  });

  it("does not read or invent an INP value — TBT is the only interactivity number", () => {
    const m = extractMetrics(fakeLhr());
    expect(m).not.toHaveProperty("inp");
    expect(m).not.toHaveProperty("inpMs");
  });
});

describe("buildMarkdownTable", () => {
  it("labels the interactivity column as a TBT lab proxy, never as INP", () => {
    const table = buildMarkdownTable([
      { label: "Homepage", path: "/", metrics: extractMetrics(fakeLhr()) },
    ]);
    expect(table).toContain("TBT (lab proxy for INP)");
    expect(table).not.toMatch(/\|\s*INP\s*\|/);
  });

  it("renders '—' for any metric a failed run couldn't produce", () => {
    const table = buildMarkdownTable([
      {
        label: "Homepage",
        path: "/",
        metrics: { performanceScore: null, lcpMs: null, cls: null, tbtMs: null },
      },
    ]);
    expect(table).toContain("| Homepage (`/`) | — | — | — | — |");
  });

  it("renders one row per page, in the given order", () => {
    const table = buildMarkdownTable([
      { label: "A", path: "/a", metrics: extractMetrics(fakeLhr()) },
      { label: "B", path: "/b", metrics: extractMetrics(fakeLhr()) },
    ]);
    const rows = table.split("\n").filter((l) => l.startsWith("| A") || l.startsWith("| B"));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("A (`/a`)");
    expect(rows[1]).toContain("B (`/b`)");
  });
});

describe("TARGETS", () => {
  it("covers the five representative pages the report asked for", () => {
    expect(TARGETS).toHaveLength(5);
    expect(TARGETS.map((t) => t.path)).toEqual([
      "/",
      "/blog",
      "/blog/how-to-learn-korean-faster",
      "/blog/korean-learning-apps-comparison-2026-duolingo-rosetta-stone-ar",
      "/blog/korean-weather-small-talk-phrases",
    ]);
  });

  it("includes exactly one Arabic (RTL) target", () => {
    const arTargets = TARGETS.filter((t) => t.path.endsWith("-ar"));
    expect(arTargets).toHaveLength(1);
  });
});
