# Setting up a dedicated content-edit service account

Four "Apply Content Edits" dispatches have failed on `Invalid login
credentials` while guessing which of your three personal admin accounts'
passwords belonged in the `CONTENT_EDIT_ADMIN_EMAIL` /
`CONTENT_EDIT_ADMIN_PASSWORD` secrets — more of your time than the entire
title batch is worth. This replaces guessing with a account built for exactly
one purpose, whose password you set yourself in the same sitting you paste it
into the secret. Nothing to guess, ever again.

**Why a dedicated account instead of reusing your own login:**

- **It can be revoked without locking you out of your own site.** If this
  account's credentials ever leak (a compromised CI log, a screenshot sent to
  the wrong person), disabling it is a two-minute fix that touches nothing
  else. Reusing your login means every future credential rotation is also a
  "does this break Re's own sign-in" question.
- **Its password exists for exactly one purpose, so it cannot drift.** Your
  own password changes when *you* decide to change it, for reasons that have
  nothing to do with this workflow. A dedicated account's password only ever
  changes when this workflow needs it to.

Four steps. Do them in order — each one depends on the last.

## Step 1 — Create the account

1. Open the [Supabase dashboard](https://supabase.com/dashboard/project/ewtdgpbybkceokfohhyg) for the Klovers project.
2. In the left sidebar, click **Authentication**, then **Users**.
3. Click **Add user** (top right) → **Create new user**.
4. **Email**: `content-bot@kloversegy.com` (or another address you control —
   whatever you choose, use the *same* address in every step below).
5. **Password**: generate or type a strong password. Copy it somewhere
   temporary (a password manager, not a note you'll lose) — you'll paste it
   into a GitHub secret in Step 3.
6. Check **Auto Confirm User** before clicking **Create user**, if the dialog
   offers it. This confirms the account immediately, with no confirmation
   email round-trip — you should not need to wait for or click anything else
   before the account is usable.
7. Click **Create user**. Confirm the new row appears in the Users list with
   that email.

At this point the account exists and can sign in, but it has no permissions —
`user_roles` has no row for it yet, so `has_role(auth.uid(), 'admin')` returns
false and every RLS-gated write (including `content-edit-cli.mjs apply`) will
be rejected. That's Step 2.

## Step 2 — Grant it the `admin` role

There is no admin-panel screen for this (checked — every `user_roles`
reference in the app is a read, none of them grant a role), so this goes
through the same **Apply Migrations** workflow every schema change in this
repo already uses, not a direct write to production.

The migration is already written and waiting:
`supabase/migrations/20260829154738_grant_admin_role_content_service_account.sql`.
It looks up the account by the email above and grants it `admin` — it does
**not** create the account (that was Step 1) and does **not** touch any other
user's role.

1. Merge the PR that adds this migration file, if it isn't merged yet.
2. **Actions → Apply Migrations → Run workflow → `mode: plan`.** Confirm the
   plan lists this migration and nothing unexpected.
3. Same workflow, **`mode: apply`.**
4. If you used an email other than `content-bot@kloversegy.com` in Step 1,
   the migration will fail with a clear error naming the email it looked for
   and pointing back to this step — edit the `target_email` in the migration
   file to match, merge that fix, and re-dispatch `plan` then `apply`.

Full detail on this workflow: `docs/APPLYING_MIGRATIONS.md`.

## Step 3 — Put the credentials in the GitHub secrets

1. In the `klovers` GitHub repo: **Settings → Environments →
   `production-content-apply` → Environment secrets.**
2. Click **Update** (or **Add secret** if it's not there) on
   `CONTENT_EDIT_ADMIN_EMAIL`. **Name** stays exactly
   `CONTENT_EDIT_ADMIN_EMAIL` — do not change it. **Value** is the email from
   Step 1 (e.g. `content-bot@kloversegy.com`).
3. Same for `CONTENT_EDIT_ADMIN_PASSWORD`. **Name** stays exactly
   `CONTENT_EDIT_ADMIN_PASSWORD`. **Value** is the password from Step 1.

**The mix-up that cost a round last time**: on the secret form, *Name* is the
fixed label GitHub already shows you (`CONTENT_EDIT_ADMIN_EMAIL` /
`CONTENT_EDIT_ADMIN_PASSWORD`) — never type anything into that field. *Value*
is the only field you fill in, and it holds the actual email or password, not
another label. If a run fails again on `Invalid login credentials` after this
setup, this is the first thing to double-check: open each secret and confirm
the *Value* field genuinely holds the email/password and not something else
pasted into the wrong box.

## Step 4 — Verify before dispatching anything

1. Go to `kloversegy.com/admin/login`.
2. Sign in with the email and password from Step 1.
3. Confirm you land in the admin panel rather than being bounced back to the
   login screen or an "unauthorized" page.

If sign-in fails here, stop — do not dispatch Apply Content Edits yet. A
failure at this step means the credential pair itself is wrong (Step 1 or
Step 3), and dispatching will only reproduce the same `Invalid login
credentials` error, uninformatively, inside a GitHub Actions log.

If sign-in succeeds, the account is fully set up. **The 51-title batch can
now apply** (`content-edits/proposals/2026-08-27T12-43-40-928Z.proposal.json`,
`docs/APPLYING_CONTENT_EDITS.md`) — but that dispatch, and every later Gate 2
content step that reuses this same mechanism (internal linking, FAQ
expansion, thin-article expansion, the retired-duplicate content harvest),
is Re's call on when to run, not something to start automatically once this
runbook is done.
