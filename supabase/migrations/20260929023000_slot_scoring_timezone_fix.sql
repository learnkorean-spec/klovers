-- Fix: Phase 1's LOCKED-conflict check compared clock times across
-- timezones without converting them (Re caught this by eye — a Sunday
-- private lesson with Renad, recorded in `teacher_availability_rules`
-- (kind='blocked') in Asia/Bangkok, was NOT being excluded from candidate
-- group/private times, which are generated in Africa/Cairo).
--
-- Root cause: `teacher_availability_rules` (kind='blocked') and
-- `teacher_student_classes` are BOTH stored in Asia/Bangkok (the teacher's
-- own clock) — confirmed live: `select distinct timezone from
-- teacher_availability_rules where kind='blocked'` and same for
-- `teacher_student_classes` both return only 'Asia/Bangkok'. The two
-- LOCKED checks in fn_suggest_group_slots/fn_private_slot_options compared
-- `to_char(tsc.start_time,'HH24:MI') = c.c_start` and a raw
-- `c.c_start::time between r.start_time and r.end_time` directly against
-- v_tz='Africa/Cairo' candidates — no zone conversion at all. Currently
-- Bangkok is 4h ahead of Cairo (5h after Egypt leaves DST on 30 Oct), so
-- a block recorded as "Sunday 22:00-23:30 Bangkok" (Renad) needed to be
-- checked against "Sunday 18:00-19:30 Cairo" (today) and was not.
--
-- schedule_packages is untouched by this fix — it's already stored in
-- Africa/Cairo (= v_tz), so that comparison was already correct.
--
-- Fix: generate real instants (not just weekday+HH:MM text) for the
-- blocked windows and the private-class ranges, the same way the
-- candidate availability windows already are (`dated`/`bounds` below),
-- and compare candidates to them as real overlapping time ranges instead
-- of same-timezone text.

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
    select
           extract(dow from g)::int as c_dow,
           to_char(g, 'HH24:MI')    as c_start,
           min(g)                   as c_instant
      from bounds b
      cross join lateral generate_series(b.lo, b.hi - (v_dur || ' min')::interval, (v_step || ' min')::interval) g
     group by 1, 2
  ),
  -- Blocked windows and running private classes are the teacher's own
  -- (Asia/Bangkok) clock — convert each to a real instant range before
  -- comparing to a candidate, exactly like `bounds` above does for
  -- availability rules.
  blocked_dated as (
    select r.*, (current_date + ((r.weekday - extract(dow from current_date)::int + 7) % 7)) as d
      from public.teacher_availability_rules r
     where r.kind = 'blocked' and r.end_time > r.start_time
       and (r.effective_from is null or r.effective_from <= current_date)
       and (r.effective_to   is null or r.effective_to   >= current_date)
  ),
  blocked_ranges as (
    select ((bd.d + bd.start_time) at time zone bd.timezone at time zone v_tz) as lo,
           ((bd.d + bd.end_time)   at time zone bd.timezone at time zone v_tz) as hi
      from blocked_dated bd
  ),
  private_dated as (
    select tsc.*, (current_date + ((tsc.weekday - extract(dow from current_date)::int + 7) % 7)) as d
      from public.teacher_student_classes tsc
     where (tsc.effective_from is null or tsc.effective_from <= current_date)
       and (tsc.effective_to   is null or tsc.effective_to   >= current_date)
  ),
  private_ranges as (
    select ((pd.d + pd.start_time) at time zone pd.timezone at time zone v_tz) as lo,
           ((pd.d + pd.start_time) at time zone pd.timezone at time zone v_tz)
             + (coalesce(pd.duration_minutes, 60) || ' min')::interval as hi
      from private_dated pd
  ),
  locked as (
    select c.c_dow, c.c_start
      from candidates c
     where exists (select 1 from blocked_ranges br where c.c_instant >= br.lo and c.c_instant < br.hi)
        or exists (select 1 from private_ranges pr where c.c_instant >= pr.lo and c.c_instant < pr.hi)
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
  'from real matching_slots demand + teacher_availability_rules. LOCKED '
  'conflicts (blocked windows, running private classes) are converted to '
  'real instants before comparison — fixed 29 Sep 2026 after a Bangkok- '
  'timezone private lesson was not being excluded.';

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
    select
           extract(dow from g)::int as c_dow,
           to_char(g, 'HH24:MI')    as c_start,
           min(g)                   as c_instant
      from bounds b
      cross join lateral generate_series(b.lo, b.hi - (v_dur || ' min')::interval, (v_step || ' min')::interval) g
     group by 1, 2
  ),
  blocked_dated as (
    select r.*, (current_date + ((r.weekday - extract(dow from current_date)::int + 7) % 7)) as d
      from public.teacher_availability_rules r
     where r.kind = 'blocked' and r.end_time > r.start_time
       and (r.effective_from is null or r.effective_from <= current_date)
       and (r.effective_to   is null or r.effective_to   >= current_date)
  ),
  blocked_ranges as (
    select ((bd.d + bd.start_time) at time zone bd.timezone at time zone v_tz) as lo,
           ((bd.d + bd.end_time)   at time zone bd.timezone at time zone v_tz) as hi
      from blocked_dated bd
  ),
  private_dated as (
    select tsc.*, (current_date + ((tsc.weekday - extract(dow from current_date)::int + 7) % 7)) as d
      from public.teacher_student_classes tsc
     where (tsc.effective_from is null or tsc.effective_from <= current_date)
       and (tsc.effective_to   is null or tsc.effective_to   >= current_date)
  ),
  private_ranges as (
    select ((pd.d + pd.start_time) at time zone pd.timezone at time zone v_tz) as lo,
           ((pd.d + pd.start_time) at time zone pd.timezone at time zone v_tz)
             + (coalesce(pd.duration_minutes, 60) || ' min')::interval as hi
      from private_dated pd
  ),
  locked as (
    select c.c_dow, c.c_start
      from candidates c
     where exists (select 1 from blocked_ranges br where c.c_instant >= br.lo and c.c_instant < br.hi)
        or exists (select 1 from private_ranges pr where c.c_instant >= pr.lo and c.c_instant < pr.hi)
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
  'first. LOCKED conflicts (blocked windows, running private classes) are '
  'converted to real instants before comparison — fixed 29 Sep 2026 after '
  'a Bangkok-timezone private lesson was not being excluded.';
