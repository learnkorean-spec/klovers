import { describe, it, expect } from "vitest";
import {
  stripHtmlComments,
  extractRelatedBlock,
  RELATED_MARKER_START,
  RELATED_MARKER_END,
} from "./markdownContent";
import { MARKER_START, MARKER_END } from "../../scripts/lib/related-links.mjs";

/**
 * The markers are duplicated across a .ts module the app imports and a .mjs
 * script the content pipeline imports. This is the assertion that stops the
 * two copies drifting: change one and the suite fails.
 */
describe("marker constants", () => {
  it("match the ones the content pipeline writes", () => {
    expect(RELATED_MARKER_START).toBe(MARKER_START);
    expect(RELATED_MARKER_END).toBe(MARKER_END);
  });
});

const withBlock = [
  "Plan your 2026 Seollal like a Korean.",
  "",
  MARKER_START,
  "",
  "## Related Articles",
  "",
  "- [Korean Holidays: Chuseok and Seollal Guide](/blog/korean-traditional-holidays-chuseok-seollal)",
  "- [Korean Age System Explained Simply](/blog/korean-age-system-explained)",
  "",
  MARKER_END,
  "",
].join("\n");

describe("stripHtmlComments", () => {
  it("removes the markers but keeps the block they wrap", () => {
    const out = stripHtmlComments(withBlock);
    expect(out).not.toContain("klovers:related");
    expect(out).not.toContain("<!--");
    expect(out).toContain("## Related Articles");
  });

  it("keeps the heading separated from the paragraph above it", () => {
    const out = stripHtmlComments(`Body text.\n\n${MARKER_START}\n\n## Related Articles\n`);
    expect(out).toBe("Body text.\n\n## Related Articles");
  });

  it("removes multi-line comments", () => {
    expect(stripHtmlComments("a\n\n<!--\nnote to editor\n-->\n\nb")).toBe("a\n\nb");
  });

  it("leaves real markup alone", () => {
    const md = "before\n\n<br />\n\nafter";
    expect(stripHtmlComments(md)).toBe(md);
  });

  it("is safe on empty and undefined-ish input", () => {
    expect(stripHtmlComments("")).toBe("");
    expect(stripHtmlComments(undefined as unknown as string)).toBe("");
  });
});

describe("extractRelatedBlock", () => {
  it("returns the slugs in the order the block lists them", () => {
    expect(extractRelatedBlock(withBlock).slugs).toEqual([
      "korean-traditional-holidays-chuseok-seollal",
      "korean-age-system-explained",
    ]);
  });

  it("removes the whole block from the body, heading included", () => {
    const { body } = extractRelatedBlock(withBlock);
    expect(body).toBe("Plan your 2026 Seollal like a Korean.");
    expect(body).not.toContain("Related Articles");
    expect(body).not.toContain("/blog/");
  });

  it("leaves an article without a block untouched apart from comments", () => {
    const md = "Just an article.\n\nWith [an inline link](/blog/korean-age-system-explained).";
    const { body, slugs } = extractRelatedBlock(md);
    expect(slugs).toEqual([]);
    expect(body).toBe(md);
  });

  it("does not treat a half-written block as a block", () => {
    const md = `Body.\n\n${MARKER_START}\n\n- [x](/blog/y)`;
    const { slugs, body } = extractRelatedBlock(md);
    expect(slugs).toEqual([]);
    expect(body).toContain("/blog/y");
  });

  it("de-duplicates a slug listed twice", () => {
    const md = `B\n\n${MARKER_START}\n- [a](/blog/x)\n- [b](/blog/x)\n${MARKER_END}`;
    expect(extractRelatedBlock(md).slugs).toEqual(["x"]);
  });

  it("is safe on empty input", () => {
    expect(extractRelatedBlock("")).toEqual({ body: "", slugs: [] });
  });
});
