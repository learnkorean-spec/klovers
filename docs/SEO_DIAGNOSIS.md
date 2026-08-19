# SEO Diagnosis — kloversegy.com

**Date:** 2026-08-19
**Scope:** why public marketing + blog pages are not reliably crawlable, and what has to change.
**Method:** read of the code actually on `main` (commit `c1a2ee0`) — `vercel.json`,
`scripts/prerender-meta.mjs`, `api/sitemap.xml.js`, `public/sitemap.xml`,
`public/robots.txt`, `src/hooks/useSEO.ts`, `src/pages/Index.tsx`,
`src/pages/BlogPostPage.tsx`, and the `ping-search-engines` edge function plus its
migrations.

> **Note on this document.** It was re-created on 2026-08-19 by re-auditing the
> repository, because no saved copy of the earlier diagnosis existed in the repo,
> in git history, or on the build machine. Every finding below was re-verified
> against the source files named above rather than carried over from memory. The
> decisions recorded in `docs/DECISIONS.md` all correspond to findings that
> reproduce in the current code.

---

## Summary

The site is a client-rendered React SPA *(single-page app — the server sends an
almost-empty HTML shell and JavaScript draws the page in the browser)*. A
post-build script, `scripts/prerender-meta.mjs`, papers over the worst of this by
writing per-route HTML files containing the right `<title>`, description,
canonical and Open Graph tags. That script is the only reason marketing pages
have correct metadata in search results today.

The problem is that the script works from a **hand-maintained list of routes**.
Three separate hand-maintained lists now exist, they have already drifted apart,
and blog posts published after the lists were written fall through all of them.
For those posts the server returns the generic shell: no title, no description,
no body text.

Compounding this, a database trigger actively invites search engines to crawl
each newly published post at the exact moment that post is guaranteed *not* to be
in any of the lists.

---

## Findings

### 1. Body content is never in the HTML — only metadata is

`scripts/prerender-meta.mjs` runs after `vite build` (wired up in `package.json`
as `"build": "vite build && node scripts/prerender-meta.mjs"`). It reads
`dist/index.html` and writes a copy per route with substituted meta tags.

It substitutes **head tags only**. The `<body>` of every generated file is still
the empty React mount point. A crawler that does not execute JavaScript sees a
correct title and description attached to a blank page.

Google does render JavaScript, so this is not fatal for Google. It is fatal for
everything that does not: Bing's non-render path, IndexNow consumers, Facebook
and WhatsApp link previews beyond the OG tags, and most AI crawlers.

**Severity: high — this is the structural issue the rendering decision addresses.**

### 2. Blog posts are hardcoded in the prerender script, and the list is stale

`scripts/prerender-meta.mjs` contains 30 hardcoded `/blog/<slug>` entries with
hand-written titles and descriptions. The blog itself lives in Supabase
(`blog_posts`), where posts are created and published continuously — including by
the `article-generator` edge function, which inserts drafts that a human later
publishes.

Any post published after that list was last hand-edited gets **no prerendered
file at all**. It falls through the SPA rewrite in `vercel.json` to the generic
`dist/index.html`, and is served with the site-wide default title
("Klovers | Korean Lovers Academy") and the site-wide default description.

Consequences:
- Every such post looks like a duplicate of every other such post to a crawler.
- The per-post canonical, OG image and BlogPosting JSON-LD exist only after JS runs.

**Severity: high. This is what Option A1 fixes** — reading published slugs from
Supabase at build time replaces the hand-maintained list with the real table.

### 3. Three hardcoded page lists that have already drifted

| List | Location | Static pages | Blog posts |
|---|---|---|---|
| Prerender routes | `scripts/prerender-meta.mjs` | 16 | 30 |
| Static sitemap | `public/sitemap.xml` | 15 | 32 |
| Dynamic sitemap | `api/sitemap.xml.js` → `STATIC_PAGES` | 12 | from DB (live) |

No two agree. Concretely:

- `public/sitemap.xml` lists 32 blog posts; the prerender script covers 30. At
  least two sitemap-advertised posts are served with generic metadata.
- `api/sitemap.xml.js` is missing the three commercial landing pages —
  `/learn-korean-arabic-speakers`, `/topik-exam-preparation`,
  `/learn-korean-kdramas` — that `public/sitemap.xml` does list.

**That last point is a trap for the sitemap decision:** switching `/sitemap.xml`
to the dynamic function *as it is currently written* would silently drop those
three landing pages from the sitemap. `STATIC_PAGES` in `api/sitemap.xml.js` must
be topped up with them in the same change that retires `public/sitemap.xml`.

**Severity: medium-high, and it is a blocker on the sitemap change.**

### 4. Two sitemaps exist, and the stale one is the one being served

- `public/sitemap.xml` — static, hand-maintained, every `<lastmod>` frozen at
  `2026-04-08`.
- `api/sitemap.xml.js` — a Vercel serverless function that queries `blog_posts`
  for published posts and emits real `lastmod` dates.

The rewrite rule in `vercel.json` explicitly **excludes** `sitemap\.xml` from
being rewritten to the SPA, so `/sitemap.xml` resolves to the static file in
`public/`. The serverless function is reachable only at `/api/sitemap.xml`.

`public/robots.txt` ends with `Sitemap: https://kloversegy.com/sitemap.xml`, and
`ping-search-engines` submits the same URL. **Both therefore point at the stale
static file, and the dynamic sitemap is dead code that nothing consumes.**

Every `lastmod` in the served sitemap has read `2026-04-08` for four months, which
tells search engines nothing on the site has changed since April.

**Severity: high.**

### 5. The Arabic-slug filter in the dynamic sitemap is wrong

`api/sitemap.xml.js` excludes Arabic posts with:

```js
.filter((p) => !p.slug.endsWith("-ar"))
```

But `src/pages/BlogPostPage.tsx` documents two Arabic slug forms in its own
hreflang code:

```
Slug pattern: `{base}` (en) ↔ `{base}-ar` or legacy `ar-{base}`.
```

The suffix form is filtered. The **legacy `ar-` prefix form is not** — those posts
pass the filter and get published in the sitemap as if they were English URLs.

The query already selects a `lang` column that is then never used. Filtering on
`lang` would be correct and would not depend on slug spelling at all.

**Severity: medium. Fix it in the same change that promotes this file to `/sitemap.xml`.**

### 6. The publish trigger points crawlers at pages that are not ready

`supabase/migrations/20260320030001_auto_ping_search_engines.sql` installs:

- a pg_cron job at 08:00 UTC calling `ping-search-engines` daily, and
- trigger `on_blog_post_published` on `blog_posts`, firing
  `notify_search_engines_on_publish()` whenever a post flips to `published = true`.

`ping-search-engines` then submits that post's URL to IndexNow immediately.

Because of finding #2, a freshly published post is precisely the case that has **no
prerendered file**. So the current behaviour is: publish a post → instantly tell
Bing, Yandex, Naver and Seznam to crawl a URL that serves a blank shell with a
duplicate title. Repeated across posts, this teaches those engines that the blog
produces near-identical low-value pages.

This is why the mitigation decision pauses the trigger until A1 is live. The
daily cron is comparatively harmless — it re-submits the same static URL set — but
the per-publish trigger amplifies the exact failure we have not fixed yet.

Two further observations on that migration, recorded but **not** actioned here:
- `notify_search_engines_on_publish()` reads `current_setting('app.supabase_url', true)`,
  which returns NULL unless that GUC is set on the database. A later migration
  (`20260421130000_harden_notify_search_engines_null_url.sql`) exists specifically
  to harden the NULL-URL case, which suggests it was in fact firing NULL.
- The function is `SECURITY DEFINER` with **no `SET search_path`** clause in the
  migration file. Per `CLAUDE.md` the live definition must be read with
  `pg_get_functiondef` before anything replaces it — the live version may differ
  from this file.

**Severity: medium — it is making an existing problem worse rather than creating a new one.**

### 7. A dead Google ping endpoint

`ping-search-engines` calls:

```
https://www.google.com/ping?sitemap=<sitemap url>
```

Google **retired this endpoint in June 2023**. It no longer submits anything.
It is a guaranteed-failed HTTP call on every run, and it makes the function's
result payload report a `google` status that means nothing.

Google discovery now happens through the sitemap referenced in `robots.txt` plus
Search Console. Bing and the IndexNow submissions in the same function are still
live and still worth keeping.

**Severity: low — pure noise, but it makes the function's output misleading.**

### 8. A false hreflang alternate on the homepage

`src/pages/Index.tsx` emits:

```js
addAlt("ar", "https://kloversegy.com/?lang=ar");
```

There is no Arabic URL. `?lang=ar` is a query parameter on the same SPA route; it
returns the same document, and that document's canonical points to
`https://kloversegy.com/`. An `hreflang` alternate pointing at a URL that
canonicalises to its own source is invalid — Google discards the whole annotation
cluster rather than honouring half of it.

Notably, `src/hooks/useSEO.ts` already gets this right: it emits hreflang tags
**only** when an explicit `hreflangAr` URL is passed, and its own comment says
"If omitted, no hreflang tags are emitted (correct for pages with no AR pair)."
`Index.tsx` bypasses that hook and hand-rolls the tags instead.

Arabic marketing pages cannot have honest hreflang until Arabic content has real
URLs of its own, which is part of Option B.

**Severity: medium — currently an actively wrong signal, and the fix is deletion.**

### 9. App routes: `Disallow` is doing the work, not `noindex`

`public/robots.txt` disallows `/login`, `/signup`, `/admin`, `/dashboard`,
`/profile`, `/pay/`, `/textbook`, `/review`, `/daily-quiz` and friends. Separately,
those pages call `useSEO({ noindex: true })`, which sets
`<meta name="robots" content="noindex, nofollow">` from JavaScript.

This mostly works, but the two mechanisms do not compose the way it looks like
they do: **a crawler that obeys `Disallow` never fetches the page, so it never
sees the `noindex`.** If any of these URLs was indexed before the `Disallow` was
added, the `Disallow` now prevents Google from re-crawling it to discover the
`noindex`, and the URL can persist in the index as a bare link.

This matches the stated intent ("app routes stay SPA and noindex") and needs no
code change now. It is worth a one-time check in Search Console that no
`/dashboard` or `/admin` URLs are sitting in the index.

**Severity: low — verify, do not change.**

### 10. Items to verify outside the repo

These cannot be settled by reading code and need checking in the Vercel and
Search Console dashboards:

- **www → apex redirect.** The canonical domain is `https://kloversegy.com`
  (non-www, no trailing slash), but `vercel.json` contains no www redirect. If
  Vercel is not doing it at the domain level, `www.kloversegy.com` is a second
  crawlable copy of the whole site.
- **Search Console property verified**, and which sitemap URL is actually
  submitted there.
- Whether `/api/sitemap.xml` currently returns 200 in production.

The Supabase anon key hardcoded in `api/sitemap.xml.js` is the publishable key and
is safe to have in the repo — flagged here only so it is not mistaken for a leak
in a later review.

---

## What follows from this

The four decisions recorded in `docs/DECISIONS.md` on 2026-08-19 respond to
findings #1/#2 (rendering), #3/#4/#5 (sitemap), #6/#7 (mitigation) and #8
(hreflang) respectively.

The one thing this diagnosis adds beyond those decisions is the blocker noted in
finding #3: **the three landing pages missing from `STATIC_PAGES` must be added to
`api/sitemap.xml.js` in the same change that deletes `public/sitemap.xml`**, or
the sitemap consolidation will quietly de-list the highest-intent commercial pages
on the site.
