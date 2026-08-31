-- Revoke the `admin` role from learnkorean@kloversegy.com.
--
-- Background
-- ----------
-- docs/ADMIN_ACCESS_AUDIT.md (2026-08-31 entry) found this account has
-- never signed in since it was created (2026-03-27, auth.users.last_sign_in_at
-- is NULL), and the only two references to its email anywhere in this
-- codebase are as a plain string - a digest-email recipient
-- (supabase/functions/funnel-digest/index.ts) and a Wikipedia API contact
-- address (supabase/functions/attach-blog-hero-images/index.ts). Nothing
-- signs in as this account or depends on its admin role.
--
-- PREPARED, NOT DISPATCHED. Re asked for this to be ready but explicitly
-- not applied until she says so - do not run Apply Migrations for this
-- version without that explicit go-ahead, whatever else in this repo's
-- pending list gets applied around it.
--
-- Why an email lookup instead of a hardcoded user_id
-- ---------------------------------------------------
-- Same reasoning as every other role-grant/revoke migration in this
-- history (e.g. 20260829154738, 20260831080000): correct under whatever
-- id the account actually has, no separate lookup step to get wrong.
--
-- Safety
-- ------
-- Guarded: raises a clear error if the account no longer exists, or no
-- longer holds `admin` (nothing to revoke - this migration's job is
-- already done, not a failure, but also not silently skipped without
-- saying so). Idempotent: a second run after a successful revoke is a
-- true no-op via the same guard.

BEGIN;

SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

DO $$
DECLARE
  target_email text := 'learnkorean@kloversegy.com';
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Guard failed: no auth.users row for %. Nothing to revoke.', target_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Guard failed: % has no admin role to revoke (already revoked, or never granted through this path).', target_email;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin';

  INSERT INTO public.admin_audit_log (admin_id, enrollment_id, action, field, old_value, new_value)
  VALUES (
    'eb51d4be-8378-493f-b6c7-9c3a5e9b5416'::uuid,
    NULL,
    'admin_role_revoked',
    'user_roles',
    target_email,
    'dormant account, never signed in since creation 2026-03-27 - see docs/ADMIN_ACCESS_AUDIT.md'
  );
END $$;

-- Verify before commit.
DO $$
DECLARE
  target_email text := 'learnkorean@kloversegy.com';
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Verify failed: % has no auth.users row', target_email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Verify failed: % still has the admin role after DELETE', target_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.admin_audit_log
     WHERE action = 'admin_role_revoked' AND old_value = target_email
  ) THEN
    RAISE EXCEPTION 'Verify failed: no admin_audit_log record for revoking %''s admin role', target_email;
  END IF;
END $$;

COMMIT;
