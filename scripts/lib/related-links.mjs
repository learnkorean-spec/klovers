/**
 * related-links.mjs — builds the internal link graph the blog does not have.
 *
 * Measured 2026-09-02 against production: of 200 published articles, the
 * number containing a markdown link to another article is ZERO. Every article
 * is an island. Google infers topical authority from how a site links its own
 * pages together; with no internal links there is nothing to infer, and no
 * link equity flows from the articles that do get traffic to the ones that
 * do not (13 articles have never been viewed at all).
 *
 * What this file does NOT do, deliberately: it does not weave contextual
 * links into article prose. Inline anchor text inside a sentence is better
 * SEO than a list at the foot of the page, but it cannot be generated safely
 * — placing a link mid-sentence requires understanding the sentence, and a
 * script that guesses will produce text no one wrote in a language half this
 * catalogue's readers speak natively. A clearly delimited "Related articles"
 * block is the honest mechanical version: weaker per link, but correct every
 * time, reversible, and it does not put invented words in the author's mouth.
 *
 * Pure functions only — no I/O, no database, no filesystem. The proposal
 * script (scripts/proposals/internal-links.mjs) supplies the rows and writes
 * the output. That split exists so the selection logic is unit-testable
 * without a network, which is the part worth testing.
 */

/**
 * Arabic morphology defeats exact-string keyword matching, and this codebase
 * has been burned by that before: four of the 51 title defects in Gate 2
 * Step 1 were invisible to an exact-string detector because of the definite
 * article (ال) and the conjunction prefix (و). The same failure would make
 * every Arabic article look unrelated to every other one here. Strip the
 * clitics before comparing.
 */
export function normaliseKeyword(raw) {
  if (typeof raw !== "string") return "";
  let s = raw.toLowerCase().trim();
  // Arabic orthographic normalisation: unify alef forms, drop tatweel and
  // harakat, normalise ta marbuta and alef maqsura.
  s = s
    .replace(/[ً-ْـ]/g, "")
    .replace(/[آأإ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
  // Clitics attach per WORD, not once per phrase: "الأفعال الكورية" carries
  // two of them. Stripping only the leading one leaves "الكورية" intact and
  // makes it look unrelated to "كورية" — the exact class of miss that hid
  // four Arabic title defects in Gate 2 Step 1.
  s = s
    .split(/\s+/)
    .map((w) => w.replace(/^(?:وال|بال|كال|فال|لل|ال|و)/u, ""))
    .filter(Boolean)
    .join(" ");
  return s.trim();
}

const STOP_TOKENS = new Set([
  "the", "a", "an", "and", "or", "of", "for", "to", "in", "on", "with",
  "guide", "complete", "explained", "beginners", "beginner", "ar", "2026",
  "how", "what", "your", "you",
]);

/** Slug tokens carry real topical signal ("korean-past-tense-conjugation"),
 * so they are used alongside keywords rather than instead of them. */
export function slugTokens(slug) {
  return String(slug || "")
    .split(/[-_/]+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 2 && !STOP_TOKENS.has(t));
}

/** The comparable signature of one article. Keywords are weighted higher than
 * slug tokens because they were chosen deliberately; slug tokens are a
 * fallback for articles whose keyword sets barely overlap. */
export function signature(article) {
  const kw = new Set(
    (article.keywords || [])
      .map(normaliseKeyword)
      .filter((k) => k.length > 1)
  );
  const tk = new Set(slugTokens(article.slug));
  return { kw, tk };
}

/**
 * Inverse document frequency. Without this, every article "matches" every
 * other one on the token "korean", which appears in essentially every slug
 * and half the keyword sets in the catalogue — a food article would be
 * declared related to a grammar article on the strength of a word that
 * carries no information because everything has it. Weighting each term by
 * how rare it is across the corpus is what makes the difference between a
 * topic cluster and a random list.
 */
export function buildIdf(signatures) {
  const df = new Map();
  const n = signatures.length || 1;
  for (const sig of signatures) {
    for (const t of new Set([...sig.kw, ...sig.tk])) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }
  const idf = new Map();
  for (const [t, c] of df) idf.set(t, Math.log(n / c));
  return idf;
}

const weighted = (a, b, idf, factor) => {
  let sum = 0;
  for (const v of a) if (b.has(v)) sum += (idf.get(v) ?? 0) * factor;
  return sum;
};

/** Higher is more related. Keyword hits count for three times a slug-token
 * hit, and both are scaled by term rarity. */
export function relatedness(sigA, sigB, idf) {
  return weighted(sigA.kw, sigB.kw, idf, 3) + weighted(sigA.tk, sigB.tk, idf, 1);
}

/**
 * A pair scoring below this is not related enough to be worth a link. Chosen
 * so that a single shared ubiquitous token ("korean", present in ~all slugs,
 * idf near zero) can never clear it, while one genuinely shared topical
 * keyword can.
 */
export const MIN_SCORE = 0.6;

/**
 * Which articles each article should link to.
 *
 * Guarantees, all of which are asserted in the tests:
 *   - never links an article to itself
 *   - never crosses languages (an Arabic reader is not sent to English)
 *   - never links to a retired slug (those carry live 301s; linking to one
 *     would spend internal link equity on a redirect hop)
 *   - never links on ubiquitous-token overlap alone (MIN_SCORE)
 *   - deterministic: same input, byte-identical output, so a re-run produces
 *     an empty diff rather than churn
 *   - no orphans: any article that would receive zero inbound links is
 *     inserted into its own nearest neighbour's list, and only if that pair
 *     also clears MIN_SCORE — an article with no real relatives stays
 *     unlinked rather than being attached to something arbitrary
 */
export function buildRelatedMap(articles, { perArticle = 4, retired = new Set() } = {}) {
  const live = articles.filter((a) => !retired.has(a.slug));
  const sigs = new Map(live.map((a) => [a.slug, signature(a)]));
  const idf = buildIdf([...sigs.values()]);

  const byLang = new Map();
  for (const a of live) {
    if (!byLang.has(a.lang)) byLang.set(a.lang, []);
    byLang.get(a.lang).push(a);
  }

  const rank = (a, group) =>
    group
      .filter((b) => b.slug !== a.slug)
      .map((b) => ({ slug: b.slug, score: relatedness(sigs.get(a.slug), sigs.get(b.slug), idf) }))
      .filter((x) => x.score >= MIN_SCORE)
      .sort((x, y) => y.score - x.score || (x.slug < y.slug ? -1 : 1));

  const map = new Map();
  for (const [, group] of byLang) {
    for (const a of group) {
      map.set(a.slug, rank(a, group).slice(0, perArticle).map((x) => x.slug));
    }
  }

  const inbound = new Map(live.map((a) => [a.slug, 0]));
  for (const targets of map.values()) {
    for (const t of targets) inbound.set(t, (inbound.get(t) || 0) + 1);
  }
  for (const a of live) {
    if ((inbound.get(a.slug) || 0) > 0) continue;
    const best = rank(a, byLang.get(a.lang) || [])[0];
    if (!best) continue;
    const list = map.get(best.slug) || [];
    if (!list.includes(a.slug)) {
      list.push(a.slug);
      map.set(best.slug, list);
      inbound.set(a.slug, 1);
    }
  }

  return map;
}

export const MARKER_START = "<!-- klovers:related:start -->";
export const MARKER_END = "<!-- klovers:related:end -->";

const HEADING = {
  en: "## Related Articles",
  ar: "## مقالات ذات صلة",
};

/** The block itself. Markers are HTML comments so react-markdown renders
 * nothing for them, and so a later run can replace this block exactly rather
 * than appending a second one. */
export function renderRelatedBlock(lang, items) {
  const heading = HEADING[lang] || HEADING.en;
  const lines = [MARKER_START, "", heading, ""];
  for (const it of items) lines.push(`- [${it.title}](/blog/${it.slug})`);
  lines.push("", MARKER_END);
  return lines.join("\n");
}

/**
 * Returns the new content, or null when there is nothing to change — which
 * is what makes re-running this safe. A null result must never become an
 * edit in a proposal.
 */
export function withRelatedBlock(content, lang, items) {
  if (!items.length) return null;
  const block = renderRelatedBlock(lang, items);
  const body = String(content || "");
  const start = body.indexOf(MARKER_START);
  const end = body.indexOf(MARKER_END);

  if (start !== -1 && end !== -1 && end > start) {
    const existing = body.slice(start, end + MARKER_END.length);
    if (existing === block) return null; // already exactly right
    return body.slice(0, start) + block + body.slice(end + MARKER_END.length);
  }
  return body.replace(/\s*$/, "") + "\n\n" + block + "\n";
}
