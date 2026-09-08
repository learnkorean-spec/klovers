-- 20260908120000_trial_rebook_resend_batch_1.sql
--
-- WHY
-- ---
-- 38 English trial bookings (status='pending', trial_date is null,
-- timezone='Africa/Cairo') were sent the `trial_rebook_request` email in
-- July 2026. It offered dates that have since passed. 9 opened it, 0 chose
-- a slot. Measured 2026-09-08.
--
-- `TrialClassesManager`'s bulk "Resend with new dates (N)" builds its send list
-- as: not cancelled -> has an email -> NOT already emailed -> one row per
-- address. `rebook_email_sent_at` is the "already emailed" flag, so all 38 are
-- invisible to the button. Pressing it today reaches 7 people, 5 of whom carry
-- a wrong stored timezone (Asia/Kuala_Lumpur).
--
-- This migration re-opens the 10 OLDEST of the 38 so the button can see them.
-- Batches of 10, not all 38 at once: a fault found on ten is recoverable.
--
-- WHAT THIS DOES NOT DO
-- ---------------------
-- It sends no email. It only makes 10 rows eligible for a send that Re still has
-- to trigger by hand from the admin UI. Verified 2026-09-08 that no active cron
-- job reads `rebook_email_sent_at` or emails a customer -- the 13 customer-email
-- jobs paused on 2026-09-07 are all still `active = false`.
--
-- SAFETY
-- ------
-- The previous timestamp is copied into `trial_rebook_resend_log` BEFORE it is
-- cleared, so (a) the July send is not erased from the record and (b) the change
-- is exactly reversible. The row count is asserted; anything other than 10 aborts
-- the whole migration.
--
-- UNDO
-- ----
--   update public.trial_bookings b
--      set rebook_email_sent_at = l.previous_sent_at
--     from public.trial_rebook_resend_log l
--    where b.id = l.booking_id
--      and l.batch = 'batch_1_2026_09_08';
--   delete from public.trial_rebook_resend_log
--    where batch = 'batch_1_2026_09_08';

create table if not exists public.trial_rebook_resend_log (
  id               bigserial primary key,
  booking_id       uuid        not null references public.trial_bookings(id) on delete cascade,
  previous_sent_at timestamptz not null,
  batch            text        not null,
  cleared_at       timestamptz not null default now()
);

comment on table public.trial_rebook_resend_log is
  'Audit trail for deliberately clearing trial_bookings.rebook_email_sent_at so a '
  'stale rebook invitation can be re-sent. One row per booking per batch. Holds the '
  'timestamp that was cleared, which is what makes the operation reversible.';

create index if not exists trial_rebook_resend_log_booking_id_idx
  on public.trial_rebook_resend_log (booking_id);

alter table public.trial_rebook_resend_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename  = 'trial_rebook_resend_log'
       and policyname = 'trial_rebook_resend_log_admin_all'
  ) then
    create policy trial_rebook_resend_log_admin_all
      on public.trial_rebook_resend_log
      for all
      to authenticated
      using      (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

do $$
declare
  v_count int;
begin
  with picked as (
    select id, rebook_email_sent_at
      from public.trial_bookings
     where status            = 'pending'
       and trial_date        is null
       and class_language    = 'english'
       and timezone          = 'Africa/Cairo'
       and email             is not null
       and rebook_email_sent_at is not null
     order by created_at, id
     limit 10
  ),
  logged as (
    insert into public.trial_rebook_resend_log (booking_id, previous_sent_at, batch)
    select id, rebook_email_sent_at, 'batch_1_2026_09_08'
      from picked
    returning booking_id
  )
  update public.trial_bookings b
     set rebook_email_sent_at = null
    from logged l
   where b.id = l.booking_id;

  get diagnostics v_count = row_count;

  if v_count <> 10 then
    raise exception
      'trial rebook batch 1: expected to re-open exactly 10 bookings, re-opened %. Aborting.',
      v_count;
  end if;

  raise notice 'trial rebook batch 1: re-opened % bookings for a new invitation', v_count;
end $$;
