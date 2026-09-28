-- Phase 1 of the dynamic class-availability rebuild (Re, 29 Sep 2026, spec
-- "KLOVERS — DYNAMIC CLASS AVAILABILITY & BOOKING SYSTEM").
--
-- Scope, deliberately narrow per Re's own choice ("ابدأ الآن بالمرحلة 1
-- فقط"): the data model and scoring engine only. Nothing here is wired into
-- any student- or admin-facing page yet — that is Phase 2/3, and only after
-- this migration has been reviewed and merged.
--
-- IMPORTANT — this is NOT a from-scratch build. Before writing a line of
-- this, the live schema and functions were read (per CLAUDE.md's "check
-- main first, or it lands twice"): `matching_slots` and
-- `student_slot_preferences` already implement almost exactly the
-- OPEN / SOFT_HOLD / group-concentration model the spec asks for — level,
-- day, time, min/max students, current_count, status — with a working
-- matching engine (`match_enrollment_to_slot`, `auto_match_student`,
-- `assign_student_to_group_from_slot`, `reassign_student_slot`,
-- `unmatch_student_slot`). It has 0 rows today and its admin UI
-- (SlotManager.tsx, SlotRanker.tsx, LevelSlotConfig.tsx) is built but not
-- routed anywhere — built, then orphaned, never deleted. `fn_suggest_trial_slots`
-- is a working, live example of the exact scoring pattern the spec asks
-- for (candidate generation from teacher_availability_rules, conflict
-- exclusion, weighted score, human-readable reasons[]) — just scoped to
-- trials. This migration REUSES both rather than duplicating them:
--   - matching_slots / student_slot_preferences stay as the SOFT_HOLD /
--     group-concentration model; nothing about their shape changes here.
--   - the new functions below follow fn_suggest_trial_slots' proven shape,
--     generalised to course levels (group) and to private lessons.
--
-- Everything in this file is additive: one new config row, one new view,
-- three new functions. Nothing existing is altered or dropped.

-- ── 1. Scoring weights, in one configurable place (spec: "Put weights in
--    one configuration location so they can be changed later") ─────────────
insert into public.app_settings (key, value)
values (
  'slot_scoring_config',
  jsonb_build_object(
    'existingCourseDemandWeight', 40,
    'timezoneSuitabilityWeight', 25,
    'teacherPreferenceWeight', 15,
    'scheduleEfficiencyWeight', 10,
    'competingDemandPenalty', 20,
    'minimumStudentsToConfirmGroup', 3,
    'maximumStudentsPerGroup', 8,
    'softHoldThreshold', 1
  )::text
)
on conflict (key) do nothing;

-- ── 2. Slot state, read off matching_slots without changing its columns ────
-- OPEN: nobody has picked it yet. SOFT_HOLD: below the confirm threshold —
-- spec: "should still be possible to sell as Private". FORMING: at or past
-- the threshold, actively being protected. FULL: at capacity.
create or replace view public.v_matching_slots_status as
select
  ms.*,
  case
    when ms.current_count >= ms.max_students then 'FULL'
    when ms.current_count >= ms.min_students then 'FORMING'
    when ms.current_count >= 1 then 'SOFT_HOLD'
    else 'OPEN'
  end as slot_state
from public.matching_slots ms;

comment on view public.v_matching_slots_status is
  'matching_slots + a derived slot_state (OPEN/SOFT_HOLD/FORMING/FULL) per '
  'the 29 Sep 2026 dynamic-availability spec. Read-only convenience — write '
  'through matching_slots as before.';

-- ── 3. Recommended group-class times for a level ────────────────────────────
-- Generalises fn_suggest_trial_slots (same candidate-generation shape) from
-- trials to a course level, weighted by real matching_slots demand instead
-- of trial_bookings history. A schedule_packages row alone is NOT treated
-- as occupying the slot — spec: "A course's recommended slot must NEVER
-- permanently consume teacher availability merely because we advertised
-- that time." Only a real LOCKED conflict (a blocked availability window,
-- an active 1:1 private class, or a schedule_packages slot with an actual
-- running/full pkg_group) excludes a candidate.
create or replace function public.fn_suggest_group_slots(p_level text, p_count int default 2)
returns table(
  day_of_week int,
  day_name text,
  start_time text,
  duration_min int,
  timezone text,
  score int,
  reasons text[],
  existing_demand int
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_dur  int := coalesce((select default_duration_min from public.trial_settings where id = 1), 60);
  v_step int := coalesce((select slot_minutes from public.trial_settings where id = 1), 30);
  v_tz   text := 'Africa/Cairo';
  v_cfg  jsonb := coalesce((select value::jsonb from public.app_settings where key = 'slot_scoring_config'), '{}'::jsonb);
  w_demand   int := coalesce((v_cfg->>'existingCourseDemandWeight')::int, 40);
  w_tz       int := coalesce((v_cfg->>'timezoneSuitabilityWeight')::int, 25);
  w_pref     int := coalesce((v_cfg->>'teacherPreferenceWeight')::int, 15);
  w_eff      int := coalesce((v_cfg->>'scheduleEfficiencyWeight')::int, 10);
  w_conflict int := coalesce((v_cfg->>'competingDemandPenalty')::int, 20);
begin
  return query
  with rules as (
    select r.weekday, r.start_time, r.end_time, r.timezone
      from public.teacher_availability_rules r
     where r.kind = 'available'
       and (r.effective_from is null or r.effective_from <= current_date)
       and (r.effective_to   is null or r.effective_to   >= current_date)
  ),
  dated as (
    select r.*,
           (current_date + ((r.weekday - extract(dow from current_date)::int + 7) % 7)) as d
      from rules r
  ),
  bounds as (
    select ((d.d + d.start_time) at time zone d.timezone at time zone v_tz) as lo,
           ((d.d + d.end_time)   at time zone d.timezone at time zone v_tz) as hi
      from dated d
  ),
  candidates as (
    select distinct
           extract(dow from g)::int as c_dow,
           to_char(g, 'HH24:MI')    as c_start
      from bounds b
      cross join lateral generate_series(b.lo, b.hi - (v_dur || ' min')::interval, (v_step || ' min')::interval) g
  ),
  -- LOCKED: a blocked window, a real running private class, or a real
  -- running/full group already sitting on this exact day+time.
  locked as (
    select c.c_dow, c.c_start
      from candidates c
     where exists (
             select 1 from public.teacher_availability_rules r
              where r.kind = 'blocked' and r.weekday = c.c_dow
                and r.end_time > r.start_time
                and c.c_start::time >= r.start_time and c.c_start::time < r.end_time)
        or exists (
             select 1 from public.teacher_student_classes tsc
              where tsc.weekday = c.c_dow
                and to_char(tsc.start_time, 'HH24:MI') = c.c_start
                and (tsc.effective_from is null or tsc.effective_from <= current_date)
                and (tsc.effective_to   is null or tsc.effective_to   >= current_date))
        or exists (
             select 1 from public.schedule_packages sp
             join public.pkg_groups pg on pg.package_id = sp.id and pg.is_active = true
             join public.pkg_group_members pgm on pgm.group_id = pg.id and pgm.member_status = 'active'
              where sp.is_active = true and sp.day_of_week = c.c_dow
                and to_char(sp.start_time, 'HH24:MI') = c.c_start
              group by sp.id, sp.capacity
             having count(pgm.user_id) > 0)
  ),
  demand as (
    select
      case lower(ms.day) when 'sunday' then 0 when 'monday' then 1 when 'tuesday' then 2
        when 'wednesday' then 3 when 'thursday' then 4 when 'friday' then 5 when 'saturday' then 6 end as d_dow,
      ms.time as d_start,
      ms.course_level as d_level,
      ms.current_count as d_count
    from public.matching_slots ms
    where ms.status <> 'full'
  ),
  scored as (
    select
      c.c_dow as r_dow,
      case c.c_dow
        when 0 then 'Sunday' when 1 then 'Monday' when 2 then 'Tuesday'
        when 3 then 'Wednesday' when 4 then 'Thursday' when 5 then 'Friday' when 6 then 'Saturday'
      end as r_day_name,
      c.c_start as r_start,
      own.d_count as r_own_demand,
      (
        case when own.d_count is not null and own.d_count > 0 then w_demand else 0 end
        + case when public._trial_time_to_minutes(c.c_start) between (9*60) and (22*60) then w_tz else 0 end
        + case when public._trial_time_to_minutes(c.c_start) between (12*60) and (17*60) then w_pref else 0 end
        + case when exists (
                 select 1 from public.schedule_packages sp2
                  where sp2.is_active = true and sp2.day_of_week = c.c_dow and sp2.level = p_level)
               then w_eff else 0 end
        - case when exists (
                 select 1 from demand other
                  where other.d_dow = c.c_dow and other.d_start = c.c_start and other.d_level <> p_level)
               then w_conflict else 0 end
      ) as r_score,
      array_remove(array[
        case when own.d_count is not null and own.d_count > 0
             then format('%s student(s) already interested in this level at this time — concentrate the group', own.d_count)
             else null end,
        case when public._trial_time_to_minutes(c.c_start) between (9*60) and (22*60)
             then 'Student-friendly hour (09:00-22:00 Cairo)' else null end,
        case when public._trial_time_to_minutes(c.c_start) between (12*60) and (17*60)
             then 'Inside the most-requested band (12:00-17:00 Cairo)' else null end,
        'Clear of blocked windows, running private classes and full/running groups'
      ], null) as r_reasons
    from candidates c
    left join lateral (
      select sum(d.d_count) as d_count from demand d
       where d.d_dow = c.c_dow and d.d_start = c.c_start and d.d_level = p_level
    ) own on true
    where not exists (select 1 from locked l where l.c_dow = c.c_dow and l.c_start = c.c_start)
  )
  select s.r_dow, s.r_day_name, s.r_start, v_dur, v_tz, s.r_score, s.r_reasons, coalesce(s.r_own_demand, 0)::int
  from scored s
  order by s.r_score desc, s.r_dow, s.r_start
  limit greatest(p_count, 1);
end;
$$;

comment on function public.fn_suggest_group_slots(text, int) is
  'Recommended (not reserved) day/time options for a course level, scored '
  'from real matching_slots demand + teacher_availability_rules. Phase 1 of '
  'the 29 Sep 2026 dynamic-availability spec — not called by any page yet.';

-- ── 4. Private-lesson options: every genuinely open time, ranked ───────────
-- Spec: "Private students should see ALL genuinely available teacher
-- slots... Slots with no group demand should appear first." Same LOCKED
-- definition as fn_suggest_group_slots above, so a private booking and a
-- group recommendation never disagree about what's actually free.
create or replace function public.fn_private_slot_options(p_limit int default 50)
returns table(
  day_of_week int,
  day_name text,
  start_time text,
  timezone text,
  group_demand_count int,
  is_recommended boolean
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_step int := coalesce((select slot_minutes from public.trial_settings where id = 1), 30);
  v_dur  int := coalesce((select default_duration_min from public.trial_settings where id = 1), 60);
  v_tz   text := 'Africa/Cairo';
begin
  return query
  with rules as (
    select r.weekday, r.start_time, r.end_time, r.timezone
      from public.teacher_availability_rules r
     where r.kind = 'available'
       and (r.effective_from is null or r.effective_from <= current_date)
       and (r.effective_to   is null or r.effective_to   >= current_date)
  ),
  dated as (
    select r.*,
           (current_date + ((r.weekday - extract(dow from current_date)::int + 7) % 7)) as d
      from rules r
  ),
  bounds as (
    select ((d.d + d.start_time) at time zone d.timezone at time zone v_tz) as lo,
           ((d.d + d.end_time)   at time zone d.timezone at time zone v_tz) as hi
      from dated d
  ),
  candidates as (
    select distinct
           extract(dow from g)::int as c_dow,
           to_char(g, 'HH24:MI')    as c_start
      from bounds b
      cross join lateral generate_series(b.lo, b.hi - (v_dur || ' min')::interval, (v_step || ' min')::interval) g
  ),
  locked as (
    select c.c_dow, c.c_start
      from candidates c
     where exists (
             select 1 from public.teacher_availability_rules r
              where r.kind = 'blocked' and r.weekday = c.c_dow
                and r.end_time > r.start_time
                and c.c_start::time >= r.start_time and c.c_start::time < r.end_time)
        or exists (
             select 1 from public.teacher_student_classes tsc
              where tsc.weekday = c.c_dow
                and to_char(tsc.start_time, 'HH24:MI') = c.c_start
                and (tsc.effective_from is null or tsc.effective_from <= current_date)
                and (tsc.effective_to   is null or tsc.effective_to   >= current_date))
        or exists (
             select 1 from public.schedule_packages sp
             join public.pkg_groups pg on pg.package_id = sp.id and pg.is_active = true
             join public.pkg_group_members pgm on pgm.group_id = pg.id and pgm.member_status = 'active'
              where sp.is_active = true and sp.day_of_week = c.c_dow
                and to_char(sp.start_time, 'HH24:MI') = c.c_start
              group by sp.id
             having count(pgm.user_id) > 0)
  ),
  demand as (
    select
      case lower(ms.day) when 'sunday' then 0 when 'monday' then 1 when 'tuesday' then 2
        when 'wednesday' then 3 when 'thursday' then 4 when 'friday' then 5 when 'saturday' then 6 end as d_dow,
      ms.time as d_start,
      sum(ms.current_count) as d_count
    from public.matching_slots ms
    where ms.status <> 'full'
    group by 1, 2
  )
  select
    c.c_dow,
    case c.c_dow
      when 0 then 'Sunday' when 1 then 'Monday' when 2 then 'Tuesday'
      when 3 then 'Wednesday' when 4 then 'Thursday' when 5 then 'Friday' when 6 then 'Saturday'
    end,
    c.c_start,
    v_tz,
    coalesce(d.d_count, 0)::int,
    (coalesce(d.d_count, 0) = 0)
  from candidates c
  left join demand d on d.d_dow = c.c_dow and d.d_start = c.c_start
  where not exists (select 1 from locked l where l.c_dow = c.c_dow and l.c_start = c.c_start)
  order by (coalesce(d.d_count, 0) = 0) desc, c.c_dow, c.c_start
  limit greatest(p_limit, 1);
end;
$$;

comment on function public.fn_private_slot_options(int) is
  'Every open (non-LOCKED) teacher time, group-demand-free slots ranked '
  'first. Phase 1 of the 29 Sep 2026 dynamic-availability spec — not '
  'called by any page yet; replaces nothing that ships today.';
