/**
 * replace-literal.mjs — String.replace with the replacement treated as text.
 *
 * THE HAZARD
 *
 * `String.prototype.replace` and `replaceAll` interpret a handful of `$`
 * sequences inside a STRING replacement, and they do it whether the pattern is
 * a regexp or a plain string:
 *
 *   $$   a literal dollar sign
 *   $&   the matched substring
 *   $`   everything BEFORE the match — the entire document prefix
 *   $'   everything AFTER the match — the entire document suffix
 *   $1…$99, $<name>   capture groups, when the pattern is a regexp that has them
 *
 * scripts/prerender-meta.mjs builds every page's <head> by replacing tags in a
 * copy of dist/index.html with strings it interpolates database values into.
 * A blog title containing `$&` would therefore splice the matched
 * `<title>…</title>` into itself; a `` $` `` would splice the whole document
 * prefix into the tag. The result is not a visibly broken build — it is 200
 * pages with a quietly corrupted <head>, which is the one part of the page
 * that is currently correct on every route.
 *
 * The same class of bug was fixed for the `<div id="root">` mount point in
 * PR #246 (see `writeIntoRoot`). This is the rest of it.
 *
 * THE FIX
 *
 * A FUNCTION replacement is returned verbatim: the spec runs no substitution
 * pass over it. That is the entire mechanism, and it is why this wrapper is
 * one line — the value is not the code, it is having one obvious name to reach
 * for, one docblock explaining why, and a test that proves the native form
 * really does corrupt.
 *
 * Kept in scripts/lib/ rather than inline in prerender-meta.mjs for the same
 * reason related-posts.mjs and faq-parser.mjs live here: prerender-meta.mjs is
 * a top-to-bottom build script that runs on import and cannot be imported from
 * a test.
 *
 * The pattern's own matching semantics are untouched — a global regexp still
 * replaces every match, a non-global one still replaces the first.
 */

/**
 * Replace matches of `pattern` in `subject` with `replacement`, treating
 * `replacement` as literal text rather than a substitution template.
 *
 * Use this instead of a bare `.replace(pattern, someString)` whenever the
 * replacement embeds a runtime value. A replacement written inline as a pure
 * literal cannot contain a surprise `$`, and does not need it.
 */
export function replaceLiteral(subject, pattern, replacement) {
  return String(subject ?? "").replace(pattern, () => replacement);
}

/**
 * True when `s` contains a sequence that `String.replace` would expand if `s`
 * were used as a string replacement.
 *
 * Not used in the build — it exists so the tests can state precisely which
 * inputs are dangerous, rather than asserting against a hand-picked list and
 * quietly missing a form.
 */
export const SUBSTITUTION_PATTERN = /\$[$&`']|\$\d|\$<[^>]*>/;

export const hasSubstitutionPattern = (s) =>
  SUBSTITUTION_PATTERN.test(String(s ?? ""));
