-- Verify a cron shared secret against Vault, so an edge function does not need
-- its own copy in an environment variable.
--
-- WHY THIS EXISTS
-- send-trial-followups and send-trial-rollover-notifications authenticated cron
-- by comparing an x-cron-secret header to Deno.env CRON_SECRET. That put the
-- same secret in two places that had to match, and they did not: Vault had no
-- CRON_SECRET, so app_private.invoke_edge refused to send the request at all.
-- Both jobs logged "skipped" 168 times in 7 days — every hourly run for a week —
-- and pg_cron still recorded "succeeded", because the SQL had run fine. Zero
-- trial follow-up emails have ever been sent as a result.
--
-- One source of truth removes that failure mode. Rotating the secret becomes a
-- single Vault update with no redeploy and nothing left to fall out of sync.
--
-- Lives in public because PostgREST only exposes functions there; it is locked
-- to service_role, which is the only identity an edge function calls it with.
create or replace function public.verify_cron_secret(p_secret text)
returns boolean
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  select coalesce(p_secret, '') <> ''
     and exists (
       select 1
       from vault.decrypted_secrets
       where name = 'CRON_SECRET'
         and decrypted_secret = p_secret
     );
$$;

comment on function public.verify_cron_secret(text) is
  'Returns true when the argument equals the CRON_SECRET stored in Vault. service_role only — this is a credential oracle and must never be executable by anon or authenticated.';

-- Default EXECUTE for a new function is PUBLIC. Take it away before anything
-- can reach it, then grant only the role edge functions use.
revoke all on function public.verify_cron_secret(text) from public;
revoke all on function public.verify_cron_secret(text) from anon;
revoke all on function public.verify_cron_secret(text) from authenticated;
grant execute on function public.verify_cron_secret(text) to service_role;
