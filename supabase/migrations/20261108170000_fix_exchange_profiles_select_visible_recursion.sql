-- Fix: "infinite recursion detected in policy for relation
-- exchange_profiles", live in production and breaking the whole Language
-- Exchange feature (Discover, My Profile save, Matches all read
-- exchange_profiles).
--
-- Root cause: exchange_profiles_select_visible (added in
-- 20261104200000_exchange_safety_hardening.sql, the minor/adult age-band
-- safeguard) does:
--   (select p.age from public.exchange_profiles p where p.user_id = auth.uid())
-- inside its own USING clause -- a policy on exchange_profiles querying
-- exchange_profiles again. Postgres re-evaluates this same policy for that
-- inner query and detects the self-reference as infinite recursion.
--
-- Fix: move the viewer's-own-age lookup into a SECURITY DEFINER function.
-- Same pattern this file's own migrations already use for
-- exchange_handle_swipe() -- SECURITY DEFINER bypasses RLS for its internal
-- query, so the inner lookup no longer re-enters this policy at all.

create or replace function public.exchange_viewer_age(_uid uuid)
returns int
language sql
stable
security definer
set search_path to 'public'
as $$
  select age from public.exchange_profiles where user_id = _uid
$$;

revoke all on function public.exchange_viewer_age(uuid) from public;
revoke all on function public.exchange_viewer_age(uuid) from anon;
grant execute on function public.exchange_viewer_age(uuid) to authenticated;

drop policy if exists "exchange_profiles_select_visible" on public.exchange_profiles;
create policy "exchange_profiles_select_visible"
  on public.exchange_profiles for select to authenticated
  using (
    is_visible = true
    and not exists (
      select 1 from public.exchange_blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = exchange_profiles.user_id)
         or (b.blocked_id = (select auth.uid()) and b.blocker_id = exchange_profiles.user_id)
    )
    and (
      case
        when public.exchange_viewer_age((select auth.uid())) between 16 and 17
          then exchange_profiles.age between 16 and 17
        else exchange_profiles.age is null or exchange_profiles.age >= 18
      end
    )
  );

do $$
declare
  v_anon boolean;
begin
  select has_function_privilege('anon', 'public.exchange_viewer_age(uuid)', 'EXECUTE') into v_anon;
  if v_anon then
    raise exception 'exchange_viewer_age is still callable by anon';
  end if;
end $$;
