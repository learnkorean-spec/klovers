-- Grant the `admin` role to a dedicated content-edit service account.
--
-- Background
-- ----------
-- Four "Apply Content Edits" dispatches (docs/APPLYING_CONTENT_EDITS.md) have
-- failed on "Invalid login credentials" while guessing which of Re's three
-- personal admin accounts' passwords belonged in the
-- CONTENT_EDIT_ADMIN_EMAIL / CONTENT_EDIT_ADMIN_PASSWORD secrets. That is
-- more of Re's time than the whole title batch is worth.
--
-- The fix in docs/CONTENT_EDIT_SERVICE_ACCOUNT_RUNBOOK.md is a purpose-built
-- Supabase Auth user that exists only for this workflow, whose password Re
-- sets herself in the dashboard in the same sitting she pastes it into the
-- GitHub secret — nothing to guess, and nothing shared with a personal
-- login. This migration is step 2 of that runbook: it does NOT create the
-- Auth user (that's a dashboard action only Re can do — Authentication ->
-- Users -> Add user) and does NOT set its password. It only grants the
-- `admin` role once that user already exists, which is the one part of
-- account setup this repo does through a migration rather than by hand,
-- same as every other role grant in this table's history.
--
-- Why an email lookup instead of a hardcoded user_id
-- ---------------------------------------------------
-- The account does not exist yet at the time this file is written or
-- reviewed, so there is no UUID to hardcode. Matching by email means this
-- migration is correct the moment Re finishes step 1 of the runbook,
-- with no manual UUID lookup step for anyone to get wrong in between.
--
-- Safety
-- ------
-- Guarded: raises a clear error (naming step 1 of the runbook) if the
-- account does not exist yet, rather than silently doing nothing. Guarded
-- again against granting a SECOND admin role to an account that somehow
-- already has one (the UNIQUE (user_id, role) constraint would already stop
-- this, but the guard gives a readable error instead of a raw constraint
-- violation). Idempotent via ON CONFLICT DO NOTHING - a re-run after a
-- successful apply is a true no-op, not a duplicate audit row.

BEGIN;

-- Attribution for admin_audit_log. Same account used for every other
-- migration's set_config in this sequence (admin@klovers.com).
SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

DO $$
DECLARE
  target_email text := 'content-bot@kloversegy.com';
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION
      'Guard failed: no auth.users row for %. Complete step 1 of docs/CONTENT_EDIT_SERVICE_ACCOUNT_RUNBOOK.md (Authentication -> Users -> Add user in the Supabase dashboard) before re-running this migration.',
      target_email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    -- Already granted (a prior successful run, or granted some other way).
    -- Nothing to do; verified below either way.
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.admin_audit_log (admin_id, enrollment_id, action, field, old_value, new_value)
  VALUES (
    'eb51d4be-8378-493f-b6c7-9c3a5e9b5416'::uuid,
    NULL,
    'admin_role_granted',
    'user_roles',
    NULL,
    target_email
  );
END $$;

-- Verify before commit. Not "should be right" -- asserted.
DO $$
DECLARE
  target_email text := 'content-bot@kloversegy.com';
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Verify failed: % still has no auth.users row', target_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Verify failed: % has no admin role in user_roles after INSERT', target_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.admin_audit_log
     WHERE action = 'admin_role_granted' AND new_value = target_email
  ) THEN
    RAISE EXCEPTION 'Verify failed: no admin_audit_log record for granting % the admin role', target_email;
  END IF;
END $$;

COMMIT;
