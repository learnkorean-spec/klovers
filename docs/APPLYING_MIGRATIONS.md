# Applying migrations

Migrations are **not** applied automatically. Adding a file to
`supabase/migrations/` does not change the database; you dispatch the Apply
Migrations workflow when you want it applied.

## Why not `supabase db push`

`db push` requires the remote migration history to be a subset of
`supabase/migrations/`. It is not, and will not be: 112 versions exist in the
history with no local file, applied by hand between April and August 2026 and
catalogued in [MIGRATION_TRIAGE.md](./MIGRATION_TRIAGE.md). `db push` refuses to
run at all in that state:

    Remote migration versions not found in local migrations directory.

The fix it suggests, `migration repair --status reverted` on those 112, deletes
the record of migrations that really were applied — their objects are live — so
it is not used. Applying directly and recording afterwards is what the Apply
Migrations workflow does instead: the same two things `db push` does, minus a
consistency check this project cannot satisfy.

## Adding a migration

1. Add the file to `supabase/migrations/` as usual and merge it.

   The `Check migration state` job in **Deploy Supabase** will now go **red**,
   reporting your migration as pending. That is expected and is the reminder
   that it has not been applied. Edge function deploys are unaffected — they no
   longer wait on that job.

2. Actions → **Apply Migrations** → Run workflow → `mode: plan`.

   Lists what would be applied and changes nothing. Check the list is exactly
   what you expect.

3. Same workflow, `mode: apply`.

   Applies each pending migration in version order and records it. Each file is
   applied in a transaction unless it opens its own, so a failure part-way
   through a file cannot half-apply it, and a failure on one migration leaves
   later ones untouched.

4. `Check migration state` goes green on the next push.

## Writing a migration that is safe here

- Make it idempotent: `IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS`.
  A run that fails part-way is re-dispatched, not rolled back by hand.
- If it touches more than one object, wrap it in `BEGIN; ... COMMIT;` yourself.
- Preserve every clause on any function you replace, especially `SET search_path`.
- Check the live object first (`pg_get_functiondef`, `information_schema.columns`).
  Local files and the live database have diverged before.

## If something goes wrong

The apply step stops at the first failure and the record step does not run, so
nothing is marked applied that was not. Read the run log to see which migration
failed, fix the file, merge it, and dispatch again — the versions already
applied are recorded and will not be re-applied.
