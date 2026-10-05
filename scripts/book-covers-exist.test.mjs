import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every local book cover BOOK_COVERS points at must actually be on disk.
 *
 * Why this exists: the range was put on one cover template on 1 Oct 2026, but
 * BOOK_COVERS kept pointing at the pre-restyle files in the marketing-images
 * bucket. Admin -> Book Plan showed the new aligned covers while the shop
 * shelf, the Books screen and a student's My Books showed the old mismatched
 * ones, and nothing failed — a wrong-but-present image looks like a working
 * page. Re found it by looking at the shelf.
 *
 * A missing file is the other half of the same failure and is cheap to catch,
 * so catch it. A cover that is present but stale is still only caught by
 * looking, which is why BOOK_COVERS carries a comment saying where it comes
 * from.
 */

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src/constants/books.ts");

/** The local paths in BOOK_COVERS, read from source so the test needs no build. */
function localCoverPaths() {
  const src = readFileSync(SRC, "utf8");
  const block = src.slice(src.indexOf("export const BOOK_COVERS"));
  const body = block.slice(0, block.indexOf("};"));
  return [...body.matchAll(/"(\/[^"]+\.(?:webp|png|jpg|jpeg|svg))"/g)].map((m) => m[1]);
}

describe("book covers", () => {
  const paths = localCoverPaths();

  it("BOOK_COVERS declares local cover paths", () => {
    expect(paths.length).toBeGreaterThan(5);
  });

  it("every local cover file exists under public/", () => {
    const missing = paths.filter((p) => !existsSync(join(ROOT, "public", p)));
    expect(missing, `BOOK_COVERS points at files that are not in public/:\n${missing.join("\n")}`)
      .toEqual([]);
  });

  it("every BOOKS entry has a cover", () => {
    const src = readFileSync(SRC, "utf8");
    const body = src.slice(src.indexOf("export const BOOKS"), src.indexOf("} as const;"));
    const ids = [...body.matchAll(/^  "([^"]+)": \{/gm)].map((m) => m[1]);
    const covers = src.slice(src.indexOf("export const BOOK_COVERS"));
    const mapped = new Set(
      [...covers.slice(0, covers.indexOf("};")).matchAll(/^  "([^"]+)":/gm)].map((m) => m[1]),
    );
    const uncovered = ids.filter((id) => !mapped.has(id));
    expect(uncovered, `BOOKS entries with no cover in BOOK_COVERS:\n${uncovered.join("\n")}`)
      .toEqual([]);
  });

  it("covers are small enough for a list thumbnail", () => {
    const heavy = paths
      .filter((p) => existsSync(join(ROOT, "public", p)))
      .map((p) => [p, statSync(join(ROOT, "public", p)).size])
      .filter(([, size]) => size > 60 * 1024)
      .map(([p, size]) => `${p} (${Math.round(size / 1024)} KB)`);
    expect(heavy, `Covers over 60 KB — these render at 60-300px, so resize them:\n${heavy.join("\n")}`)
      .toEqual([]);
  });
});
