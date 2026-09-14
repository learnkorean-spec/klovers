-- A held seat has no transaction reference, no receipt, and no price yet
-- 14 Sep 2026
--
-- Reproduced in production the first time anyone pressed the button:
--
--   Couldn't hold your place
--   null value in column "tx_ref" of relation "enrollments"
--   violates not-null constraint
--
-- `hold_my_seat()` opens an enrolment in `PENDING_PAYMENT` precisely so a
-- student can take her place BEFORE paying. There is no transaction yet, so it
-- does not set `tx_ref` — and the column is NOT NULL with no default, so the
-- whole function rolls back. The feature could never have worked; nothing was
-- seated, and the student saw a red box.
--
-- THE TABLE SAYS THREE TIMES THAT AN ENROLMENT IS A PAYMENT
--
-- tx_ref was only the first of them, and each one was found the same way — by
-- the next failing run, one column at a time:
--
--   1. tx_ref      NOT NULL, no default
--   2. receipt_url NOT NULL, no default
--   3. amount      CHECK (amount > 0)
--
-- They are all the same assumption, written in three places: that a row in this
-- table exists because money changed hands. That was true until `hold_my_seat`
-- shipped, and it is not true any more. A student holding a place has made no
-- transaction, uploaded no receipt, and chosen no plan, so she owes nothing yet.
--
-- This file answers all three together rather than waiting to be told about the
-- next one.
--
-- REHEARSED AGAINST PRODUCTION, NOT AGAINST A COPY
--
-- The earlier rehearsal for `hold_my_seat` loaded the real triggers into a
-- local Postgres and tested every behaviour — capacity, the move rule,
-- idempotency, the paid carve-out. It passed. Triggers are not constraints, and
-- none of these three is a trigger.
--
-- So the complete change was rehearsed on production itself, inside one DO
-- block that made all three alterations, ran `hold_my_seat()`'s exact INSERT,
-- and then RAISEd to abort. The insert succeeded. Postgres DDL is
-- transactional, so the schema and all 7 rows were left exactly as they were,
-- which was checked afterwards rather than assumed.
--
-- WHY NOT A PLACEHOLDER. The alternative was to have `hold_my_seat` write ''
-- or a generated string. Both put a value in a field that means "this is the
-- reference for the money that arrived" when no money arrived — the same
-- fiction as the student who was told to type `....` into the transaction field
-- to get past a form, which is what put a non-payment in the PAYMENTS queue in
-- the first place. A row with no payment should say so by having no reference.
--
-- Nothing is rewritten: all 7 existing enrolments carry a real reference, and
-- `create_egypt_order` still generates one for every actual order.
-- `protect_enrollment_sensitive_fields` compares tx_ref with IS DISTINCT FROM,
-- which is null-safe, so the guard keeps working unchanged.

-- 1 and 2. The payment artefacts.
--
-- tx_ref was already understood to be optional everywhere else. Its unique
-- index, added in 20260321060000, reads:
--
--   CREATE UNIQUE INDEX enrollments_tx_ref_nonempty_unique
--     ON public.enrollments (tx_ref)
--     WHERE tx_ref IS NOT NULL AND tx_ref <> '';
--
-- An index that explicitly excludes NULL and '' is an index written for a
-- column that holds neither some of the time. The NOT NULL was the leftover.

alter table public.enrollments
  alter column tx_ref drop not null;

alter table public.enrollments
  alter column receipt_url drop not null;

comment on column public.enrollments.tx_ref is
  'Payment transaction reference. NULL until a payment exists — a seat held before paying has none. Unique among non-empty values only (enrollments_tx_ref_nonempty_unique).';

comment on column public.enrollments.receipt_url is
  'Where the uploaded receipt lives. NULL until one is uploaded — a seat held before paying has none.';

-- 3. The price.
--
-- The check is NARROWED, not dropped. `amount > 0` was trying to say something
-- true and worth keeping — nobody has paid for nothing — but it said it about
-- every row, including rows that exist before any price is chosen. The version
-- below says only the part that is still true, and it still catches the bug the
-- original was there for: a PAID enrolment for zero money.
--
-- Every existing row satisfies it: the smallest amount on file is 1200, and no
-- PAID row is at or below zero.

alter table public.enrollments
  drop constraint if exists enrollments_amount_check;

alter table public.enrollments
  add constraint enrollments_amount_check
  check (amount >= 0 and (amount > 0 or payment_status <> 'PAID'));

comment on column public.enrollments.amount is
  'Total for this enrolment in `currency`. 0 while a seat is held and no plan has been chosen; a PAID row must be greater than 0 (enrollments_amount_check).';

-- ---------------------------------------------------------------------------
-- Prove the hole is closed, without leaving a row behind.
--
-- The insert is the exact shape hold_my_seat() uses, including the columns it
-- omits; it is deleted immediately. If any of the three were still in force
-- this raises and the migration fails, which is the intended behaviour — a
-- green run means a student can now hold a seat.
-- ---------------------------------------------------------------------------
do $$
declare
  _user uuid;
  _id   uuid;
begin
  select user_id into _user from public.profiles where user_id is not null limit 1;
  if _user is null then
    raise notice 'no profile to test with; skipping the insert check';
    return;
  end if;

  insert into public.enrollments (
    user_id, plan_type, duration, classes_included, amount, currency,
    payment_provider, payment_status, approval_status,
    level, package_id, slot_id, matched_at, timezone
  ) values (
    _user, 'group', 1, 4, 0, 'EGP',
    'manual', 'PENDING_PAYMENT', 'APPROVED',
    null, null, null, now(), 'Africa/Cairo'
  )
  returning id into _id;

  delete from public.enrollments where id = _id;

  raise notice 'a seat can be held with no reference, no receipt and no price; rehearsal row removed';
end $$;
