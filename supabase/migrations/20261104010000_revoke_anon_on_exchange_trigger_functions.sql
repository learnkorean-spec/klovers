-- Hardening follow-up to 20261104000100_language_exchange_feature.sql.
--
-- The Supabase security advisor flagged exchange_handle_swipe() as callable
-- by anon/authenticated as a SECURITY DEFINER function via PostgREST RPC
-- (/rest/v1/rpc/exchange_handle_swipe) -- it is a trigger function, never
-- meant to be called directly. exchange_profiles_set_updated_at() has the
-- same unintended exposure (not flagged only because it isn't SECURITY
-- DEFINER, so it carries less risk, but it is equally not an RPC).
--
-- Every other trigger function in this schema (handle_new_user,
-- protect_profile_fields, notify_new_enrollment, etc.) already has EXECUTE
-- revoked from anon/authenticated -- this just brings the two new ones in
-- line with that existing pattern. Calling either via RPC would error today
-- regardless (both reference NEW, which only exists in trigger context), so
-- this closes an advisory finding rather than a live exploit.

revoke execute on function public.exchange_handle_swipe() from anon, authenticated;
revoke execute on function public.exchange_profiles_set_updated_at() from anon, authenticated;
