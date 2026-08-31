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
