-- How many active students each class package already has, as a COUNT only.
--
-- /enroll-now ranks the days it offers by real demand and shows seats left,
-- both computed in the browser from pkg_group_members. But that table's RLS
-- lets a student read only her OWN membership row ("Users can view own
-- pkg_group_members"), and lets a logged-out visitor read nothing at all
-- (pkg_groups is authenticated-only too). So for everyone except an admin the
-- count came back 0 or 1: every slot looked empty, the "most popular day
-- first" ordering never happened, and seats-left always showed full capacity.
-- Flagged as open in the 18 Oct audit ("anon demand-ranking gap"); the
-- logged-in half of it was not noticed then.
--
-- The policies are right as they are: who is in which group is private. What
-- the page needs is not the rows but one number per package, so that is all
-- this returns. SECURITY DEFINER so the count is taken past RLS; no user id,
-- group id or name leaves the function.
--
-- New object. Nothing existing is altered.

create or replace function public.enroll_package_demand(p_package_ids uuid[])
returns table (package_id uuid, active_members integer)
language sql
stable
security definer
set search_path to 'public'
as $$
  select g.package_id, count(m.user_id)::integer
  from public.pkg_groups g
  left join public.pkg_group_members m
    on m.group_id = g.id and m.member_status = 'active'
  where g.is_active
    and g.package_id = any (p_package_ids)
    -- A page asks about one level's packages, a handful. Anything larger is
    -- not this page asking.
    and coalesce(cardinality(p_package_ids), 0) <= 200
  group by g.package_id;
$$;

revoke all on function public.enroll_package_demand(uuid[]) from public;
grant execute on function public.enroll_package_demand(uuid[]) to anon, authenticated, service_role;
