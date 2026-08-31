-- Re-grant the `admin` role to the content-edit service account after its
-- account was deleted and recreated with a new user ID.
--
-- Background
-- ----------
-- 20260829154738 originally granted content-bot@kloversegy.com the admin
-- role. That account's password could not be reset through any supported
-- path (no dashboard "set password" for an existing user, and a recovery
-- email cannot reach a mailbox that does not exist), so Re deleted and
-- recreated the account via Step 1 of
-- docs/CONTENT_EDIT_SERVICE_ACCOUNT_RUNBOOK.md, this time capturing the
-- password directly at creation. Deletion and recreation both change the
-- account's auth.users.id, so 20260829154738's grant (tied to the old id
-- indirectly, via user_roles rows keyed on it) no longer matches anything
-- a real sign-in can produce.
--
-- This migration does two things, matching by email rather than a
-- hardcoded id so it is correct the moment the account exists under
-- whatever id it was actually recreated with:
--   1. Removes the now-orphaned rows left behind by the old id - user_roles
--      and profiles both have no foreign key to auth.users (checked directly
--      against this schema before writing this file - see below), so
--      deleting the auth.users row did not, and could not, cascade-clean
--      them. Left alone, they are permanent dead data pointing at a user id
--      nothing can ever sign in as again.
--   2. Grants the admin role to the account under its current id, same
--      guard and verify structure as 20260829154738.
--
-- Why not just edit 20260829154738 in place
-- -------------------------------------------
-- It already ran and is recorded as applied; migrations here are never
-- rewritten after the fact (this project's own working rules). A new file
-- is the correct way to change previously-applied state, same as any other
-- correction migration in this history (e.g. 20260830043329).
--
-- Verified before writing (read-only, against the live schema)
-- ---------------------------------------------------------------
-- `SELECT ... FROM pg_constraint WHERE contype='f' AND confrelid =
-- 'auth.users'::regclass AND conrelid::regclass::text IN
-- ('public.user_roles','public.profiles')` returned zero rows for both -
-- confirmed no FK exists, so the orphan cleanup below is necessary, not
-- optional, and safe to do unconditionally (a WHERE on the specific old id
-- only touches Content-bot's own stale rows, not anyone else's).

BEGIN;

SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

DO $$
DECLARE
  target_email text := 'content-bot@kloversegy.com';
  old_user_id  uuid  := '3f450c18-dbbc-4402-bf4e-42f1f6a6fcf2';
  new_user_id  uuid;
BEGIN
  -- 1. Clean up rows orphaned by the old id's deletion. Scoped to the exact
  --    old id, never a broad delete - touches nothing else in either table.
  DELETE FROM public.user_roles WHERE user_id = old_user_id;
  DELETE FROM public.profiles WHERE user_id = old_user_id;

  -- 2. Grant the role under the account's current (recreated) id.
  SELECT id INTO new_user_id FROM auth.users WHERE email = target_email;

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION
      'Guard failed: no auth.users row for %. The account must be recreated (Step 1 of docs/CONTENT_EDIT_SERVICE_ACCOUNT_RUNBOOK.md) before this migration can run.',
      target_email;
  END IF;

  IF new_user_id = old_user_id THEN
    RAISE EXCEPTION
      'Guard failed: % still resolves to the old user id (%). Expected a NEW id from the delete-and-recreate - if this account was not actually recreated, 20260829154738 already granted it the role and this migration is not needed.',
      target_email, old_user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = new_user_id AND role = 'admin'
  ) THEN
    RETURN; -- already granted under the new id; nothing left to do
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.admin_audit_log (admin_id, enrollment_id, action, field, old_value, new_value)
  VALUES (
    'eb51d4be-8378-493f-b6c7-9c3a5e9b5416'::uuid,
    NULL,
    'admin_role_regranted_after_account_recreation',
    'user_roles',
    old_user_id::text,
    target_email
  );
END $$;

-- Verify before commit.
DO $$
DECLARE
  target_email text := 'content-bot@kloversegy.com';
  old_user_id  uuid  := '3f450c18-dbbc-4402-bf4e-42f1f6a6fcf2';
  new_user_id  uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = old_user_id) THEN
    RAISE EXCEPTION 'Verify failed: old user_roles row for % still present', old_user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = old_user_id) THEN
    RAISE EXCEPTION 'Verify failed: old profiles row for % still present', old_user_id;
  END IF;

  SELECT id INTO new_user_id FROM auth.users WHERE email = target_email;
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'Verify failed: % still has no auth.users row', target_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = new_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Verify failed: % has no admin role under its current id after INSERT', target_email;
  END IF;
END $$;

COMMIT;
