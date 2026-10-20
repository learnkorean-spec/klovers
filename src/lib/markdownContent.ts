/**
 * Article markdown is stored with machine-readable HTML comments in it —
 * `<!-- klovers:related:start -->` / `<!-- klovers:related:end -->` delimit the
 * internal-links block that scripts/lib/related-links.mjs writes and rewrites.
 *
 * Those markers must survive in the database: they are what lets a re-run
 * replace the existing block exactly instead of appending a second one.
 * But they must never survive to the screen, and react-markdown does not
 * remove them for us — with no `rehype-raw` in the pipeline, raw HTML nodes
 * are rendered as literal text rather than dropped, so the comments appear
 * verbatim at the foot of every article that has a related-links block.
 *
 * Stripping happens here, at the render boundary, for that reason.
 */

/** Matches an HTML comment, including multi-line ones. */
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

/** Kept in sync with scripts/lib/related-links.mjs — asserted in the tests. */
export const RELATED_MARKER_START = "<!-- klovers:related:start -->";
export const RELATED_MARKER_END = "<!-- klovers:related:end -->";

/** `](/blog/some-slug)` — the markdown link target, without a trailing #hash. */
const BLOG_LINK = /\]\(\/blog\/([^)\s#?]+)\)/g;

/**
 * Removes HTML comments from markdown, then collapses the blank-line run the
 * removal leaves behind so the surrounding paragraphs keep their spacing.
 *
 * Deliberately narrow: only comments are removed. Stripping raw HTML in
 * general would silently delete real markup from any article that uses it.
 */
export function stripHtmlComments(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(HTML_COMMENT, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface ExtractedRelated {
  /** The article body with the related-links block and any comments removed. */
  body: string;
  /** Slugs from the block, in the order the block lists them. */
  slugs: string[];
}

/**
 * Splits the related-links block out of an article.
 *
 * The block is a bullet list of titles. Those links are the most considered
 * set on the page — chosen by shared keywords weighted by term rarity — and
 * returning the slugs lets the page render them the way the auto-suggested
 * posts are already rendered, with the hero image of each article.
 *
 * The body comes back without the block, so the links are not printed twice
 * once the cards are on the page. An article with no block is unaffected.
 */
export function extractRelatedBlock(markdown: string): ExtractedRelated {
  const source = markdown || "";
  const start = source.indexOf(RELATED_MARKER_START);
  const end = source.indexOf(RELATED_MARKER_END);

  if (start === -1 || end === -1 || end < start) {
    return { body: stripHtmlComments(source), slugs: [] };
  }

  const block = source.slice(start, end + RELATED_MARKER_END.length);
  const body = source.slice(0, start) + source.slice(end + RELATED_MARKER_END.length);

  const slugs: string[] = [];
  BLOG_LINK.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BLOG_LINK.exec(block)) !== null) {
    if (!slugs.includes(match[1])) slugs.push(match[1]);
  }

  return { body: stripHtmlComments(body), slugs };
}

export interface MarkdownSplit {
  /** Everything before the inserted element. */
  before: string;
  /** Everything from the split point onward. */
  after: string;
}

/** Matches the start of a top-level (`## `) heading line. */
const H2_START = /\n(?=##\s)/g;

/**
 * Finds a point roughly `fraction` of the way through an article's markdown
 * to insert something (an early CTA, an ad slot, …) without cutting a
 * section in half — the split always lands right before a top-level `##`
 * heading, never mid-paragraph or mid-section.
 *
 * Most readers who leave an article leave well before the end (the behavior
 * this exists to work around), so a conversion prompt placed only at the
 * bottom reaches a shrinking fraction of them. This lets the same CTA also
 * appear after the intro/first section instead of only at the foot.
 *
 * Returns `null` when the article has too few sections (fewer than 3
 * top-level headings) for an early split to land anywhere sensible — a
 * short article keeps its single CTA at the end rather than getting a
 * second one crammed in right next to it.
 */
export function splitMarkdownAtHeading(markdown: string, fraction: number): MarkdownSplit | null {
  const source = (markdown || "").trim();
  if (!source) return null;

  const headingStarts: number[] = [];
  H2_START.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = H2_START.exec(source)) !== null) headingStarts.push(m.index + 1);

  if (headingStarts.length < 3) return null;

  const target = source.length * fraction;
  // Never split at the very first heading (nothing would precede the CTA)
  // or the very last one (nothing meaningful would follow it).
  const splitAt = headingStarts.find((idx, i) => i > 0 && i < headingStarts.length - 1 && idx >= target);
  if (splitAt === undefined) return null;

  return {
    before: source.slice(0, splitAt).trim(),
    after: source.slice(splitAt).trim(),
  };
}
