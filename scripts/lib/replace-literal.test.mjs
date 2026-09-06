import { describe, it, expect } from "vitest";
import {
  replaceLiteral,
  hasSubstitutionPattern,
  SUBSTITUTION_PATTERN,
} from "./replace-literal.mjs";

// A stand-in for the document prerender-meta.mjs rewrites: the interesting
// part is that there is real content both BEFORE and AFTER the tag being
// replaced, so a "$`" or "$'" expansion is visible as spliced-in page text.
const DOC = [
  "<!doctype html>",
  "<html><head>",
  '<meta charset="UTF-8" />',
  "<title>PLACEHOLDER</title>",
  '<meta name="description" content="PLACEHOLDER" />',
  '<link rel="canonical" href="PLACEHOLDER" />',
  "</head><body>",
  '<div id="root"></div>',
  "</body></html>",
].join("\n");

const TITLE_RE = /<title>[^<]*<\/title>/;
const DESC_RE = /<meta name="description" content="[^"]*"\s*\/?>/;
const CANONICAL_RE = /<link rel="canonical" href="[^"]*"\s*\/?>/;

/** Every sequence String.replace expands in a string replacement. */
const HAZARDS = ["$&", "$`", "$'", "$$", "$1", "$9", "$<name>"];

describe("SUBSTITUTION_PATTERN / hasSubstitutionPattern", () => {
  it("recognises every expandable sequence", () => {
    for (const h of HAZARDS) expect(hasSubstitutionPattern(h)).toBe(true);
  });

  it("does not flag an ordinary dollar sign", () => {
    // Prices are the common real case: "$0", "15-20$", "8–12$/شهر".
    expect(hasSubstitutionPattern("costs 15-20$ a month")).toBe(false);
    expect(hasSubstitutionPattern("plain text")).toBe(false);
    expect(hasSubstitutionPattern("")).toBe(false);
    expect(hasSubstitutionPattern(null)).toBe(false);
  });

  it("flags a dollar followed by a digit, which is the price case that IS dangerous", () => {
    // "$0" is expandable ($0 is not a valid group, but $1-$99 are, and the
    // detector deliberately does not try to know how many groups a pattern
    // has). Three published articles contain "$" next to a digit.
    expect(hasSubstitutionPattern("costs $12 a month")).toBe(true);
  });

  it("is a plain regexp with no global flag, so it cannot carry lastIndex state", () => {
    expect(SUBSTITUTION_PATTERN.global).toBe(false);
  });
});

describe("the hazard this module exists to remove", () => {
  // These assert the NATIVE behaviour, so the tests below are demonstrably
  // testing something real rather than restating the obvious.
  it("native replace expands $& into the matched text", () => {
    const out = DOC.replace(TITLE_RE, `<title>Deal $& Now</title>`);
    expect(out).toContain("<title>PLACEHOLDER</title>");
    expect(out).not.toContain("<title>Deal $& Now</title>");
  });

  it("native replace expands $` into the whole document prefix", () => {
    const out = DOC.replace(TITLE_RE, "<title>A $` B</title>");
    expect(out).toContain("<!doctype html>");
    // The doctype now appears twice: once for real, once spliced into <title>.
    expect(out.match(/<!doctype html>/g).length).toBe(2);
  });

  it("native replace expands $' into the whole document suffix", () => {
    const out = DOC.replace(TITLE_RE, "<title>A $' B</title>");
    expect(out.match(/<div id="root"><\/div>/g).length).toBe(2);
  });
});

describe("replaceLiteral", () => {
  it("writes a title containing every hazard verbatim", () => {
    for (const h of HAZARDS) {
      const out = replaceLiteral(DOC, TITLE_RE, `<title>Klovers ${h} Korean</title>`);
      expect(out).toContain(`<title>Klovers ${h} Korean</title>`);
      expect(out).not.toContain("PLACEHOLDER</title>");
    }
  });

  it("writes a description containing every hazard verbatim", () => {
    for (const h of HAZARDS) {
      const out = replaceLiteral(
        DOC,
        DESC_RE,
        `<meta name="description" content="Learn ${h} Korean" />`
      );
      expect(out).toContain(`content="Learn ${h} Korean"`);
    }
  });

  it("writes a canonical URL containing every hazard verbatim", () => {
    for (const h of HAZARDS) {
      const out = replaceLiteral(
        DOC,
        CANONICAL_RE,
        `<link rel="canonical" href="https://kloversegy.com/blog/a${h}b" />`
      );
      expect(out).toContain(`href="https://kloversegy.com/blog/a${h}b"`);
    }
  });

  it("does not duplicate any part of the document", () => {
    // The failure mode of $` and $' is a silent duplication, so assert on the
    // document's own landmarks rather than only on the replaced tag.
    const out = replaceLiteral(DOC, TITLE_RE, "<title>A $` B $' C $& D</title>");
    expect(out.match(/<!doctype html>/g).length).toBe(1);
    expect(out.match(/<div id="root"><\/div>/g).length).toBe(1);
    expect(out.match(/<title>/g).length).toBe(1);
    expect(out).toContain("<title>A $` B $' C $& D</title>");
  });

  it("leaves the document byte-identical apart from the replaced tag", () => {
    const out = replaceLiteral(DOC, TITLE_RE, "<title>New</title>");
    expect(out).toBe(DOC.replace("<title>PLACEHOLDER</title>", "<title>New</title>"));
    expect(out.length).toBe(DOC.length - "PLACEHOLDER".length + "New".length);
  });

  it("preserves the pattern's own matching semantics", () => {
    // Non-global replaces the first match; global replaces all. Only the
    // handling of the REPLACEMENT changes.
    expect(replaceLiteral("a a a", /a/, "$&b")).toBe("$&b a a");
    expect(replaceLiteral("a a a", /a/g, "$&b")).toBe("$&b $&b $&b");
  });

  it("accepts a plain string pattern", () => {
    expect(replaceLiteral("x</head>y", "</head>", "$&TAGS</head>")).toBe(
      "x$&TAGS</head>y"
    );
  });

  it("returns the subject unchanged when the pattern does not match", () => {
    expect(replaceLiteral(DOC, /<nothing>/, "$&")).toBe(DOC);
  });

  it("handles an empty replacement and a null subject", () => {
    expect(replaceLiteral("abc", /b/, "")).toBe("ac");
    expect(replaceLiteral(null, /b/, "x")).toBe("");
    expect(replaceLiteral(undefined, /b/, "x")).toBe("");
  });

  it("writes a real-world price string with no expansion", () => {
    const out = replaceLiteral(
      DOC,
      DESC_RE,
      `<meta name="description" content="Plans from 15-20$ a month" />`
    );
    expect(out).toContain('content="Plans from 15-20$ a month"');
  });

  it("writes an Arabic title containing a hazard verbatim", () => {
    const out = replaceLiteral(DOC, TITLE_RE, "<title>ألعاب $& كورية</title>");
    expect(out).toContain("<title>ألعاب $& كورية</title>");
  });

  it("writes a multi-tag block, as the </head> insertion does", () => {
    // buildHeadTags returns many tags at once, including JSON-LD built from
    // article content; the whole block goes in through one replace.
    const block = [
      '<link rel="canonical" href="https://kloversegy.com/blog/x$&y" />',
      '<meta property="og:title" content="A $` B" />',
      '<script type="application/ld+json">{"headline":"C $\' D"}</script>',
    ].join("\n");
    const out = replaceLiteral(DOC, "</head>", `${block}\n</head>`);
    expect(out).toContain(block);
    expect(out.match(/<!doctype html>/g).length).toBe(1);
    expect(out.match(/<\/head>/g).length).toBe(1);
  });
});
