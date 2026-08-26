# Content edit safety mechanism

**Date:** 2026-08-25
**What this is:** Option A from `docs/SEO_GATE1_REPORT.md` Part 2 ("Propose,
review, apply"), built as the required precondition for Gate 2 before any
`blog_posts` row is touched in bulk. There is no revision/history table in the
database — this mechanism *is* the safety net.

Nothing in this file changes any behavior on its own. It is infrastructure
that every later Gate 2 step (title repair, FAQ blocks, internal links, body
expansion) reuses instead of writing its own database access.

## The three commands

```
npm run content:apply -- content-edits/proposals/<batchId>.proposal.json
npm run content:rollback -- content-edits/backups/<batchId>.backup.json
npm run content:status
```

**Against production, `apply` and `rollback` are run through the Apply
Content Edits GitHub Actions workflow, not by hand.** See
[`docs/APPLYING_CONTENT_EDITS.md`](./APPLYING_CONTENT_EDITS.md) — it's the
same plan-then-apply, secrets-live-in-GitHub-Actions pattern
`docs/APPLYING_MIGRATIONS.md` already uses for the database, and for the
same reason: `CONTENT_EDIT_ADMIN_EMAIL` / `CONTENT_EDIT_ADMIN_PASSWORD` are a
real admin account's real credentials, and those don't belong on a laptop or
in an AI session's environment. `content:status` is read-only and fine to
run anywhere.

There is deliberately no generic `content:propose` command — computing *what*
to propose is specific to each step (a title rewrite, an FAQ block, a link).
Each step gets its own small script (e.g. `scripts/proposals/titles.mjs` in
Step 1) that computes its edits and calls `writeProposal()` from
`scripts/lib/content-edit.mjs`. `apply`, `rollback`, and `status` are fully
generic and shared by every step.

## What each guarantee actually is, and where it lives

| Requirement | How it's met |
|---|---|
| Backup before any change | `applyProposal` writes the backup file to disk **before** the first row write, and again after every single edit — not once at the end. |
| Dry-run that writes nothing | `writeProposal` only reads (to check for staleness) and writes proposal files. `store.writeColumn` is never called. |
| Tested rollback | `rollbackBatch` restores each entry's `before` value and reads it back to confirm. See the rehearsal transcript below — this was run for real, not just unit-tested. |
| Idempotency guard | `apply` hashes the proposal file and checks a ledger (`content-edits/ledger.json`) before writing anything; a batch already applied is refused, not re-run. `rollback` is symmetric. |
| Per-batch record | Every apply and rollback appends to `content-edits/ledger.json`: batch id, timestamp, which script produced it, how many rows, and the backup file path. |

## Row-level staleness guard

Beyond the batch-level idempotency guard, `writeProposal` re-reads the live
value of every row it's about to touch and compares it to what the proposal
expects. If something else changed that row since the proposal's source data
was read (a previous partial run, someone editing in the admin panel), the
edit is marked `stale` in the `.md` review file and `apply` refuses to run
until the proposal is regenerated. This protects against silently
overwriting a change nobody reviewed.

## Where files land, and why they are committed

`content-edits/proposals/`, `content-edits/backups/`, and
`content-edits/ledger.json` are **not** gitignored. A backup file is the
*only* way to undo an edit — if it only ever existed on whichever machine ran
`apply`, losing that machine loses the rollback path. **Commit the backup
file and the updated `ledger.json` in their own small PR immediately after
every `apply` run**, before doing anything else. `content:apply` prints this
reminder every time it finishes.

## Admin sign-in, not the service role key

`scripts/lib/content-edit-supabase-store.mjs` signs in as a real admin user
(`CONTENT_EDIT_ADMIN_EMAIL` / `CONTENT_EDIT_ADMIN_PASSWORD` env vars) and
writes through the same row-level-security policy the admin panel uses
(`has_role(auth.uid(), 'admin')` on `blog_posts` UPDATE). It confirms the
signed-in account actually holds the `admin` role before allowing any write,
so a wrong or expired account fails loudly up front rather than failing
silently on the first RLS-rejected write. The `service_role` key is
deliberately not supported here — see "Not recommended" in
`docs/SEO_GATE1_REPORT.md` Part 2.

*(Separately, and not part of this mechanism: `scripts/deploy-lesson1.mjs`
has a live Supabase secret key hardcoded in it. That key should be rotated —
flagged here because this doc is where the "no service_role, no hardcoded
secrets" rule for content edits is documented, not because that script uses
this mechanism.)*

## The local-Postgres rehearsal

`scripts/content-edit-rehearsal.mjs` exercises the exact propose/apply/
rollback code above — not a reimplementation of it — against a real
throwaway Postgres table, via `scripts/lib/content-edit-pg-store.mjs`. It is
not part of `npm test` (a normal CI run for this repo has no Postgres
server); it's a one-time manual demonstration, required before this PR is
reviewed, and reusable afterward if the mechanism itself ever changes.

Run it against any disposable local Postgres:

```
CONTENT_EDIT_REHEARSAL_PG_URL="postgres://postgres:<password>@localhost:5432/postgres" \
  npm run content:rehearsal
```

It creates `blog_posts_rehearsal`, seeds three rows, runs propose → apply →
re-apply (idempotency) → rollback → re-rollback (idempotency), asserts every
step, then drops the table. Full transcript from the run performed for this
PR:

```
── 1. Create throwaway table ──────────────────────────────
  ✓ blog_posts_rehearsal created

── 2. Seed three rows ─────────────────────────────────────
  ✓ 3 rows seeded

── 3. propose (dry-run) ───────────────────────────────────
  ✓ no edits flagged stale against fresh seed data
  ✓ propose wrote nothing to the database
  ✓ propose left the target row's live value unchanged too

── 4. apply ────────────────────────────────────────────────
  ✓ apply actually ran (not skipped)
  ✓ both edits in the batch applied
  ✓ row 1 title updated
  ✓ row 2 title updated
  ✓ row 3 (not in the batch) is untouched
  ✓ ledger records this batch as applied
  ✓ ledger records which script ran it
  ✓ ledger records when it ran

── 5. re-apply the same batch (idempotency guard) ─────────
  ✓ second apply of the same batch was refused, not re-run
  ✓ re-running apply did not touch the row a second time

── 6. rollback ─────────────────────────────────────────────
  ✓ rollback actually ran
  ✓ both entries restored
  ✓ row 1 restored byte-for-byte to its original title ("Korean Numbers: Two Counting Systems")
  ✓ row 2 restored byte-for-byte to its original title ("Korean Food Vocabulary: 60 Words")

── 7. re-run rollback (idempotency guard) ─────────────────
  ✓ second rollback of the same batch was refused, not re-run

REHEARSAL PASSED — every assertion above held.
```

## For whoever writes Step 1 (or any later step)

```js
import { writeProposal } from "./lib/content-edit.mjs";
import { createReadOnlyStore } from "./lib/content-edit-supabase-store.mjs";

const store = createReadOnlyStore();
const edits = /* compute your { slug, lang, column, before, after } array */;
const { mdPath } = await writeProposal(
  { source: "scripts/proposals/titles.mjs", description: "...", edits },
  store
);
console.log(`Review ${mdPath}, then npm run content:apply -- <the .json next to it>`);
```

`apply` and `rollback` need nothing step-specific — the same two commands
work for every future batch, on every column.
