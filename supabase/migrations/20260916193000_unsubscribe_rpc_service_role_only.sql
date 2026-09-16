-- `unsubscribe_by_token` really is service_role only — 16 September 2026.
--
-- WHAT WENT WRONG IN 20260916113000
-- That migration ended with `revoke all on function ... from public`, which
-- reads like a lockdown and is not one. Two separate things were confused:
--
--   * PUBLIC is the implicit grant every role inherits;
--   * `anon` and `authenticated` hold their OWN grant here, because this
--     project's default privileges give EXECUTE on new functions in `public`
--     to both roles.
--
-- Revoking from PUBLIC leaves those two untouched. Measured on production
-- right after the apply run:
--
--   has_function_privilege('anon',          'public.unsubscribe_by_token(uuid)', 'execute') -> TRUE
--   has_function_privilege('authenticated', 'public.unsubscribe_by_token(uuid)', 'execute') -> TRUE
--
-- while `trigger_trial_guide` and `verify_cron_secret`, written the same day,
-- came back FALSE for both - which is exactly why this was worth checking
-- rather than assuming.
--
-- HOW BAD
-- Not an open door: the argument is a v4 uuid, so calling it usefully means
-- already holding someone's token, and a wrong guess only returns null. But a
-- token that leaks - a forwarded email, a screenshot, a proxy log - should not
-- be replayable from the browser, and only the edge function, which runs with
-- the service key, has any business resolving one.
--
-- THE RULE
-- To restrict a function in this project, name the roles. `revoke ... from
-- public` alone is not enough, and the check that proves it is
-- has_function_privilege, not reading the grant back.

revoke all on function public.unsubscribe_by_token(uuid) from anon;
revoke all on function public.unsubscribe_by_token(uuid) from authenticated;
revoke all on function public.unsubscribe_by_token(uuid) from public;
grant execute on function public.unsubscribe_by_token(uuid) to service_role;

do $$
begin
  if has_function_privilege('anon', 'public.unsubscribe_by_token(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.unsubscribe_by_token(uuid)', 'execute') then
    raise exception 'unsubscribe_by_token is still executable by anon or authenticated';
  end if;
  if not has_function_privilege('service_role', 'public.unsubscribe_by_token(uuid)', 'execute') then
    raise exception 'unsubscribe_by_token is not executable by service_role';
  end if;
  raise notice 'unsubscribe_by_token: service_role only, verified in-migration';
end $$;
