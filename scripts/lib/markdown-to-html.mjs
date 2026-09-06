/**
 * markdown-to-html.mjs — a deliberately small markdown renderer, for the
 * prerenderer only.
 *
 * WHY THIS EXISTS RATHER THAN A LIBRARY
 *
 * The client renders article markdown with `react-markdown` (^10.1.0) plus
 * `remark-gfm` (^4.0.1). Neither can be used here: react-markdown declares
 * React as a peer dependency and returns JSX, and scripts/prerender-meta.mjs
 * runs under plain node after `vite build`, deliberately independent of the
 * client bundle compiling (the same constraint that keeps the /games body copy
 * duplicated rather than imported). remark-gfm is only a plugin — rendering
 * with it would additionally need unified, remark-parse, remark-rehype and
 * hast-util-to-html, none of which are direct dependencies of this repo.
 *
 * Adding a markdown library was rejected: a build-time dependency whose output
 * lands verbatim in 200 public pages is a supply-chain surface, and the
 * subset of markdown these articles actually use is small enough to implement
 * and test in one file.
 *
 * WHAT IT SUPPORTS, AND WHY EXACTLY THIS SET
 *
 * The set is not guessed. It is a census of all 200 published articles
 * (2026-09-06), counting articles containing each construct:
 *
 *   ATX headings        200 (h2), 108 (h3), 67 (leading h1), 0 (h4+)
 *   unordered lists     190
 *   ordered lists       103
 *   bold **x**          182
 *   inline links        192
 *   GFM tables          180 (all with a |---|---| delimiter row)
 *   horizontal rules     39
 *   blockquotes          12
 *   italic *x*           26
 *   HTML comments       175 (all of them the related-links markers)
 *
 * and, equally load-bearing, the constructs measured at ZERO occurrences and
 * therefore deliberately NOT supported:
 *
 *   images ![](), fenced code blocks, inline code, raw HTML tags,
 *   underscore emphasis _x_, strikethrough ~~x~~, backslash escapes
 *
 * Unsupported markup is not silently mangled: it is escaped and emitted as
 * literal text, which is the safe failure. Indented/nested list items exist on
 * exactly three lines in the whole corpus and are flattened into the enclosing
 * list rather than nested.
 *
 * SAFETY
 *
 * Article content is arbitrary text from a database. Every text node is HTML-
 * escaped BEFORE any inline markup is applied, so a `<script>` in an article
 * becomes visible text and never a tag. Link targets are additionally checked
 * against a scheme allowlist, so a `javascript:` URL degrades to plain text
 * rather than becoming a live anchor.
 *
 * Pure functions, no I/O — the unit tests in markdown-to-html.test.mjs run it
 * without a build, a network, or a database.
 */

/** HTML comments. The related-links block markers are the only ones in the
 * corpus, but any comment is dropped: a comment cannot carry reader-visible
 * content, and passing one through verbatim would be the one route by which
 * unescaped `<` reached the output. */
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

/** Escape a string for use as HTML text content. Applied to every text node
 * before inline markup, never after. */
export const escapeText = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Escape a string for use inside a double-quoted attribute. */
export const escapeAttr = (s) => escapeText(s).replace(/"/g, "&quot;");

/**
 * Link targets we are willing to emit as a live anchor: absolute http(s),
 * root-relative paths, in-page anchors and mailto. Protocol-relative "//host"
 * is excluded on purpose — it reads as a path but is not one.
 *
 * Every link in the corpus today is root-relative ("/courses", "/blog/...").
 */
const SAFE_URL = /^(?:https?:\/\/|mailto:|#|\/(?!\/))/i;

export const isSafeUrl = (href) => SAFE_URL.test(String(href ?? "").trim());

/**
 * Inline markup, applied to a single already-escaped line of text.
 *
 * Order matters: links first (their label may contain emphasis), then bold,
 * then italic — `**` has to be consumed before a single `*` is looked for, or
 * bold markers get read as two italics.
 */
export function renderInline(raw) {
  let s = escapeText(raw);

  // [label](target)
  s = s.replace(/\[([^\]\n]*)\]\(([^)\s]+)\)/g, (whole, label, href) =>
    isSafeUrl(href)
      ? `<a href="${escapeAttr(href)}">${label}</a>`
      : label // unsafe scheme: keep the words, drop the link
  );

  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  return s;
}

const isBlank = (l) => !l.trim();
const isHr = (l) => /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(l);
/** `#` through `######`, with or without a space after the hashes — five
 * headings in the Arabic articles are written `##عنوان`, with none. */
const HEADING = /^\s*(#{1,6})\s*(.+?)\s*#*\s*$/;
const UL_ITEM = /^\s*[-*+]\s+(.*)$/;
const OL_ITEM = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const TABLE_ROW = /^\s*\|/;
/** The |---|:--:|---| row that makes a pipe table a table rather than prose
 * that happens to contain pipes. */
const TABLE_DELIM = /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/;

/** Split "| a | b |" into ["a", "b"]. No corpus article escapes a pipe (there
 * are zero backslashes in the whole catalogue), so none is handled. */
const splitRow = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());

/**
 * A pipe row is only a table when a delimiter row follows it. Prose that
 * merely contains pipes stays prose — and, importantly, must still be treated
 * as paragraph text rather than as a block boundary, or the line is dropped.
 */
const startsTable = (lines, i) =>
  TABLE_ROW.test(lines[i]) &&
  i + 1 < lines.length &&
  TABLE_DELIM.test(lines[i + 1]) &&
  lines[i + 1].includes("|");

/**
 * Render markdown to an HTML fragment.
 *
 * `headingFloor` is the shallowest heading level the output may contain. The
 * prerenderer passes 2, because the page's only <h1> is the article title
 * written from the database row; an article whose markdown also opens with an
 * `#` heading (67 of 200 do) would otherwise put a second <h1> on the page.
 * Those headings are DEMOTED, never dropped — only 24 of the 67 are a copy of
 * the title, so dropping would silently delete a real heading from the other
 * 43.
 */
export function markdownToHtml(markdown, { headingFloor = 2 } = {}) {
  const src = String(markdown ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(HTML_COMMENT, "");

  const lines = src.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i++;
      continue;
    }

    if (isHr(line)) {
      out.push("<hr />");
      i++;
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const level = Math.max(headingFloor, heading[1].length);
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    // Table: a pipe row immediately followed by a delimiter row.
    if (startsTable(lines, i)) {
      const head = splitRow(line);
      i += 2;
      const body = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        body.push(splitRow(lines[i]));
        i++;
      }
      const th = head.map((c) => `<th>${renderInline(c)}</th>`).join("");
      const rows = body
        .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`)
        .join("");
      out.push(
        `<table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`
      );
      continue;
    }

    if (QUOTE.test(line)) {
      const parts = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        parts.push(lines[i].match(QUOTE)[1]);
        i++;
      }
      out.push(`<blockquote><p>${renderInline(parts.join(" ").trim())}</p></blockquote>`);
      continue;
    }

    // Lists. Indented items are flattened into the same list rather than
    // nested — three lines in the entire corpus are indented, and a wrong
    // nesting guess is worse than a flat list that reads correctly.
    if (UL_ITEM.test(line) || OL_ITEM.test(line)) {
      const ordered = !UL_ITEM.test(line) && OL_ITEM.test(line);
      const pattern = ordered ? OL_ITEM : UL_ITEM;
      const items = [];
      while (i < lines.length && pattern.test(lines[i])) {
        items.push(lines[i].match(pattern)[1]);
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(
        `<${tag}>${items.map((it) => `<li>${renderInline(it)}</li>`).join("")}</${tag}>`
      );
      continue;
    }

    // Paragraph: run to the next blank line or block start. Soft-wrapped
    // lines join with a space, as markdown does.
    //
    // The stopper for tables is startsTable, NOT "contains a pipe": a line of
    // prose with pipes in it and no delimiter row underneath is ordinary text,
    // and treating it as a block boundary here silently deleted it.
    const para = [];
    while (
      i < lines.length &&
      !isBlank(lines[i]) &&
      !isHr(lines[i]) &&
      !HEADING.test(lines[i]) &&
      !QUOTE.test(lines[i]) &&
      !UL_ITEM.test(lines[i]) &&
      !OL_ITEM.test(lines[i]) &&
      !startsTable(lines, i)
    ) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) {
      out.push(`<p>${renderInline(para.join(" "))}</p>`);
    } else {
      // Unreachable with the block set above, but content must never be lost
      // to a future edit that adds a stopper without a matching handler:
      // emit the line rather than skipping it.
      out.push(`<p>${renderInline(lines[i].trim())}</p>`);
      i++;
    }
  }

  return out.join("\n");
}
