-- The weekly session generator skipped today's class.
--
-- fn_generate_scheduled_sessions built its candidate dates from
--   generate_series(current_date + 1, current_date + p_horizon_days, '1 day')
-- so the day the job runs was never a candidate. The job runs Mondays at
-- 02:00 UTC (05:00 Cairo), which means every Monday class was skipped by the
-- very run that was supposed to put it on the calendar.
--
-- Solafa (Mon/Tue/Wed/Thu 21:00 Bangkok) is the case that surfaced it: on
-- Monday 21 Sep 2026 at 05:00 Cairo the generator had one lesson of her
-- 16-lesson bundle left to place. It skipped Monday 21 and placed Tuesday 22.
-- Monday's class then had no row at all to confirm, and the only row on the
-- screen was Tuesday's -- a class that had not happened yet.
--
-- The horizon now starts today. Everything else is unchanged: the quota
-- arithmetic, the effective_from/effective_to window, the "never double-book
-- a slot that already has a row" guard and the unique-key conflict clause all
-- keep today from being inserted twice.

create or replace function public.fn_generate_scheduled_sessions(p_horizon_days integer default 56)
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_inserted integer := 0;
begin
  if p_horizon_days is null or p_horizon_days < 1 or p_horizon_days > 366 then
    raise exception 'p_horizon_days must be between 1 and 366, got %', p_horizon_days;
  end if;

  with active_bundle as (
    -- one active bundle per active student; the oldest coverage runs first
    select distinct on (b.student_id)
           b.id as bundle_id, b.student_id, b.total_classes
    from public.student_bundles b
    join public.teacher_students ts on ts.id = b.student_id
    where b.status = 'active'
      and ts.status = 'active'
    order by b.student_id, b.coverage_start asc nulls last, b.created_at asc
  ),
  quota as (
    -- how many lessons of this bundle are neither used nor already on the calendar
    select ab.bundle_id,
           ab.student_id,
           ab.total_classes
             - count(s.id) filter (where s.counted)
             - count(s.id) filter (where s.outcome = 'scheduled'
                                     and s.session_date >= current_date) as slots_to_fill
    from active_bundle ab
    left join public.student_class_sessions s on s.bundle_id = ab.bundle_id
    group by ab.bundle_id, ab.student_id, ab.total_classes
  ),
  candidates as (
    select q.bundle_id,
           q.student_id,
           q.slots_to_fill,
           c.id as class_id,
           c.start_time,
           g.d::date as session_date,
           row_number() over (partition by q.student_id order by g.d, c.start_time) as rn
    from quota q
    join public.teacher_student_classes c on c.student_id = q.student_id
    -- starts today, not tomorrow: a class happening today belongs on the
    -- calendar, otherwise there is no row to confirm it against.
    cross join lateral generate_series(current_date,
                                       current_date + p_horizon_days,
                                       interval '1 day') g(d)
    where q.slots_to_fill > 0
      and extract(dow from g.d)::int = c.weekday
      and (c.effective_from is null or g.d::date >= c.effective_from)
      and (c.effective_to   is null or g.d::date <= c.effective_to)
      -- never double-book a slot that already has a row of any outcome
      and not exists (
        select 1
        from public.student_class_sessions x
        where x.student_id  = q.student_id
          and x.session_date = g.d::date
          and x.start_time   = c.start_time
      )
  )
  insert into public.student_class_sessions
    (student_id, bundle_id, class_id, session_date, start_time,
     outcome, counted, confirmed_at, entry_source)
  select student_id, bundle_id, class_id, session_date, start_time,
         'scheduled', false, null, 'schedule'
  from candidates
  where rn <= slots_to_fill
  on conflict (student_id, session_date, start_time) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$function$;
