/**
 * Tests for scripts/lib/related-posts.mjs.
 *
 * The fixtures are real slugs and real `keywords` values from published rows,
 * because the cases worth protecting are the ones where a naive signal fails:
 * six folklore articles that share no slug word, and a Hangul article whose
 * nearest neighbours share a keyword *word* but no whole keyword phrase.
 */
import { describe, it, expect } from "vitest";
import {
  RELATED_MIN,
  RELATED_MAX,
  RELATED_CAP,
  baseOf,
  buildRelatedMap,
  keywordWords,
  scoreRelatedness,
  toCandidate,
  slugTokens,
} from "./lib/related-posts.mjs";

const post = (slug, keywords = [], lang = "en", articleType = "longform") => ({
  slug,
  lang,
  keywords,
  articleType,
});

// Real rows, verbatim from blog_posts.
const FOLKLORE = [
  post("gumiho-nine-tailed-fox-korean-folklore", [
    "gumiho", "nine-tailed fox", "korean folklore", "korean mythology",
    "tale of the nine tailed", "korean myths",
  ]),
  post("dokkaebi-korean-goblin-myth-kdrama", [
    "dokkaebi", "korean goblin", "dokkaebi kdrama", "korean folklore",
    "goblin drama", "korean mythology",
  ]),
  post("korean-ghost-stories-chilling-legends", [
    "korean ghost stories", "korean gwishin", "korean horror legends",
    "korean folklore", "korean myths", "korean scary stories",
  ]),
  post("jeoseung-saja-korean-grim-reaper-symbolism", [
    "jeoseung saja", "korean grim reaper", "korean folklore", "goblin kdrama",
    "korean mythology", "korean afterlife",
  ]),
  post("korean-shamanism-mudang-kdrama-tradition", [
    "korean shamanism", "mudang", "gut ritual", "korean folklore", "muism",
    "korean spirituality",
  ]),
];

const UNRELATED = [
  post("korean-skincare-kbeauty-routine-guide", [
    "korean skincare", "k-beauty", "10 step skincare routine",
    "korean beauty products", "glass skin", "korean culture",
  ]),
  post("korean-transportation-guide-seoul", [
    "korean transportation vocabulary", "seoul subway korean",
    "korean travel phrases", "getting around seoul", "korean for travelers",
  ]),
  post("korean-street-food-guide", [
    "korean street food guide", "tteokbokki hotteok", "korean food vocabulary",
    "pojangmacha guide", "korean travel food",
  ]),
  post("korean-money-banking-vocabulary", [
    "korean money vocabulary", "korean banking vocabulary",
    "currency exchange korean", "korean won phrases", "korean travel money",
  ]),
];

const HANGUL = [
  post("learn-korean-alphabet-hangul-guide", [
    "korean alphabet", "hangul", "learn korean", "hangul for beginners",
    "korean letters", "how to read korean",
  ]),
  post("korean-pronunciation-guide-beginners", [
    "korean pronunciation", "how to pronounce korean", "korean sounds",
    "korean for beginners", "learn korean pronunciation", "hangul pronunciation",
  ]),
  post("korean-pronunciation-guide-speaking", [
    "korean pronunciation", "speaking korean", "korean phonetics",
    "korean accent", "pronunciation tips",
  ]),
];

const relatedFor = (posts, slug) => buildRelatedMap(posts).related.get(slug);

describe("slug and keyword signals", () => {
  it("drops words that appear in almost every slug", () => {
    // "korean" is in about nine slugs out of ten; keeping it would relate
    // everything to everything.
    expect(slugTokens("korean-street-food-guide")).toEqual(new Set(["street", "food"]));
  });

  it("collapses both Arabic slug conventions onto the English base", () => {
    expect(baseOf("korean-numbers-guide-ar")).toBe("korean-numbers-guide");
    expect(baseOf("ar-korean-numbers-guide")).toBe("korean-numbers-guide");
  });

  it("breaks keyword phrases into words so near-matches still count", () => {
    expect(keywordWords(["hangul pronunciation"])).toEqual(new Set(["hangul", "pronunciation"]));
    expect(keywordWords(["learn korean"])).toEqual(new Set());
  });
});

describe("scoring", () => {
  it("scores two folklore articles above a folklore and a skincare article", () => {
    const gumiho = toCandidate(FOLKLORE[0]);
    const dokkaebi = toCandidate(FOLKLORE[1]);
    const skincare = toCandidate(UNRELATED[0]);
    expect(scoreRelatedness(gumiho, dokkaebi)).toBeGreaterThan(
      scoreRelatedness(gumiho, skincare)
    );
  });

  it("is symmetric", () => {
    const a = toCandidate(FOLKLORE[0]);
    const b = toCandidate(FOLKLORE[2]);
    expect(scoreRelatedness(a, b)).toBe(scoreRelatedness(b, a));
  });
});

describe("choosing related articles", () => {
  it("relates folklore articles that share no slug word at all", () => {
    // "gumiho-nine-tailed-fox-korean-folklore" and
    // "korean-ghost-stories-chilling-legends" have no meaningful slug word in
    // common. Only the shared keyword "korean folklore" connects them, and
    // without it the top-up would fill the block with skincare and subway maps.
    const chosen = relatedFor([...FOLKLORE, ...UNRELATED], FOLKLORE[0].slug);
    const unrelatedSlugs = new Set(UNRELATED.map((p) => p.slug));
    expect(chosen).toHaveLength(RELATED_MAX);
    expect(chosen.filter((s) => unrelatedSlugs.has(s))).toEqual([]);
  });

  it("relates hangul to pronunciation on a shared keyword word", () => {
    // "hangul" vs "hangul pronunciation": no whole phrase in common.
    const chosen = relatedFor([...HANGUL, ...UNRELATED], HANGUL[0].slug);
    expect(chosen).toContain("korean-pronunciation-guide-beginners");
  });

  it("never relates an article to its own translation", () => {
    const posts = [
      post("topic", ["korean folklore"]),
      post("topic-ar", ["korean folklore"], "ar"),
      post("ar-topic", ["korean folklore"], "ar"),
      ...FOLKLORE,
    ];
    expect(relatedFor(posts, "topic")).not.toContain("topic-ar");
    expect(relatedFor(posts, "topic")).not.toContain("ar-topic");
  });

  it("never relates the two Arabic translations of one English post", () => {
    const arabic = FOLKLORE.map((p) => post(`${p.slug}-ar`, p.keywords, "ar"));
    const posts = [
      post("dup", ["korean folklore"]),
      post("dup-ar", ["korean folklore"], "ar"),
      post("ar-dup", ["korean folklore"], "ar"),
      ...arabic,
    ];
    expect(relatedFor(posts, "dup-ar")).not.toContain("ar-dup");
    expect(relatedFor(posts, "ar-dup")).not.toContain("dup-ar");
  });

  it("never crosses languages", () => {
    const arabic = FOLKLORE.map((p) => post(`${p.slug}-ar`, p.keywords, "ar"));
    const { related } = buildRelatedMap([...FOLKLORE, ...arabic]);
    for (const [slug, chosen] of related) {
      const isAr = slug.endsWith("-ar");
      for (const c of chosen) expect(c.endsWith("-ar")).toBe(isAr);
    }
  });

  it("gives every article at least the minimum, even with nothing in common", () => {
    const strangers = ["alpha-one", "beta-two", "gamma-three", "delta-four", "epsilon-five"].map(
      (s) => post(s)
    );
    const { related } = buildRelatedMap(strangers);
    for (const chosen of related.values()) expect(chosen.length).toBe(RELATED_MIN);
  });

  it("leaves no orphan, which is the whole point of the block", () => {
    const strangers = Array.from({ length: 12 }, (_, i) => post(`stranger-${i}`));
    const { inbound } = buildRelatedMap([...FOLKLORE, ...UNRELATED, ...strangers]);
    const orphans = [...inbound].filter(([, n]) => n === 0).map(([s]) => s);
    expect(orphans).toEqual([]);
  });

  it("leaves no orphan even when one article matches nothing", () => {
    // A lone article sharing no slug word and no keyword with anything: passes
    // 1 and 2 can both skip it entirely, so pass 3 has to place it.
    const posts = [...FOLKLORE, post("utterly-unlike-anything-else", ["quantum bookbinding"])];
    const { inbound } = buildRelatedMap(posts);
    expect(inbound.get("utterly-unlike-anything-else")).toBeGreaterThan(0);
  });

  it("never exceeds the hard cap on links per article", () => {
    const strangers = Array.from({ length: 30 }, (_, i) => post(`stranger-${i}`));
    const { related } = buildRelatedMap([...FOLKLORE, ...UNRELATED, ...strangers]);
    for (const chosen of related.values()) {
      expect(chosen.length).toBeLessThanOrEqual(RELATED_CAP);
      expect(chosen.length).toBeGreaterThanOrEqual(RELATED_MIN);
    }
  });

  it("never lists the same article twice in one block", () => {
    const strangers = Array.from({ length: 20 }, (_, i) => post(`stranger-${i}`));
    const { related } = buildRelatedMap([...FOLKLORE, ...UNRELATED, ...strangers]);
    for (const chosen of related.values()) {
      expect(new Set(chosen).size).toBe(chosen.length);
    }
  });

  it("never points an article at itself", () => {
    const { related } = buildRelatedMap([...FOLKLORE, ...UNRELATED]);
    for (const [slug, chosen] of related) expect(chosen).not.toContain(slug);
  });

  it("still works when no keywords are stored, as after a cache fallback", () => {
    // The committed route cache holds no keywords, so a build that loses
    // Supabase falls back to slug words alone. It must still produce a full
    // block rather than failing the build.
    const noKeywords = [
      post("korean-past-tense-conjugation-guide"),
      post("korean-future-tense-plans-guide"),
      post("korean-verb-conjugation-guide"),
      post("korean-street-food-guide"),
      post("korean-food-vocabulary"),
    ];
    const chosen = relatedFor(noKeywords, "korean-past-tense-conjugation-guide");
    expect(chosen.length).toBeGreaterThanOrEqual(RELATED_MIN);
    expect(chosen).toContain("korean-future-tense-plans-guide");
  });

  it("is deterministic", () => {
    const posts = [...FOLKLORE, ...UNRELATED, ...HANGUL];
    const a = buildRelatedMap(posts).related;
    const b = buildRelatedMap(posts).related;
    expect([...a]).toEqual([...b]);
  });
});
