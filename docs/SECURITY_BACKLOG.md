# Security backlog

Running log of security findings for kloversegy.com / klovers — closed and open.
Newest last. `SECURITY.md` at the repo root is the unfilled GitHub template and is
not this log.

---

## 2026-08-25 — CLOSED: `sb_secret_` key hardcoded in `scripts/deploy-lesson1.mjs`

**Status: CLOSED. No rotation performed or needed — the credential targets a
project that no longer exists.**

Found while investigating admin-auth patterns for the Gate 2 content-edit safety
mechanism (`docs/CONTENT_EDIT_SAFETY.md`): `scripts/deploy-lesson1.mjs` had a
Supabase project URL and an `sb_secret_` key (the modern equivalent of the
legacy `service_role` key — bypasses RLS entirely) hardcoded inline.

### Investigation (read-only throughout)

- The project ref in the file did not match `ewtdgpbybkceokfohhyg`, the project
  referenced everywhere else in this repo.
- Git history (all 64 branches, not just `main`) traces its origin precisely:
  linked as the main app's Supabase project on 2026-03-19 02:16 (+0800), reverted
  **4 minutes later** (commit `17b040c`, message *"restore old Supabase project
  ref (new project is empty)"*), superseded by `ewtdgpbybkceokfohhyg` the next day
  (commits `53f8583`, `f3deb00`). `deploy-lesson1.mjs` was committed at 02:37 that
  same session, already targeting the just-abandoned project.
- The script is not referenced by `package.json`, any CI workflow, or any other
  script — it has never run automatically, only if invoked by hand.
- No other copy of the value exists anywhere in this repo's tracked history, on
  any branch (`git log --all -S <value>` across all 64 fetched branches).
- This session deliberately did **not** attempt to connect to the credential's
  endpoint to test it — using a credential of unconfirmed ownership against
  outside infrastructure is a different act from investigating this repo's own
  exposure, and that line was not crossed. See the resolution below for how
  validity was actually confirmed instead.

### Resolution

Re checked her own Supabase account directly (read-only): exactly one
organization ("Klovers", `yejbamqkmwvfsuhttjry`), exactly one project
(`ewtdgpbybkceokfohhyg`, created 2026-03-19 16:47 UTC — **hours after** the
abandoned ref was dropped that same day). The project the leaked credential
targets does not exist under her account, in any organization, paused or
otherwise.

**The exposure is closed.** No rotation was needed and no key was touched —
including the real project's own keys, which are unrelated. The hardcoded value
was removed from `scripts/deploy-lesson1.mjs` (see that file's own comment)
purely as hygiene, not as the fix — the fix was confirming the credential is
already inert.

**Caveat on record, not pursued further:** visibility here is limited to
organizations Re's own Supabase account can see. If the abandoned project were
somehow recreated under an account outside her ownership, that is outside what
either investigation could check. Given it was empty and superseded within a
day, this is noted for the record rather than chased further.

### Separately noted this session — not itself closed, nothing to act on yet

This repository had a fork created before it was made private; that fork's
ownership was never confirmed. Not a rotation-requiring exposure on its own
today, but worth remembering the next time a secret turns up in this repo's
history: deleting a line never removes it from a fork nobody controls, or from
this repo's own git log. Rotation (or, as here, confirming the target is
already gone) is the only real fix.
