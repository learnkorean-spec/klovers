# Database backup and restore

The Supabase project (`ewtdgpbybkceokfohhyg`) is on the **FREE plan**: no
point-in-time recovery, no automated backups. `.github/workflows/database-backup.yml`
is the whole safety net.

## What runs

| | |
|---|---|
| Schedule | **Daily**, 02:17 UTC (04:17/05:17 Cairo, 10:17 Kuala Lumpur) |
| On demand | Actions → **Database Backup** → *Run workflow* |
| Contents | `public`, `supabase_migrations` (required) · `auth`, `storage` (best effort — see below) |
| Encryption | GPG symmetric, AES-256, passphrase from `BACKUP_ENCRYPTION_PASSPHRASE` |
| Stored as | GitHub Actions artifact, 90-day retention by default |

The plaintext dump is shredded on the runner before upload. Only the `.gpg` file
leaves the job. The connection string is never echoed.

Every run restores the artifact it just produced into a throwaway Postgres 17
and compares row counts against production. If any table comes back missing or
empty, the run **fails** and the artifact is not to be trusted.

**Daily rather than weekly.** Measured against a database matching production's
size (77 tables, 16,632 rows), the encrypted artifact is under 1 MB — daily
backups cost roughly 18% of GitHub's free artifact-storage quota and 8% of its
Actions-minutes quota for a private repo, so the extra safety is nearly free.
The 59 students on the waiting list are about to start booking, and a
confirmed booking cannot be reconstructed from memory the way most other data
can — weekly would risk up to 7 days of them; daily caps it at 24 hours.

### Does the backup include login accounts (`auth.users`)?

**Yes — verified against production, not assumed.** `auth` is listed as
"best effort" because *any* single unreadable object in a schema fails that
schema's whole `pg_dump` call, and the workflow does not treat that as fatal
for `auth`/`storage` the way it does for `public`. But the specific
permission `pg_dump` needs — `SELECT` on every table — was checked directly
against the role the workflow connects as (`postgres`), for **every table**
in both schemas:

```sql
has_table_privilege('postgres', 'auth.users', 'SELECT')       -- true
has_table_privilege('postgres', 'storage.objects', 'SELECT')  -- true
-- and the same, individually, for all 23 auth.* and 8 storage.* tables: all true
```

So on the current permission grants, `auth` (including `users`, `identities`,
`sessions`, `mfa_factors`) and `storage` (including `objects` — file
*metadata*, not the files themselves) are expected to dump successfully, not
silently skipped. This was checked with a live read-only query, not by
running `pg_dump` itself — this session intentionally does not hold the
database password. **The first manual run after merge is the actual proof**:
its log will show either a successful dump of both schemas, or a named
warning for whichever one failed.

This changes what a restore actually means for logins: raw `auth.users` rows,
including password hashes, are expected to be in the archive. What that does
**not** guarantee is that dropping them into a *new* Supabase project's `auth`
schema (the realistic restore scenario — see RTO below) works cleanly without
conflicting with rows that project's own Auth service seeds on creation, or
that existing sessions/refresh tokens stay valid against a new JWT secret —
that is a Supabase-restore question, not a data-presence question, and is
untested. Sessions being invalidated on a restore is expected regardless;
users needing fresh logins because the rows never made it across would not be.

**This is a known gap, tracked as its own follow-up item** — the same status
as the storage-objects gap below — not something this PR closes: rehearse an
`auth.users` restore into an actual scratch Supabase project and write down
whether logins survive it. Having the rows is not the same claim as having a
working restore, and that gap is exactly the distinction this item exists to
close.

## Required secrets

| Secret | Notes |
|---|---|
| `SUPABASE_DB_PASSWORD` | already present (used by Apply Migrations) |
| `SUPABASE_PROJECT_REF` | optional, defaults to `ewtdgpbybkceokfohhyg` |
| `BACKUP_ENCRYPTION_PASSPHRASE` | **new** — must be created before the first run |

Generate the passphrase with `openssl rand -base64 32` and store it in a
password manager before saving it into GitHub.

### If the passphrase is lost

**Every backup encrypted with it becomes permanently unreadable. There is no
recovery, no reset, and no support path.**

Concretely, this is what "lost" means:

- GitHub will not show it back to you. Actions secrets are write-only: once
  saved, the value can be replaced but never read, not by Re, not by an admin,
  not by GitHub support.
- The encryption is AES-256 with no key escrow and no recovery key. Nobody —
  not Anthropic, not GitHub, not Supabase — can open the files without the
  passphrase. This was tested: a wrong passphrase is refused outright.
- Every `.gpg` artifact already stored becomes a permanently unopenable file.
  Months of daily backups turn into useless blobs in one step.
- The database itself is untouched and still running. Losing the passphrase
  does not break production — it removes the safety net without any warning
  sign. **Nothing fails, nothing turns red, and nobody finds out until the day
  a restore is actually needed.** That is what makes it dangerous.

Recovery, if it happens: set a **new** passphrase, run the workflow manually,
and treat every older artifact as gone. The gap between the last readable
backup and that new run is data with no protection at all.

**Therefore:** store it in a password manager AND in one place that survives
losing the password manager. Rotating it is safe as long as the old value is
kept for as long as artifacts encrypted with it still exist.

## RPO / RTO — the honest numbers

These are measured, not estimated. A rehearsal was run against a database
built to match production's shape and size (77 tables, 16,632 rows, 17 MB).

| | Measured |
|---|---|
| Plain dump | 4.3 MB |
| **Encrypted artifact** | **~0.9 MB** |
| pg_dump | 0.2 s |
| Compress + encrypt | 0.9 s |
| Decrypt + unpack | 0.2 s |
| **Restore into Postgres** | **0.6 s** |
| **Total data restore** | **0.8 s** |

**RPO (how much data a failure can destroy): up to 24 hours.**
Backups are daily. A database lost just before the next run loses most of a
day's bookings, enrolments, leads and profile changes — permanently. There is
no PITR to fall back on and no transaction log shipping. Running the workflow
by hand before any risky change is what shrinks this window further, and it
is the reason the manual dispatch exists.

**RTO: the data comes back in under a second. Everything around it takes 2-4 hours.**

This is the number that surprises people, so it is worth stating precisely:
restoring the *data* is trivially fast. The hours are spent on everything that
is not the data.

1. Download the artifact — minutes, and only within the retention window.
2. Decrypt, unpack, restore — **under a second**, measured above.
3. Provision a target. Restoring *over* a live Supabase project is not
   supported cleanly; in practice this means a **new project**, which changes
   the project ref — so Vercel env vars, edge-function secrets and any
   hardcoded URL all have to be repointed. **This is the slow part, and it is
   almost all of the 2-4 hours.**
4. Re-run migrations if the restored history is behind the repo.
5. `auth` and `storage` restore only if the dump captured them — see "Does the
   backup include login accounts" above for what is actually expected to be
   in there and what stays unverified about restoring it into a fresh project.
6. Storage **objects** — the uploaded files themselves (receipt images, any
   upload) — are **not** in this backup at all, only their metadata rows in
   `storage.objects`. **This is a known gap, tracked as its own follow-up
   item** (a separate backup for uploaded files), not something this PR fixes.

**What this backup does not cover:**

- Storage objects (uploaded files, receipt images) — see point 6 above.
- Edge-function source — that lives in the repo, which is its own backup.
- Vercel configuration and environment variables.
- Anything written since the last run.
- **Corruption that gets backed up before anyone notices it.** This is the
  quiet one. The counter-inflation bug is exactly this shape: a faithful backup
  of already-wrong data is still wrong data. Backups protect against loss, not
  against being wrong. Only the row-count history in `ROW-COUNTS.txt` gives any
  hint, and only for deletions, not for bad values.

Run the workflow by hand before anything risky — a migration, a bulk edit, an
admin action that deletes. That turns the 24-hour window into a few minutes,
and it costs one click.

## Restoring

```bash
# 1. Download the artifact from the workflow run, then:
gpg --batch --decrypt --pinentry-mode loopback \
    --passphrase-file /path/to/passphrase \
    -o backup.tar.gz klovers-backup-<STAMP>.tar.gz.gpg
tar -xzf backup.tar.gz -C ./restore
cat restore/MANIFEST.txt        # when it was taken, which schemas, which commit

# 2. Create the Supabase roles the dump grants to, in the target database:
psql "$TARGET" -c "DO \$\$ DECLARE r text; BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','authenticator',
    'supabase_admin','supabase_auth_admin','supabase_storage_admin'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r)
      THEN EXECUTE format('CREATE ROLE %I NOLOGIN', r); END IF;
  END LOOP; END \$\$;"

# 3. Restore. Do not use ON_ERROR_STOP: "schema public already exists" and
#    Supabase-only extensions will error harmlessly.
psql "$TARGET" -f restore/public.sql
psql "$TARGET" -f restore/supabase_migrations.sql

# 4. Check the result against what production held when the dump was taken.
cat restore/ROW-COUNTS.txt
```

`restore/ROW-COUNTS.txt` is the per-table row count at dump time — the only
reliable way to tell a complete restore from a partial one.

## Testing a restore for real

The workflow proves restorability on every run, but it restores into an empty
Postgres, not into a Supabase project. Before relying on this in an emergency,
do one full rehearsal into a scratch Supabase project and write down what broke.
An untested restore path is an assumption, not a plan.

## Known follow-ups (not fixed in this PR)

Two gaps identified while building this backup, deliberately left out of scope
here and tracked as their own items rather than folded into this one:

1. **Does an `auth.users` restore actually work in a new Supabase project?**
   Verified that the rows are captured (see "Does the backup include login
   accounts" above) — not verified that dropping them into a fresh project's
   `auth` schema produces working logins, given that project seeds its own
   auth rows on creation. "We have the rows" and "we can log people back in"
   are different claims; only the first one is proven today.
2. **Backup for uploaded files** (receipt images, any file a student or admin
   uploads). This workflow captures `storage.objects` — the *metadata rows*
   describing those files — but not the files themselves. A separate backup
   covering actual file content is needed to close this.

Both are real gaps, not hypothetical ones, and both should become their own
PRs once queued.
