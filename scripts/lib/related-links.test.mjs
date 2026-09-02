import { describe, it, expect } from "vitest";
import {
  normaliseKeyword,
  slugTokens,
  buildRelatedMap,
  withRelatedBlock,
  renderRelatedBlock,
  MARKER_START,
  MARKER_END,
} from "./related-links.mjs";

const A = (slug, lang, keywords) => ({ slug, lang, keywords });

const CORPUS = [
  A("korean-verb-conjugation-guide", "en", ["korean grammar", "verb conjugation"]),
  A("korean-past-tense-conjugation-guide", "en", ["korean grammar", "verb conjugation"]),
  A("korean-irregular-verbs-guide", "en", ["korean grammar", "verb conjugation"]),
  A("korean-food-vocabulary", "en", ["korean food", "korean vocabulary"]),
  A("korean-street-food-guide", "en", ["korean food"]),
  A("korean-verb-conjugation-guide-ar", "ar", ["قواعد كورية", "تصريف الأفعال"]),
  A("korean-past-tense-conjugation-guide-ar", "ar", ["القواعد الكورية", "تصريف أفعال"]),
];

describe("normaliseKeyword", () => {
  it("strips the definite article on every word, not just the first", () => {
    // The Gate 2 Step 1 detector stripped only a leading clitic and therefore
    // read these two as unrelated. They are the same phrase.
    expect(normaliseKeyword("الأفعال الكورية")).toBe(normaliseKeyword("أفعال كورية"));
  });

  it("strips the conjunction prefix", () => {
    expect(normaliseKeyword("وآداب")).toBe(normaliseKeyword("آداب"));
  });

  it("unifies alef and ta-marbuta forms", () => {
    expect(normaliseKeyword("إتيكيت")).toBe(normaliseKeyword("اتيكيت"));
    expect(normaliseKeyword("ثقافة")).toBe(normaliseKeyword("ثقافه"));
  });

  it("is a no-op on plain English", () => {
    expect(normaliseKeyword("Korean Grammar")).toBe("korean grammar");
  });
});

describe("slugTokens", () => {
  it("drops filler and short tokens", () => {
    expect(slugTokens("learn-the-korean-alphabet-guide")).not.toContain("guide");
    expect(slugTokens("learn-the-korean-alphabet-guide")).toContain("alphabet");
  });
});

describe("buildRelatedMap", () => {
  const map = buildRelatedMap(CORPUS, { perArticle: 3 });

  it("never links an article to itself", () => {
    for (const [slug, targets] of map) expect(targets).not.toContain(slug);
  });

  it("never crosses languages", () => {
    const lang = new Map(CORPUS.map((a) => [a.slug, a.lang]));
    for (const [slug, targets] of map) {
      for (const t of targets) expect(lang.get(t)).toBe(lang.get(slug));
    }
  });

  it("never links to a retired slug", () => {
    const retired = new Set(["korean-street-food-guide"]);
    const m = buildRelatedMap(CORPUS, { perArticle: 3, retired });
    expect(m.has("korean-street-food-guide")).toBe(false);
    for (const targets of m.values()) expect(targets).not.toContain("korean-street-food-guide");
  });

  it("does not relate articles that only share a ubiquitous token", () => {
    // Every slug in the corpus contains "korean"; that alone must not be
    // enough to make a food article related to a grammar article.
    expect(map.get("korean-food-vocabulary")).not.toContain("korean-verb-conjugation-guide");
  });

  it("groups genuine topic neighbours", () => {
    expect(map.get("korean-verb-conjugation-guide")).toContain("korean-past-tense-conjugation-guide");
    expect(map.get("korean-food-vocabulary")).toContain("korean-street-food-guide");
  });

  it("matches Arabic neighbours across morphological variants", () => {
    // The two Arabic articles share a phrase only after clitic stripping.
    expect(map.get("korean-verb-conjugation-guide-ar")).toContain(
      "korean-past-tense-conjugation-guide-ar"
    );
  });

  it("respects perArticle", () => {
    for (const targets of map.values()) expect(targets.length).toBeLessThanOrEqual(4);
  });

  it("is deterministic across runs", () => {
    const a = buildRelatedMap(CORPUS, { perArticle: 3 });
    const b = buildRelatedMap([...CORPUS].reverse(), { perArticle: 3 });
    for (const [slug, targets] of a) expect(b.get(slug)).toEqual(targets);
  });

  it("leaves no article without inbound links", () => {
    const inbound = new Map([...map.keys()].map((s) => [s, 0]));
    for (const targets of map.values()) {
      for (const t of targets) inbound.set(t, inbound.get(t) + 1);
    }
    for (const [, n] of inbound) expect(n).toBeGreaterThan(0);
  });
});

describe("withRelatedBlock", () => {
  const items = [{ slug: "korean-food-vocabulary", title: "Korean Food Vocabulary" }];

  it("appends a delimited block", () => {
    const out = withRelatedBlock("# Title\n\nBody text.", "en", items);
    expect(out).toContain(MARKER_START);
    expect(out).toContain(MARKER_END);
    expect(out).toContain("## Related Articles");
    expect(out).toContain("[Korean Food Vocabulary](/blog/korean-food-vocabulary)");
    expect(out.startsWith("# Title")).toBe(true);
  });

  it("uses the Arabic heading for Arabic articles", () => {
    expect(withRelatedBlock("نص", "ar", items)).toContain("## مقالات ذات صلة");
  });

  it("returns null when the block is already exactly right - re-running is a no-op", () => {
    const once = withRelatedBlock("Body.", "en", items);
    expect(withRelatedBlock(once, "en", items)).toBeNull();
  });

  it("replaces an existing block rather than appending a second one", () => {
    const once = withRelatedBlock("Body.", "en", items);
    const twice = withRelatedBlock(once, "en", [
      { slug: "korean-street-food-guide", title: "Korean Street Food" },
    ]);
    expect(twice.match(new RegExp(MARKER_START, "g")).length).toBe(1);
    expect(twice).toContain("korean-street-food-guide");
    expect(twice).not.toContain("korean-food-vocabulary");
  });

  it("returns null when there is nothing to link", () => {
    expect(withRelatedBlock("Body.", "en", [])).toBeNull();
  });

  it("does not disturb the original body text", () => {
    const body = "# Title\n\nParagraph one.\n\n## Section\n\nParagraph two.";
    const out = withRelatedBlock(body, "en", items);
    expect(out.slice(0, body.length)).toBe(body);
  });

  it("renders a stable block for stable input", () => {
    expect(renderRelatedBlock("en", items)).toBe(renderRelatedBlock("en", items));
  });
});
