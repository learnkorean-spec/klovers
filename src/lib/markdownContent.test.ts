import { describe, it, expect } from "vitest";
import { stripHtmlComments } from "./markdownContent";
import { MARKER_START, MARKER_END } from "../../scripts/lib/related-links.mjs";

describe("stripHtmlComments", () => {
  it("removes the related-links markers but keeps the block they wrap", () => {
    const body = [
      "Plan your 2026 Seollal like a Korean.",
      "",
      MARKER_START,
      "",
      "## Related Articles",
      "",
      "- [Korean Holidays: Chuseok and Seollal Guide](/blog/korean-traditional-holidays-chuseok-seollal)",
      "",
      MARKER_END,
      "",
    ].join("\n");

    const out = stripHtmlComments(body);

    expect(out).not.toContain("klovers:related");
    expect(out).not.toContain("<!--");
    expect(out).toContain("## Related Articles");
    expect(out).toContain("/blog/korean-traditional-holidays-chuseok-seollal");
  });

  it("keeps the heading separated from the paragraph above it", () => {
    const out = stripHtmlComments(`Body text.\n\n${MARKER_START}\n\n## Related Articles\n`);
    // A single blank line is all markdown needs; three would render the same,
    // but the assertion pins the collapse so the output stays stable.
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
