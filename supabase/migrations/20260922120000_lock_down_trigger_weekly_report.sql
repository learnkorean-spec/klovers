-- 20260922100100_weekly_report_cron.sql did evoke all on function
-- public.trigger_weekly_report() from public, but that only revokes from
-- the PUBLIC pseudo-role. Supabase grants EXECUTE on every new public-schema
-- function to non and uthenticated separately (that's how PostgREST
-- exposes it as /rest/v1/rpc/trigger_weekly_report), so the intended lockdown
-- didn't take: the security advisor confirmed anon and authenticated both
-- still had EXECUTE, meaning any unauthenticated caller could invoke this
-- SECURITY DEFINER function and trigger the weekly report send. Same bug
-- class as 20260815034255_lock_down_anon_rpc_surface.sql and its _v2 fixed
-- previously -- this closes it for this function specifically.
--
-- trigger_weekly_report() is meant to run only via pg_cron
-- (weekly-report-hourly), which executes as the function owner, so no role
-- needs direct EXECUTE here.

revoke execute on function public.trigger_weekly_report() from anon, authenticated;
