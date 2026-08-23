# Database backup and restore

The Supabase project (`ewtdgpbybkceokfohhyg`) is on the **FREE plan**: no
point-in-time recovery, no automated backups. `.github/workflows/database-backup.yml`
is the whole safety net.

## What runs

| | |
|---|---|
| Schedule | Sundays 02:17 UTC (04:17/05:17 Cairo, 10:17 Kuala Lumpur) |
| On demand | Actions → **Database Backup** → *Run workflow* |
| Contents | `public`, `supabase_migrations` (required) · `auth`, `storage` (best effort) |
| Encryption | GPG symmetric, AES-256, passphrase from `BACKUP_ENCRYPTION_PASSPHRASE` |
| Stored as | GitHub Actions artifact, 90-day retention by default |

The plaintext dump is shredded on the runner before upload. Only the `.gpg` file
leaves the job. The connection string is never echoed.

Every run restores the artifact it just produced into a throwaway Postgres 17
and compares row counts against production. If any table comes back missing or
empty, the run **fails** and the artifact is not to be trusted.

## Required secrets

| Secret | Notes |
|---|---|
| `SUPABASE_DB_PASSWORD` | already present (used by Apply Migrations) |
| `SUPABASE_PROJECT_REF` | optional, defaults to `ewtdgpbybkceokfohhyg` |
| `BACKUP_ENCRYPTION_PASSPHRASE` | **new** — must be created before the first run |

Generate the passphrase with `openssl rand -base64 32` and store it in a
password manager. **If it is lost, every backup taken with it is unreadable.**
It is not recoverable from GitHub — secrets are write-only once saved.

## RPO / RTO — the honest numbers

**RPO (how much data a failure can destroy): up to 7 days.**
Backups are weekly. A database lost on a Saturday loses six days of bookings,
enrolments, leads and profile changes — permanently. There is no PITR to fall
back on and no transaction log shipping. Running the workflow by hand before
any risky change is what shrinks this window, and it is the reason the manual
dispatch exists.

**RTO (how long a restore actually takes): 2–4 hours, and it is not one click.**

1. Download the artifact — minutes, and only within the retention window.
2. Decrypt and unpack — minutes.
3. Provision a target. Restoring *over* a live Supabase project is not
   supported cleanly; in practice this means a new project, which changes the
   project ref — so Vercel env vars, edge-function secrets and any hardcoded
   URL all have to be repointed. This is the slow part.
4. Restore `public` and `supabase_migrations`, then re-run migrations if needed.
5. `auth` and `storage` restore only if the dump captured them. **Auth users may
   have to be recreated**, which means password resets for everyone.
6. Storage *objects* (uploaded files) are **not** in this backup at all — only
   their metadata rows. Receipt images and any uploaded file are lost.

**What this backup does not cover:** storage objects, edge-function source
(that lives in the repo), Vercel configuration, and anything written in the
days since the last run.

**The real fix is Supabase Pro** (daily backups + 7-day PITR), which turns the
RPO from 7 days into minutes. This workflow is the stopgap, not the answer.

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
