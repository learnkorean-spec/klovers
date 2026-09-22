-- Re opened the Notifications panel and found an engineering write-up sitting
-- in Updates, unread, next to the daily numbers. Her words: the notifications
-- should tell her who signed up, who paid, what needs attention -- "but not
-- code notification".
--
-- WHY IT GOT THERE
--
-- notification_category was a denylist:
--
--   when _type in ('cron_health','self_verification','pgnet_failure',
--                  'calendar_drift','email_lost','sessions_unconfirmed','info')
--   then 'system' else 'update'
--
-- Seven known system types, and EVERYTHING ELSE fell through to 'update'. A
-- note written by hand under a type nobody had registered -- the 22 Sep
-- write-up filed as 'payment_claim' -- therefore landed in Re's Updates tab by
-- default. The default was the bug: an unknown type is far more likely to be
-- something technical than something Re needs to read.
--
-- It is an allowlist now. Business events are named; anything else is System.
--
-- AND A LENGTH GUARD BEHIND IT
--
-- A note for Re is a sentence: "Aya signed up", "Solafa paid 6,400 EGP". An
-- update over 280 characters is an engineering write-up whatever its type says,
-- so it is re-filed as system before it is stored. The guard exists because the
-- allowlist only helps once someone has thought about the type -- this catches
-- the case where nobody did.
--
-- PRIVATE STUDENTS HAD NO MONEY NOTES AT ALL
--
-- Every payment notification in this system is built on `enrollments`, which a
-- private student does not have. notify_payment_received fires on an enrolment
-- row; there was no equivalent for student_bundles. So Solafa's package being
-- paid and Renad's being unpaid were both completely silent, which is exactly
-- the "attention paying request" Re asked for.

-- ---------------------------------------------------------------------------
-- 1. The router: allowlist, not denylist
-- ---------------------------------------------------------------------------

create or replace function public.notification_category(_type text)
returns text
language sql
immutable
set search_path to 'public'
as $function$
  select case
    when _type in (
      'new_registration',      -- someone signed up
      'new_enrollment',        -- someone enrolled
      'trial',                 -- trial booked
      'payment_received',      -- money in, group student
      'payment_submitted',     -- money in, Egypt payment form
      'payment_claim',         -- student says she paid, receipt waiting
      'bundle_paid',           -- money in, private student
      'payment_due',           -- a package is waiting to be paid
      'daily_summary'          -- yesterday's numbers
    ) then 'update'
    else 'system'
  end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. The length guard
-- ---------------------------------------------------------------------------

create or replace function public.tg_admin_notifications_set_category()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  new.category := public.notification_category(new.type);
  if new.category = 'update' and length(coalesce(new.message, '')) > 280 then
    new.category := 'system';
  end if;
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Money notes for private students
-- ---------------------------------------------------------------------------

create or replace function public.notify_private_bundle_money()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _name     text;
  _price    text;
  _currency text := coalesce(new.currency, 'EGP');
begin
  select full_name into _name from public.teacher_students where id = new.student_id;
  _name := coalesce(nullif(trim(_name), ''), 'A student');

  -- 6400.00 -> "6400", 49.50 -> "49.5". FM drops the padding; the trailing
  -- dot it leaves on a whole number has to go too.
  _price := trim(trailing '.' from trim(to_char(coalesce(new.total_price, 0), 'FM999999990.99')));

  -- money in
  if new.paid_on is not null
     and (tg_op = 'INSERT' or old.paid_on is null)
  then
    insert into public.admin_notifications (message, type)
    values (
      _name || ' paid ' || _price || ' ' || _currency
        || ' for ' || new.total_classes || ' private classes.',
      'bundle_paid'
    );
    return new;
  end if;

  -- money owed: a live package with nothing recorded against it
  if new.status = 'active'
     and new.paid_on is null
     and coalesce(new.total_price, 0) > 0
     and (tg_op = 'INSERT'
          or old.status is distinct from 'active'
          or old.paid_on is not null)
  then
    insert into public.admin_notifications (message, type)
    values (
      _name || ' has a new package of ' || new.total_classes || ' classes — '
        || _price || ' ' || _currency || ' not received yet.',
      'payment_due'
    );
  end if;

  return new;
exception when others then
  -- a notification must never block a package being saved
  return new;
end;
$function$;

drop trigger if exists trg_notify_private_bundle_money on public.student_bundles;
create trigger trg_notify_private_bundle_money
  after insert or update of paid_on, status on public.student_bundles
  for each row execute function public.notify_private_bundle_money();

-- ---------------------------------------------------------------------------
-- 4. Re-file what the old rule put in the wrong tab
-- ---------------------------------------------------------------------------

update public.admin_notifications
   set category = public.notification_category(type)
 where category is distinct from public.notification_category(type);

update public.admin_notifications
   set category = 'system'
 where category = 'update' and length(coalesce(message, '')) > 280;
