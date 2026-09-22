-- Re: "if they exceed to new class opens new bundle automatic".
--
-- The problem it solves is the one that keeps recurring. Solafa's 16-lesson
-- package is used up and she still has a lesson on the calendar; Renad's 12 is
-- used up too. Every time, the package has to be closed by hand and the next
-- one opened by hand before anything can be counted, and until that happens
-- the lesson either goes unrecorded or pushes the bundle negative.
--
-- WHEN, EXACTLY
--
-- Re's call, and it is the right one: not when the package runs out, but when
-- a lesson is taught PAST it. A package reaching zero says nothing about
-- whether the student is continuing - she may have finished. A lesson taught
-- after the last paid one is the only proof that she wants another package.
-- So nobody is asked for money for a package they were not going to buy.
--
-- HOW
--
-- After a lesson is counted, count the counted lessons on its package. If that
-- is more than the package was sold, this lesson is the one past the end:
--
--   * the old package is closed (status -> completed), keeping exactly the
--     lessons it paid for;
--   * a new package opens on the same terms - same size, same price, same
--     currency, same label - unpaid, covering from this lesson's date;
--   * every lesson past the end moves onto it.
--
-- The rest follows on its own: trg_auto_send_bundle_payment_ask emails the
-- student the amount and how to pay (20260923100000), and
-- notify_private_bundle_money puts "a new package ... not received yet" in
-- Re's Updates (20260922210000).
--
-- WHAT IT REFUSES TO BREAK
--
-- The whole thing is wrapped: rolling a package must never stop a lesson being
-- recorded. If the bundle audit rail refuses the close (it requires a
-- signed-in admin, and correctly so), the exception rolls back only this
-- trigger's own work - the lesson still stands, and the package can be opened
-- by hand.
--
-- The trigger is `update of outcome, counted`, so the bundle_id re-pointing it
-- does itself cannot fire it again.

create or replace function public.tg_roll_bundle_when_overdrawn()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _old   record;
  _used  int;
  _new   uuid;
begin
  if not coalesce(new.counted, false) then
    return new;
  end if;

  -- The bundle this lesson was charged to. A lesson with no bundle is charged
  -- to whichever package is live for that student.
  select b.* into _old
    from public.student_bundles b
   where b.id = coalesce(
           new.bundle_id,
           (select id from public.student_bundles
             where student_id = new.student_id and status = 'active'
             order by coverage_start asc nulls last, created_at asc limit 1)
         );

  if _old.id is null or _old.status <> 'active' then
    return new;
  end if;

  select count(*) into _used
    from public.student_class_sessions s
   where s.bundle_id = _old.id and s.counted;

  -- Still inside the package she paid for. Nothing to do.
  if _used <= coalesce(_old.total_classes, 0) then
    return new;
  end if;

  -- This lesson is the one past the end. The package is finished, and she is
  -- still coming -- which is the only proof that she wants another one.
  update public.student_bundles
     set status = 'completed'
   where id = _old.id;

  insert into public.student_bundles
    (student_id, source, label, catalog_key, total_classes, total_price,
     currency, purchased_on, status, coverage_start, note)
  values
    (_old.student_id, 'custom', _old.label, null, _old.total_classes,
     _old.total_price, _old.currency, new.session_date, 'active',
     new.session_date,
     'Opened automatically: the previous package ran out and a lesson was taught past it.')
  returning id into _new;

  -- Every lesson past the end of the old package belongs to the new one.
  update public.student_class_sessions
     set bundle_id = _new
   where bundle_id = _old.id
     and id in (
       select id from public.student_class_sessions
        where bundle_id = _old.id and counted
        order by session_date desc, start_time desc
        limit (_used - coalesce(_old.total_classes, 0))
     );

  return new;
exception when others then
  -- Rolling a package must never stop a lesson being recorded. The lesson
  -- stands; the package can be opened by hand.
  return new;
end
$function$;

drop trigger if exists trg_roll_bundle_when_overdrawn on public.student_class_sessions;
create trigger trg_roll_bundle_when_overdrawn
  after insert or update of outcome, counted on public.student_class_sessions
  for each row execute function public.tg_roll_bundle_when_overdrawn();
