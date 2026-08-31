# Admin access audit

Running log of who holds the `admin` role on production and why. New entries
go at the bottom. Background/evidence for related findings:
`docs/CONTENT_EDIT_SERVICE_ACCOUNT_RUNBOOK.md`.

---

## 2026-08-31 — Four accounts hold `admin` (OPEN — needs Re's review)

Surfaced by Re's GM while working through the content-bot account setup.
Queried directly against `public.user_roles` / `auth.users` (read-only) on
2026-08-31:

| email | user_id | account created |
|---|---|---|
| `admin@klovers.com` | `eb51d4be-8378-493f-b6c7-9c3a5e9b5416` | 2026-03-20 |
| `reham.elshrkawy@gmail.com` | `a4208ff1-1bcc-4737-ad02-3a2948c6e227` | 2026-03-20 |
| `learnkorean@kloversegy.com` | `4f1cacb6-af80-426a-bba0-dc86b14f04e8` | 2026-03-27 |
| `content-bot@kloversegy.com` | `3f450c18-dbbc-4402-bf4e-42f1f6a6fcf2`* | 2026-08-30 |

\* content-bot's account is being deleted and recreated as of this entry
(see `docs/CONTENT_EDIT_SERVICE_ACCOUNT_RUNBOOK.md`); its `admin` grant is
handled separately (migration `20260831080000`, not yet applied as of this
entry).

Two of these are accounted for: `reham.elshrkawy@gmail.com` is Re's own
login (matches her account on file), and `content-bot@kloversegy.com` is
the dedicated content-edit service account this repo's own runbook set up
deliberately.

**Not accounted for, not decided, not acted on here:**

- `admin@klovers.com` and `learnkorean@kloversegy.com` — who each one is,
  why it has `admin`, and whether it's still needed. `admin_audit_log`
  attributes migration-driven writes to `admin@klovers.com`'s user_id
  (`eb51d4be-...`) throughout this repo's migration history, which is a
  clue to what it's for, not a confirmed answer — that attribution could
  itself just be a convention someone picked, not proof the account is
  still a real, actively-used login.
- Both predate this repo's active session history (created 2026-03-20 and
  2026-03-27) — no record here of who set them up or why.

Explicitly Re's call, not mine: whether either account still needs
`admin`, and if not, how it gets revoked (through the normal migration
path, like every other role change in this history — see
`20260829154738` / `20260831080000` for the pattern).

## 2026-08-31 — Read-only follow-up: what `admin@klovers.com` and `learnkorean@kloversegy.com` are actually used for

Re asked three specific questions after noticing `admin@klovers.com` had
signed in two days earlier (2026-08-29) despite her own account
(`reham.elshrkawy@gmail.com`) not having signed in since 2026-08-23 —
odd, since she works in the admin panel daily. **Read-only. No account,
role, or code changed by this entry.**

**1. What is `admin@klovers.com` (`eb51d4be-...`) actually used for? Do
migrations run under its identity?**

Two separate, unrelated uses of the same account — worth not conflating:

- **It is the site's actual admin login.** `src/pages/AdminLogin.tsx`
  (line 28) hard-codes `data.user.email !== "admin@klovers.com"` — a
  sign-in with *any other* email is explicitly signed out and rejected,
  *before* the code even checks `user_roles`. Concretely: Re's own account
  holds the `admin` role in `user_roles` (confirmed above) but **cannot
  reach `/admin`** through this page, because the email check runs first
  and rejects it outright. Whoever has `admin@klovers.com`'s password is
  the only one who can sign into the panel through the front door — this
  is very likely a shared credential, not a stray unused account.
- **It is a text placeholder inside migration files**, unrelated to any
  real sign-in: 8 migrations (`20260826110000` through `20260831080000`,
  all from the last week) call
  `SELECT set_config('request.jwt.claim.sub', 'eb51d4be-...', true)` to
  attribute their `admin_audit_log` rows to a real user id, since a
  migration runs over a direct `psql` connection with no authenticated
  Supabase session of its own. This does **not** mean migrations execute
  "as" `admin@klovers.com` in any sign-in sense — no login event, no
  password, no session is created by this; it only fills in the audit
  log's `admin_id` column with a real id someone chose as the
  conventional "system actor" for these writes.

**2. Where did the 2026-08-29 14:42:10 UTC sign-in come from?**

Found in the raw GoTrue request log for that exact timestamp (the
`auth.audit_log_entries` table itself is empty — no retention configured,
so this came from the log drain, not that table):

```
grant_type: password
path: /token
method: POST
referer: https://kloversegy.com/
remote_addr: 149.40.58.150
status: 200
```

A standard password sign-in through the real site's own login form
(`referer` is `kloversegy.com`, not the Supabase dashboard or an API
client) — not a Management API call, not a service-role action, not the
Supabase dashboard's own "Users" panel. Immediately before it
(14:42:09), a `refresh_token` grant for the same account was revoked from
the same IP — the ordinary pattern of a browser session's silent refresh
expiring, followed by a fresh password login, not two separate incidents.
**Whether `149.40.58.150` is a familiar IP is for Re to check on her
end** — not verified here.

**3. Does any code use `learnkorean@kloversegy.com`? Is the account
dead?**

`last_sign_in_at` is `null` — it has never once signed in since creation
(2026-03-27). The two code references that exist are both just its email
address used as a **string**, not a login:

- `supabase/functions/funnel-digest/index.ts` — default value of
  `FUNNEL_DIGEST_TO`, the recipient address for a digest email sent via
  Resend.
- `supabase/functions/attach-blog-hero-images/index.ts` — a contact
  address inside the `User-Agent` header sent to Wikipedia's API.

No code signs in as this account or uses its credentials for anything.
Its `admin` role appears to be inert — attached to an account that has
never authenticated, doing nothing a revoke would break, as far as this
read-only pass found.
