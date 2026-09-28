-- 29 Sep 2026 — dynamic group alternatives (spec: "Tuesday 19:00 must NOT be
-- permanently blocked ... if a Private student books it first, Private wins and
-- the engine finds the next best alternative").
--
-- NEW function only. Nothing existing is replaced (checked live: no function
-- named fn_locked_group_packages exists). Read-only, STABLE.
--
-- Returns the ids of ACTIVE, EMPTY (0 active members) group packages of a level
-- whose real time overlaps something that has priority over an empty group:
--   * a blocked window / private lesson (teacher_availability_rules kind='blocked',
--     teacher_student_classes) — both recorded in the teacher's own zone
--   * a running group of ANY other package that already has members
-- Every time is turned into a real instant (date + time AT TIME ZONE its own
-- zone) over the next 14 days, so Cairo-anchored packages and Bangkok-anchored
-- lessons compare correctly across the 30 Oct Egypt DST change — the same rule
-- fn_suggest_group_slots / fn_private_slot_options follow since PR #746.
-- A package that already has students is never returned: it can only be lost
-- by an admin, never by a booking.

create or replace function public.fn_locked_group_packages(p_level text)
returns table(package_id uuid)
language sql
stable
security definer
set search_path to 'public'
as $$
  with days as (
    select d::date as d from generate_series(current_date, current_date + 13, interval '1 day') d
  ),
  pk as (
    select sp.id, sp.level,
           (dy.d + sp.start_time) at time zone sp.timezone as lo,
           (dy.d + sp.start_time) at time zone sp.timezone
             + (coalesce(sp.duration_min, 60) || ' min')::interval as hi,
           (select count(*)
              from public.pkg_group_members m
              join public.pkg_groups g on g.id = m.group_id and g.is_active = true
             where g.package_id = sp.id and m.member_status = 'active') as n
      from public.schedule_packages sp
      join days dy on extract(dow from dy.d)::int = sp.day_of_week
     where sp.is_active = true and sp.course_type = 'group'
  ),
  blocked as (
    select (dy.d + r.start_time) at time zone r.timezone as lo,
           (dy.d + r.end_time)   at time zone r.timezone as hi
      from public.teacher_availability_rules r
      join days dy on extract(dow from dy.d)::int = r.weekday
     where r.kind = 'blocked' and r.end_time > r.start_time
       and (r.effective_from is null or r.effective_from <= dy.d)
       and (r.effective_to   is null or r.effective_to   >= dy.d)
  ),
  priv as (
    select (dy.d + t.start_time) at time zone t.timezone as lo,
           (dy.d + t.start_time) at time zone t.timezone
             + (coalesce(t.duration_minutes, 60) || ' min')::interval as hi
      from public.teacher_student_classes t
      join days dy on extract(dow from dy.d)::int = t.weekday
     where (t.effective_from is null or t.effective_from <= dy.d)
       and (t.effective_to   is null or t.effective_to   >= dy.d)
  )
  select distinct p.id
    from pk p
   where p.level = p_level
     and p.n = 0
     and (
          exists (select 1 from blocked b where p.lo < b.hi and b.lo < p.hi)
       or exists (select 1 from priv v    where p.lo < v.hi and v.lo < p.hi)
       or exists (select 1 from pk o
                   where o.id <> p.id and o.n > 0 and p.lo < o.hi and o.lo < p.hi)
     );
$$;

grant execute on function public.fn_locked_group_packages(text) to anon, authenticated;
