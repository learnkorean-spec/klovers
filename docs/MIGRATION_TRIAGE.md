# Migration triage — 47 local files absent from the live migration history

**Status: OPEN.** `supabase/MIGRATIONS_HOLD` is in place and `deploy-functions.yml`
is skipping both jobs. Nothing in this document has been run. Do not lift the
hold until the repair step below has been executed and verified.

## Why this exists

`SUPABASE_ACCESS_TOKEN` expired on **2026-04-21** and was rotated on
**2026-08-21**. In between, `deploy-functions.yml` failed on every run
(#234–#501, 268 consecutive failures), so `supabase db push` never ran. Schema
work continued and was applied to production **by hand**, under different
version numbers.

The result is two diverged lineages:

| | count |
|---|---|
| Migration versions recorded in production | 316 |
| Migration files in `supabase/migrations/` on `main` | 251 |
| **Local files whose version is absent from production** | **47** |
| Of those 316, applied since 2026-04-21 (hand-applied) | 122 |

`supabase db push` applies any local version not in
`supabase_migrations.schema_migrations`. With the token repaired and no triage,
the next push to `main` attempts all 47.

`docs/SEO_MIGRATION.md` flagged this at the time:

> Fixing the token without triaging those 44 first would let `supabase db push`
> run all of them. That needs its own PR.

This is that PR. (44 has become 47: the two ping-trigger migrations landed on
2026-08-19, and the duplicate version described below was split into two.)

## What would happen today, without triage

The push does **not** simply succeed or fail. It aborts partway:

`20260512000001` runs `DROP CONSTRAINT trial_slots_day_of_week_start_time_timezone_key`
with no `IF EXISTS`, and that constraint no longer exists in production
(verified 2026-08-21). Postgres raises, `db push` stops, and every migration
before it stays applied **and recorded** while everything after it does not run.
`deploy-functions` never starts, because of its `needs: migrate`.

So the realistic failure is a **partially migrated production database**, not a
clean abort.

## Method

Every migration was read, the objects it creates were extracted (tables, views,
functions, triggers, columns, constraints, indexes, cron jobs), and each was
tested for existence against the live database with read-only queries. Nothing
was executed against production.

- **A — Already applied (36).** Every object it creates already exists in
  production. Replaying is redundant; the DDL is idempotent or the objects are
  simply recreated identically. Safe either way, but there is no reason to run it.
- **B — Genuinely pending (3).** Creates something production does not have.
  These are the only three that should actually run.
- **C — Must not replay (8).** Mutates live data, or aborts the push, or both.
  These must never execute again in any environment.

## C — Must not replay (8)

Three of these are **neutralised in this PR**: the destructive statements are
removed and replaced with a comment recording exactly what was deleted and why.
Idempotent schema DDL is kept where present, so a local `supabase db reset`
still builds a correct schema. The other five are made unreachable by the repair
step, which records their versions as applied so `db push` skips them.

| version | file | what makes it unsafe | evidence (live, 2026-08-21) | action |
|---|---|---|---|---|
| `20260511000003` | `reset_bookings_tba_june_slots` | `UPDATE trial_bookings SET trial_date=NULL, start_time=NULL, is_tba=true WHERE status IN ('confirmed','pending')` — unschedules every active booking | matches **0 rows today only** because all 59 active bookings are already `is_tba=true`; one new booking before deploy would be wiped | **neutralised** + repair |
| `20260423000006` | `fix_orphaned_credits` | zeroes 4 named accounts; sets account `846805ef` to **4**; disables `protect_profile_fields_trigger` | the 4 accounts are at 0 (no-op), but `846805ef` holds **20** — this would drop it to 4 | **neutralised** + repair |
| `20260423000007` | `restore_ayaaraffaa_credits` | sets account `846805ef` to 20; disables `protect_profile_fields_trigger` | account is at 20; no-op today | **neutralised** + repair |
| `20260512000001` | `trial_slots_unique_by_date_and_may_slots` | `DROP CONSTRAINT trial_slots_day_of_week_start_time_timezone_key` with no `IF EXISTS` — **this is what aborts the push**; also inserts May 2026 slots | constraint **absent**; replacement `trial_slots_trial_date_start_time_key` **present**; the 4 May slots already exist | repair |
| `20260517000003` | `trial_attendance_flow` | `DROP CONSTRAINT trial_bookings_status_check` with no `IF EXISTS`, then re-adds an April-era status list; regenerates `confirmation_token` where NULL | constraint present (so it would succeed) — but re-adding the older `CHECK` risks rejecting statuses added since | repair |
| `20260511000004` | `tba_status_pending` | mass `UPDATE trial_bookings SET status='pending'` | touches **59 rows**, all already `pending` — no-op today, but it is an unconditional write | repair |
| `20260517000001` | `new_trial_schedule_myt` | inserts and updates May–June 2026 slots, superseded by the August schedule work | live slots run 2026-09-04 … 09-07 | repair |
| `20260517000002` | `assign_trial_slot_languages` | updates 4 specific May/June slot dates | those dates do not exist — matches nothing | repair |

The pattern worth noting: most of these are no-ops **today**, purely because of
the current contents of the tables. That is not safety. `20260423000006` is the
counter-example that proves it — it is actively harmful right now.

`000006` and `000007` also had to be handled as a pair. `000006` sets account
`846805ef` to 4 and `000007` sets it back to 20, which is why production reads
20. Neutralising only `000007` would have left a replay of `000006` regressing
that account to 4.

## B — Genuinely pending (3)

These are the only migrations that should run. All three are idempotent
(`IF NOT EXISTS` throughout), and `20260522000000` is wrapped in an explicit
transaction.

| version | file | what it adds | why it is safe |
|---|---|---|---|
| `20260422120000` | `admin_error_log` | `admin_error_log` table + 2 indexes + RLS | table confirmed **absent** in production; pure DDL, no DML |
| `20260423000000` | `trial_bookings_trial_days` | `trial_bookings.trial_days` column | column confirmed **absent**; single `ADD COLUMN IF NOT EXISTS` |
| `20260522000000` | `trial_booking_change_cancel_tracking` | 3 columns, tracking function, trigger, 2 partial indexes | function and trigger confirmed **absent**; its one `UPDATE` is a bounded backfill (`cancelled_at = COALESCE(cancelled_at, created_at)` for the 16 cancelled rows), inside `BEGIN`/`COMMIT` |

## A — Already applied (36)

Every object these create exists in production. Listed for completeness; each is
repaired as applied rather than run.

| version | file |
|---|---|
| `20260421120000` | `abandoned_checkout_recovery` |
| `20260421130000` | `checkout_recovery_tracking` |
| `20260421130001` | `harden_notify_search_engines_null_url` |
| `20260421140000` | `blog_comments` |
| `20260421200000` | `trial_followup_cron` |
| `20260421210000` | `lead_funnel_attribution` |
| `20260423000001` | `fix_approval_email_gate` |
| `20260423000002` | `enrollment_audit_trail` |
| `20260423000003` | `redesign_email_flow` |
| `20260423000004` | `require_receipt_before_approval` |
| `20260423000005` | `atomic_approve_enrollment` |
| `20260423000008` | `group_forming_email` |
| `20260423000009` | `receipt_nudge_email` |
| `20260424000000` | `lead_funnel_broadcast` |
| `20260424000001` | `language_from_profile` |
| `20260424000002` | `class_link_and_first_class` |
| `20260424000003` | `email_logs` |
| `20260424000004` | `day5_escalation` |
| `20260424000005` | `rejection_followup` |
| `20260424000006` | `preclass_reminder` |
| `20260424000007` | `class_feedback_email` |
| `20260424000008` | `pgnet_failure_logging` |
| `20260424000009` | `email_logs_delivery_columns` |
| `20260424000010` | `email_unsubscribe` |
| `20260424100000` | `trial_system_hardening` |
| `20260425000001` | `performance_indexes` |
| `20260427000000` | `trial_capacity_and_rate_limits` |
| `20260427010000` | `trial_cron_and_capacity_lock` |
| `20260501150000` | `funnel_digest_cron` |
| `20260511000001` | `trial_slots_meeting_url` |
| `20260511000002` | `fix_rate_limit_digest_bytea_cast` |
| `20260511000005` | `get_trial_availability_language_filter` |
| `20260519000001` | `v_trial_slots_admin_meeting_url` |
| `20260528000001` | `trial_views_add_class_language` |
| `20260819113000` | `pause_blog_publish_ping_trigger` |
| `20260819122000` | `reenable_blog_publish_ping_trigger` |

## The duplicate version

Two different files shared the version `20260421130000`:

```
20260421130000_checkout_recovery_tracking.sql
20260421130000_harden_notify_search_engines_null_url.sql
```

The CLI keys on the 14-digit prefix, so it records that version once and the
second file silently never applies — with which one wins decided by directory
ordering. Both are already applied in substance (the
`checkout_recovery_tracker` / `checkout_recovery_kpi` views and the
`notify_search_engines_on_publish` function all exist in production), so this
never caused damage, but it would have made the repair step below
unreproducible.

This PR renames the second to `20260421130001_harden_notify_search_engines_null_url.sql`.
All 251 migration versions are now unique. The rename is local-only; it does not
touch production.

`notify_search_engines_on_publish` is the function `CLAUDE.md` warns about
regarding `SET search_path`. Renaming the file does not re-run it, and the live
definition is untouched.

## Runbook — NOT YET RUN

Requires the rotated `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`. Run
from a linked checkout of this branch. **Step 0 is not optional.**

### 0. Back up first

Production is about to have 44 rows inserted into its migration history and 3
migrations applied. Take a snapshot from the Supabase dashboard
(Database → Backups) and confirm it completed before continuing.

### 1. Verify the CLI authenticates

```bash
supabase link --project-ref ewtdgpbybkceokfohhyg
```

This is the command that failed with `{"message":"Unauthorized"}` for four
months. If it still fails, stop — the token is not right and nothing below
will work.

### 2. Record the 44 already-applied / must-not-replay versions

This writes to `supabase_migrations.schema_migrations` only. It runs no
migration SQL and changes no application data.

```bash
supabase migration repair --status applied \
  20260421120000 20260421130000 20260421130001 20260421140000 \
  20260421200000 20260421210000 20260423000001 20260423000002 \
  20260423000003 20260423000004 20260423000005 20260423000006 \
  20260423000007 20260423000008 20260423000009 20260424000000 \
  20260424000001 20260424000002 20260424000003 20260424000004 \
  20260424000005 20260424000006 20260424000007 20260424000008 \
  20260424000009 20260424000010 20260424100000 20260425000001 \
  20260427000000 20260427010000 20260501150000 20260511000001 \
  20260511000002 20260511000003 20260511000004 20260511000005 \
  20260512000001 20260517000001 20260517000002 20260517000003 \
  20260519000001 20260528000001 20260819113000 20260819122000
```

### 3. Confirm only the 3 pending migrations remain

```bash
supabase migration list
```

Expected: exactly `20260422120000`, `20260423000000` and `20260522000000` show
as local-only. If anything else does, stop and re-triage — do not proceed.

### 4. Apply the 3

```bash
supabase db push
```

### 5. Verify

```sql
SELECT to_regclass('public.admin_error_log')                        IS NOT NULL AS admin_error_log,
       EXISTS(SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='trial_bookings'
                AND column_name='trial_days')                        AS trial_days,
       EXISTS(SELECT 1 FROM pg_trigger
              WHERE tgname='trg_trial_bookings_track_change_cancel') AS change_cancel_trigger;
```

All three must be `true`. Also re-check that the trial data is untouched:

```sql
SELECT status, is_tba, count(*) FROM public.trial_bookings GROUP BY 1,2;
-- expected, unchanged: pending/true = 59, cancelled/false = 16
SELECT credits FROM public.profiles WHERE user_id='846805ef-fe6e-4670-8f7c-88f2a4b232f7';
-- expected, unchanged: 20
```

### 6. Lift the hold

Delete `supabase/MIGRATIONS_HOLD` and merge. The next push to `main` runs
`migrate` and `deploy-functions` normally, deploying four months of accumulated
edge function work (16 new functions, 11 modified).

## After the hold is lifted

The edge function deploy has not run since 2026-04-21 either. It is not gated by
the migration history, so all 27 changed function files deploy at once on the
first successful run. That is a separate risk surface from the migrations and is
not analysed in this document.

Two structural issues remain open, both out of scope here:

1. ~~**`deploy-functions` has `needs: migrate`.**~~ Resolved. The coupling is
   gone: `deploy-functions` now depends on the hold guard directly, so a
   migration question cannot block shipping edge functions. The migrate job no
   longer runs `db push` either - it reports whether anything is pending and
   fails if so. Applying migrations is a deliberate, manually dispatched act:
   see [APPLYING_MIGRATIONS.md](./APPLYING_MIGRATIONS.md).
2. **Nothing prevents the lineages diverging again.** Hand-applying SQL to
   production without a matching migration file is what produced these 47. A
   check that fails CI when local and remote histories drift would catch the
   next one early.
