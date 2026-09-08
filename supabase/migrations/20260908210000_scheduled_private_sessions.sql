-- Private lessons could only ever be recorded AFTER they happened. The outcome
-- check constraint was:
--
--   CHECK ( (outcome='attended'            AND counted)
--        OR (outcome='cancelled_no_charge' AND NOT counted) )
--
-- There was no state for a lesson that has not happened yet, so student_class_sessions
-- held 47 rows, every one of them in the past. Consequences:
--
--   * the teacher's forward schedule lived only in Google Calendar; the database
--     did not know she had a lesson tomorrow;
--   * "classes remaining" on a bundle was correct only while every single lesson
--     was logged by hand, and silently stale the moment one was missed;
--   * nothing could warn that a lesson had passed unrecorded, because an
--     unrecorded lesson left no row at all.
--
-- This migration:
--   1. adds a third outcome, 'scheduled', which never counts against a bundle;
--   2. adds fn_generate_scheduled_sessions() to materialise upcoming lessons from
--      the weekly rules already in teacher_student_classes;
--   3. adds fn_alert_unconfirmed_sessions() so a lesson whose date has passed
--      without being confirmed raises an admin notification instead of vanishing;
--   4. schedules both.
--
-- Cancellation policy (owner decision, 8 Sep 2026): a cancelled lesson is not
-- counted, so the generator simply schedules one more week. The bundle stretches
-- rather than shrinking — the student keeps the number of lessons they paid for.
--
-- Sends no email. The customer email freeze of 7 Sep is untouched.

begin;

-- 1. the missing state ------------------------------------------------------

alter table public.student_class_sessions
  drop constraint if exists student_class_sessions_outcome_check;

alter table public.student_class_sessions
  add constraint student_class_sessions_outcome_check
  check (
       (outcome = 'attended'            and counted)
    or (outcome = 'cancelled_no_charge' and not counted)
    or (outcome = 'scheduled'           and not counted)
  );

-- A scheduled lesson has not been confirmed by anyone yet, so confirmed_at must
-- be allowed to be empty. Existing rows keep the value they have.
alter table public.student_class_sessions
  alter column confirmed_at drop not null;

-- Supports both the generator's "does this slot already exist" test and the
-- unconfirmed-lesson alert.
create index if not exists idx_student_class_sessions_outcome_date
  on public.student_class_sessions (outcome, session_date);

-- 2. materialise the forward schedule --------------------------------------

create or replace function public.fn_generate_scheduled_sessions(p_horizon_days integer default 56)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
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
    cross join lateral generate_series(current_date + 1,
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
$$;

comment on function public.fn_generate_scheduled_sessions(integer) is
  'Materialises upcoming private lessons from teacher_student_classes as outcome=scheduled, '
  'bounded by what remains on each student''s active bundle. Idempotent: re-running inserts nothing new.';

revoke all on function public.fn_generate_scheduled_sessions(integer) from public, anon, authenticated;

-- 3. a lesson must never pass unrecorded ------------------------------------

create or replace function public.fn_alert_unconfirmed_sessions()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.student_class_sessions
  where outcome = 'scheduled'
    and session_date < current_date;

  if v_count = 0 then
    return 0;
  end if;

  -- one notification per day at most, so a backlog does not become a wall of alerts
  if exists (
    select 1 from public.admin_notifications
    where type = 'sessions_unconfirmed'
      and created_at > now() - interval '24 hours'
  ) then
    return v_count;
  end if;

  insert into public.admin_notifications (type, message)
  values (
    'sessions_unconfirmed',
    v_count || ' private lesson(s) have passed without being marked attended or cancelled. '
      || 'Until they are confirmed, the classes-remaining figure on those bundles is too high.'
  );

  return v_count;
end;
$$;

revoke all on function public.fn_alert_unconfirmed_sessions() from public, anon, authenticated;

-- 4. schedule ---------------------------------------------------------------
-- Neither job sends email; both are safe under the 7 Sep customer-email freeze.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'generate-scheduled-sessions') then
    perform cron.unschedule('generate-scheduled-sessions');
  end if;
  perform cron.schedule(
    'generate-scheduled-sessions',
    '0 2 * * 1',
    $job$select public.fn_generate_scheduled_sessions(56);$job$
  );

  if exists (select 1 from cron.job where jobname = 'alert-unconfirmed-sessions') then
    perform cron.unschedule('alert-unconfirmed-sessions');
  end if;
  perform cron.schedule(
    'alert-unconfirmed-sessions',
    '0 6 * * *',
    $job$select public.fn_alert_unconfirmed_sessions();$job$
  );
end
$$;

-- 5. first fill -------------------------------------------------------------
-- Expected on the data as of 8 Sep 2026: 14 rows —
-- Solafa 6, Mariam 3, Namy 2, Rynad 2, Menna 1 — which is exactly each bundle's
-- remaining count, so no bundle is over- or under-filled.
select public.fn_generate_scheduled_sessions(56);

commit;
