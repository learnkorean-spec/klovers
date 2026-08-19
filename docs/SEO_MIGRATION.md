# SEO Migration — Option A1

**Date:** 2026-08-19
**Branch:** `claude/seo-a1-prerender`
**Implements:** the Rendering decision in `docs/DECISIONS.md` (2026-08-19)
**Diagnosis it responds to:** `docs/SEO_DIAGNOSIS.md`

---

## What A1 is, in one paragraph

The site is a client-rendered React SPA. A post-build script writes one HTML
file per route so that search engines get a real `<title>`, description and
canonical without executing JavaScript. Before A1, that script worked from a
list of routes typed into the file by hand, so any blog post published after
the list was last edited was served the site-wide default title. A1 replaces the
hand-maintained list with a build-time query of the `blog_posts` table, and
completes the `<head>` each route gets.

A1 does **not** put article text into the HTML — the `<body>` is still an empty
React mount point. That is Option B (Next.js App Router), deliberately deferred
until A1 has been live for two weeks.

---

## What changed

### 1. Route list comes from the database

`scripts/prerender-meta.mjs` queries `blog_posts` where `published = true` — the
same filter `api/sitemap.xml.js` uses — and prerenders every result.

| | before | after |
|---|---|---|
| blog routes | 30, hand-typed | 200, from the database |
| marketing routes | 16 | 19 |
| total prerendered | 46 | **219** |

The three added marketing routes are `/interview-training`, `/welcome-back` and
`/hangul-starter`. They are live routes in `App.tsx` that were missing from the
list. Their titles and descriptions are copied from each page's own `useSEO()`
call so the prerendered head matches what the page sets for itself.

**Credentials.** `SUPABASE_URL` / `SUPABASE_ANON_KEY`, falling back to the
`VITE_`-prefixed pair the app already needs. Vercel therefore needs no new
environment variables. The anon key is a publishable key; it was previously
hardcoded in `api/sitemap.xml.js` and has been moved to the environment there
too.

**Failure behaviour.** If the query fails the script falls back to
`scripts/prerender-routes.cache.json` and prints a loud multi-line warning. If
there is no cache either it exits non-zero and fails the build. Emitting only
the 19 marketing routes would silently de-list every blog post; a failed build
simply leaves the previous good deploy serving, which is the safer outcome.

**Why the cache is committed to git.** A Vercel build starts from a fresh
checkout. A cache written during one build does not survive to the next, so an
uncommitted cache could never be the fallback for the build that needs it. It is
rewritten on every successful build; when the diff shows it changing, that is
just the blog moving on.

### 2. Every route gets a full head

Per route: `<title>`, description, self-referencing canonical, `og:type`
(`article` for posts, `website` otherwise), `og:url`, `og:image` + `og:image:alt`,
`twitter:card`/`title`/`description`/`image`. Posts additionally get
`article:published_time` / `article:modified_time`, and `BlogPosting` +
`BreadcrumbList` JSON-LD built from the row.

Two corrections worth recording:

- **78 of 200 `hero_image` values are root-relative** (`/assets/...`). Open Graph
  requires absolute URLs, so those share images would not have loaded on any
  social platform. They are now absolute.
- The organisation-level `EducationalOrganization`/`LocalBusiness` and `WebSite`
  JSON-LD is emitted **on the homepage only**. Repeating it on 218 subpages is
  duplicate entity markup.

### 3. hreflang is now honest

Arabic posts use either a `-ar` suffix (90 posts) or a legacy `ar-` prefix (10).
The old code assumed the suffix unconditionally, so for those 10 it pointed at a
URL that does not exist — and Google discards an entire annotation cluster when
one alternate is invalid.

hreflang is now emitted only where the partner document actually exists:
**186 of 200 posts** are annotated, 14 are not.

Three places had to change together, because the client-side code overwrote the
prerendered tags for any crawler that runs JavaScript:

| file | change |
|---|---|
| `scripts/prerender-meta.mjs` | emits `en`/`ar`/`x-default` only for a real pair |
| `src/pages/BlogPostPage.tsx` | resolves the partner slug from the DB first; emits nothing when there is no partner |
| `src/pages/Index.tsx` | the false `hreflang="ar"` → `/?lang=ar` removed entirely |

`?lang=ar` was never a valid alternate: it is a query parameter on the same
document, and that document canonicalises back to `/`.

### 4. The SPA shell is no longer the homepage

`dist/index.html` was serving two incompatible jobs — the homepage, and the
fallback for every unmatched route. An unknown URL was therefore answered with
the homepage's title *and* the homepage's canonical, so every stray URL declared
itself a duplicate of the homepage.

They are now split. `index.html` keeps the real homepage head. `dist/app.html` is
a neutral shell — generic title, **no canonical**, no `og:url` — and the rewrite
in `vercel.json` points at it. Same bundle; only the metadata differs.

The shell is deliberately **not** `noindex`: real app routes are served through
it and set their own robots meta, and a blanket `noindex` would be harmful if a
marketing route ever fell through.

### 5. 404s stay soft — a known limitation

You asked for a real 404 page "if the framework allows". **It does not, and this
is deferred to Option B.**

On a Vite SPA hosted on Vercel, the server responds `200 OK` and sends the shell
before the application knows whether the route exists. Returning a true `404`
status would require a server-side function on every unmatched request, which is
precisely what the Next.js App Router in Option B provides.

What exists today: `src/pages/NotFound.tsx` renders a helpful page with quick
links and already sets `noindex`, so Google drops the URL rather than indexing
it. The status code remains `200`. **Accept this until Option B.**

### 6. One sitemap

`public/sitemap.xml` (static, hand-maintained, every `lastmod` frozen at
`2026-04-08`) is deleted. `/sitemap.xml` now rewrites to `api/sitemap.xml.js`.
Vercel serves static files before rewrites, which is why the stale file had been
winning while the dynamic one sat unused at `/api/sitemap.xml`.

The Arabic filter was `!slug.endsWith("-ar")`, which let the 10 `ar-`-prefixed
posts through as English URLs. It now filters on the `lang` column, so the
sitemap drops from **110 URLs to the correct 100** and no longer depends on how
a slug is spelled. The 10 that were leaking:

```
ar-korean-grammar-particles      ar-korean-slang-words
ar-seoul-travel-korean-phrases   ar-korean-food-vocabulary
ar-study-korean-kdramas-method   ar-topik-exam-guide
ar-korean-cafe-culture           ar-korean-numbers-guide
ar-korean-daily-greetings        ar-learn-korean-alphabet-hangul
```

`xhtml:link` hreflang alternates are included for the 89 English posts with a
real Arabic partner. Six landing pages missing from `STATIC_PAGES` were added —
three of them (`/learn-korean-arabic-speakers`, `/topik-exam-preparation`,
`/learn-korean-kdramas`) were listed in the deleted static file, so promoting the
function without them would have de-listed the highest-intent pages on the site.

### 7. robots.txt, redirects, noindex

`robots.txt` names exactly one sitemap. It disallows nine transactional routes
(`/complete-profile`, `/trial-confirm`, `/rsvp`, `/trial-booking`,
`/progress-report`, `/certificate`, `/hangul-book`, `/trial-book`,
`/enrollment-status`) and explicitly allows `GPTBot`, `ClaudeBot`,
`PerplexityBot` and `Google-Extended`.

Those same nine routes now set `noindex` client-side. Eight had no `useSEO` call
at all and were inheriting the site-wide `index, follow`. Both mechanisms are
present on purpose: `Disallow` stops the crawl but is not a de-index
instruction, and for a URL already in the index the `Disallow` actively prevents
Google from re-crawling to discover the `noindex`.

`vercel.json` gains a **301 from `www` to the apex** — there was none, so
`www.kloversegy.com` was a second crawlable copy of the whole site — and
`trailingSlash: false`, so `/courses/` redirects to `/courses`.

### 8. seo-check

`scripts/seo-check.mjs` asserts the invariants above and exits non-zero on
failure. It runs as a **blocking** step in `.github/workflows/ci.yml`, above the
advisory lint and typecheck steps: those tolerate known debt, this must not.

```
npm run seo:check        # offline, against dist/ — what CI runs
npm run seo:check:live   # fetches every sitemap URL over plain HTTP
```

Verified in both directions: 219/219 pass on a clean build (exit 0); against a
deliberately broken build — one duplicated canonical, one copied homepage title
— it reports 3 failing pages by URL and reason and exits 1.

---

## Verification

| | result |
|---|---|
| `npm run build` | passes, 219 routes prerendered |
| `npm test` | 220 passed, 13 files |
| `npm run seo:check` | PASS, 219/219 |
| `npx tsc --noEmit` | pre-existing errors only (stale generated types, narrow `LeadSource`) — no new ones |

Two `seo-check` rows are reported as **skipped** in dist mode because they need a
live server: HTTP 200 and the www redirect. Run `npm run seo:check:live` after
deploy to close them.

---

## What is deliberately NOT in this change

- **Article text in the HTML.** Still Option B.
- **Hard 404 status codes.** Still Option B — see §5.
- **hreflang on marketing pages.** Waiting on Arabic having URLs of its own.
- **Un-pausing the publish ping trigger.** It stays paused until A1 is deployed
  and verified; see below.
- **Repairing the Supabase deploy pipeline.** `deploy-functions.yml` has failed
  on every run since mid-August (expired `SUPABASE_ACCESS_TOKEN`), and 44 local
  migration files are absent from the live migration history. Fixing the token
  without triaging those 44 first would let `supabase db push` run all of them.
  That needs its own PR.

---

## After deploy

1. Confirm `https://kloversegy.com/sitemap.xml` returns XML with ~100 blog URLs
   and no `ar-`-prefixed slugs.
2. Run `npm run seo:check:live` to close the two skipped rows.
3. Check `https://www.kloversegy.com/` returns `301` to the apex.
4. In Search Console, resubmit `https://kloversegy.com/sitemap.xml`.
5. **Two weeks later**, per `docs/DECISIONS.md`, decide on Option B.
6. Once A1 is confirmed live, re-enable the publish ping:
   ```sql
   ALTER TABLE public.blog_posts ENABLE TRIGGER on_blog_post_published;
   ```
