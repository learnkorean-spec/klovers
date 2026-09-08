-- ============================================================================
-- get_session_roster() -- an ungated SECURITY DEFINER read of auth.users.email
--
-- Found while auditing the other surfaces for the leaderboard email leak
-- (P0-1, see 20260908160000_leaderboard_display_name_privacy.sql).
--
-- WHAT IT IS
-- ----------
-- Measured against production on 2026-09-08:
--
--   proname             get_session_roster(uuid)
--   returns             user_id, full_name, EMAIL, attendance_status, ...
--   security            DEFINER          -- runs as owner, RLS does not apply
--   acl                 authenticated=X  -- any signed-in user may call it
--   role check in body  NONE
--
-- So any signed-in student who holds a session id gets the name and email
-- address of every active member of that session. A student is a member of
-- her own group's sessions, so obtaining an id is not the hard part.
--
-- WHY IT HAS NOT BURNED YET
-- -------------------------
-- Only by accident. The body also selects `p.full_name`, and there is no
-- `full_name` column on public.profiles -- it is `name`. Verified directly:
--
--   select * from public.get_session_roster('00000000-...-000000000000');
--   ERROR: 42703: column p.full_name does not exist
--
-- Every call has thrown since the function shipped on 2026-03-20 in
-- 20260320040000_session_management.sql. The same wrong column name is the
-- bug CommunityFeed.tsx documents in its header comment.
--
-- ⚠️ THIS IS WHY THE COLUMN FIX AND THE GUARD ARE ONE COMMIT.
-- `p.full_name` -> `p.name` looks like a trivial one-line typo fix and is
-- the change anyone debugging the admin attendance screen would reach for
-- first. On its own it would take a function that throws for everybody and
-- turn it into a working, ungated, authenticated-readable dump of student
-- email addresses. Do not split this migration.
--
-- WHY ADMIN-ONLY IS THE RIGHT GUARD
-- ---------------------------------
-- Every caller was checked before the guard was written. The only reference
-- in the repository is src/components/admin/SessionAttendanceManager.tsx --
-- the admin attendance screen -- plus the generated types file. Nothing on a
-- student path calls it, so admin-only breaks nothing.
--
-- This is the sibling of save_session_attendance() from the same 2026-03-20
-- migration, used by the same screen, which was given exactly this guard in
-- 20260902200000_rpc_authorization_gaps.sql. That sweep read the RPC and
-- fixed the write; this is the read it left behind.
--
-- SIDE EFFECT, STATED PLAINLY: this migration makes the admin attendance
-- roster work for the first time. It has been failing silently for an admin
-- opening that screen for five and a half months.
-- ============================================================================

begin;

create or replace function public.get_session_roster(p_session_id uuid)
returns table (
  user_id           uuid,
  full_name         text,
  email             text,
  attendance_status text,
  admin_approved    boolean
)
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
begin
  -- The guard, before anything reads auth.users.
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not_authorised: get_session_roster requires the admin role'
      using errcode = '42501';
  end if;

  return query
  select
    pgm.user_id,
    -- was: coalesce(p.full_name, u.email) -- profiles.full_name does not exist.
    -- nullif(trim(...)) matters because handle_new_user() writes '' into name
    -- when the signup form sends no full_name, and '' is not null -- without
    -- it the email fallback would never fire for those rows and the roster
    -- would show a blank where a person should be.
    coalesce(nullif(trim(p.name), ''), u.email) as full_name,
    u.email,
    coalesce(pa.status, 'unmarked')             as attendance_status,
    coalesce(pa.admin_approved, false)          as admin_approved
  from public.pkg_group_sessions pgs
  join public.pkg_group_members pgm on pgm.group_id = pgs.group_id
  join auth.users u                 on u.id = pgm.user_id
  left join public.profiles p       on p.user_id = pgm.user_id
  left join public.pkg_attendance pa on pa.session_id = pgs.id
                                    and pa.user_id = pgm.user_id
  where pgs.id = p_session_id
    and pgm.member_status = 'active'
  order by coalesce(nullif(trim(p.name), ''), u.email);
end;
$function$;

-- CREATE OR REPLACE does not reset a function's ACL, and this project's
-- pg_default_acl grants EXECUTE on public functions to anon and
-- authenticated, so the grants are restated rather than assumed. See
-- 20260902200000_rpc_authorization_gaps.sql.
--
-- `authenticated` is kept deliberately: the admin screen calls this with an
-- ordinary signed-in session that happens to hold the admin role, so the
-- role check inside the body -- not the grant -- is what does the work here.
revoke all on function public.get_session_roster(uuid) from public, anon;
grant execute on function public.get_session_roster(uuid) to authenticated;

comment on function public.get_session_roster(uuid) is
  'Admin-only session roster for the attendance screen. Returns student email addresses, so the admin role check in the body is load-bearing -- do not remove it, and do not widen the grant.';

commit;

-- ============================================================================
-- VERIFY AFTER APPLY
--
-- 1. As a non-admin signed-in user, this must raise 42501:
--      select * from public.get_session_roster('<any real session id>');
--
-- 2. As an admin, it must return one row per active member and no error:
--      select count(*) from public.get_session_roster('<any real session id>');
--
-- 3. The admin attendance screen (SessionAttendanceManager) should list
--    students for the first time. If a row shows an email in the name
--    column, that student's profiles.name is empty -- that is the intended
--    fallback on an admin-only screen, not a leak.
-- ============================================================================
