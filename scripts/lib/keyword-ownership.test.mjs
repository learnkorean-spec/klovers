import { describe, it, expect } from "vitest";
import { planKeywordOwnership, pickOwner } from "./keyword-ownership.mjs";

const A = (slug, lang, keywords, views = 0, length = 0) => ({ slug, lang, keywords, views, length });

// Arabic fixtures. AR_GRAMMAR_DEF is "the Korean grammar", AR_GRAMMAR is
// "Korean grammar", AR_GRAMMAR_WA is "and the Korean grammar", AR_SYNTAX is
// "syntax". The first three are the same phrase wearing different clitics -
// the case an exact-string comparison misses.
const AR_GRAMMAR_DEF = "القواعد الكورية";
const AR_GRAMMAR = "قواعد كورية";
const AR_GRAMMAR_WA = "والقواعد الكورية";
const AR_SYNTAX = "نحو";

describe("pickOwner", () => {
  it("prefers measured views over length", () => {
    expect(pickOwner([A("a", "en", [], 1, 9000), A("b", "en", [], 5, 100)]).slug).toBe("b");
  });
  it("falls back to length when views tie", () => {
    expect(pickOwner([A("a", "en", [], 0, 100), A("b", "en", [], 0, 9000)]).slug).toBe("b");
  });
  it("is deterministic when everything ties", () => {
    expect(pickOwner([A("z", "en", []), A("a", "en", [])]).slug).toBe("a");
  });
});

describe("planKeywordOwnership", () => {
  const corpus = [
    A("g1", "en", ["korean grammar", "particles"], 10, 5000),
    A("g2", "en", ["korean grammar", "verb tense"], 1, 4000),
    A("g3", "en", ["korean grammar", "adjectives"], 0, 3000),
    A("g4", "en", ["korean grammar", "counters"], 0, 2000),
    A("g5", "en", ["korean grammar"], 0, 1000),
  ];

  const { changes, decisions, keptMinimum } = planKeywordOwnership(corpus, { contestedAt: 3 });

  it("identifies the contested keyword", () => {
    expect(decisions).toHaveLength(1);
    expect(decisions[0].claimedBy).toBe(5);
  });

  it("awards it to the most-viewed article", () => {
    expect(decisions[0].owner).toBe("g1");
  });

  it("leaves the owner untouched", () => {
    expect(changes.has("g1")).toBe(false);
  });

  it("strips it from the others", () => {
    expect(changes.get("g2")).toEqual(["verb tense"]);
    expect(changes.get("g4")).toEqual(["counters"]);
  });

  it("never empties an article keyword list - it proposes no change and reports it", () => {
    // g5's only keyword belongs to g1. Stripping it would leave g5 with no
    // declared subject, so g5 is left untouched and surfaced for a human to
    // give a more specific keyword.
    expect(changes.has("g5")).toBe(false);
    expect(keptMinimum).toContain("g5");
  });

  it("does not contest across languages", () => {
    const mixed = [
      A("e1", "en", ["korean grammar"]), A("e2", "en", ["korean grammar"]),
      A("a1", "ar", [AR_GRAMMAR]), A("a2", "ar", [AR_GRAMMAR]),
    ];
    const { decisions: d } = planKeywordOwnership(mixed, { contestedAt: 1 });
    expect(d.filter((x) => x.lang === "en")).toHaveLength(1);
    expect(d.filter((x) => x.lang === "ar")).toHaveLength(1);
  });

  it("treats Arabic morphological variants as one claim", () => {
    const ar = [
      A("a1", "ar", [AR_GRAMMAR_DEF], 5), A("a2", "ar", [AR_GRAMMAR]),
      A("a3", "ar", [AR_GRAMMAR_WA]), A("a4", "ar", [AR_GRAMMAR, AR_SYNTAX]),
    ];
    const { decisions: d, changes: c } = planKeywordOwnership(ar, { contestedAt: 3 });
    expect(d).toHaveLength(1);
    expect(d[0].owner).toBe("a1");
    expect(c.get("a4")).toEqual([AR_SYNTAX]);
  });

  it("leaves an uncontested catalogue completely alone", () => {
    const clean = [A("a", "en", ["one"]), A("b", "en", ["two"]), A("c", "en", ["three"])];
    expect(planKeywordOwnership(clean).changes.size).toBe(0);
  });

  it("is deterministic", () => {
    const a = planKeywordOwnership(corpus, { contestedAt: 3 });
    const b = planKeywordOwnership([...corpus].reverse(), { contestedAt: 3 });
    expect([...a.changes.entries()].sort()).toEqual([...b.changes.entries()].sort());
  });
});
