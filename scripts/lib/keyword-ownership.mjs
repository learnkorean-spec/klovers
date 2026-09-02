/**
 * keyword-ownership.mjs - decides which single article owns a keyword that
 * too many articles currently claim.
 *
 * Measured 2026-09-02: `learn korean grammar` is listed as a target keyword by
 * 13 different published articles, `korean for beginners` by 10, `learn
 * korean` by 9, and the Arabic phrase for "learn Korean" by 9. When thirteen
 * pages target one query they compete with each other: the ranking signal
 * splits, none of them accumulates enough to win, and the search engine
 * resolves the ambiguity by ranking somebody else's page instead. That is
 * keyword cannibalisation, and it is the same defect the 11 retired Arabic
 * duplicates had - this time inside the keyword column rather than across two
 * URLs.
 *
 * The fix is not to delete content. It is to let one article own each
 * contested phrase while the others keep their own more specific keywords.
 *
 * Pure functions, no I/O - so the ownership rule is testable without a
 * network, which is the part that decides what actually gets changed.
 */
import { normaliseKeyword } from "./related-links.mjs";

/**
 * A keyword shared by more than this many articles is contested. Three
 * articles sharing a broad theme word is normal site structure; thirteen is
 * a defect.
 */
export const CONTESTED_AT = 3;

/**
 * Ownership rule, in order:
 *   1. the article with the most views - real measured demand beats any
 *      heuristic, and it is the page already earning the signal;
 *   2. then the longest article - depth is what a broad head term needs;
 *   3. then the alphabetically first slug, purely so the result is
 *      deterministic and a re-run produces an identical proposal.
 */
export function pickOwner(candidates) {
  return [...candidates].sort(
    (a, b) =>
      (b.views || 0) - (a.views || 0) ||
      (b.length || 0) - (a.length || 0) ||
      (a.slug < b.slug ? -1 : 1)
  )[0];
}

/**
 * Returns { changes: Map<slug, newKeywords>, decisions, keptMinimum }.
 *
 * Guarantees, all asserted in the tests:
 *   - an article never loses its LAST keyword; if stripping contested terms
 *     would empty the set, the article is left UNCHANGED and reported in
 *     `keptMinimum` rather than silently emptied
 *   - the owner of a keyword never loses it
 *   - articles in different languages never contest the same keyword
 *   - Arabic morphological variants of one phrase count as one claim
 *   - deterministic ordering throughout
 */
export function planKeywordOwnership(articles, { contestedAt = CONTESTED_AT } = {}) {
  const claims = new Map();
  for (const a of articles) {
    for (const raw of a.keywords || []) {
      const key = a.lang + " " + normaliseKeyword(raw);
      if (!claims.has(key)) claims.set(key, []);
      claims.get(key).push(a);
    }
  }

  const contested = [...claims.entries()]
    .filter(([, list]) => list.length > contestedAt)
    .sort((x, y) => y[1].length - x[1].length || (x[0] < y[0] ? -1 : 1));

  const owner = new Map();
  const decisions = [];
  for (const [key, list] of contested) {
    const winner = pickOwner(list);
    owner.set(key, winner.slug);
    const sep = key.indexOf(" ");
    decisions.push({
      lang: key.slice(0, sep),
      keyword: key.slice(sep + 1),
      claimedBy: list.length,
      owner: winner.slug,
    });
  }

  const changes = new Map();
  const keptMinimum = [];
  for (const a of articles) {
    const all = a.keywords || [];
    const kept = [];
    let dropped = 0;
    for (const raw of all) {
      const key = a.lang + " " + normaliseKeyword(raw);
      if (owner.has(key) && owner.get(key) !== a.slug) dropped++;
      else kept.push(raw);
    }
    if (dropped === 0) continue;

    if (kept.length === 0) {
      // Every keyword this article claims is owned by someone else. Emptying
      // it would leave the article declaring no subject at all, which is
      // worse than the cannibalisation being fixed - so it is left exactly as
      // it is and reported instead. These are the articles that need a person
      // to choose a more specific keyword; a script cannot invent one.
      keptMinimum.push(a.slug);
      continue;
    }
    changes.set(a.slug, kept);
  }

  return { changes, decisions, keptMinimum };
}
