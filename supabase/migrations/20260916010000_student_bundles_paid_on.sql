-- A private bundle records whether it was paid for.
--
-- THE PROBLEM
-- `student_bundles` carried `total_price` and `status` (active / completed /
-- cancelled) and nothing else about money. So every reader had to guess, and
-- the KPI tile guessed "active means paid". Mariam Harb is the case that shows
-- what that costs:
--
--   6 Jul  2,350 EGP, 4 classes, status completed — PAID, and not counted,
--                                                   because it had finished
--   24 Aug 2,350 EGP, 4 classes, status active    — NOT paid, two classes
--                                                   already taught, and counted
--                                                   in full as income
--
-- Wrong in both directions at once, on the same student. `status` describes how
-- much teaching is left in a bundle. It was never about money and cannot be
-- made to be.
--
-- THE MODEL
-- `paid_on` is a date: the day the money arrived. NULL means it has not. That
-- is the whole thing. "Money in" becomes `sum(total_price) where paid_on is not
-- null`, which stays right whether the bundle is half-taught, finished, or
-- bought this morning, and it makes an unpaid bundle visible as a debt instead
-- of invisible as income.
--
-- `paid_note` is free text for how it arrived — Vodafone Cash, Fawry, a bank
-- transfer — for the cases where Re needs to find the receipt later.
--
-- NOTHING IS BACKFILLED, DELIBERATELY
-- `purchased_on` is when a bundle was entered, which is not evidence that money
-- moved. Guessing it here would write five fabricated payment dates into the
-- one table that is supposed to be the record of what was actually received.
-- Which bundles were paid for is Re's knowledge; every existing row starts
-- unmarked and the MONEY IN section on /admin/today lists them for her to tick
-- off, one click each.
--
-- Partial payments are out of scope. If a bundle is ever half paid, it wants a
-- `paid_amount` alongside this, and a decision about what the balance means —
-- neither of which should be invented before there is a real case.

alter table public.student_bundles
  add column if not exists paid_on   date,
  add column if not exists paid_note text;

comment on column public.student_bundles.paid_on is
  'The day the money for this bundle arrived. NULL means it has not been paid. '
  'This, not `status`, is what "money in" is summed over — status describes how '
  'much teaching is left, not whether anyone paid.';

comment on column public.student_bundles.paid_note is
  'Free text for how the money arrived (Vodafone Cash, Fawry, bank transfer), '
  'so a payment can be traced back to a receipt later.';

-- Partial, because the interesting query is "what has been paid" and the
-- unmarked rows are few and read in full anyway.
create index if not exists student_bundles_paid_on_idx
  on public.student_bundles (paid_on)
  where paid_on is not null;
