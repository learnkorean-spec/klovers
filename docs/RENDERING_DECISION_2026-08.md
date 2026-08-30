# The rendering decision — Option A2 vs. Option B, re-costed

**Date:** 2026-08-29
**Status:** evidence assembly for Re's decision. **Nothing below is decided or
implemented.** No code for either option is written here.
**Supersedes-in-part:** `docs/SEO_MIGRATION.md` §5, §"What is deliberately NOT
in this change" (2026-08-19) — those sections describe the site as it was
before this document's §1.

---

## Why now

`docs/DECISIONS.md` (2026-08-19) deferred this choice for two weeks of Search
Console data, which lands this week. That data is not fully in hand (see §2 —
this is a real gap, not a rounding error), but enough has changed in the
codebase itself since 19 August that re-costing both options was worth doing
regardless of whether the two-week wait is also over.

## 1. What changed since 19 August

Everything in this list was true as a known gap on 19 August and is not
anymore:

| Gap (19 August) | Now |
|---|---|
| hreflang wrong for 10 of 100 Arabic posts (assumed `-ar` suffix unconditionally) | Emitted only where a real partner exists, both slug shapes handled — 178/189 live posts (PR #130 confirmed this count live) |
| `BlogPosting`/`BreadcrumbList` JSON-LD present but no `FAQPage` | `FAQPage` ships in raw prerendered HTML for 85/100 Arabic and 58/100 English articles — the real, verified-on-production coverage (PR #130) |
| Sitemap included 10 leaking `ar-`-prefixed duplicate URLs | 11 retired duplicates now excluded from the sitemap, the `/blog` index, and prerendering entirely (PRs #131, and the original sitemap fix) |
| `/blog` index and article "related links" could point at a retired duplicate that 301s away | Fixed (PR #131) |
| Every unmatched URL soft-200s, including retired/typo'd blog slugs | Fixed for `/blog/:slug` specifically (PR #132) — the highest-value URL space, not the general case |
| Core Web Vitals never measured | Measured as of this week (`ci/lighthouse-budget`, separate deliverable) |

**What has not changed, and is the actual subject of this document:** article
body text is still absent from the raw HTML `<body>`. `scripts/prerender-meta.mjs`'s
`buildArticleBodyHtml()` writes an `<h1>`, the description, and a related-articles
block into the prerendered file — never the article's markdown content. Google
renders the client bundle and reads the real content; GPTBot, ClaudeBot,
PerplexityBot, Bing's non-JS path, Facebook, and WhatsApp do not execute
JavaScript at all, so every one of them sees a title and a snippet, never the
article. The `FAQPage` work that shipped this week gives those crawlers
question-and-answer text specifically — real progress, and the reason this
document says the remaining gap is *narrower* than it was on 19 August, not
that it is closed.

**One correction to make explicitly**: `docs/DECISIONS.md` (2026-08-19)
already states "**Option A2 is rejected**", with no reasoning recorded
anywhere in this repo — I looked for it (`SEO_DIAGNOSIS.md`, `SEO_MIGRATION.md`,
`DECISIONS.md` itself) and found none. §3 below re-costs A2 from scratch
because there is no prior analysis to update, not because I'm assuming the
original rejection was wrong. If Re remembers why it was rejected and that
reason still holds, §3 needs to be read against it, not instead of it.

## 2. What Search Console shows

**I do not have Search Console access in this session** — no connector is
attached, and a search of the Gmail and Drive connectors available here for
an existing export or digest found nothing. This section cannot be filled in
without one of:

- A CSV export of the **Performance report** (Search results, last 28 days,
  compare to the 28 days before that) — impressions, clicks, average
  position, split by query and by page if possible.
- A CSV or screenshot of the **Pages** indexing report (Indexing → Pages) —
  specifically the "Why pages aren't indexed" breakdown, and the indexed
  count over time.
- Ideally both **before and after** the Gate 1 duplicate cleanup
  (`docs/SEO_GATE1_DUPLICATE_SLUGS.md`, the 11 retired Arabic pairs) so
  "did the cleanup change anything measurable" has an actual answer instead
  of a guess.

**This is the single biggest hole in this document.** Everything in §3-§6 is
codebase analysis, which I can do directly; whether Google is actually
struggling with this site today — the thing that would most directly argue
for or against spending weeks on Option B — is a real-world question this
session cannot answer from here. If Re can attach a GSC export (or Search
Console access) to a future session, this section should be filled in before
the recommendation in §6 is trusted over her own read of the data.

## 3. Option A2 (build-time DOM snapshot), re-costed for today

**What it is:** at build time, after `vite build` produces the client
bundle, boot each article route in a real headless browser (Playwright or
Puppeteer), let the existing client-side code run exactly as a real visitor's
browser would (fetch from Supabase, render markdown via `react-markdown`),
then serialize the resulting DOM and write it as that route's static HTML —
replacing today's `buildArticleBodyHtml()` stub with the real rendered
article. No new rendering framework; the exact same React app it already is,
captured after it finishes rendering instead of before.

**What it would cost, estimated (not measured — this sandbox cannot reach a
real Vercel build or `kloversegy.com` to time this for real; see the
Lighthouse deliverable's own network-access notes for why):**

- **New devDependency.** Neither Playwright nor Puppeteer exists in
  `package.json` today — confirmed by grep. Either ships a full Chromium
  binary with `npm install`, which is a real addition to install time and
  `node_modules` size in the Vercel build container. This needs to be
  verified against Vercel's actual build-size and build-time limits before
  committing to A2, not assumed to fit.
- **Per-page render time.** A page needs: browser navigation, JS bundle
  parse/exec, the Supabase fetch the client already does, React render,
  `react-markdown` parsing the article body (proportional to length — up to
  ~12k characters for the longest articles today). A reasonable estimate is
  1.5-3 seconds per page with the browser warm, run with concurrency (5-8
  parallel browser contexts, not one page at a time).
- **At 189 live articles today:** roughly 189 ÷ 6 concurrent ≈ 32 batches ×
  ~2.5s ≈ **1-2 minutes added to the build**, order of magnitude.
- **Projected at 300** (Gate 3's ~60 new Arabic articles brings the live
  catalogue to roughly 249; 300 is stated as the planning horizon): scales
  close to linearly with article count → roughly **2-3 minutes added**, same
  order of magnitude, not a step change.
- **New failure modes**, none of which exist in the codebase today: a
  Chromium crash or hang inside the Vercel/CI build container; memory
  pressure from concurrent browser contexts; the render step depending on
  Supabase being reachable *during the build*, not just at request time (this
  session hit exactly this class of dependency today — Supabase egress being
  unreachable from a sandboxed environment — worth taking seriously as a real
  failure mode, not a hypothetical one); and **hydration mismatches**: the
  snapshot has to match, byte-for-byte in structure, what the client's own
  first render produces, or React discards the SEO benefit and visibly
  re-renders for every real visitor. Achievable, but it is a new invariant
  that has no guard today and would need one (a test comparing snapshot
  output against a fresh client render, at minimum for one article per
  language).

**What A2 does NOT fix**, regardless of implementation quality: it only
touches pages that are already prerendered per-route today (blog articles,
already having distinct URLs per language). It does nothing for the
Arabic-marketing-page URL gap in §5, because that is a routing problem, not
a rendering-completeness problem — a build-time DOM snapshot of a page that
only exists at one URL is still only reachable at that one URL.

## 4. Option B (Next.js App Router for marketing + blog), re-costed for today

**What it is:** the framework migration `docs/SEO_MIGRATION.md` already
describes as the eventual end state — marketing pages and the blog move onto
Next.js's App Router with real server-side rendering; the authenticated app
(`/dashboard`, `/textbook`, `/pay`, `/admin`, etc.) most realistically stays
a client-rendered SPA either mounted inside the Next app or kept as a
separate deployment, since none of those routes benefit from SSR and all of
them are already correctly excluded from indexing.

**What has NOT shifted since 19 August, re-examined against today's
codebase:**

- This is still a genuine framework migration, not an incremental step —
  ~30+ page components under `src/pages/`, the entire router in `src/App.tsx`,
  and shared chrome (`Header`, `Footer`, the language/auth contexts) all need
  porting from React Router's client-side model to Next's file-based routing
  and server/client component split. Nothing done since 19 August has reduced
  that surface — A1, the FAQPage work, and the retired-slug/404 fixes all
  worked *within* the existing Vite/React-Router architecture precisely
  because they were scoped to avoid touching it.
- Realistic effort is still weeks, not days, and carries real regression risk
  across the whole site (not a scoped, single-concern PR like everything
  else shipped this week) — the architecture change touches every page, not
  a specific bug in one.

**What HAS shifted, and narrows B's unique value:**

- On 19 August, B was the only path to correct hreflang, correct JSON-LD,
  and a correct sitemap. All three are done today, inside A1, at a fraction
  of B's cost. B no longer "also fixes" those as part of its business case —
  they're not broken anymore for it to fix.
- B was also the only path to a real 404. That's still true **in general**,
  but PR #132 closed the specific case that matters most (`/blog/:slug`,
  where nearly all of this engagement's SEO-relevant traffic and backlink
  history concentrates) at a cost of one small serverless function, not a
  framework migration. B's remaining 404 value is real but narrower: every
  *other* unmatched route (a mistyped marketing URL, a stale `/textbook/:id`)
  still soft-200s, and stays that way until B.

**What B still uniquely provides, undiminished:**

- **Article body text in raw HTML**, via the framework's own SSR primitives
  rather than a bolted-on headless-browser step — no hydration-mismatch risk
  class, no new devDependency shipping a Chromium binary. This is the same
  underlying gap A2 targets in §3, solved architecturally instead of
  procedurally.
- **Real 404s everywhere**, not just `/blog/:slug`.
- **Arabic URL space for marketing pages** — see §5. This is the one thing
  neither A1 nor A2 can provide at any cost, because it's a routing
  capability, not a rendering-completeness one.

## 5. The Arabic URL-space question

Confirmed directly against the router (`src/App.tsx`) and the language state
(`src/contexts/LanguageContext.tsx`): **no marketing page has a distinct
Arabic URL today.** Language is a client-side toggle persisted to
`localStorage`, with no route parameter and no `/ar/...` path anywhere in the
app. `/courses` and `/pricing` render in Arabic for a visitor who has
toggled the language, but there is exactly one URL for each, and it is the
English one — Google cannot discover, index, or rank an Arabic version of
any marketing page, because there is no Arabic version to find at a URL of
its own.

This is a **different gap from the blog's.** Blog articles already have real,
distinct, indexable URLs per language (`korean-numbers-guide` /
`korean-numbers-guide-ar`) and have since before A1 — hreflang, the sitemap,
and JSON-LD all work correctly for them today. The marketing pages
(`/courses`, `/pricing`, `/about`, `/faq`, `/contact`, `/enroll-now`,
`/placement-test`, `/free-trial`, `/affiliate`, plus the high-intent landing
pages) have never had this at all, in either A1 or any A2 that only touches
article rendering.

**Is this still only solvable by B?** Yes, unchanged from 19 August — a
distinct, indexable URL per language is a routing capability. Next's App
Router provides it natively (`/ar/courses` alongside `/courses`, both
server-rendered, both real URLs). Nothing short of hand-rolling equivalent
routing inside the current Vite/React-Router app (a smaller, more scoped
project than a full Next migration, and not costed here because it was not
one of the two options this document was asked to compare) gets there
without B.

**What is it worth?** This is squarely a judgment call for Re, not a
technical one, but the relevant fact to weigh it against: the growth
investment currently underway (Gate 3, ~60 new Arabic articles) is entirely
in the **blog catalogue**, which already has real per-language URLs without
B. Marketing-page Arabic URL space serves a *different* kind of discovery —
someone searching in Arabic for "دورة كورية أونلاين" landing directly on a
course/pricing page, not on a blog article — which is real, but is not the
lever Gate 3 is currently pulling. Whether that different lever is worth
weeks of migration risk *now*, versus once Gate 3's content growth is further
along and Arabic-language demand is better understood, is the actual
decision.

## 6. Recommendation (my recommendation, not a decision)

**A2, not B, for now** — specifically to close the article-body-invisibility
gap, the one thing this week's FAQPage work made real progress on but did not
finish. Reasoning:

- A2's estimated cost (a few minutes of build time, one new devDependency,
  a real but manageable new failure-mode class) is dramatically lower than
  B's (a multi-week framework migration with regression risk across the
  entire site), and it closes the highest-remaining-impact gap: full article
  content is currently invisible to every major AI crawler and to
  non-JavaScript indexers, and that has gotten worse in relative terms as
  the FAQ text now visible to those crawlers highlights how much of the rest
  of each article they still can't see.
- B's two gaps A2 cannot touch — universal real 404s, Arabic marketing-page
  URLs — are both real, but narrower today than they were on 19 August (404
  is fixed where it mattered most; Arabic-page discovery is a secondary
  lever to the content-catalogue growth Gate 3 is already pursuing) and
  neither is urgent enough on its own to justify B's cost right now.
- This reasoning is missing §2's evidence. If a GSC export shows Google is
  genuinely failing to index or rank pages in a way that traces back
  specifically to rendering (not to the duplicate-content issues Gate 1
  already addressed), that would be the strongest possible argument for B
  regardless of A2's lower cost, and should override this recommendation.
- I flagged, and am not overriding, the undocumented 19-August rejection of
  A2 (§1). If that rejection was for a reason this document hasn't
  addressed, this recommendation should be revisited against it before
  acting on it.

**Not recommended right now:** starting B. Its unique value (§4, §5) is real
but narrower than it was, its cost hasn't shrunk at all, and A2 addresses the
larger remaining gap for a fraction of the investment. Revisit B once Gate
3's Arabic content growth is further along and the Arabic-marketing-URL
question in §5 has a clearer commercial answer — or immediately, if a GSC
export contradicts the reasoning above.
