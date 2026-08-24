/**
 * related-posts.mjs — choose which articles link to which.
 *
 * Used by scripts/prerender-meta.mjs to write a related-articles block into
 * every article page's raw HTML. Kept in its own module so the scoring can be
 * unit tested; prerender-meta.mjs is a top-to-bottom build script that runs on
 * import and cannot be imported from a test.
 *
 * The signal is deliberately not `article_type`. That column holds howto /
 * listicle / longform / review, which is a *format*, not a topic — it is why the
 * existing client-side related-posts block can offer a listicle about street
 * food as the follow-up to a listicle about verb endings.
 *
 * What actually groups these articles is:
 *
 *   1. shared keyword phrases — six folklore articles all carry the exact
 *      keyword "korean folklore", which no other signal picks up;
 *   2. shared keyword words — "hangul" and "hangul pronunciation" are obviously
 *      related and share no whole phrase;
 *   3. shared slug words — always present, including when the Supabase fetch
 *      fails and the build falls back to the route cache, which stores no
 *      keywords.
 *
 * Slugs are English on both sides (Arabic posts are `<base>-ar` or `ar-<base>`),
 * so signal 3 works identically for both languages.
 */

/**
 * How many related links each article carries.
 *
 * MAX is what scoring alone will choose; CAP is the hard ceiling, and the one
 * spare slot between them is what pass 3 uses to place an article that nothing
 * else picked, without having to evict a link that is already carrying someone.
 */
export const RELATED_MIN = 3;
export const RELATED_MAX = 4;
export const RELATED_CAP = 5;

/** Weights. A shared whole phrase is worth more than a shared single word. */
const WEIGHT_KEYWORD_PHRASE = 3;
const WEIGHT_SLUG_TOKEN = 2;
const WEIGHT_KEYWORD_WORD = 1;

/**
 * Words too common across this blog to carry meaning. "korean" alone appears in
 * about nine slugs out of ten, so leaving it in would make every article
 * related to every other article.
 */
const STOPWORDS = new Set([
  "korean", "korea", "learn", "learning", "guide", "complete", "explained",
  "best", "how", "to", "for", "in", "of", "and", "with", "your", "the", "a",
  "is", "what", "why", "2026", "meaning", "tips",
]);

const meaningful = (words) => words.filter((w) => w && !STOPWORDS.has(w));

/** The language-neutral identity of a post, for both Arabic slug conventions. */
export const baseOf = (slug) =>
  slug.startsWith("ar-") ? slug.slice(3) : slug.replace(/-ar$/, "");

export const slugTokens = (slug) => new Set(meaningful(baseOf(slug).split("-")));

/** Whole keyword phrases, lowercased and trimmed. */
export const keywordPhrases = (keywords) =>
  new Set((keywords || []).map((k) => String(k).trim().toLowerCase()).filter(Boolean));

/** Individual meaningful words drawn from the keyword phrases. */
export const keywordWords = (keywords) =>
  new Set(meaningful([...keywordPhrases(keywords)].flatMap((k) => k.split(/[\s-]+/))));

const overlap = (a, b) => {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
};

/** How strongly two articles belong together. Zero means unrelated. */
export function scoreRelatedness(a, b) {
  return (
    WEIGHT_KEYWORD_PHRASE * overlap(a.phrases, b.phrases) +
    WEIGHT_SLUG_TOKEN * overlap(a.tokens, b.tokens) +
    WEIGHT_KEYWORD_WORD * overlap(a.words, b.words)
  );
}

/** Precompute the comparable form of a post once. */
export const toCandidate = (post) => ({
  slug: post.slug,
  base: baseOf(post.slug),
  lang: post.lang === "ar" ? "ar" : "en",
  type: post.articleType ?? post.article_type ?? null,
  tokens: slugTokens(post.slug),
  phrases: keywordPhrases(post.keywords),
  words: keywordWords(post.keywords),
});

/**
 * Choose related articles for every post.
 *
 * Candidates are always same-language, and never share a base slug with the
 * post: that excludes the post's own translation, and it excludes the eight
 * cases where one English article has two published Arabic translations, which
 * would otherwise be each other's closest match and link a near-duplicate to
 * its near-duplicate.
 *
 * Returns `related` (slug -> chosen slugs) and `inbound` (slug -> how many
 * articles ended up pointing at it, so the caller can report remaining orphans).
 */
export function buildRelatedMap(posts) {
  const candidates = posts.map(toCandidate);
  const related = new Map();
  const inbound = new Map(candidates.map((c) => [c.slug, 0]));
  const peersOf = (c) => candidates.filter((o) => o.lang === c.lang && o.base !== c.base);

  // Pass 1 — genuine topical matches only.
  for (const c of candidates) {
    const picked = peersOf(c)
      .map((o) => ({ o, score: scoreRelatedness(c, o) }))
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score || x.o.slug.localeCompare(y.o.slug))
      .slice(0, RELATED_MAX);

    related.set(c.slug, picked.map((x) => x.o.slug));
    for (const x of picked) inbound.set(x.o.slug, inbound.get(x.o.slug) + 1);
  }

  // Pass 2 — top up anything still below the minimum, preferring the articles
  // that the fewest others already point at. Filling by "least linked" rather
  // than "most recent" is what stops the top-up piling onto the same handful of
  // posts, and it is what drives the orphan count to zero.
  for (const c of candidates) {
    const chosen = related.get(c.slug);
    if (chosen.length >= RELATED_MIN) continue;
    const taken = new Set(chosen);

    const fill = peersOf(c)
      .filter((o) => !taken.has(o.slug))
      .sort((x, y) => {
        const byInbound = inbound.get(x.slug) - inbound.get(y.slug);
        if (byInbound) return byInbound;
        const sameType = (o) => (o.type === c.type ? 0 : 1);
        if (sameType(x) !== sameType(y)) return sameType(x) - sameType(y);
        return x.slug.localeCompare(y.slug);
      })
      .slice(0, RELATED_MIN - chosen.length);

    for (const o of fill) {
      chosen.push(o.slug);
      inbound.set(o.slug, inbound.get(o.slug) + 1);
    }
  }

  // Pass 3 — place anything still orphaned.
  //
  // Passes 1 and 2 leave no orphans on the current 200 articles, but nothing in
  // them guarantees it: an article that scores poorly against everything and is
  // never needed as a top-up receives no links at all. Since removing an orphan
  // is the entire point of this block, place it explicitly rather than relying
  // on the corpus staying shaped the way it is today.
  //
  // It is appended to its own best match, using the spare slot up to
  // RELATED_CAP, so no existing link has to be evicted and no article can be
  // orphaned by the fix.
  for (const c of candidates) {
    if (inbound.get(c.slug) > 0) continue;

    const host = peersOf(c)
      .filter((o) => (related.get(o.slug) || []).length < RELATED_CAP)
      .map((o) => ({ o, score: scoreRelatedness(c, o) }))
      .sort(
        (x, y) =>
          y.score - x.score ||
          related.get(x.o.slug).length - related.get(y.o.slug).length ||
          x.o.slug.localeCompare(y.o.slug)
      )[0];

    if (!host) continue; // nowhere to put it: fewer than two topics in this language
    related.get(host.o.slug).push(c.slug);
    inbound.set(c.slug, inbound.get(c.slug) + 1);
  }

  return { related, inbound };
}
