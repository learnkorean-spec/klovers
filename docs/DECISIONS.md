# Decisions

Running log of SEO and rendering decisions for kloversegy.com. Newest last.
Background and evidence for these entries: `docs/SEO_DIAGNOSIS.md`.

---

## 2026-08-19 — Rendering

**Option A1 now.** `scripts/prerender-meta.mjs` reads published blog slugs from
Supabase at build time, instead of the hand-maintained list of routes it uses
today.

**Option B is the planned end state:** Next.js App Router for marketing + blog,
SPA for the app. The decision to proceed with B is deferred until A1 has been
live for two weeks.

**Option A2 is rejected.**

## 2026-08-19 — Sitemap

Keep the dynamic `api/sitemap.xml.js` as the **only** sitemap, served at
`/sitemap.xml`.

- Delete `public/sitemap.xml`.
- Fix the `ar-` prefix filter.
- `robots.txt` and `ping-search-engines` point at it.

## 2026-08-19 — Mitigation

Pause the `blog_posts` publish trigger on `ping-search-engines` until A1 is
deployed. Remove the dead Google ping endpoint.

## 2026-08-19 — hreflang

Remove the false `?lang=ar` alternate. No hreflang on marketing pages until
Arabic has URLs of its own (Option B). Blog hreflang only where a `-ar` / `ar-`
partner post actually exists.

## 2026-08-27 — Arabic register for Gate 3 (OPEN — needs Re's decision before Gate 3 starts)

Retiring `korean-learning-apps-comparison-2026-ar` (see
`scripts/lib/retired-arabic-slugs.mjs`, pair #11) leaves the live Arabic
catalogue at 89 standard-MSA articles and exactly 1 Egyptian-colloquial
article — the one just retired was that one colloquial outlier, and it also
carried a text defect, not just a register choice. Egyptian colloquial is not
wrong for this audience and may in fact read closer to them than MSA does —
but one article drifting into it while 89 don't is drift, not a considered
choice for the site.

**Not decided or acted on here.** Which register the ~60 new Arabic articles
for Gate 3 should use — MSA (consistent with today's catalogue), Egyptian
colloquial (closer to the primary audience), or a deliberate per-topic mix —
is a real strategic decision. It needs Re's call, recorded here, before Gate
3 content generation starts, not settled implicitly by whatever a title-repair
or retirement PR happens to touch.

## 2026-08-28 — Verifying structured data needs a raw-HTML fetch

A markdown-converting fetch tool was used to check whether a live article's
`<head>` carried `FAQPage` JSON-LD. It reported the tag missing on an Arabic
article whose PR had just added it, which read as a real regression — until
the same tool was run against the tool's own English control case (an
article independently confirmed, via raw HTML, to already carry the tag).
The control also came back "missing." The tool strips `<script>` tags as
part of converting a page to markdown, so it cannot see JSON-LD in *any*
page, in either language — its report of absence carried no information at
all, and the apparent regression didn't exist.

Same failure shape as the vocabulary-overlap duplicate-detection mistake in
`scripts/lib/retired-arabic-slugs.mjs` (corrected 2026-08-24): a plausible
instrument applied confidently, without first confirming it could detect
the thing being checked. The fix here, as there, is the same discipline —
run the instrument against a known-positive case before trusting a
known-unknown one.

**Rule for future verification of any `<script type="application/ld+json">`
content (FAQPage, BlogPosting, BreadcrumbList, or anything added later):
fetch the raw HTML and grep it directly.** A tool that summarizes,
markdown-converts, or otherwise "cleans up" a page for readability is very
likely stripping `<script>` tags along the way, and will silently report
every page — including ones that genuinely carry the tag — as not having
it. `mcp__Vercel__web_fetch_vercel_url` (or an equivalent raw fetch) is the
correct instrument for this repo; a general-purpose page-reading tool is
not, even though its output looks like a normal, confident answer.
