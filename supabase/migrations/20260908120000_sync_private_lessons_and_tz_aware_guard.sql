-- The teacher's private lessons were stored twice, in two clocks.
--
--   teacher_student_classes     the real record: student name, Asia/Bangkok
--   teacher_availability_rules  what the booking guard reads: no name, Africa/Cairo
--
-- Nothing kept them in step. Move a lesson in one table and the other keeps the
-- old hour silently, so the timetable shows one thing and the guard enforces
-- another. The Cairo copy was also a *converted* copy, frozen at the offset that
-- happened to apply when someone typed it: Bangkok is UTC+7 all year, Cairo is
-- UTC+3 now and UTC+2 from 30 October, so every one of those rows becomes an
-- hour wrong on that date with nothing to announce it.
--
-- Two changes, and both are needed — either alone leaves a live hole.
--
-- 1. The rules become a DERIVED MIRROR, kept by trigger, linked by id rather
--    than matched on time. Matching on time is what breaks the moment a time
--    changes, which is exactly when you need the link to hold.
--
-- 2. The guard learns to convert. It previously compared only rules whose
--    timezone was literally 'Africa/Cairo' and REPORTED the rest as
--    "not compared" — honest, but it meant a rule in the teacher's own clock
--    protected nothing. Now every rule is resolved to a real instant on a real
--    date and read back in Cairo, so the mirror can hold the source's own
--    timezone verbatim and stay correct across the October change by itself.

-- ── 1. the link ────────────────────────────────────────────────────────

alter table public.teacher_availability_rules
  add column if not exists student_class_id uuid
    references public.teacher_student_classes(id) on delete cascade;

comment on column public.teacher_availability_rules.student_class_id is
  'When set, this row is a derived mirror of that teacher_student_classes row and is maintained by trigger. Do not edit it by hand — edit the class.';

create unique index if not exists teacher_availability_rules_student_class_uk
  on public.teacher_availability_rules (student_class_id)
  where student_class_id is not null;

-- ── 2. the mirror ────────────────────────────────────────────────────

create or replace function public.sync_teacher_class_block()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_name text;
  v_end  time;
begin
  if tg_op = 'DELETE' then
    delete from public.teacher_availability_rules where student_class_id = old.id;
    return old;
  end if;

  select full_name into v_name from public.teacher_students where id = new.student_id;

  -- A lesson that runs past midnight cannot be expressed as one same-day
  -- start/end pair. Rather than store a row that reads as an empty span, skip
  -- it and leave the guard's "not compared" branch to surface it.
  v_end := (new.start_time + make_interval(mins => new.duration_minutes))::time;
  if v_end <= new.start_time then
    delete from public.teacher_availability_rules where student_class_id = new.id;
    return new;
  end if;

  insert into public.teacher_availability_rules
    (weekday, start_time, end_time, kind, timezone, note,
     effective_from, effective_to, student_class_id)
  values
    (new.weekday, new.start_time, v_end, 'blocked', new.timezone,
     coalesce(v_name, 'Private') || ' — private lesson',
     new.effective_from, new.effective_to, new.id)
  on conflict (student_class_id) where student_class_id is not null
  do update set
    weekday        = excluded.weekday,
    start_time     = excluded.start_time,
    end_time       = excluded.end_time,
    timezone       = excluded.timezone,
    note           = excluded.note,
    effective_from = excluded.effective_from,
    effective_to   = excluded.effective_to,
    updated_at     = now();

  return new;
end;
$fn$;

drop trigger if exists trg_sync_teacher_class_block on public.teacher_student_classes;
create trigger trg_sync_teacher_class_block
  after insert or update or delete on public.teacher_student_classes
  for each row execute function public.sync_teacher_class_block();

-- Renaming a student changes what every one of her blocks is called.
create or replace function public.sync_teacher_student_name()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  if new.full_name is distinct from old.full_name then
    update public.teacher_availability_rules r
       set note = new.full_name || ' — private lesson', updated_at = now()
      from public.teacher_student_classes c
     where r.student_class_id = c.id and c.student_id = new.id;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_sync_teacher_student_name on public.teacher_students;
create trigger trg_sync_teacher_student_name
  after update on public.teacher_students
  for each row execute function public.sync_teacher_student_name();

-- ── 3. adopt the rows that already exist ─────────────────────────────────
-- Link first, on the instant the two rows describe rather than on wall clock,
-- because the pair are in different zones. Then let the trigger rewrite them
-- from source so nothing stays hand-converted.

with pairs as (
  select r.id as rule_id, c.id as class_id,
         row_number() over (partition by r.id order by c.id) as rn_r,
         row_number() over (partition by c.id order by r.id) as rn_c
  from public.teacher_availability_rules r
  join public.teacher_student_classes c
    on c.weekday = r.weekday
   and ((date '2026-09-14' + c.start_time) at time zone c.timezone)
     = ((date '2026-09-14' + r.start_time) at time zone r.timezone)
  where r.kind = 'blocked' and r.student_class_id is null
)
update public.teacher_availability_rules r
   set student_class_id = p.class_id
  from pairs p
 where r.id = p.rule_id and p.rn_r = 1 and p.rn_c = 1;

-- Re-derive every linked row from its source, in the source's own timezone.
update public.teacher_student_classes set updated_at = now()
 where id in (select student_class_id from public.teacher_availability_rules
              where student_class_id is not null);

-- ── 4. the guard learns to convert ─────────────────────────────────────

create or replace function public.fn_trial_slot_conflicts(
  p_day_of_week integer, p_start_text text, p_duration_min integer default null)
returns table(source text, detail text)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
DECLARE
  v_start int := public._trial_time_to_minutes(p_start_text);
  v_dur   int := COALESCE(p_duration_min,
                          (SELECT default_duration_min FROM public.trial_settings WHERE id = 1),
                          30);
  v_end   int;
BEGIN
  IF v_start IS NULL THEN RETURN; END IF;
  v_end := v_start + v_dur;

  RETURN QUERY
  SELECT 'schedule_package'::text,
         format('Group class on day %s at %s for %s min',
                sp.day_of_week, sp.start_time, sp.duration_min)
  FROM public.schedule_packages sp
  WHERE sp.is_active = true
    AND sp.day_of_week = p_day_of_week
    AND NOT (
      v_end   <= (EXTRACT(HOUR FROM sp.start_time)::int * 60
                  + EXTRACT(MINUTE FROM sp.start_time)::int)
      OR v_start >= (EXTRACT(HOUR FROM sp.start_time)::int * 60
                     + EXTRACT(MINUTE FROM sp.start_time)::int
                     + sp.duration_min)
    );

  RETURN QUERY
  SELECT 'matching_slot'::text,
         format('Matching slot %s %s %s', ms.course_level, ms.day, ms.time)
  FROM public.matching_slots ms
  WHERE ms.status IN ('open','confirmed','full')
    AND CASE lower(ms.day)
          WHEN 'sunday' THEN 0 WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3 WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6 ELSE -1 END = p_day_of_week
    AND NOT (
      v_end   <= public._trial_time_to_minutes(ms.time)
      OR v_start >= public._trial_time_to_minutes(ms.time) + 90
    );

  RETURN QUERY
  SELECT 'trial_slot'::text,
         format('Existing trial slot on day %s at %s',
                ts.day_of_week, ts.start_time)
  FROM public.trial_slots ts
  WHERE ts.lifecycle = 'active' AND ts.is_active = true
    AND ts.day_of_week = p_day_of_week
    AND NOT (
      v_end   <= public._trial_time_to_minutes(ts.start_time)
      OR v_start >= public._trial_time_to_minutes(ts.start_time) + ts.duration_min
    );

  -- The teacher's blocked hours, in WHATEVER zone they are stored.
  --
  -- Each rule is anchored to the next real date on which its own weekday falls
  -- in its own timezone, turned into an instant, and read back in Cairo. That
  -- makes the comparison correct through the 30 October change and through any
  -- future rule in any zone, instead of only for rows that happened to be
  -- written in Cairo. The Cairo weekday is recomputed too, because a late-night
  -- Bangkok lesson is the previous day in Cairo.
  RETURN QUERY
  WITH anchored AS (
    SELECT r.note, r.weekday, r.start_time, r.end_time, r.timezone,
           (CURRENT_DATE
            + ((r.weekday - EXTRACT(DOW FROM CURRENT_DATE)::int + 7) % 7))::date AS d
    FROM public.teacher_availability_rules r
    WHERE r.kind = 'blocked'
      AND r.end_time > r.start_time
      AND (r.effective_from IS NULL OR r.effective_from <= CURRENT_DATE)
      AND (r.effective_to   IS NULL OR r.effective_to   >= CURRENT_DATE)
  ), in_cairo AS (
    SELECT a.note, a.start_time, a.end_time, a.timezone,
           ((a.d + a.start_time) AT TIME ZONE a.timezone AT TIME ZONE 'Africa/Cairo') AS s,
           ((a.d + a.end_time)   AT TIME ZONE a.timezone AT TIME ZONE 'Africa/Cairo') AS e
    FROM anchored a
  )
  SELECT 'availability_rule'::text,
         format('%s, %s-%s %s (= %s-%s Cairo)',
                COALESCE(c.note, 'Blocked'),
                to_char(c.start_time, 'HH24:MI'), to_char(c.end_time, 'HH24:MI'),
                c.timezone,
                to_char(c.s, 'HH24:MI'), to_char(c.e, 'HH24:MI'))
  FROM in_cairo c
  WHERE EXTRACT(DOW FROM c.s)::int = p_day_of_week
    AND NOT (
      v_end   <= (EXTRACT(HOUR FROM c.s)::int * 60 + EXTRACT(MINUTE FROM c.s)::int)
      OR v_start >= (EXTRACT(HOUR FROM c.e)::int * 60 + EXTRACT(MINUTE FROM c.e)::int)
    );

  -- Still reported rather than skipped: a rule that cannot be expressed as one
  -- same-day span. A silently ignored rule is how the original bug worked.
  RETURN QUERY
  SELECT 'availability_rule_unchecked'::text,
         format('%s on day %s (%s-%s %s) was NOT compared: it does not end after it starts, so it crosses midnight. Check it by hand.',
                COALESCE(r.note, 'Blocked'), r.weekday,
                to_char(r.start_time, 'HH24:MI'), to_char(r.end_time, 'HH24:MI'),
                r.timezone)
  FROM public.teacher_availability_rules r
  WHERE r.kind = 'blocked'
    AND r.weekday = p_day_of_week
    AND (r.effective_from IS NULL OR r.effective_from <= CURRENT_DATE)
    AND (r.effective_to   IS NULL OR r.effective_to   >= CURRENT_DATE)
    AND r.end_time <= r.start_time;
END;
$function$;
