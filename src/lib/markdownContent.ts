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
