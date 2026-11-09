-- Raise the availability_slots cap from 2 to 4 (Language Exchange UX
-- follow-up, 2026-11-09). The frontend required exactly 2 free-time slots,
-- no more -- unnecessarily tight for actually scheduling a match. Frontend
-- now requires at least EXCHANGE_AVAILABILITY_MIN (2) and offers up to
-- EXCHANGE_AVAILABILITY_MAX (4) pickers
-- (src/constants/languageExchange.ts). This only raises the server-side
-- ceiling to match; it does not add a floor -- the "at least 2" rule stays
-- a client-side concern, same as before (the column default is '{}' and
-- existing rows with 2 slots are unaffected either way).

alter table public.exchange_profiles
  drop constraint if exists exchange_profiles_availability_max_two;

alter table public.exchange_profiles
  add constraint exchange_profiles_availability_max_four
  check (cardinality(availability_slots) <= 4);
