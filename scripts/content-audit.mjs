#!/usr/bin/env node
/**
 * content-audit.mjs — repeatable read-only audit of the published blog.
 *
 * Run with `npm run content-audit`. Emits two files next to the repo root:
 *
 *   content-audit.json  full per-article data, for scripts and diffing
 *   content-audit.md    the same thing written for a human to read
 *
 * READ-ONLY BY CONSTRUCTION. The only database call in this file is a single
 * `.select()` against `blog_posts`. There is no insert, update, upsert, delete
 * or rpc anywhere in it, and there must never be one: this script is meant to be
 * safe to run against production at any time, by anyone, without thinking about
 * it first.
 *
 * Credentials come from the environment, same names the build already uses:
 *   SUPABASE_URL / VITE_SUPABASE_URL
 *   SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY
 *
 * Flags:
 *   --dist <dir>       where to look for prerendered files (default: dist)
 *   --sitemap <src>    sitemap URL or local file (default: the live sitemap)
 *   --no-sitemap       skip the sitemap check entirely
 *   --out <dir>        where to write the two reports (default: cwd)
 *
 * The sitemap and prerender checks are best-effort. When the sitemap cannot be
 * fetched, or `dist/` has not been built, the affected fields are reported as
 * `null` and the report says the check did not run — rather than reporting a
 * missing file as a missing page, which would read as a far worse result than
 * the truth.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import { createClient } from "@supabase/supabase-js";

// ── Tunables ────────────────────────────────────────────────────────────────

/**
 * Characters per word, used to turn a character count into a word count.
 * Arabic is written without short vowels and packs more meaning per character,
 * so a fixed ratio for both languages would overstate Arabic length.
 */
const CHARS_PER_WORD = { en: 5.1, ar: 5.5 };

/** STRONG thresholds. A post must satisfy all five. */
const STRONG = { words: 1200, h2: 5, internalLinks: 3 };
/** Below either of these a post is THIN regardless of anything else. */
const THIN = { words: 800, h2: 3 };

/**
 * Topic clusters, matched against the *base* slug so that an English post and
 * its Arabic translation always land in the same cluster.
 *
 * Order matters — first match wins. Grammar is tested before vocabulary because
 * several grammar slugs also contain a vocabulary word, and the K-drama/K-pop
 * rules come first because "kdrama phrases" is a drama post, not a phrasebook.
 *
 * Deliberately NOT keyed on `article_type`. That column holds howto / listicle /
 * longform / review, which is a *format*, not a topic — it is why the current
 * client-side "related posts" block can offer a listicle about street food as
 * the follow-up to a listicle about verb endings.
 */
const CLUSTERS = [
  {
    id: "hangul-pronunciation",
    label: "Hangul & pronunciation",
    test: /hangul|alphabet|pronunciation/,
  },
  {
    // Ahead of the K-drama rule on purpose. Several folklore articles are
    // written for a drama audience and say so in the slug
    // (`dokkaebi-korean-goblin-myth-kdrama`), but their subject is the myth.
    id: "myths-folklore",
    label: "Myths, folklore & beliefs",
    test: /myth|folklore|dokkaebi|gumiho|jeoseung|ghost|shamanism|superstition|zodiac|fortune-telling|legends/,
  },
  {
    id: "kdrama-kpop",
    label: "K-drama, K-pop & fandom",
    test: /kdrama|k-drama|drama|kpop|k-pop|idol|webtoon|songs|bts|blackpink/,
  },
  {
    id: "topik",
    label: "TOPIK exam",
    test: /topik/,
  },
  {
    id: "study-method",
    label: "How to study Korean",
    test: /learn-korean-(faster|3-months|egypt)|study-method|how-long-to-learn|how-to-learn|learning-apps|free-resources|easier-than|difficulty-guide/,
  },
  {
    id: "grammar",
    label: "Grammar & conjugation",
    // `-verbs` rather than `verbs`, or "proverbs" would be filed as grammar.
    test: /grammar|conjugation|particles|tense|-verbs|honorifics|speech-levels|negation|passive|causative|conditional|comparative|superlative|connectors|conjunctions|irregular|question-words|reported-speech|sentence-structure|word-order|imperative|suggestion|purpose|intention|ability-expressions|past-experience/,
  },
  {
    id: "vocabulary-phrases",
    label: "Vocabulary & phrases",
    test: /vocabulary|phrases|words|slang|proverbs|idioms|adjectives|numbers|counting|colou?r|greetings|introduce-yourself|telling-time|directions|shopping|restaurant|ordering|family-terms|body-parts|hobbies|weather|money|banking|housing|animal|compliment|dating|job-interview|small-talk/,
  },
  {
    id: "culture-life",
    label: "Korean culture & daily life",
    test: /culture|etiquette|traditions?|holidays?|seollal|chuseok|lunar-new-year|hanbok|clothing|age-system|body-language|cafe|coffee|convenience-store|drinking|soju|education|hagwon|birthday|dol|funeral|gaming|pcbang|military|phone|texting|skincare|kbeauty|street-food|food|tattoo|transportation|seoul|travel|wedding|workplace|business|nunchi|jeong|social/,
  },
];

const UNCLUSTERED = { id: "unclustered", label: "No cluster matched" };

// ── Pure helpers (exported for the unit tests) ──────────────────────────────

/**
 * The language-neutral identity of a post. Arabic posts use either a `-ar`
 * suffix (90 of them) or a legacy `ar-` prefix (10), and both forms have to
 * collapse onto the English slug for pairing and clustering to work.
 */
export const baseSlug = (slug) =>
  slug.startsWith("ar-") ? slug.slice(3) : slug.replace(/-ar$/, "");

/** True when the slug uses the legacy prefix form rather than the suffix. */
export const isLegacyArabicSlug = (slug) => slug.startsWith("ar-");

/**
 * Character count in code points, not UTF-16 units.
 *
 * `"💡".length` is 2 in JavaScript but 1 to Postgres `length()`. Several
 * articles use emoji as section markers, so counting code points is what makes
 * a number in this report match the same number checked straight against the
 * database.
 */
export const countChars = (s) => [...String(s ?? "")].length;

/**
 * Strip Markdown down to the prose a reader actually sees, so that word counts
 * measure writing rather than syntax. Link *text* is kept, link targets are not.
 */
export function stripMarkdown(md) {
  return String(md ?? "")
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> their text
    .replace(/<[^>]+>/g, " ") // raw html tags
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // heading markers
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s{0,3}[-*+]\s+/gm, "") // bullets
    .replace(/^\s{0,3}\d+\.\s+/gm, "") // numbered lists
    .replace(/[*_~]/g, "") // emphasis
    .replace(/\|/g, " ") // table pipes
    .replace(/\s+/g, " ")
    .trim();
}

/** Count ATX headings at exactly the given level. */
export function countHeadings(md, level) {
  const re = new RegExp(`^\\s{0,3}#{${level}}\\s+\\S`, "gm");
  return (String(md ?? "").match(re) || []).length;
}

/**
 * Every internal link in the body, split by destination.
 *
 * `blog` are links to another article — the ones that build a topical web and
 * the ones the site currently has none of. `site` are links to a marketing or
 * product page (/courses, /textbook, /placement-test), which are useful for
 * conversion but do nothing to make other articles discoverable.
 */
export function extractInternalLinks(md) {
  const body = String(md ?? "");
  const targets = [];

  // [text](/path) and [text](https://kloversegy.com/path)
  for (const m of body.matchAll(/\[[^\]]*\]\(\s*([^)\s]+)/g)) targets.push(m[1]);
  // href="/path"
  for (const m of body.matchAll(/href\s*=\s*["']([^"']+)["']/g)) targets.push(m[1]);

  const blog = [];
  const site = [];
  for (const raw of targets) {
    let path = raw;
    const abs = raw.match(/^https?:\/\/(?:www\.)?kloversegy\.com(\/[^\s]*)?$/i);
    if (abs) path = abs[1] || "/";
    else if (!raw.startsWith("/")) continue; // external or an anchor
    if (path.startsWith("#")) continue;

    const post = path.match(/^\/blog\/([^/#?]+)/);
    if (post) blog.push(post[1]);
    else site.push(path.split(/[#?]/)[0]);
  }
  return { blog, site, total: blog.length + site.length };
}

/** Hangul syllables and jamo. A proxy for "does this article show real Korean". */
export function countHangul(s) {
  return (String(s ?? "").match(/[가-힣ᄀ-ᇿ㄰-㆏]/g) || []).length;
}

/**
 * Whether the article carries a real FAQ *section*, i.e. a heading — not merely
 * the letters "FAQ" somewhere in a sentence. A heading is what a reader scans
 * for and what FAQPage structured data would eventually be built from.
 */
export function faqStatus(md, lang) {
  const body = String(md ?? "");
  const headingRe =
    lang === "ar"
      ? /^\s{0,3}#{1,6}\s+.*(?:أسئلة|الأسئلة الشائعة)/m
      : /^\s{0,3}#{1,6}\s+.*(?:FAQ|Frequently Asked)/im;
  const mentionRe = lang === "ar" ? /أسئلة/ : /FAQ|Frequently Asked/i;
  const heading = headingRe.test(body);
  return { heading, mentionOnly: !heading && mentionRe.test(body) };
}

/** Estimated word count from the visible prose. */
export function estimateWords(md, lang) {
  const chars = countChars(stripMarkdown(md));
  return Math.round(chars / (CHARS_PER_WORD[lang] || CHARS_PER_WORD.en));
}

/** The cluster a slug belongs to. Matched on the base slug, so EN and AR agree. */
export function clusterOf(slug) {
  const base = baseSlug(slug);
  for (const c of CLUSTERS) if (c.test.test(base)) return c.id;
  return UNCLUSTERED.id;
}

/**
 * Content quality bucket, ignoring inbound links.
 *
 * Evaluation order is THIN, then STRONG, then DECENT. The brief defines DECENT
 * as ">=800 words, missing at most two STRONG criteria", which leaves posts that
 * clear the length and heading bars but miss three or more criteria in no bucket
 * at all. Those land in DECENT here, and every article also carries its own
 * `missingStrongCriteria` list so the distinction stays visible in the report.
 */
export function contentBucket(a) {
  if (a.words < THIN.words || a.h2 < THIN.h2) return "THIN";
  if (a.missingStrongCriteria.length === 0) return "STRONG";
  return "DECENT";
}

/** Which of the five STRONG criteria a post fails. */
export function missingStrongCriteria(a) {
  const missing = [];
  if (a.words < STRONG.words) missing.push(`under ${STRONG.words} words`);
  if (a.h2 < STRONG.h2) missing.push(`under ${STRONG.h2} H2 headings`);
  if (!a.faq) missing.push("no FAQ section");
  if (a.internalLinks < STRONG.internalLinks) missing.push(`under ${STRONG.internalLinks} internal links`);
  if (!a.hasPair) missing.push("no translation pair");
  return missing;
}

// ── Analysis ────────────────────────────────────────────────────────────────

/**
 * Turn raw `blog_posts` rows into the full report object.
 *
 * `sitemapPaths` is a Set of paths found in the sitemap, or null when the check
 * did not run. `distHas` is a predicate returning whether a prerendered file
 * exists for a slug, or null when there is no build to look at.
 */
export function analyze(posts, { sitemapPaths = null, distHas = null } = {}) {
  const publishedSlugs = new Set(posts.map((p) => p.slug));

  const partnerOf = (slug, lang) => {
    const base = baseSlug(slug);
    if (lang === "ar") return publishedSlugs.has(base) ? base : null;
    if (publishedSlugs.has(`${base}-ar`)) return `${base}-ar`;
    if (publishedSlugs.has(`ar-${base}`)) return `ar-${base}`;
    return null;
  };

  const articles = posts.map((p) => {
    const lang = p.lang === "ar" ? "ar" : "en";
    const content = p.content || "";
    const links = extractInternalLinks(content);
    const faq = faqStatus(content, lang);
    const partner = partnerOf(p.slug, lang);

    const a = {
      slug: p.slug,
      lang,
      title: p.title || "",
      titleLength: countChars(p.title || ""),
      descriptionLength: countChars(p.description || ""),
      chars: countChars(content),
      words: estimateWords(content, lang),
      h2: countHeadings(content, 2),
      h3: countHeadings(content, 3),
      internalLinks: links.total,
      internalBlogLinks: links.blog.length,
      internalSiteLinks: links.site.length,
      linksTo: links.blog,
      faq: faq.heading,
      faqMentionOnly: faq.mentionOnly,
      hangulChars: countHangul(content),
      heroImage: Boolean(p.hero_image),
      heroAlt: Boolean(p.hero_alt),
      keywordCount: Array.isArray(p.keywords) ? p.keywords.length : 0,
      seoScore: p.seo_score ?? null,
      seoPriority: p.seo_priority ?? null,
      viewCount: p.view_count ?? 0,
      articleType: p.article_type || null,
      partnerSlug: partner,
      hasPair: Boolean(partner),
      legacyArabicSlug: lang === "ar" && isLegacyArabicSlug(p.slug),
      cluster: clusterOf(p.slug),
      inSitemap: sitemapPaths ? sitemapPaths.has(`/blog/${p.slug}`) : null,
      prerendered: distHas ? distHas(p.slug) : null,
    };

    a.missingStrongCriteria = missingStrongCriteria(a);
    a.contentBucket = contentBucket(a);
    return a;
  });

  // Inbound links: who points AT each article. An article nothing points to is
  // an orphan — reachable only from the sitemap, and only by a crawler that
  // already knows it exists.
  const inbound = new Map(articles.map((a) => [a.slug, []]));
  for (const a of articles) {
    for (const target of a.linksTo) {
      if (inbound.has(target) && target !== a.slug) inbound.get(target).push(a.slug);
    }
  }
  for (const a of articles) {
    a.inboundLinks = inbound.get(a.slug).length;
    a.linkedFrom = inbound.get(a.slug);
    a.orphan = a.inboundLinks === 0;
    // The brief asks for exactly one bucket per article. Being unreachable
    // outranks how well the article is written, so ORPHAN wins; contentBucket
    // is kept alongside it so the writing quality is never hidden.
    a.bucket = a.orphan ? "ORPHAN" : a.contentBucket;
  }

  // Sorted before anything is built from it, so that two runs over the same
  // data produce byte-identical reports no matter what order the rows arrived
  // in. The reports are meant to be diffed against each other over time.
  articles.sort((x, y) => x.lang.localeCompare(y.lang) || x.slug.localeCompare(y.slug));

  return {
    generatedAt: new Date().toISOString(),
    totals: buildTotals(articles),
    siteWide: buildSiteWide(articles),
    clusters: buildClusters(articles),
    articles,
  };
}

function buildTotals(articles) {
  const per = (lang) => {
    const rows = articles.filter((a) => a.lang === lang);
    const count = (fn) => rows.filter(fn).length;
    return {
      articles: rows.length,
      views: rows.reduce((n, a) => n + a.viewCount, 0),
      medianWords: median(rows.map((a) => a.words)),
      buckets: {
        ORPHAN: count((a) => a.bucket === "ORPHAN"),
        STRONG: count((a) => a.bucket === "STRONG"),
        DECENT: count((a) => a.bucket === "DECENT"),
        THIN: count((a) => a.bucket === "THIN"),
      },
      contentBuckets: {
        STRONG: count((a) => a.contentBucket === "STRONG"),
        DECENT: count((a) => a.contentBucket === "DECENT"),
        THIN: count((a) => a.contentBucket === "THIN"),
      },
      withFaq: count((a) => a.faq),
      withPair: count((a) => a.hasPair),
      orphans: count((a) => a.orphan),
      articleToArticleLinks: rows.reduce((n, a) => n + a.internalBlogLinks, 0),
      inSitemap: count((a) => a.inSitemap === true),
      sitemapChecked: rows.some((a) => a.inSitemap !== null),
      prerendered: count((a) => a.prerendered === true),
      prerenderChecked: rows.some((a) => a.prerendered !== null),
    };
  };
  return { en: per("en"), ar: per("ar") };
}

function buildSiteWide(articles) {
  const en = articles.filter((a) => a.lang === "en");
  const ar = articles.filter((a) => a.lang === "ar");
  const brief = (a) => ({ slug: a.slug, lang: a.lang, title: a.title, words: a.words, views: a.viewCount });
  return {
    englishWithoutArabicPair: en.filter((a) => !a.hasPair).map(brief),
    arabicWithoutEnglishPair: ar.filter((a) => !a.hasPair).map(brief),
    legacyArabicPrefixSlugs: ar
      .filter((a) => a.legacyArabicSlug)
      .map((a) => ({ ...brief(a), suggested: `${baseSlug(a.slug)}-ar` })),
    titlesOver60: articles
      .filter((a) => a.titleLength > 60)
      .map((a) => ({ slug: a.slug, lang: a.lang, titleLength: a.titleLength, title: a.title }))
      .sort((x, y) => y.titleLength - x.titleLength),
    zeroViewArticles: articles.filter((a) => a.viewCount === 0).map(brief),
    missingFromSitemap: articles.filter((a) => a.inSitemap === false).map(brief),
    missingPrerender: articles.filter((a) => a.prerendered === false).map(brief),
  };
}

/**
 * Group articles into clusters and nominate one pillar per cluster per language.
 *
 * The pillar is the article best placed to be the hub others link up to:
 * longest, then most H2 headings, then most views. A cluster is flagged when its
 * best candidate is itself below the STRONG length or heading bars — that is a
 * cluster with no article strong enough to lead it, and the fix is to write or
 * expand one rather than to pick the least-bad option.
 */
function buildClusters(articles) {
  const known = [...CLUSTERS.map((c) => ({ id: c.id, label: c.label })), UNCLUSTERED];

  return known
    .map(({ id, label }) => {
      const rows = articles.filter((a) => a.cluster === id);
      const perLang = {};
      for (const lang of ["en", "ar"]) {
        const inLang = rows
          .filter((a) => a.lang === lang)
          .sort((x, y) => y.words - x.words || y.h2 - x.h2 || y.viewCount - x.viewCount);
        const pillar = inLang[0] || null;
        const viable = Boolean(pillar) && pillar.words >= STRONG.words && pillar.h2 >= STRONG.h2;
        perLang[lang] = {
          count: inLang.length,
          pillar: pillar
            ? { slug: pillar.slug, title: pillar.title, words: pillar.words, h2: pillar.h2, views: pillar.viewCount }
            : null,
          pillarViable: viable,
          children: inLang.slice(1).map((a) => ({ slug: a.slug, title: a.title, words: a.words })),
        };
      }
      return { id, label, total: rows.length, en: perLang.en, ar: perLang.ar };
    })
    .filter((c) => c.total > 0)
    .sort((x, y) => y.total - x.total);
}

const median = (nums) => {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

// ── Markdown report ─────────────────────────────────────────────────────────

const pct = (n, total) => (total ? `${Math.round((n / total) * 100)}%` : "—");

function renderMarkdown(report) {
  const { totals, siteWide, clusters, articles } = report;
  const L = [];
  const both = totals.en.articles + totals.ar.articles;

  L.push("# Klovers content audit");
  L.push("");
  L.push(`Generated ${report.generatedAt} from published \`blog_posts\`. Read-only.`);
  L.push("");

  L.push("## Where the blog stands");
  L.push("");
  L.push("| | English | Arabic |");
  L.push("|---|---:|---:|");
  L.push(`| Published articles | ${totals.en.articles} | ${totals.ar.articles} |`);
  L.push(`| Lifetime views | ${totals.en.views} | ${totals.ar.views} |`);
  L.push(`| Median words | ${totals.en.medianWords} | ${totals.ar.medianWords} |`);
  L.push(`| Has an FAQ section | ${totals.en.withFaq} | ${totals.ar.withFaq} |`);
  L.push(`| Has a translation pair | ${totals.en.withPair} | ${totals.ar.withPair} |`);
  L.push(`| Links out to another article | ${totals.en.articleToArticleLinks} | ${totals.ar.articleToArticleLinks} |`);
  L.push(`| Orphans (nothing links to them) | ${totals.en.orphans} | ${totals.ar.orphans} |`);
  if (totals.en.sitemapChecked || totals.ar.sitemapChecked) {
    L.push(`| Listed in the sitemap | ${totals.en.inSitemap} | ${totals.ar.inSitemap} |`);
  }
  if (totals.en.prerenderChecked || totals.ar.prerenderChecked) {
    L.push(`| Has a prerendered file | ${totals.en.prerendered} | ${totals.ar.prerendered} |`);
  }
  L.push("");

  L.push("## Buckets");
  L.push("");
  L.push(
    "Each article gets exactly one bucket. ORPHAN outranks the rest: an article " +
      "nothing links to cannot be found, however well it is written. The content " +
      "bucket underneath shows how good the writing is on its own terms."
  );
  L.push("");
  L.push("| Bucket | English | Arabic | Total |");
  L.push("|---|---:|---:|---:|");
  for (const b of ["ORPHAN", "STRONG", "DECENT", "THIN"]) {
    const e = totals.en.buckets[b];
    const a = totals.ar.buckets[b];
    L.push(`| ${b} | ${e} | ${a} | ${e + a} (${pct(e + a, both)}) |`);
  }
  L.push("");
  L.push("Ignoring orphan status, on writing quality alone:");
  L.push("");
  L.push("| Content bucket | English | Arabic | Total |");
  L.push("|---|---:|---:|---:|");
  for (const b of ["STRONG", "DECENT", "THIN"]) {
    const e = totals.en.contentBuckets[b];
    const a = totals.ar.contentBuckets[b];
    L.push(`| ${b} | ${e} | ${a} | ${e + a} (${pct(e + a, both)}) |`);
  }
  L.push("");

  const section = (title, rows, render) => {
    L.push(`### ${title} (${rows.length})`);
    L.push("");
    if (!rows.length) L.push("None.");
    else rows.forEach((r) => L.push(`- ${render(r)}`));
    L.push("");
  };

  L.push("## Gaps");
  L.push("");
  section("English articles with no Arabic translation", siteWide.englishWithoutArabicPair, (a) => `\`${a.slug}\` — ${a.title}`);
  section("Arabic articles with no English original", siteWide.arabicWithoutEnglishPair, (a) => `\`${a.slug}\` — ${a.title}`);
  section("Arabic slugs using the legacy `ar-` prefix", siteWide.legacyArabicPrefixSlugs, (a) => `\`${a.slug}\` → would be \`${a.suggested}\``);
  section("Titles over 60 characters", siteWide.titlesOver60, (a) => `${a.titleLength} chars — \`${a.slug}\` — ${a.title}`);
  section("Articles with zero lifetime views", siteWide.zeroViewArticles, (a) => `\`${a.slug}\` (${a.lang}) — ${a.title}`);
  if (siteWide.missingFromSitemap.length) {
    section("Published but missing from the sitemap", siteWide.missingFromSitemap, (a) => `\`${a.slug}\` (${a.lang})`);
  }
  if (siteWide.missingPrerender.length) {
    section("Published but with no prerendered file", siteWide.missingPrerender, (a) => `\`${a.slug}\` (${a.lang})`);
  }

  L.push("## Topic clusters");
  L.push("");
  L.push(
    "Clusters are derived from the slug, so an article and its translation always " +
      "sit together. The pillar is the longest, most structured article in the " +
      "cluster — the page the others should link up to."
  );
  L.push("");
  for (const c of clusters) {
    L.push(`### ${c.label} — ${c.total} articles`);
    L.push("");
    for (const lang of ["en", "ar"]) {
      const side = c[lang];
      const name = lang === "en" ? "English" : "Arabic";
      if (!side.count) {
        L.push(`- **${name}:** no articles.`);
        continue;
      }
      if (!side.pillar) continue;
      const flag = side.pillarViable ? "" : "  ⚠️ **no viable pillar** — best candidate is below the strong bar";
      L.push(`- **${name} pillar:** \`${side.pillar.slug}\` (${side.pillar.words} words, ${side.pillar.h2} H2, ${side.pillar.views} views)${flag}`);
      L.push(`  - ${side.children.length} children: ${side.children.map((x) => `\`${x.slug}\``).join(", ") || "none"}`);
    }
    L.push("");
  }

  L.push("## Every article");
  L.push("");
  L.push("| Slug | Lang | Bucket | Words | H2 | H3 | Links out | Links in | FAQ | Hangul | Keywords | Views | Pair |");
  L.push("|---|---|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---|");
  for (const a of articles) {
    L.push(
      `| \`${a.slug}\` | ${a.lang} | ${a.bucket} | ${a.words} | ${a.h2} | ${a.h3} | ` +
        `${a.internalLinks} (${a.internalBlogLinks} to articles) | ${a.inboundLinks} | ${a.faq ? "yes" : "no"} | ` +
        `${a.hangulChars} | ${a.keywordCount} | ${a.viewCount} | ${a.hasPair ? "yes" : "**no**"} |`
    );
  }
  L.push("");
  return L.join("\n");
}

// ── Data access — the only database call in this file ───────────────────────

async function fetchPublishedPosts() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY are not set. " +
        "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are also accepted."
    );
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "slug, title, description, keywords, article_type, hero_image, hero_alt, " +
        "content, lang, published_at, updated_at, seo_score, seo_priority, view_count"
    )
    .eq("published", true)
    .order("slug", { ascending: true });

  if (error) throw new Error(error.message);
  if (!data || !data.length) throw new Error("query returned zero published posts");
  return data;
}

/** Paths listed in the sitemap, or null when the check could not run. */
async function loadSitemapPaths(source) {
  try {
    const xml = /^https?:\/\//i.test(source)
      ? await fetch(source).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        })
      : readFileSync(source, "utf-8");

    const paths = new Set();
    for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
      try {
        paths.add(new URL(m[1]).pathname.replace(/\/$/, "") || "/");
      } catch {
        paths.add(m[1]);
      }
    }
    return paths.size ? paths : null;
  } catch (err) {
    console.warn(`   sitemap check skipped: ${err.message}`);
    return null;
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const get = (flag, fallback) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  return {
    dist: resolve(get("--dist", "dist")),
    sitemap: argv.includes("--no-sitemap") ? null : get("--sitemap", "https://kloversegy.com/sitemap.xml"),
    out: resolve(get("--out", process.cwd())),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log("Reading published posts from Supabase (SELECT only)...");
  const posts = await fetchPublishedPosts();
  console.log(`   ${posts.length} published posts.`);

  const sitemapPaths = args.sitemap ? await loadSitemapPaths(args.sitemap) : null;
  if (sitemapPaths) console.log(`   sitemap: ${sitemapPaths.size} URLs from ${args.sitemap}`);

  const distExists = existsSync(args.dist);
  if (!distExists) console.warn(`   prerender check skipped: no build at ${args.dist}`);
  const distHas = distExists ? (slug) => existsSync(join(args.dist, "blog", slug, "index.html")) : null;

  const report = analyze(posts, { sitemapPaths, distHas });

  const jsonPath = join(args.out, "content-audit.json");
  const mdPath = join(args.out, "content-audit.md");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8");
  writeFileSync(mdPath, renderMarkdown(report), "utf-8");

  const t = report.totals;
  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}\n`);
  console.log(
    `EN  ${t.en.articles} articles — ` +
      `${t.en.contentBuckets.STRONG} strong / ${t.en.contentBuckets.DECENT} decent / ${t.en.contentBuckets.THIN} thin, ` +
      `${t.en.orphans} orphaned`
  );
  console.log(
    `AR  ${t.ar.articles} articles — ` +
      `${t.ar.contentBuckets.STRONG} strong / ${t.ar.contentBuckets.DECENT} decent / ${t.ar.contentBuckets.THIN} thin, ` +
      `${t.ar.orphans} orphaned`
  );
  console.log(
    `\nArticle-to-article links across the whole blog: ` +
      `${t.en.articleToArticleLinks + t.ar.articleToArticleLinks}`
  );
}

export { renderMarkdown, CLUSTERS, STRONG, THIN };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`\ncontent-audit failed: ${err.message}\n`);
    process.exit(1);
  });
}
