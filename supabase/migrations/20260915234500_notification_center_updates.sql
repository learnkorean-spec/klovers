-- Notification centre: separate business updates from system/technical alerts,
-- and report the numbers Re actually watches (signups, trials, payments, revenue).
--
-- Re, 15 Sep 2026: "no need to system msgs in the notification center,
-- i want updates for website numbers".
--
-- 1. admin_notifications.category — 'update' (business) or 'system' (technical)
-- 2. new_registration  — every new profile, with the running total
-- 3. payment_received  — every enrolment that turns PAID, with total revenue
-- 4. trial             — moved out of the book-trial edge function into a
--                        trigger, so every booking path notifies, and the
--                        message now carries the seat count for that session
-- 5. daily_summary     — one digest at 07:00 Africa/Cairo with the day's numbers

-- ---------------------------------------------------------------------------
-- 1. Category
-- ---------------------------------------------------------------------------

alter table public.admin_notifications
  add column if not exists category text not null default 'update';

create or replace function public.notification_category(_type text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when _type in (
      'cron_health',
      'self_verification',
      'pgnet_failure',
      'calendar_drift',
      'email_lost',
      'sessions_unconfirmed',
      'info'
    ) then 'system'
    else 'update'
  end;
$$;

comment on function public.notification_category(text) is
  'Which drawer a notification belongs in. Anything technical is system; anything about students, bookings or money is update.';

alter table public.admin_notifications
  drop constraint if exists admin_notifications_category_check;
alter table public.admin_notifications
  add constraint admin_notifications_category_check
  check (category in ('update', 'system'));

create or replace function public.tg_admin_notifications_set_category()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.category := public.notification_category(new.type);
  return new;
end;
$$;

drop trigger if exists trg_admin_notifications_set_category on public.admin_notifications;
create trigger trg_admin_notifications_set_category
  before insert on public.admin_notifications
  for each row execute function public.tg_admin_notifications_set_category();

update public.admin_notifications
   set category = public.notification_category(type)
 where category is distinct from public.notification_category(type);

create index if not exists admin_notifications_category_read_idx
  on public.admin_notifications (category, read, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. New registration
-- ---------------------------------------------------------------------------

create or replace function public.notify_new_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _total bigint;
begin
  select count(*) into _total from public.profiles;

  insert into public.admin_notifications (message, type, related_user_id)
  values (
    'New signup: ' || coalesce(nullif(trim(new.name), ''), 'no name yet')
      || ' (' || coalesce(new.email, 'no email') || ')'
      || case when new.country is not null then ' · ' || new.country else '' end
      || ' — ' || _total || ' registered in total',
    'new_registration',
    new.user_id
  );

  return new;
exception when others then
  -- a notification must never block a signup
  return new;
end;
$$;

drop trigger if exists trg_notify_new_registration on public.profiles;
create trigger trg_notify_new_registration
  after insert on public.profiles
  for each row execute function public.notify_new_registration();

-- ---------------------------------------------------------------------------
-- 3. Payment received
-- ---------------------------------------------------------------------------

create or replace function public.notify_payment_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _name     text;
  _revenue  numeric;
  _paid     bigint;
  _currency text := coalesce(new.currency, 'EGP');
begin
  if new.payment_status is not distinct from old.payment_status then
    return new;
  end if;
  if upper(coalesce(new.payment_status, '')) <> 'PAID' then
    return new;
  end if;

  select name into _name from public.profiles where user_id = new.user_id limit 1;

  select coalesce(sum(amount), 0), count(*)
    into _revenue, _paid
    from public.enrollments
   where upper(coalesce(payment_status, '')) = 'PAID'
     and deleted_at is null;

  insert into public.admin_notifications (message, type, related_user_id)
  values (
    'Payment received: ' || coalesce(_name, 'Unknown')
      || ' — ' || coalesce(new.amount, 0) || ' ' || _currency
      || ' · total revenue ' || _revenue || ' ' || _currency
      || ' from ' || _paid || ' paid enrolment(s)',
    'payment_received',
    new.user_id
  );

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_notify_payment_received on public.enrollments;
create trigger trg_notify_payment_received
  after update on public.enrollments
  for each row execute function public.notify_payment_received();

-- ---------------------------------------------------------------------------
-- 4. New trial booking — now a trigger, with the session's seat count
-- ---------------------------------------------------------------------------

create or replace function public.notify_new_trial_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _seats bigint;
  _when  text;
begin
  if upper(coalesce(new.status, '')) = 'CANCELLED' then
    return new;
  end if;

  select count(*)
    into _seats
    from public.trial_bookings
   where status <> 'cancelled'
     and trial_date is not distinct from new.trial_date
     and start_time is not distinct from new.start_time;

  _when := case
    when new.trial_date is null then 'no date yet'
    else to_char(new.trial_date, 'Dy DD Mon') || ' · ' || coalesce(new.start_time, '')
  end;

  insert into public.admin_notifications (message, type, related_user_id)
  values (
    'New trial booking: ' || coalesce(nullif(trim(new.name), ''), 'no name')
      || ' (' || coalesce(new.email, 'no email') || ')'
      || ' — ' || _when
      || ' · ' || coalesce(new.class_language, 'language not set')
      || ' · ' || coalesce(new.level, 'level not set')
      || ' — ' || _seats || ' booked on that session',
    'trial',
    new.user_id
  );

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_notify_new_trial_booking on public.trial_bookings;
create trigger trg_notify_new_trial_booking
  after insert on public.trial_bookings
  for each row execute function public.notify_new_trial_booking();

-- ---------------------------------------------------------------------------
-- 5. Daily numbers digest — 07:00 Africa/Cairo, DST-safe via an hourly guard
-- ---------------------------------------------------------------------------

create or replace function public.send_daily_numbers_digest()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _today       date := (now() at time zone 'Africa/Cairo')::date;
  _yesterday   date := _today - 1;
  _reg_today   bigint;
  _reg_yest    bigint;
  _reg_total   bigint;
  _trial_today bigint;
  _trial_up    bigint;
  _enr_today   bigint;
  _rev_today   numeric;
  _rev_total   numeric;
begin
  -- run once a day, at 07:00 Cairo
  if extract(hour from (now() at time zone 'Africa/Cairo')) <> 7 then
    return;
  end if;

  if exists (
    select 1 from public.admin_notifications
     where type = 'daily_summary'
       and (created_at at time zone 'Africa/Cairo')::date = _today
  ) then
    return;
  end if;

  select count(*) filter (where (created_at at time zone 'Africa/Cairo')::date = _today),
         count(*) filter (where (created_at at time zone 'Africa/Cairo')::date = _yesterday),
         count(*)
    into _reg_today, _reg_yest, _reg_total
    from public.profiles;

  select count(*) filter (where (created_at at time zone 'Africa/Cairo')::date = _today),
         count(*) filter (where status <> 'cancelled' and trial_date >= _today)
    into _trial_today, _trial_up
    from public.trial_bookings;

  select count(*) filter (where (created_at at time zone 'Africa/Cairo')::date = _today),
         coalesce(sum(amount) filter (
           where upper(coalesce(payment_status, '')) = 'PAID'
             and (coalesce(payment_date, created_at) at time zone 'Africa/Cairo')::date = _today
         ), 0),
         coalesce(sum(amount) filter (where upper(coalesce(payment_status, '')) = 'PAID'), 0)
    into _enr_today, _rev_today, _rev_total
    from public.enrollments
   where deleted_at is null;

  insert into public.admin_notifications (message, type)
  values (
    'Yesterday on the site (' || to_char(_yesterday, 'DD Mon') || '): '
      || _reg_yest || ' signup(s). Today so far: '
      || _reg_today || ' signup(s), '
      || _trial_today || ' trial booking(s), '
      || _enr_today || ' enrolment(s), '
      || _rev_today || ' EGP received. '
      || 'Totals: ' || _reg_total || ' registered · '
      || _trial_up || ' upcoming trial seat(s) · '
      || _rev_total || ' EGP revenue.',
    'daily_summary'
  );
end;
$$;

revoke all on function public.send_daily_numbers_digest() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('daily-numbers-digest');
exception when others then
  null;
end;
$$;

select cron.schedule(
  'daily-numbers-digest',
  '0 * * * *',
  $$select public.send_daily_numbers_digest();$$
);
