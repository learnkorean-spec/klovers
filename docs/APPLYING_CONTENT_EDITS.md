# Applying content edits

Content edits (title rewrites in Gate 2 Step 1, and every later step that
reuses the same mechanism — FAQ blocks, internal links, body expansion) are
**not** applied by running `npm run content:apply` on a laptop or in this
session. They are applied by the **Apply Content Edits** GitHub Actions
workflow, the same way `supabase db push` was replaced by **Apply
Migrations** (`docs/APPLYING_MIGRATIONS.md`) — that pattern has run thirteen
times against production with no incident, so this reuses it rather than
inventing a new one.

## Why not run it locally, or from a Claude session

`scripts/content-edit-cli.mjs apply` needs `CONTENT_EDIT_ADMIN_EMAIL` /
`CONTENT_EDIT_ADMIN_PASSWORD` — a real admin account's real password — in the
environment that runs it. **Production admin credentials do not belong in a
Claude Code session, ever**, and putting them on a contributor's laptop as a
plaintext env var is the same problem in a different place. GitHub Actions
secrets are the one place they should live: encrypted at rest, injected only
into a job that explicitly references them, never printed in a log.

## The three modes

Actions → **Apply Content Edits** → Run workflow:

1. **`mode: plan`**, with `proposal_path` set to the file under review, e.g.
   `content-edits/proposals/2026-08-26T04-57-30-113Z.proposal.json`.

   Reads that file and prints its full before/after table (before, after,
   and — when the proposal script recorded them — `reason` and `confidence`
   per row) into the run's Job Summary, plus the file's sha256 checksum.
   **Uses no Supabase credential of any kind, not even the public anon key.**
   Everything it prints comes from the proposal file already checked into
   the repo — the same file the PR that added it was reviewed against.
   Changes nothing.

2. **`mode: apply`**, with the same `proposal_path` and `expected_checksum`
   set to the sha256 the `plan` run just printed.

   Runs under the `production-content-apply` GitHub Environment — if that
   environment has Required reviewers configured, the run pauses for one of
   them to click Approve before anything below executes. First re-checks
   that the file's checksum still matches `expected_checksum`: if the
   proposal file changed since you ran `plan` (a rebase, a further edit, a
   `main` merge), the run refuses and tells you to re-plan. Then re-prints
   the same before/after table for the record, then runs
   `scripts/content-edit-cli.mjs apply` — the exact backup-then-write-then-
   verify code path described in `docs/CONTENT_EDIT_SAFETY.md`, unchanged.
   Confirms the number of rows actually changed matches the proposal's
   declared `editCount` and fails the run loudly if it doesn't. Uploads the
   batch's backup file (and the updated `ledger.json`) as workflow artifacts
   with 90-day retention, so the only rollback path isn't sitting solely on
   a runner that's already been reclaimed by the time anyone needs it.

3. **`mode: rollback`**, with `backup_path` set to
   `content-edits/backups/<batchId>.backup.json`.

   Same environment gate. If that file is already committed to the repo
   (per the "commit the backup" reminder below), it's used directly. If
   not — the disaster-recovery case, where something needs undoing before
   anyone has had a chance to commit it — also set `backup_run_id` to the
   `apply` run's ID and this workflow downloads that run's backup artifact
   first. Prints what it's about to restore, then runs
   `scripts/content-edit-cli.mjs rollback` and confirms the restored count
   matches the backup's entry count.

## After every `apply` run

Same rule as the CLI has always printed: **commit the backup file and the
updated `content-edits/ledger.json` in their own small PR immediately.**
Download them from the `apply` run's Artifacts tab (`content-edit-backup-
<batchId>` and `content-edit-ledger-<batchId>`) if nobody has a local
checkout with them. Until that PR is merged, the only record of the batch
having been applied — and the only rollback material — lives in the
workflow's 90-day artifacts, not in git history.

## Setup Re needs to do once

1. **Settings → Environments → New environment.** Name it exactly
   `production-content-apply`. Add Required reviewers, same as
   `production-db-apply` for migrations. Without this, `apply` and
   `rollback` still run (GitHub auto-creates an unprotected environment on
   first reference) — they just aren't gated by anyone's approval, which
   defeats the point.

2. **Add exactly two secrets**, scoped to that same
   `production-content-apply` environment (Settings → Environments →
   `production-content-apply` → Environment secrets → Add secret — not
   repository-level secrets, so they're unreadable by any job that doesn't
   run under this environment):

   - `CONTENT_EDIT_ADMIN_EMAIL`
   - `CONTENT_EDIT_ADMIN_PASSWORD`

   The email/password of an existing Supabase auth user that holds the
   `admin` role (`has_role(auth.uid(), 'admin')`) — the same account anyone
   running `content:apply` locally would need. No third secret: the
   Supabase project URL and anon key are hardcoded directly in the workflow
   file, deliberately — see the comment above `SUPABASE_ANON_KEY` in
   `.github/workflows/apply-content-edits.yml` for why that value isn't
   secret material (it's already shipped in kloversegy.com's own JS bundle).

## Where the two secrets can and can't end up

Neither `CONTENT_EDIT_ADMIN_EMAIL` nor `CONTENT_EDIT_ADMIN_PASSWORD` is ever
passed to `echo`, written to a file, or included in anything the workflow
uploads as an artifact — by inspection of every step in
`.github/workflows/apply-content-edits.yml`, the only place either value is
used is as a process environment variable that
`scripts/lib/content-edit-supabase-store.mjs` reads to call Supabase's
`auth.signInWithPassword()`, which does not log its arguments. The `plan`
job never receives these secrets at all — they're declared only inside the
`apply` and `rollback` jobs' own `env:` blocks. As defense in depth, GitHub
Actions also automatically masks any string that exactly matches a
referenced secret's value anywhere it would otherwise appear in a run's logs
or Job Summary — so an accidental future `echo "$CONTENT_EDIT_ADMIN_PASSWORD"`
would still come out as `***`, not the password, though nothing here relies
on that as the only safeguard.

## If something goes wrong

`apply` and `rollback` both stop at the first failure — a checksum mismatch,
a stale edit, a write that doesn't read back correctly, a row-count mismatch
— and print `::error::` annotations naming exactly what didn't match. Read
the run's Job Summary and log, fix the underlying problem (usually: re-run
`plan` to get a fresh checksum, or re-run the proposal script if the source
data drifted), and dispatch again. `applyProposal`/`rollbackBatch`'s own
idempotency guards mean a batch that already fully succeeded is never
re-applied by a repeat dispatch — it's reported as skipped instead.
