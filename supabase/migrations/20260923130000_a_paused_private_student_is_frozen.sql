-- Re, looking at the group card's Pause button: "add here as well for group and
-- private that the group i can activate stop and its frozen".
--
-- The group card already promises exactly the right thing, in its own words:
-- "Paused - it is not meeting, and nobody new can be seated into it. Its start
-- date, its students and their payment dates are all kept, so Resume puts it
-- straight back." A private student had no equivalent at all.
--
-- WHY IT MATTERS MORE NOW THAN IT DID YESTERDAY
--
-- Until today, a private student who stopped simply stopped: nothing happened
-- on its own, so nothing needed switching off. As of 20260923110000 and
-- 20260923120000 the system renews her package the moment a lesson is taught
-- past it, and emails her for the money. That is right for a student who is
-- carrying on and wrong for one who is not - so "carrying on" has to become
-- something Re can say no to, in one click, without deleting anything.
--
-- WHAT FROZEN MEANS
--
--   * no renewal        - roll_bundle_if_overdrawn returns early
--   * no payment ask    - tg_auto_send_bundle_payment_ask returns early
--   * no new lessons    - fn_generate_scheduled_sessions already filters on
--                         ts.status = 'active', so this comes free
--   * everything kept   - her package, her counted lessons, her dates, her
--                         balance. Resume puts her straight back.
--
-- The MANUAL payment button on Today is deliberately left working for a paused
-- student: Re asking for money on purpose is not the same act as the system
-- deciding to. Freezing stops the automatic, never her.

alter table public.teacher_students
  drop constraint if exists teacher_students_status_check;

alter table public.teacher_students
  add constraint teacher_students_status_check
  check (status in ('active', 'paused', 'inactive'));

comment on column public.teacher_students.status is
  'active = running · paused = frozen, everything kept, nothing automatic happens · inactive = stopped for good.';

-- ---------------------------------------------------------------------------
-- No renewal while paused
-- ---------------------------------------------------------------------------

create or replace function public.roll_bundle_if_overdrawn(p_bundle_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _old  record;
  _used int;
  _new  uuid;
begin
  select b.*, ts.status as student_status
    into _old
    from public.student_bundles b
    join public.teacher_students ts on ts.id = b.student_id
   where b.id = p_bundle_id;

  if _old.id is null or _old.status <> 'active' then return null; end if;

  -- Frozen. A paused student is not renewed, whatever the calendar says.
  if _old.student_status <> 'active' then return null; end if;

  select count(*) into _used
    from public.student_class_sessions s
   where s.bundle_id = _old.id and s.counted;

  -- Still inside the package she paid for. Nothing to do.
  if _used <= coalesce(_old.total_classes, 0) then return null; end if;

  -- Names the rule, so the audit rail records this instead of refusing it.
  perform set_config('app.system_actor', 'bundle_rollover', true);

  update public.student_bundles set status = 'completed' where id = _old.id;

  insert into public.student_bundles
    (student_id, source, label, catalog_key, total_classes, total_price,
     currency, purchased_on, status, coverage_start, note)
  select _old.student_id, 'custom', _old.label, null, _old.total_classes,
         _old.total_price, _old.currency, s.session_date, 'active', s.session_date,
         'Opened automatically: the previous package ran out and lessons were taught past it.'
    from public.student_class_sessions s
   where s.bundle_id = _old.id and s.counted
   order by s.session_date asc, s.start_time asc
   offset coalesce(_old.total_classes, 0) limit 1
  returning id into _new;

  update public.student_class_sessions
     set bundle_id = _new
   where id in (
     select id from public.student_class_sessions
      where bundle_id = _old.id and counted
      order by session_date asc, start_time asc
      offset coalesce(_old.total_classes, 0)
   );

  perform set_config('app.system_actor', '', true);
  return _new;
end
$function$;

-- ---------------------------------------------------------------------------
-- No automatic payment ask while paused
-- ---------------------------------------------------------------------------

create or replace function public.tg_auto_send_bundle_payment_ask()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status <> 'active' then return new; end if;
  if new.paid_on is not null then return new; end if;
  if new.payment_ask_sent_at is not null then return new; end if;
  if coalesce(new.total_price, 0) <= 0 then return new; end if;

  if (select ts.status from public.teacher_students ts where ts.id = new.student_id) <> 'active' then
    return new;
  end if;

  -- Only when the package BECOMES live and unpaid, not on every save.
  if tg_op = 'UPDATE'
     and old.status = 'active'
     and old.paid_on is null
  then
    return new;
  end if;

  perform public.send_bundle_payment_ask(new.id);
  return new;
exception when others then
  return new;
end
$function$;
