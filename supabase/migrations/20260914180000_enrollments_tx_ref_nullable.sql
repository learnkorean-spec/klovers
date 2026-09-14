-- A held seat has no transaction reference, and no receipt — 14 Sep 2026
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
-- The column was already understood to be optional everywhere else. Its unique
-- index, added in 20260321060000, reads:
--
--   CREATE UNIQUE INDEX enrollments_tx_ref_nonempty_unique
--     ON public.enrollments (tx_ref)
--     WHERE tx_ref IS NOT NULL AND tx_ref <> '';
--
-- An index that explicitly excludes NULL and '' is an index written for a
-- column that holds neither some of the time. The NOT NULL is the leftover, and
-- this drops it.
--
-- `receipt_url` GOES WITH IT. tx_ref is the first NOT NULL the insert meets,
-- not the only one. Running that exact insert against production returns the
-- failing row, and it reads `..., tx_ref null, receipt_url null, PENDING, ...`
-- — receipt_url is NOT NULL with no default too, so fixing tx_ref alone moves
-- the same error one column to the right and the rehearsal below would have
-- failed on it. A student who has not paid has not uploaded a receipt either;
-- it is the same fact about the same moment, and it gets the same answer.
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

alter table public.enrollments
  alter column tx_ref drop not null;

alter table public.enrollments
  alter column receipt_url drop not null;

comment on column public.enrollments.tx_ref is
  'Payment transaction reference. NULL until a payment exists — a seat held before paying has none. Unique among non-empty values only (enrollments_tx_ref_nonempty_unique).';

comment on column public.enrollments.receipt_url is
  'Where the uploaded receipt lives. NULL until one is uploaded — a seat held before paying has none.';

-- ---------------------------------------------------------------------------
-- Prove the hole is closed, without leaving a row behind.
--
-- The insert is the exact shape hold_my_seat() uses; it is deleted
-- immediately. If either NOT NULL were still in place this raises and the
-- migration fails, which is the intended behaviour — a green run means a
-- student can now hold a seat.
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
    payment_provider, payment_status, approval_status, timezone
  ) values (
    _user, 'group', 1, 4, 0, 'EGP',
    'manual', 'PENDING_PAYMENT', 'APPROVED', 'Africa/Cairo'
  )
  returning id into _id;

  delete from public.enrollments where id = _id;

  raise notice 'enrolment insert with no payment artefacts succeeded and was removed';
end $$;
