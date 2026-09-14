-- An Egyptian student's enrolment is recorded in Egyptian pounds.
--
-- `submit_manual_enrollment` never named the `currency` column, so every row it
-- wrote took the table default:
--
--   ALTER TABLE public.enrollments ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD'
--
-- and /enroll priced from `tierPrices`, which src/lib/stripePrices.ts documents
-- as "USD tier prices". So a student in Cairo was shown $25 for the group month
-- that costs 1,200 EGP on the pricing page, and the enrolment recorded 25 USD.
-- The label and the record agreed; both were wrong.
--
-- Two changes here.
--
--   1. The function takes `_currency`. The existing 5- and 6-argument overloads
--      are dropped rather than kept: a defaulted 7th parameter alongside them
--      would make a 6-argument call match two functions and fail as ambiguous.
--      One function with defaults serves every caller shape that worked before.
--
--   2. The ceiling becomes currency-aware. `_amount > 10000` was a USD number,
--      and an honest 11,750 EGP six-month private enrolment would have been
--      rejected by it. For EGP the check is better than a ceiling: the amount
--      must equal the published price in `egp_prices`, the same table
--      create_egypt_order prices from -- so the client cannot name its own price
--      in pounds, and the button and the record cannot drift apart.
--
-- What this does not do: it does not decide the currency. The caller does. The
-- UI change that goes with this resolves it from the student's country and,
-- when that is blank -- which it is for 85 of 107 profiles -- her timezone.

drop function if exists public.submit_manual_enrollment(text, integer, numeric, text, text);
drop function if exists public.submit_manual_enrollment(text, integer, numeric, text, text, text);

create or replace function public.submit_manual_enrollment(
  _plan_type      text,
  _duration       integer,
  _amount         numeric,
  _tx_ref         text,
  _receipt_url    text,
  _payment_method text default null,
  _currency       text default 'USD'
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _user_id       uuid;
  _enrollment_id uuid;
  _classes       integer;
  _currency_norm text;
  _expected      numeric;
begin
  _user_id := auth.uid();

  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  if _plan_type not in ('group', 'private') then
    raise exception 'Invalid plan_type';
  end if;

  if _duration not in (1, 3, 6) then
    raise exception 'Invalid duration';
  end if;

  _classes := case _duration
    when 1 then 4
    when 3 then 12
    when 6 then 24
  end;

  _currency_norm := upper(coalesce(nullif(btrim(_currency), ''), 'USD'));

  if _currency_norm not in ('USD', 'EGP') then
    raise exception 'Invalid currency: %', _currency_norm;
  end if;

  if _amount is null or _amount <= 0 then
    raise exception 'Invalid amount';
  end if;

  if _currency_norm = 'EGP' then
    -- Priced by the server, not by the page. egp_prices is the same table
    -- create_egypt_order reads, so the two Egyptian paths cannot disagree.
    select p.amount_egp into _expected
      from public.egp_prices p
     where p.plan_type = _plan_type
       and p.duration  = _duration;

    if _expected is null then
      raise exception 'No published EGP price for % / % months', _plan_type, _duration;
    end if;

    if _amount <> _expected then
      raise exception 'Amount does not match the published price (% EGP)', _expected;
    end if;
  else
    -- Unchanged for USD: a sanity ceiling, in USD units, which is what it
    -- always was.
    if _amount > 10000 then
      raise exception 'Amount exceeds maximum allowed';
    end if;
  end if;

  if _payment_method is not null and _payment_method not in ('vodafone_cash', 'instapay', 'bank_transfer') then
    raise exception 'Invalid payment_method';
  end if;

  if _tx_ref is null or length(trim(_tx_ref)) = 0 then
    raise exception 'Transaction reference required';
  end if;

  -- receipt_url can be empty on initial creation (uploaded separately after)

  insert into public.enrollments (
    user_id, plan_type, duration, classes_included, amount, unit_price,
    tx_ref, receipt_url, payment_provider, admin_review_required,
    status, payment_status, approval_status,
    sessions_total, sessions_remaining, payment_method, currency
  ) values (
    _user_id, _plan_type, _duration, _classes, _amount, _amount / _classes,
    trim(_tx_ref), coalesce(trim(_receipt_url), ''),
    'manual', true, 'PENDING', 'UNPAID', 'PENDING',
    _classes, _classes, _payment_method, _currency_norm
  ) returning id into _enrollment_id;

  return _enrollment_id;
end;
$function$;

-- Dropping and recreating resets the grants, so the ones the old overloads
-- carried are restored explicitly. The bare PUBLIC grant they also had is not:
-- it is redundant next to anon, and the function refuses an anonymous caller on
-- its first line anyway.
revoke all on function public.submit_manual_enrollment(text, integer, numeric, text, text, text, text) from public;
grant execute on function public.submit_manual_enrollment(text, integer, numeric, text, text, text, text) to anon, authenticated, service_role;
