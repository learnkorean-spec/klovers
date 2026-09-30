-- One lead per email address.
--
-- Found 1 Oct 2026: Namy (mzd0531@gmail.com) is on the Leads screen twice —
-- "Namy" (21 Sep, created by the private-student sync, unlinked) and "nami"
-- (29 Sep, created when she signed up, linked). She signed up once.
--
-- Cause: `handle_new_user_lead` (the signup trigger) inserts a new lead with
-- `ON CONFLICT DO NOTHING`, but `leads` has no unique constraint on email, so
-- the ON CONFLICT never fires and every person who was already a lead gets a
-- second row the moment she creates an account. The two placement-test pages
-- insert without looking first, so they duplicate the same way.
--
-- Fix, in two parts:
--   1. A BEFORE INSERT trigger on `leads`: when a row with the same address
--      (case-insensitive) already exists, the new details are merged into it
--      and the insert is dropped. Every insert path is covered at once. It only
--      fills blanks and never downgrades an `enrolled` student.
--   2. The signup trigger now also records the account (user_id) on the lead.
--
-- Rows that are ALREADY duplicated (Namy's included) are not touched here —
-- removing them is Re's decision, made separately.
--
-- No unique index is added: code that inserts and then expects the row back
-- would start failing, and the trigger already prevents new duplicates.

-- 1. Merge-on-insert -------------------------------------------------------

create or replace function public.leads_merge_same_email()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _id uuid;
begin
  if coalesce(btrim(new.email), '') = '' then
    return new;
  end if;

  select id into _id
    from public.leads
   where lower(email) = lower(btrim(new.email))
   order by created_at asc, id asc
   limit 1;

  if _id is null then
    return new;
  end if;

  update public.leads l
     set name      = case when coalesce(nullif(btrim(l.name), ''), 'Unknown') = 'Unknown'
                          then coalesce(nullif(btrim(new.name), ''), l.name) else l.name end,
         country   = case when coalesce(nullif(l.country, ''), 'Unknown') = 'Unknown'
                           and coalesce(new.country, '') not in ('', 'Unknown')
                          then new.country else l.country end,
         level     = coalesce(nullif(l.level, ''), nullif(new.level, ''), l.level),
         goal      = coalesce(nullif(l.goal, ''), nullif(new.goal, ''), l.goal),
         plan_type = coalesce(nullif(l.plan_type, ''), nullif(new.plan_type, ''), l.plan_type),
         duration  = coalesce(nullif(l.duration, ''), nullif(new.duration, ''), l.duration),
         schedule  = coalesce(nullif(l.schedule, ''), nullif(new.schedule, ''), l.schedule),
         timezone  = coalesce(nullif(l.timezone, ''), nullif(new.timezone, ''), l.timezone),
         user_id   = coalesce(l.user_id, new.user_id),
         status    = case when l.status = 'enrolled' then l.status
                          when coalesce(new.status, 'new') <> 'new' then new.status
                          else l.status end
   where l.id = _id;

  return null;  -- the details now live on the existing row
end;
$function$;

drop trigger if exists trg_leads_merge_same_email on public.leads;
create trigger trg_leads_merge_same_email
  before insert on public.leads
  for each row execute function public.leads_merge_same_email();

-- 2. Signup trigger records the account ------------------------------------

create or replace function public.handle_new_user_lead()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.leads (name, email, source, status, user_id)
  values (
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Unknown'),
    new.email,
    'signup',
    'new',
    new.id
  );
  return new;
end;
$function$;
