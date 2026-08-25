import { describe, it, expect } from "vitest";
import {
  analyze,
  baseSlug,
  clusterOf,
  countChars,
  countHangul,
  countHeadings,
  estimateWords,
  extractInternalLinks,
  faqStatus,
  stripMarkdown,
} from "./content-audit.mjs";

/**
 * Builds a post row with enough body to clear whichever bars the test needs.
 * `words` is approximate: the audit estimates English at 5.1 chars per word.
 */
const post = ({ slug, lang = "en", chars = 1000, h2 = 5, body = "", ...rest }) => ({
  slug,
  lang,
  title: rest.title ?? slug,
  description: rest.description ?? "d",
  keywords: rest.keywords ?? ["k"],
  hero_image: "/i.jpg",
  hero_alt: "alt",
  view_count: rest.view_count ?? 0,
  content:
    Array.from({ length: h2 }, (_, i) => `## Heading ${i}`).join("\n\n") +
    "\n\n" +
    "word ".repeat(Math.ceil(chars / 5)) +
    "\n\n" +
    body,
  ...rest,
});

describe("slug handling", () => {
  it("collapses both Arabic slug conventions onto the English base", () => {
    expect(baseSlug("korean-numbers-guide-ar")).toBe("korean-numbers-guide");
    expect(baseSlug("ar-korean-numbers-guide")).toBe("korean-numbers-guide");
    expect(baseSlug("korean-numbers-guide")).toBe("korean-numbers-guide");
  });
});

describe("counting", () => {
  it("counts characters as code points, the way Postgres length() does", () => {
    // "💡" is two UTF-16 units but one character. Several articles use emoji
    // as section markers, so this is the difference between the report and a
    // number checked straight against the database.
    expect("💡".length).toBe(2);
    expect(countChars("💡")).toBe(1);
  });

  it("counts only ATX headings at the requested level", () => {
    const md = "# Title\n## One\n### Deep\n## Two\nnot ## a heading\n";
    expect(countHeadings(md, 2)).toBe(2);
    expect(countHeadings(md, 3)).toBe(1);
  });

  it("counts Hangul syllables", () => {
    expect(countHangul("먹다 means to eat")).toBe(2);
    expect(countHangul("no korean here")).toBe(0);
  });

  it("estimates words from prose, not from Markdown syntax", () => {
    const plain = "## Heading\n\n" + "word ".repeat(100);
    // 100 words at 5 chars each, headings and markers stripped.
    expect(estimateWords(plain, "en")).toBeGreaterThan(90);
    expect(estimateWords(plain, "en")).toBeLessThan(110);
  });

  it("keeps link text and drops link targets when stripping", () => {
    expect(stripMarkdown("See [the textbook](/textbook) now")).toBe("See the textbook now");
    expect(stripMarkdown("```\ncode\n```\ntext")).toBe("text");
  });
});

describe("internal links", () => {
  it("separates article links from marketing-page links", () => {
    const md = [
      "[textbook](/textbook)",
      "[a post](/blog/korean-numbers-guide)",
      "[absolute](https://kloversegy.com/blog/korean-slang-words)",
      '<a href="/courses">courses</a>',
      "[external](https://naver.com)",
      "[anchor](#section)",
    ].join("\n");
    const links = extractInternalLinks(md);
    expect(links.blog).toEqual(["korean-numbers-guide", "korean-slang-words"]);
    expect(links.site).toEqual(["/textbook", "/courses"]);
    expect(links.total).toBe(4);
  });
});

describe("FAQ detection", () => {
  it("requires a heading, not a passing mention", () => {
    expect(faqStatus("## Quick FAQ\n\nq", "en").heading).toBe(true);
    expect(faqStatus("## Frequently Asked Questions\n\nq", "en").heading).toBe(true);
    const mention = faqStatus("Read our FAQ page for more.", "en");
    expect(mention.heading).toBe(false);
    expect(mention.mentionOnly).toBe(true);
  });

  it("recognises the Arabic heading", () => {
    expect(faqStatus("## الأسئلة الشائعة\n\nq", "ar").heading).toBe(true);
    expect(faqStatus("## مقدمة\n\nq", "ar").heading).toBe(false);
  });
});

describe("clusters", () => {
  it("puts a post and its translation in the same cluster", () => {
    expect(clusterOf("korean-numbers-guide")).toBe(clusterOf("ar-korean-numbers-guide"));
    expect(clusterOf("korean-slang-words")).toBe(clusterOf("korean-slang-words-ar"));
  });

  it("does not file 'proverbs' as grammar just because it contains 'verbs'", () => {
    expect(clusterOf("korean-proverbs-idioms-guide")).toBe("vocabulary-phrases");
    expect(clusterOf("korean-irregular-verbs-guide")).toBe("grammar");
  });

  it("files a folklore post written for drama fans under folklore", () => {
    expect(clusterOf("dokkaebi-korean-goblin-myth-kdrama")).toBe("myths-folklore");
    expect(clusterOf("best-kdrama-learn-korean-difficulty-ranked")).toBe("kdrama-kpop");
  });
});

describe("bucketing", () => {
  const strongBody = "[a](/blog/other-post) [b](/textbook) [c](/courses)\n\n## FAQ\n\nq";

  it("marks a long, structured, linked, paired article STRONG", () => {
    const rows = [
      post({ slug: "hub", chars: 7000, h2: 6, body: strongBody }),
      post({ slug: "hub-ar", lang: "ar", chars: 7000, h2: 6, body: "## أسئلة\n\n[x](/blog/hub)" }),
      post({ slug: "other-post", chars: 7000, h2: 6, body: strongBody }),
    ];
    const hub = analyze(rows, {}).articles.find((a) => a.slug === "hub");
    expect(hub.contentBucket).toBe("STRONG");
    expect(hub.missingStrongCriteria).toEqual([]);
    expect(hub.hasPair).toBe(true);
  });

  it("marks a short article THIN whatever else it has", () => {
    const rows = [post({ slug: "short", chars: 1000, h2: 6, body: strongBody })];
    expect(analyze(rows, {}).articles[0].contentBucket).toBe("THIN");
  });

  it("orphan status outranks the content bucket but does not hide it", () => {
    const rows = [
      post({ slug: "linked", chars: 7000, h2: 6, body: strongBody }),
      post({ slug: "linker", chars: 7000, h2: 6, body: "[to](/blog/linked)" }),
    ];
    const byslug = Object.fromEntries(analyze(rows, {}).articles.map((a) => [a.slug, a]));
    expect(byslug.linked.orphan).toBe(false);
    expect(byslug.linked.inboundLinks).toBe(1);
    expect(byslug.linker.orphan).toBe(true);
    expect(byslug.linker.bucket).toBe("ORPHAN");
    expect(byslug.linker.contentBucket).not.toBe("ORPHAN");
  });

  it("does not let an article count as its own inbound link", () => {
    const rows = [post({ slug: "selfref", chars: 7000, h2: 6, body: "[me](/blog/selfref)" })];
    expect(analyze(rows, {}).articles[0].orphan).toBe(true);
  });
});

describe("site-wide findings", () => {
  it("reports unpaired posts, legacy slugs and long titles", () => {
    const rows = [
      post({ slug: "solo-en", chars: 5000 }),
      post({ slug: "paired", chars: 5000 }),
      post({ slug: "ar-paired", lang: "ar", chars: 5000 }),
      post({ slug: "long-title", chars: 5000, title: "x".repeat(61) }),
    ];
    const { siteWide } = analyze(rows, {});
    expect(siteWide.englishWithoutArabicPair.map((a) => a.slug)).toEqual(["long-title", "solo-en"]);
    expect(siteWide.arabicWithoutEnglishPair).toEqual([]);
    expect(siteWide.legacyArabicPrefixSlugs[0]).toMatchObject({
      slug: "ar-paired",
      suggested: "paired-ar",
    });
    expect(siteWide.titlesOver60.map((a) => a.slug)).toEqual(["long-title"]);
  });

  it("reports sitemap and prerender checks as null when they did not run", () => {
    const a = analyze([post({ slug: "x", chars: 5000 })], {}).articles[0];
    expect(a.inSitemap).toBeNull();
    expect(a.prerendered).toBeNull();
  });

  it("flags a published post that is missing from the sitemap", () => {
    const rows = [post({ slug: "listed", chars: 5000 }), post({ slug: "missing", chars: 5000 })];
    const sitemapPaths = new Set(["/blog/listed"]);
    const { siteWide } = analyze(rows, { sitemapPaths });
    expect(siteWide.missingFromSitemap.map((a) => a.slug)).toEqual(["missing"]);
  });
});
