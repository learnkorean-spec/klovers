-- Lifecycle funnel: count private (1-to-1) students too.
--
-- The funnel cards read admin_student_overview, whose derived_status is
-- computed only from `enrollments` -- the online group-enrolment flow.
-- Students who enrolled by contacting the school directly are recorded in
-- `teacher_students` and never appear there, so Enrolled/Active read 2 while
-- six people were actually studying.
--
-- admin_student_overview is deliberately NOT changed: the students table,
-- the billing tiles and the payment screens all depend on its exact
-- semantics (amount_due, remaining_balance, LOCKED). This adds a
-- funnel-only layer on top of it instead.
--
--   * a registered profile whose only record is a private one reads ACTIVE
--     instead of LEAD
--   * an active private student with no platform account at all is added as
--     a row of its own, so those students are not silently dropped
--
-- Matching is by user_id with a case-insensitive email fallback, which is
-- how the teacher_students rows were linked by hand.

create or replace view public.admin_funnel_overview
with (security_invoker = true) as
  select
    o.user_id,
    o.email,
    o.name,
    case
      when o.derived_status = 'LEAD' and exists (
        select 1
        from public.teacher_students ts
        where ts.status = 'active'
          and (
            ts.user_id = o.user_id
            or lower(ts.email) = lower(o.email)
          )
      ) then 'ACTIVE'
      else o.derived_status
    end as derived_status,
    false as private_only
  from public.admin_student_overview o

  union all

  select
    null::uuid   as user_id,
    ts.email,
    ts.full_name as name,
    'ACTIVE'     as derived_status,
    true         as private_only
  from public.teacher_students ts
  where ts.status = 'active'
    and not exists (
      select 1
      from public.profiles p
      where p.user_id = ts.user_id
         or lower(p.email) = lower(ts.email)
    );

comment on view public.admin_funnel_overview is
  'Lifecycle-funnel population: admin_student_overview plus active private students from teacher_students. Read by useFunnelCounts.';

grant select on public.admin_funnel_overview to authenticated;
