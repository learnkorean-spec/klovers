# Klovers — Claude Code Instructions

## Before you build anything

**Check whether it already exists in `main` first.** This repo has been ported
between forks more than once, so features regularly land by a route other than
the PR you are looking at. In August 2026 three separate PRs were closed because
`main` already implemented them: one would have broken the build with duplicate
declarations, one would have regressed multi-currency pricing back to EGP-only.

Grep for the symbol name, the UI string, and the column name before writing code.

## Git workflow

- Branch as `<type>/<short-description>` — `ci/`, `fix/`, `feat/`, `docs/`,
  `chore/`. **Do not use `claude/`.** It bought auto-merge, that mechanism is
  disabled as of 2026-08-24 (see "Merge safety net" below), and its bot-merges
  are the ones measured leaving production undeployed. The prefix may still
  carry meaning to other tooling, so don't assume it is merely inert.
- Open a PR. `.github/workflows/ci.yml` runs `npm test` and `npm run build`
  against the **merge result** (not the branch).
- **All merges are manual.** Re signs in as `learnkorean-spec` specifically
  (not her day-to-day `rehamelshrkawy-coder` account) and clicks **"Create a
  merge commit"** — never squash, never rebase. `.github/workflows/auto-merge.yml`
  used to squash-merge `claude/*` branches automatically; it is now permanently
  disabled (PR #91, 2026-08-24) because it silently left production undeployed
  on a real, measured fraction of its own merges — see below.
- Vercel deploys `main` to kloversegy.com automatically, but **only from a
  commit authored by the `learnkorean-spec` GitHub account** (Vercel Hobby-plan
  constraint) — this is why the account distinction above isn't cosmetic.
  Supabase migrations and edge functions deploy via `deploy-functions.yml`.
- **Do not leave a PR open.** Anything sitting more than about a week against a
  moving `main` should be closed and rebuilt, not reconciled. Stale PRs here have
  a track record of being actively harmful, not merely useless.

## Merge safety net — read this before touching merge automation or settings

Two gaps, found and documented 2026-08-24, that make merging riskier than it
looks:

**1. `main` currently has no branch protection requiring `CI / Build & Test`.**
Evidence: every PR read via the GitHub API that day reported
`mergeable_state: "unstable"`, never `"blocked"` — including while Build & Test
was still `in_progress` or outright red. GitHub's `"blocked"` state is what a
*required* status check produces when it hasn't passed; `"unstable"` means
something is failing but isn't gating the merge button. Nothing currently stops
a red or half-finished PR from being merged by hand. This is exactly why a
branch protection rule requiring `CI / Build & Test` needs to exist before
relying on any auto-merge mechanism, native or custom.

**2. `ci.yml` does not re-run on a base-branch change alone.** It triggers on
`pull_request: [opened, synchronize, reopened, ready_for_review]` and on
`push: main` — not on a PR's base branch being edited or recomputed via the
API. Concretely: if `main` advances after a PR's last real CI run, that PR's
green checkmark still describes the *old* merge result, not the current one.
Forcing GitHub to recompute a PR's diff/base SHA (e.g. via the API) does
**not** get you a fresh CI run — only an actual new commit pushed to the PR
branch does (merging current `main` into the branch and pushing is the
reliable way to force one). Don't trust a green checkmark on a PR that's been
open while `main` kept moving without checking the run's timestamp against
`main`'s last-push time.

**Also, from a parallel investigation (PR #91, merged 2026-08-24):** the old
`auto-merge.yml`'s bot-driven merges (`merged_by: github-actions[bot]`) left
Vercel's production deploy **`BLOCKED`** (not just wrong-author — an explicit
`"team-configuration"` error from Vercel's own API) on 4 of 9 sampled merges,
with no identified trigger pattern. 20 of 20 human-merged commits over the same
window deployed clean. If any future automation reintroduces bot-driven merging
(native GitHub auto-merge included), verify a real Vercel `READY` production
deployment on the actual merge commit — author metadata alone was not a
sufficient signal here.

## One PR, one concern

- **Never put a database migration in a feature PR.** Migrations get their own PR
  and their SQL is checked against what is actually live before merging. A
  migration bundled into a "fix the refresh button" PR nearly stripped
  `SET search_path` off a live trigger function.
- No strategy documents, scratch notes, or unreferenced modules in a code PR.

## Migrations

Local migration files and the remote migration history have diverged — filenames
in `supabase/migrations/` do not match the versions recorded in the database.
Before writing a migration:

1. Read the live object first (`pg_get_functiondef`, `information_schema.columns`).
2. If it already exists, do not "backfill" it into a migration file.
3. If you must replace a function, preserve every clause on the live version —
   especially `SET search_path`.

Supabase project ref: `ewtdgpbybkceokfohhyg`

## Known debt — expected, do not fix as a side quest

- `npm run lint`: 22 errors, ~579 warnings. Advisory in CI, not blocking.
- `npx tsc --noEmit`: fails on ~10 files (stale generated Supabase types, a
  too-narrow `LeadSource` union). Advisory in CI. Vite does not typecheck at
  build time, which is why production is unaffected.
- ~~A dead Netlify integration fails 4 checks on every PR; ignore it.~~
  **No longer true, and reversed.** The `preeminent-bienenstitch-afa306`
  integration was disconnected on 2026-08-24: PR #86 (12:01 UTC) still received
  its 3 failing checks, PR #93 (17:46 UTC) and everything since received none,
  and no `netlify.toml` is tracked. **Every red check on a PR is now a real
  signal — investigate it, do not wave it through.** The habit of ignoring red
  is what this entry used to license, and it no longer applies.

## Project overview

Korean language learning platform targeting Arabic speakers and K-drama fans
(Egyptian / Middle East market).

- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Supabase (Postgres + Edge Functions on Deno)
- AI: Lovable AI Gateway → `google/gemini-2.5-flash` (`LOVABLE_API_KEY`)
- Admin panel: `src/pages/AdminDashboard.tsx`

## Supabase functions

| Function | Purpose |
|---|---|
| `seo-orchestration` | Multi-agent SEO analysis (analyze/fix modes) |
| `image-audit` | EN/AR bilingual image alt text audit |
| `article-generator` | Generate up to 5 blog draft articles from topic gaps; accepts `ArticleSpec[]`, inserts as unpublished drafts |

## Token efficiency rules

- Triage runs locally (no AI tokens) first
- Only posts with gaps get queued for AI
- Batch up to 5 posts per AI call
- Never send full article content — title, description, keywords, headings only

# KLOVERS STORY CANON

Before building or modifying any:

- homepage section
- student dashboard
- My Learning page
- course
- game
- story moment
- character scene
- world
- achievement
- reward
- Cluby feature

read:

`src/config/klovers-world.ts` (human-readable version: `docs/KLOVERS-STORY-BIBLE.md`)

This file is the canonical source of truth.

Do not invent parallel lore.

Do not change:

- Cluby's origin
- character relationships
- character responsibilities
- world progression logic
- core visual style
- story-learning relationship

without intentionally updating the canon first.

If a requested feature conflicts with the canon:

do not silently implement it.

Report:

STORY CONFLICT

Then explain:

1. what conflicts
2. why
3. the smallest canon-compatible solution

Every new story feature must answer:

1. What does the learner learn?
2. Why does this event happen now?
3. Which existing character owns this moment?
4. Which existing world does it belong to?
5. What real learner data triggers it?
6. What changes in the world afterward?

If these cannot be answered, the story feature should not be added.

Characters support learning. Characters do not replace learning.

Cluby is not a pet.

The male and female learners are friends and study companions. They are not a
romantic couple by default.

Story progression must be based on real learning progress.

Marketing may tease the story. The logged-in product lets the learner
experience the story.
