-- Language Exchange safety hardening, from a deep-dive audit (4 Nov 2026).
-- Three independent fixes, bundled in one migration because each is a
-- small, surgical RLS/privilege change on the same feature, not three
-- separate concerns competing for review attention.

-- ---------------------------------------------------------------------
-- 1. CRITICAL: no age-proximity safeguard between minors (16-17) and
--    adults. exchange_profiles allows ages 16-100 with zero additional
--    gate, and exchange_profiles_select_visible had no age logic at all
--    -- a 16-year-old's Discover feed could show, and let them 1:1-chat
--    with, any adult stranger, and vice versa.
--
--    Fix: segregate by age band at the RLS layer (not just the client
--    query), so an adult's API response never even contains a minor's
--    profile and vice versa, regardless of client code:
--      - A viewer whose own age is 16 or 17 only sees other profiles
--        aged 16 or 17.
--      - Any other viewer (18+, or no age on file yet) never sees a
--        profile aged 16 or 17.
--    A profile with no age on file is treated as "not a minor" for this
--    check (the existing age CHECK constraint still requires 16-100 when
--    an age IS given; a null age is the pre-this-feature default for any
--    row inserted before age became meaningful here). This does not
--    retroactively hide anyone from an existing match -- see fix 3 below
--    for the separate blocked-profile gap in that same policy.
-- ---------------------------------------------------------------------

drop policy if exists "exchange_profiles_select_visible" on public.exchange_profiles;
create policy "exchange_profiles_select_visible"
  on public.exchange_profiles for select to authenticated
  using (
    is_visible = true
    and not exists (
      select 1 from public.exchange_blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = exchange_profiles.user_id)
         or (b.blocked_id = (select auth.uid()) and b.blocker_id = exchange_profiles.user_id)
    )
    and (
      case
        when (select p.age from public.exchange_profiles p where p.user_id = (select auth.uid())) between 16 and 17
          then exchange_profiles.age between 16 and 17
        else exchange_profiles.age is null or exchange_profiles.age >= 18
      end
    )
  );

-- ---------------------------------------------------------------------
-- 1b. The age-band check above only works if age is actually on file --
--     today it's optional ("16+ if given"), so a minor could simply
--     leave it blank and fall into the adult-visible branch of the CASE
--     above. Make it mandatory going forward. Safe today: 0 of the 2
--     live rows have a null age (checked before writing this).
-- ---------------------------------------------------------------------

alter table public.exchange_profiles alter column age set not null;

-- ---------------------------------------------------------------------
-- 2. The 20261104010000 revoke missed `from public`. Postgres grants
--    EXECUTE on every new function to PUBLIC by default, and PUBLIC's
--    grant applies to every role regardless of a separate revoke on
--    that specific role -- see claude/REVOKE_FROM_PUBLIC_IS_NOT_ENOUGH_
--    2026-09-14.md and the working pattern in
--    20260914190000_confirm_letter_on_choice.sql. Confirmed live via
--    has_function_privilege('anon', ..., 'EXECUTE') = true despite the
--    earlier revoke. Not a live exploit (both functions only work in
--    trigger context), but a real advisor-flagged gap.
-- ---------------------------------------------------------------------

revoke execute on function public.exchange_handle_swipe() from public;
revoke execute on function public.exchange_profiles_set_updated_at() from public;

do $$
declare
  v_anon boolean;
  v_auth boolean;
begin
  select has_function_privilege('anon', 'public.exchange_handle_swipe()', 'EXECUTE'),
         has_function_privilege('authenticated', 'public.exchange_handle_swipe()', 'EXECUTE')
    into v_anon, v_auth;
  if v_anon or v_auth then
    raise exception 'exchange_handle_swipe is still callable over the API (anon=%, authenticated=%)', v_anon, v_auth;
  end if;

  select has_function_privilege('anon', 'public.exchange_profiles_set_updated_at()', 'EXECUTE'),
         has_function_privilege('authenticated', 'public.exchange_profiles_set_updated_at()', 'EXECUTE')
    into v_anon, v_auth;
  if v_anon or v_auth then
    raise exception 'exchange_profiles_set_updated_at is still callable over the API (anon=%, authenticated=%)', v_anon, v_auth;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. exchange_profiles_select_matched (added 20261104030000) has no
--    block-exclusion clause, unlike exchange_profiles_select_visible
--    above. RLS policies are OR'd, so once two users have ever matched,
--    one blocking the other does not stop the blocked side from still
--    reading the blocker's full profile (name, bio, age, languages) --
--    only new chat messages are stopped. Add the same block check this
--    policy's sibling already has.
-- ---------------------------------------------------------------------

drop policy if exists "exchange_profiles_select_matched" on public.exchange_profiles;
create policy "exchange_profiles_select_matched"
  on public.exchange_profiles for select to authenticated
  using (
    exists (
      select 1 from public.exchange_matches m
      where (select auth.uid()) in (m.user_a, m.user_b)
        and exchange_profiles.user_id in (m.user_a, m.user_b)
        and exchange_profiles.user_id <> (select auth.uid())
    )
    and not exists (
      select 1 from public.exchange_blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = exchange_profiles.user_id)
         or (b.blocked_id = (select auth.uid()) and b.blocker_id = exchange_profiles.user_id)
    )
  );
