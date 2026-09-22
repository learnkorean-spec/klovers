-- A used-up bundle blocked the new one behind it.
--
-- fn_generate_scheduled_sessions picked the student's bundle first and asked
-- how much was left on it second:
--
--   select distinct on (b.student_id) ...
--    where b.status = 'active' ...
--    order by b.student_id, b.coverage_start asc nulls last, b.created_at asc
--
-- so the OLDEST active bundle won, even when every credit on it had been
-- spent. Solafa's 16-lesson package is used up and still 'active'; adding a
-- second package for her would have scheduled nothing at all, because the
-- generator would keep choosing the finished one and computing zero slots.
--
-- The remedy was to remember to mark the old bundle 'completed' by hand,
-- every time, before adding the next one -- a rule nobody is told and the
-- screen does not enforce.
--
-- The choice is now made per bundle instead: compute what is left on each
-- active bundle, then take the oldest one that still has credit. A used-up
-- bundle drops out of the running on its own. Where a student has exactly one
-- active bundle -- which is every case today -- the behaviour is unchanged.

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

  with bundle_usage as (
    -- every active bundle of every active student, with what is left on it
    select b.id as bundle_id, b.student_id, b.coverage_start, b.created_at,
           b.total_classes
             - count(s.id) filter (where s.counted)
             - count(s.id) filter (where s.outcome = 'scheduled'
                                     and s.session_date >= current_date) as slots_to_fill
    from public.student_bundles b
    join public.teacher_students ts on ts.id = b.student_id
    left join public.student_class_sessions s on s.bundle_id = b.id
    where b.status = 'active'
      and ts.status = 'active'
    group by b.id, b.student_id, b.coverage_start, b.created_at
  ),
  quota as (
    -- the oldest active bundle that still has credit on it. A used-up bundle
    -- no longer blocks the new one behind it.
    select distinct on (student_id)
           bundle_id, student_id, slots_to_fill
    from bundle_usage
    where slots_to_fill > 0
    order by student_id, coverage_start asc nulls last, created_at asc
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
    where extract(dow from g.d)::int = c.weekday
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
