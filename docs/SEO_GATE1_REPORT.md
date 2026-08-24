# Gate 1 report — crawlability and safe content editing

**Date:** 2026-08-24
**Scope:** the two report-only questions from Gate 1. Nothing here is implemented
by this document; the three structural fixes ship as their own pull requests.

Everything below was measured against the live database
(`ewtdgpbybkceokfohhyg`, read-only `SELECT` only) or against a real
`npm run build` of `main`, not inferred from the source.

---

## Part 1 — What a crawler without JavaScript can actually read

### Method

`main` (commit `d8e55be`) was built in a clean worktree and the resulting
`dist/` files were read as raw bytes — exactly what a crawler receives before
any JavaScript runs. `<script>` and `<style>` contents were removed and the
remaining tags stripped, leaving the text a non-rendering client can see.

### Result

| Page | Raw bytes | Readable body text | Links in body |
|---|---:|---:|---:|
| An article (`/blog/korean-past-tense-conjugation-guide`) | 8,510 | **0 characters** | **0** |
| The blog index (`/blog`) | 5,507 | **0 characters** | **0** |
| **All 200 article pages together** | — | **0 characters** | **0** |

Zero is not an approximation. The `<body>` of every one of the 219 prerendered
files is the single empty element `<div id="root"></div>`. Every word of all 200
articles — roughly 900,000 characters of Korean teaching material — exists only
after the JavaScript bundle downloads, parses, runs, and completes a round trip
to Supabase.

What a non-JavaScript crawler *does* get is the `<head>`, and that part is in
good order: an accurate `<title>`, a description, a self-referencing canonical,
Open Graph tags, `hreflang` where a translation exists, and BlogPosting
JSON-LD. So such a crawler can learn that a page about Korean past-tense
conjugation exists, and nothing whatsoever about what it says.

### Is the invitation to AI crawlers worth anything today?

`public/robots.txt` explicitly welcomes them:

```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

**Stated plainly: today that invitation is worth nothing.** None of those four
crawlers executes JavaScript. They fetch the URL, receive an empty `<body>`, and
leave with a title and a description. The site is inviting them to read 200
articles and then handing them a blank page 200 times over.

The invitation is not wrong and should stay — it is a precondition for being
read, and it costs nothing. It is simply not yet sufficient. Google is the one
major exception: it renders JavaScript, which is why the blog is indexed at all
and why 856 lifetime views exist rather than none.

### What the three Gate 1 fixes change, and what they do not

Measured the same way, on a build of the fix branches:

| Page | Readable body text | Links in body |
|---|---:|---:|
| An article — before | 0 | 0 |
| An article — after | 373 characters | 3 |
| The blog index — before | 0 | 0 |
| The blog index — after | 39,806 characters | 200 |
| All 200 articles — before | 0 | 0 |
| All 200 articles — after | 77,604 characters | 683 |

**This must not be oversold.** The 373 characters now on an article page are its
title, its description and its related-article links. **The article's own text is
still not in the raw HTML.** What Gate 1 fixes is *discoverability* — a crawler
can now reach every article by following links, and every article is reachable
from something. What it does not fix is *readability* — an AI crawler that
arrives still cannot read the lesson.

Closing that last gap means rendering the article body at build time or on the
server. That is the Option B decision already recorded in `docs/DECISIONS.md`
(Next.js App Router for marketing and blog), and it is out of scope for Gate 1.

### One correction to `docs/SEO_DIAGNOSIS.md`

Finding #6 of the diagnosis, and the mitigation entry in `docs/DECISIONS.md`,
recommend pausing the `on_blog_post_published` trigger because it invites
crawlers to pages that are not ready. The live object no longer matches that
description. Read with `pg_get_triggerdef` and `pg_get_functiondef`:

```sql
CREATE TRIGGER on_blog_post_published
  AFTER INSERT OR UPDATE OF published ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION notify_search_engines_on_publish()
```

and the function body guards with
`if (new.published = true and (old.published is distinct from true))`, and does
carry `SET search_path TO 'pg_catalog', 'public'`.

So it fires only when a post actually crosses into published, not on every
update, and the `search_path` hardening the diagnosis was unsure about is
present. No change is needed, and — importantly for Part 2 below — **editing an
article's `content` does not ping any search engine.**

---

## Part 2 — Safe ways to bulk-edit article bodies

The requirement is a mechanism for changing `blog_posts.content` across many
articles — adding internal links, expanding thin articles — that never involves
ad-hoc SQL typed against production.

### What the live database dictates

Four facts, each checked directly, constrain every option:

1. **Writes already require an admin.** Row-level security on `blog_posts`
   allows `UPDATE` only to an authenticated user holding the `admin` role:
   `has_role((SELECT auth.uid()), 'admin'::app_role)`. The anon key the site
   ships with **cannot** modify an article. This is a feature: any tool can sign
   in as Re and stay inside the same rules the admin panel obeys.

2. **There is no history table.** The public schema has `blog_posts`,
   `blog_comments`, `admin_audit_log` and `referral_conversions`. Nothing stores
   a previous version of an article's text. **An overwrite today is
   unrecoverable from inside the database.** Any option must therefore bring its
   own backup.

3. **Editing content does not notify search engines.** Per the correction above.
   A bulk edit will not fire 200 IndexNow submissions.

4. **Editing content *does* move `lastmod`.** The `update_blog_posts_updated_at`
   trigger fires `BEFORE UPDATE` on every column, and the sitemap derives
   `<lastmod>` from `updated_at`. Rewriting all 200 articles in one afternoon
   would tell search engines the entire site changed on the same day. Batching
   over days is preferable to one large run — a presentational point, but a real
   one.

Also worth stating: Supabase database branching, the obvious "try it somewhere
else first" tool, is **not available on this project's Free plan**.

### Option A — Propose, review, apply *(recommended)*

Two scripts and a file Re reads in between.

- `npm run content:propose` reads the articles, computes the edits, and writes
  `content-changes.json` plus a readable `content-changes.md` showing, per
  article, the exact before and after. It writes **nothing** to the database.
- Re reads the `.md`, and deletes from it any article she does not want changed.
- `npm run content:apply` signs in as an admin, and for each approved article:
  first appends the current text to `content-backup-<timestamp>.json`, then
  writes the new text, then reads the row back and confirms it matches. Any
  mismatch stops the run immediately, leaving the remaining articles untouched.
- `npm run content:rollback -- content-backup-<timestamp>.json` writes every
  saved article back exactly as it was.

**Backup:** a timestamped file written *before* the first write, containing the
full previous text of every article the run will touch.
**Rollback:** one command, and it is testable end to end before Re ever approves
a real edit — run propose/apply/rollback against a single article, confirm the
text returns byte-for-byte, and only then run it for real. *This rehearsal is a
required step, not an optional one.*

Why this is the recommendation: no schema change, so no migration and no
"Apply Migrations" run; it stays inside RLS; the destructive step is separated
from the decision by a file a non-technical person can read; and the rollback is
proven before it is needed.

### Option B — A revisions table, so the database keeps its own history

Add `blog_post_revisions` and a trigger that copies the old row into it on every
update. History then exists for every future edit, whatever made it — this
tooling, the admin panel, or anything else.

**Backup:** automatic and permanent, for all future edits.
**Rollback:** copy a revision's text back over the live row.

The cost is that this is a schema change, so per `CLAUDE.md` and the working
rules it needs its own migration PR, checked against the live objects and
applied through the "Apply Migrations" workflow — dispatched `plan` first, then
`apply` only once the pending list is confirmed. It also does nothing for the
edits made before it exists.

**Suggested sequence: do Option A now; adopt Option B afterwards** as the
durable safety net, on its own PR. They are complementary, not alternatives.

### Option C — Edit by hand in the admin panel

`src/pages/AdminDashboard.tsx` already edits articles, one at a time, as Re.

**Backup:** none — this is the option with no safety net at all, which is worth
knowing given there is no history table.
**Rollback:** only by retyping.

Fine for a handful of corrections. For 200 articles it is neither realistic nor
safer than Option A, and its lack of a backup makes it the riskiest of the three
per article touched.

### Not recommended

- **SQL typed against production**, in the Supabase SQL editor or anywhere else.
  It is the thing the working rules forbid, there is no undo, and a `WHERE`
  clause that is wrong by one character changes every row in the table.
- **The `service_role` key**, which bypasses row-level security entirely.
  Option A's admin sign-in achieves the same writes while remaining subject to
  the same rules as the admin panel.

---

## What needs a decision

1. **Resolved — eight Arabic articles are duplicates by search intent, not by
   vocabulary.** Eight English articles have two published Arabic translations
   each — one `<base>-ar` and one legacy `ar-<base>`. All eight 2026 duplicates
   have zero lifetime views; the corresponding 2025 `-ar` version carries all
   26. Every pair targets the same topic and the same (or a near-identical)
   primary keyword — verified against `title` and `keywords`, not slug
   similarity — which is what makes them duplicates for search purposes
   (keyword cannibalisation) regardless of how different their example
   sentences are. A dedicated PR, `fix/duplicate-arabic-slugs`, redirects the
   8 confirmed duplicates to their `-ar` survivor and must merge before this
   report's Fix 1 (`fix/sitemap-arabic-loc`), which is now stacked on it. Full
   per-pair evidence and the Gate 2 plan to merge each retired version's
   unique examples into its survivor: `docs/SEO_GATE1_DUPLICATE_SLUGS.md`.

   Two further `ar-` prefix posts (`ar-korean-cafe-culture`,
   `ar-learn-korean-alphabet-hangul`) are NOT duplicates — each is the only
   Arabic translation of its article, just slugged inconsistently. Decision:
   rename both to the suffix convention once their redirect (shipped in the
   same PR) is confirmed live in production. Exact rollback SQL is recorded in
   the same doc.

2. **Whether to approve the topic cluster map** produced by
   `npm run content-audit`, which is what a later gate would use to decide which
   articles link to which and where new articles are needed.

3. **Which bulk-edit option to adopt** before any article text is touched.
