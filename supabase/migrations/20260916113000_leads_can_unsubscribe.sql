-- A lead can say no — 16 September 2026.
--
-- WHAT WAS MISSING
-- `leads` held 111 rows with no unsubscribe token, no opt-out column and no
-- consent record of any kind. The only automated mailer that writes to leads,
-- `abandoned-checkout-recovery`, honours `checkout_recovery_emails
-- .unsubscribed_at` — but that table only has a row once a recovery letter has
-- been scheduled, so a lead outside that sequence had no way to opt out at all.
-- The audit of 14 Sep called this the single most likely way to damage the
-- sending domain, and it is the last consent gap in the system: profiles have
-- had a token and a flag since 20260424000010.
--
-- WHAT THIS ADDS
--   1. `leads.unsubscribe_token` — uuid, backfilled for all existing rows,
--      NOT NULL with a default, and UNIQUE so a token resolves to one lead.
--   2. `leads.email_unsubscribed` / `leads.unsubscribed_at`.
--   3. `public.unsubscribe_by_token(uuid)` — resolves a token against profiles
--      first, then leads, and reports which it was. SECURITY DEFINER, granted
--      to service_role only: the unsubscribe endpoint runs with the service
--      key, and nothing in the browser should be able to enumerate tokens.
--
-- For a lead it ALSO stamps `unsubscribed_at` on every unsent
-- `checkout_recovery_emails` row, which is what makes the existing recovery
-- sequence stop immediately - that function already filters on it, so it needs
-- no change to respect the new flag.
--
-- SAFETY OF THE TOKEN COLUMN
-- `leads` has no anon SELECT policy (checked against production: anon may only
-- INSERT placement leads), so adding a token does not expose one to the
-- browser.

alter table public.leads
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid(),
  add column if not exists email_unsubscribed boolean not null default false,
  add column if not exists unsubscribed_at timestamptz;

create unique index if not exists leads_unsubscribe_token_key
  on public.leads (unsubscribe_token);

comment on column public.leads.unsubscribe_token is
  'Per-lead opt-out token carried in the unsubscribe link of any letter sent to a lead. Resolved by public.unsubscribe_by_token.';
comment on column public.leads.email_unsubscribed is
  'True once this lead has opted out. Every sender that mails leads must exclude these rows.';

create or replace function public.unsubscribe_by_token(p_token uuid)
returns text
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_profile_id uuid;
  v_lead_id uuid;
begin
  if p_token is null then
    return null;
  end if;

  update public.profiles
     set email_unsubscribed = true
   where unsubscribe_token = p_token
  returning user_id into v_profile_id;

  if v_profile_id is not null then
    return 'profile';
  end if;

  update public.leads
     set email_unsubscribed = true,
         unsubscribed_at = coalesce(unsubscribed_at, now())
   where unsubscribe_token = p_token
  returning id into v_lead_id;

  if v_lead_id is null then
    return null;
  end if;

  -- Stops the abandoned-checkout sequence on its next run without that
  -- function having to learn about the new column: it already skips a lead
  -- with any unsubscribed_at row.
  update public.checkout_recovery_emails
     set unsubscribed_at = now(),
         updated_at = now()
   where lead_id = v_lead_id
     and unsubscribed_at is null
     and sent_at is null;

  return 'lead';
end $function$;

revoke all on function public.unsubscribe_by_token(uuid) from public;
grant execute on function public.unsubscribe_by_token(uuid) to service_role;
