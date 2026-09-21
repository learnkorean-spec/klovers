-- A private student's lead should say she is a student.
--
-- Adding a private student happens in My Students and writes only to
-- `teacher_students`. Nothing has ever touched `leads`, so the Leads screen -
-- which is where "how many students do we have" is actually read - kept
-- whatever status she arrived with, or had no row for her at all.
--
-- On 21 Sep that meant: Menna taught every week with her lead still `new`,
-- and Namy, who never came through the site, absent from `leads` entirely.
-- Filtered to `enrolled`, the screen showed four of the seven people actually
-- studying.
--
-- The trigger matches on email, which is the only thing the two tables share -
-- `teacher_students.user_id` is null for anyone with no account, which is
-- exactly the case that needs this most.
--
-- It only ever moves a lead TO `enrolled`, and only for an ACTIVE private
-- student. It never writes back the other way: a student who stops is marked
-- by hand (`churned`), because "no longer active as a private student" and
-- "no longer a student" are not the same fact - she may have moved into a
-- group.

create or replace function public.sync_private_student_lead()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _existing uuid;
begin
  if new.status is distinct from 'active' then
    return new;
  end if;
  if coalesce(new.email, '') = '' then
    return new;
  end if;

  select id into _existing
    from public.leads
   where lower(email) = lower(new.email)
   order by created_at desc
   limit 1;

  if _existing is not null then
    update public.leads
       set status = 'enrolled',
           plan_type = case when coalesce(plan_type, '') = '' then 'private' else plan_type end,
           user_id = coalesce(user_id, new.user_id)
     where id = _existing
       and status is distinct from 'enrolled';
  else
    insert into public.leads (name, email, country, plan_type, status, source, user_id)
    values (
      coalesce(nullif(btrim(new.full_name), ''), split_part(new.email, '@', 1)),
      new.email,
      coalesce(new.country, ''),
      'private',
      'enrolled',
      'private-student',
      new.user_id
    );
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_sync_private_student_lead on public.teacher_students;
create trigger trg_sync_private_student_lead
  after insert or update of status, email, full_name, user_id on public.teacher_students
  for each row execute function public.sync_private_student_lead();

-- Backfill the five who already exist. Written as statements rather than by
-- poking the trigger, because the trigger fires on specific columns and a
-- no-op touch would not wake it.
update public.leads l
   set status = 'enrolled',
       plan_type = case when coalesce(l.plan_type, '') = '' then 'private' else l.plan_type end,
       user_id = coalesce(l.user_id, ts.user_id)
  from public.teacher_students ts
 where ts.status = 'active'
   and lower(l.email) = lower(ts.email)
   and l.status is distinct from 'enrolled';

insert into public.leads (name, email, country, plan_type, status, source, user_id)
select coalesce(nullif(btrim(ts.full_name), ''), split_part(ts.email, '@', 1)),
       ts.email, coalesce(ts.country, ''), 'private', 'enrolled', 'private-student', ts.user_id
  from public.teacher_students ts
 where ts.status = 'active'
   and coalesce(ts.email, '') <> ''
   and not exists (select 1 from public.leads l where lower(l.email) = lower(ts.email));
